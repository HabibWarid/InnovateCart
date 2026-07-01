import { db } from './index.ts';
import { products } from './schema.ts';

const defaultProducts = [
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

export async function seedDefaultProducts() {
  console.log("Seeding default premium products...");
  for (const item of defaultProducts) {
    try {
      await db.insert(products)
        .values(item)
        .onConflictDoUpdate({
          target: products.id,
          set: {
            name: item.name,
            tagline: item.tagline,
            description: item.description,
            price: item.price,
            category: item.category,
            imageUrl: item.imageUrl,
            imageBg: item.imageBg,
            specs: item.specs
          }
        });
    } catch (e) {
      console.error(`Failed to insert default product ${item.id}:`, e);
    }
  }
  console.log("Default products seeded successfully.");
}

export async function syncProducts() {
  try {
    console.log("Syncing products from external API (https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json)...");
    const response = await fetch("https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch: status ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Invalid format: expected array");
    }
    console.log(`Fetched ${data.length} products. Proceeding to import into PostgreSQL.`);
    
    for (const item of data) {
      // Map API fields (accommodating FakestoreAPI structures or other variations)
      const productId = String(item.id || Math.random().toString(36).substring(2, 10));
      const productName = String(item.title || item.name || "Unnamed Product");
      const productPrice = typeof item.price === "number" ? item.price : parseFloat(item.price) || 49.99;
      const productCategory = String(item.category || "General");
      const productDescription = String(item.description || item.desc || "Premium dynamic gear.");
      const productImageUrl = String(item.image || item.imageUrl || item.image_url || "");
      
      const specsArray = Array.isArray(item.specs) 
        ? item.specs 
        : item.rating && typeof item.rating === 'object'
          ? [`Rating: ${item.rating.rate || item.rating} ★`, `Count: ${item.rating.count || 0}`]
          : [`Featured Item`];

      // Dynamic backgrounds matching categories
      let imageBg = "from-[#111111] to-[#222222]";
      if (productCategory.toLowerCase().includes("cloth") || productCategory.toLowerCase().includes("fashion")) {
        imageBg = "from-[#2c3e50] to-[#3498db]";
      } else if (productCategory.toLowerCase().includes("jewel")) {
        imageBg = "from-[#d3c2a3] to-[#8e7a5c]";
      } else if (productCategory.toLowerCase().includes("elect")) {
        imageBg = "from-[#1a1c1e] to-[#2d3748]";
      }

      await db.insert(products)
        .values({
          id: productId,
          name: productName,
          tagline: item.tagline || productCategory || "",
          description: productDescription,
          price: productPrice,
          category: productCategory,
          imageUrl: productImageUrl,
          imageBg: imageBg,
          specs: specsArray
        })
        .onConflictDoUpdate({
          target: products.id,
          set: {
            name: productName,
            tagline: item.tagline || productCategory || "",
            description: productDescription,
            price: productPrice,
            category: productCategory,
            imageUrl: productImageUrl,
            specs: specsArray
          }
        });
    }
    console.log("External products synchronized with PostgreSQL successfully!");
  } catch (error: any) {
    console.warn("External product sync error:", error.message || error);
    // Graceful fallback to default premium design catalog
    await seedDefaultProducts();
  }
}
