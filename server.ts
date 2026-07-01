import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Stripe from "stripe";
import dotenv from "dotenv";
import { db } from "./src/db/index.ts";
import { users as usersTable, products as productsTable, orders as ordersTable, orderItems as orderItemsTable } from "./src/db/schema.ts";
import { syncProducts } from "./src/db/sync.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { eq, desc } from "drizzle-orm";
import { adminAuth } from "./src/lib/firebase-admin.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initializers
let aiInstance: any = null;
function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

let stripeInstance: any = null;
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

// REST API Endpoints

// Optional Auth Helper for client checkout (allows both guest and authenticated user checkouts)
async function getAuthUserFromHeader(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      console.warn("Soft token verification failed:", error);
    }
  }
  return null;
}

// Sync Route - can be called to manually trigger product sync
app.post("/api/sync-products", async (req, res) => {
  try {
    await syncProducts();
    const currentProducts = await db.select().from(productsTable);
    res.json({ success: true, count: currentProducts.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Sync failed" });
  }
});

// Endpoint to sync/register users upon front-end sign-in
app.post("/api/register-user", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Missing authentication token profile" });
    }
    const userRecord = await getOrCreateUser(req.user.uid, req.user.email || "anonymous@innovatecart.com");
    res.json({ success: true, user: userRecord });
  } catch (err: any) {
    console.error("User registration error:", err);
    res.status(500).json({ error: "Failed to synchronize user profile" });
  }
});

// 1. Get products list
app.get("/api/products", async (req, res) => {
  try {
    let currentProducts = await db.select().from(productsTable);
    // If the database is completely empty on first run, sync products automatically
    if (currentProducts.length === 0) {
      console.log("No products found in PostgreSQL. Running sync products on demand...");
      await syncProducts();
      currentProducts = await db.select().from(productsTable);
    }
    res.json({ products: currentProducts });
  } catch (err: any) {
    console.error("Failed to query products from database:", err);
    res.status(500).json({ error: "Failed to retrieve products catalog" });
  }
});

// 2. Stripe Payment Intent Creator (Lazy & Safe)
app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "usd", metadata = {} } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount." });
    }

    const stripe = getStripe();
    if (!stripe) {
      // Elegant Sandbox Simulation payload
      return res.json({
        clientSecret: "simulated_stripe_secret_" + Math.random().toString(36).substring(2),
        isSimulated: true,
        message: "Stripe integration running in Sandbox Mode. Configure STRIPE_SECRET_KEY to enable real transactions."
      });
    }

    // Convert to cents for Stripe
    const centsAmount = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: centsAmount,
      currency,
      metadata: {
        ...metadata,
        platform: "AI Studio Build"
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      isSimulated: false
    });
  } catch (err: any) {
    console.error("Stripe API Error:", err);
    res.status(500).json({ error: err.message || "Internal payment error." });
  }
});

// 3. Place order (saves it to PostgreSQL)
app.post("/api/place-order", async (req, res) => {
  try {
    const { items, total, paymentMethod, paymentStatus = "completed" } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: "Order items are empty." });
    }

    // Check if user is authenticated optionally
    const decodedUser = await getAuthUserFromHeader(req);
    let dbUserId: number | null = null;
    
    if (decodedUser) {
      const userRecord = await getOrCreateUser(decodedUser.uid, decodedUser.email || "anonymous@mono-store.com");
      dbUserId = userRecord.id;
    }

    const orderId = "ord_" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Insert order in a transaction
    await db.transaction(async (tx) => {
      await tx.insert(ordersTable).values({
        id: orderId,
        userId: dbUserId,
        total: parseFloat(total),
        paymentMethod: paymentMethod || "Stripe Card",
        paymentStatus: paymentStatus
      });

      for (const item of items) {
        await tx.insert(orderItemsTable).values({
          orderId: orderId,
          productId: item.productId || item.id,
          name: item.name || "Product Item",
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity) || 1
        });
      }
    });

    const fullOrder = {
      id: orderId,
      items,
      total,
      paymentMethod,
      paymentStatus,
      createdAt: new Date().toISOString()
    };

    res.json({ success: true, order: fullOrder });
  } catch (err: any) {
    console.error("Order placement database error:", err);
    res.status(500).json({ error: "Failed to process order in database." });
  }
});

// 4. GET Orders history
app.get("/api/orders", async (req, res) => {
  try {
    const decodedUser = await getAuthUserFromHeader(req);
    
    if (decodedUser) {
      // Find database user
      const dbUsers = await db.select().from(usersTable).where(eq(usersTable.uid, decodedUser.uid)).limit(1);
      if (dbUsers.length > 0) {
        const userId = dbUsers[0].id;
        // Fetch user's orders
        const userOrders = await db.select().from(ordersTable).where(eq(ordersTable.userId, userId)).orderBy(desc(ordersTable.createdAt));
        
        // Enrich orders with their items
        const enrichedOrders = [];
        for (const order of userOrders) {
          const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
          enrichedOrders.push({
            ...order,
            items: items.map(it => ({
              id: it.productId,
              name: it.name,
              price: it.price,
              quantity: it.quantity
            }))
          });
        }
        return res.json({ orders: enrichedOrders });
      }
    }

    // Guest / fallback: retrieve last 5 public/guest orders
    const publicOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(5);
    const enrichedOrders = [];
    for (const order of publicOrders) {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
      enrichedOrders.push({
        ...order,
        items: items.map(it => ({
          id: it.productId,
          name: it.name,
          price: it.price,
          quantity: it.quantity
        }))
      });
    }
    res.json({ orders: enrichedOrders });
  } catch (err: any) {
    console.error("Retrieve orders database error:", err);
    res.status(500).json({ error: "Failed to query orders history." });
  }
});

// 5. AI recommendations (Gemini)
app.post("/api/recommendations", async (req, res) => {
  try {
    const { userPreferences, currentCartIds } = req.body;
    const ai = getGemini();

    const dbProducts = await db.select().from(productsTable);

    if (!ai || dbProducts.length === 0) {
      // Smart Fallback
      const fallbackList = dbProducts.length > 0 ? dbProducts : [];
      const recommendedProduct = currentCartIds?.includes("studio-display")
        ? fallbackList.find(p => p.id === "mono-keyboard")
        : fallbackList.find(p => p.id === "studio-display");
      
      const chosen = recommendedProduct || fallbackList[0];
      return res.json({
        recommendation: {
          productId: chosen?.id || "studio-display",
          reason: "This premium workspace component matches your active workflow and complements your surrounding desk geometry perfectly."
        },
        isSimulated: true
      });
    }

    const prompt = `You are the InnovateCart designer recommendation engine.
We sell the following products in our database:
${JSON.stringify(dbProducts.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, tagline: p.tagline })), null, 2)}

The user has the following preferences/search: "${userPreferences || 'Looking for top-tier creative gear'}".
The current items in their cart are: ${JSON.stringify(currentCartIds || [])}.

Analyze the user interest and cart context. Choose exactly ONE product from our catalog that they would benefit most from, and write a single, extremely professional, compelling, brief recommendation reason (max 2 sentences) written in our minimalist, design-focused brand voice.

Respond strictly in valid JSON format matching this schema:
{
  "productId": "id of the product recommended",
  "reason": "personalized recommendation reason"
}
Do not write markdown block quotes or text outside of the JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "{}";
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanJson);

    res.json({ recommendation: result, isSimulated: false });
  } catch (err: any) {
    console.error("Gemini Recommendations Error:", err);
    res.json({
      recommendation: {
        productId: "studio-display",
        reason: "The Studio Display forms the absolute aesthetic and visual anchor for any premium developer desk."
      },
      isSimulated: true
    });
  }
});

// 6. NLP Support Chatbot (Gemini)
app.post("/api/chatbot", async (req, res) => {
  try {
    const { messages, currentCart } = req.body;
    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Message history is required." });
    }

    const ai = getGemini();
    const dbProducts = await db.select().from(productsTable);

    const systemInstruction = `You are "INNOVATE_BOT", the autonomous AI Customer Support Concierge for InnovateCart (a hyper-premium, minimalist developer and creative hardware brand).
You talk in a sophisticated, calm, professional, human-like, design-focused tone (no excessive emojis, no exclamation mark overload).
Our product catalog dynamically queried from Cloud SQL:
${JSON.stringify(dbProducts.map(p => ({ name: p.name, tagline: p.tagline, price: p.price, category: p.category, description: p.description })), null, 2)}

We offer secure card payment processing fully integrated with Stripe. Shipping is free worldwide on orders over $500, with express 2-year warranties included.
The current cart contains: ${JSON.stringify(currentCart || [])}.

Keep your responses direct, helpful, and concise (max 3 sentences). Answer questions about products, specifications, secure payment integration, shipping, or assist them in choosing the right gears.`;

    if (!ai) {
      // Smart Rule-Based Support Assistant fallback
      const lastMsg = messages[messages.length - 1].text.toLowerCase();
      let reply = "I would be happy to guide you with our design-grade hardware. Our systems are fully secured with Stripe. How can I help complete your setup?";
      
      if (lastMsg.includes("stripe") || lastMsg.includes("payment") || lastMsg.includes("secure")) {
        reply = "InnovateCart utilizes industry-standard Stripe encryption TLS 1.3 for secure payment processing. We support all major credit cards, as well as digital wallets.";
      } else if (lastMsg.includes("display") || lastMsg.includes("screen") || lastMsg.includes("monitor")) {
        reply = "Our Studio Display features a jaw-dropping 32-inch 6K Oxide TFT screen with 1600 nits of peak brightness and a stunning space-black aluminum chassis.";
      } else if (lastMsg.includes("shipping") || lastMsg.includes("deliver")) {
        reply = "We offer complimentary express shipping worldwide on all orders over $500. Delivery takes between 3 to 5 business days depending on your region.";
      } else if (lastMsg.includes("keyboard")) {
        reply = "The Mono Keyboard is a 75% layout CNC-milled masterpiece with dynamic hot-swappable switches and stealth legends.";
      }

      return res.json({ reply, isSimulated: true });
    }

    // Format chat logs for Gemini API
    const formattedContents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    // Prepend instruction to context
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    res.json({ reply: response.text || "I am here to assist you.", isSimulated: false });
  } catch (err: any) {
    console.error("Gemini Chatbot Error:", err);
    res.json({
      reply: "I am currently running in offline reserve. I can assure you that our products represent the pinnacle of minimalist layout design and Stripe-backed safety.",
      isSimulated: true
    });
  }
});

// Vite/Express Integration setup
async function startServer() {
  // Sync products at startup in background
  try {
    await syncProducts();
  } catch (e) {
    console.error("Startup products sync warning:", e);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
