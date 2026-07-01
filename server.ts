// server.ts এর একদম উপরে গ্লোবালি ডিক্লেয়ার করো
let localProducts: any[] = [
  {
    id: "studio-display",
    name: "Studio Display",
    tagline: "Ultra-precise 6K creative screen",
    description: "High-performance hardware aesthetic for creative professionals. Complete color coverage with absolute clarity.",
    price: 1450,
    category: "Display",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
    imageBg: "from-[#1a1a1a] to-[#333333]",
    specs: ["32-inch Oxide TFT", "6016 x 3384 Pixels", "1600 nits Peak Brightness", "Thunderbolt 4 Connection"]
  },
  {
    id: "mono-keyboard",
    name: "Mono Keyboard",
    tagline: "Seamless mechanical input",
    description: "Anodized aluminum case with dynamic hot-swappable tactile switches and high-contrast stealth legends.",
    price: 320,
    category: "Input",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    imageBg: "from-[#111111] to-[#252525]",
    specs: ["75% Layout", "CNC Aluminum Base", "Custom Matte Switches", "USB-C Interface"]
  },
  {
    id: "linear-console",
    name: "Linear Console",
    tagline: "Creative physical controller",
    description: "Sleek physical rotary dials and smooth sliding knobs designed for precision timelines and creative visual controls.",
    price: 480,
    category: "Control",
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80",
    imageBg: "from-[#080808] to-[#1e1e1e]",
    specs: ["4 Motorized Faders", "6 Dynamic Knobs", "Aluminum Top Plate", "OLED Status Displays"]
  },
  {
    id: "veloce-interface",
    name: "Veloce Audio",
    tagline: "Ultra-low-noise interface",
    description: "Dual state-of-the-art microphone preamps coupled with high-resolution converters for reference-grade sound.",
    price: 650,
    category: "Audio",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80",
    imageBg: "from-[#1f1f1f] to-[#3a3a3a]",
    specs: ["2 XLR-1/4\" Combos", "125dB Dynamic Range", "Dedicated Monitor Out", "Hardware Level Meters"]
  },
  {
    id: "aura-beam",
    name: "Aura Light Beam",
    tagline: "Intelligent magnetic lamp bar",
    description: "Aesthetic color-balancing light bar that snaps magnetically to monitors, protecting eyes and boosting focus.",
    price: 180,
    category: "Lighting",
    imageUrl: "https://images.unsplash.com/photo-1507646227500-4d389b0012be?w=800&auto=format&fit=crop&q=80",
    imageBg: "from-[#222222] to-[#444444]",
    specs: ["Magnetic Snap On", "Color-Balancing LEDs", "Ambient Backlight", "Touch Slide Control"]
  }
];

let localOrders: any[] = [];

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

// Optional Auth Helper for client checkout
async function getAuthUserFromHeader(req: express.Request) {
  if (process.env.NEXT_DISABLE_DB === "true") return null;
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

// Sync Route
app.post("/api/sync-products", async (req, res) => {
  try {
    if (process.env.NEXT_DISABLE_DB === "true") {
      return res.json({ success: true, count: localProducts.length, message: "Running in Database-Disabled Mode" });
    }
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
    if (process.env.NEXT_DISABLE_DB === "true") {
      return res.json({ success: true, user: { id: 1, uid: req.user?.uid, email: req.user?.email || "mock@innovatecart.com" } });
    }
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

// 1. Get products list (Updated for pure array response matching front-end)
app.get("/api/products", async (req, res) => {
  try {
    if (process.env.NEXT_DISABLE_DB === "true") {
      return res.json(localProducts);
    }
    
    let currentProducts = await db.select().from(productsTable);
    if (currentProducts.length === 0) {
      console.log("No products found in PostgreSQL. Running sync products on demand...");
      await syncProducts();
      currentProducts = await db.select().from(productsTable);
    }
    res.json(currentProducts);
  } catch (err: any) {
    console.error("Failed to query products from database:", err);
    res.status(500).json({ error: "Failed to retrieve products catalog" });
  }
});

// 2. Stripe Payment Intent Creator
app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "usd", metadata = {} } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount." });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.json({
        clientSecret: "simulated_stripe_secret_" + Math.random().toString(36).substring(2),
        isSimulated: true,
        message: "Stripe integration running in Sandbox Mode. Configure STRIPE_SECRET_KEY to enable real transactions."
      });
    }

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

// 3. Place order
app.post("/api/place-order", async (req, res) => {
  try {
    const { items, total, paymentMethod, paymentStatus = "completed" } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: "Order items are empty." });
    }

    const orderId = "ord_" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const fullOrder = {
      id: orderId,
      items: items.map((it: any) => ({
        id: it.productId || it.id,
        name: it.name || "Product Item",
        price: parseFloat(it.price),
        quantity: parseInt(it.quantity) || 1
      })),
      total: parseFloat(total),
      paymentMethod: paymentMethod || "Stripe Card",
      paymentStatus,
      createdAt: new Date().toISOString()
    };

    if (process.env.NEXT_DISABLE_DB === "true") {
      localOrders.unshift(fullOrder);
      return res.json({ success: true, order: fullOrder });
    }

    const decodedUser = await getAuthUserFromHeader(req);
    let dbUserId: number | null = null;
    
    if (decodedUser) {
      const userRecord = await getOrCreateUser(decodedUser.uid, decodedUser.email || "anonymous@mono-store.com");
      dbUserId = userRecord.id;
    }

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

    res.json({ success: true, order: fullOrder });
  } catch (err: any) {
    console.error("Order placement database error:", err);
    res.status(500).json({ error: "Failed to process order in database." });
  }
});

// 4. GET Orders history
app.get("/api/orders", async (req, res) => {
  try {
    if (process.env.NEXT_DISABLE_DB === "true") {
      return res.json({ orders: localOrders.slice(0, 5) });
    }

    const decodedUser = await getAuthUserFromHeader(req);
    
    if (decodedUser) {
      const dbUsers = await db.select().from(usersTable).where(eq(usersTable.uid, decodedUser.uid)).limit(1);
      if (dbUsers.length > 0) {
        const userId = dbUsers[0].id;
        const userOrders = await db.select().from(ordersTable).where(eq(ordersTable.userId, userId)).orderBy(desc(ordersTable.createdAt));
        
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

    const dbProducts = process.env.NEXT_DISABLE_DB === "true" ? localProducts : await db.select().from(productsTable);

    if (!ai || dbProducts.length === 0) {
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
    const dbProducts = process.env.NEXT_DISABLE_DB === "true" ? localProducts : await db.select().from(productsTable);

    const systemInstruction = `You are "INNOVATE_BOT", the autonomous AI Customer Support Concierge for InnovateCart (a hyper-premium, minimalist developer and creative hardware brand).
You talk in a sophisticated, calm, professional, human-like, design-focused tone (no excessive emojis, no exclamation mark overload).
Our product catalog dynamically queried from Cloud SQL:
${JSON.stringify(dbProducts.map(p => ({ name: p.name, tagline: p.tagline, price: p.price, category: p.category, description: p.description })), null, 2)}

We offer secure card payment processing fully integrated with Stripe. Shipping is free worldwide on orders over $500, with express 2-year warranties included.
The current cart contains: ${JSON.stringify(currentCart || [])}.

Keep your responses direct, helpful, and concise (max 3 sentences). Answer questions about products, specifications, secure payment integration, shipping, or assist them in choosing the right gears.`;

    if (!ai) {
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

    const formattedContents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

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
  if (process.env.NEXT_DISABLE_DB !== "true") {
    try {
      await syncProducts();
    } catch (e) {
      console.error("Startup products sync warning:", e);
    }
  } else {
    console.log("Database Bypass Mode Active. Using fallback product catalog safely.");
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