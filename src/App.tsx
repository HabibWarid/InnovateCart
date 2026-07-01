import { useState, useEffect } from "react";
import { Product, CartItem, Recommendation } from "./types";
import ProductSection from "./components/ProductSection";
import CheckoutModal from "./components/CheckoutModal";
import Chatbot from "./components/Chatbot";
import AboutSection from "./components/AboutSection";
import ContactSection from "./components/ContactSection";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Cpu, ArrowRight, Sparkles, Check, Trash2, ShieldCheck, LogIn, History, Search, X } from "lucide-react";
import { auth, googleAuthProvider } from "./lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

// এখানে লোকাল মক ডাটা অ্যাড করা হলো যাতে ডাটাবেজ ছাড়া প্রোডাক্ট দেখায়
const defaultProducts: Product[] = [
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

export default function App() {
  const [activeView, setActiveView] = useState<"home" | "about" | "contact">("home");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // প্রথম মক প্রোডাক্টটি ডিফল্ট সিলেক্টেড থাকবে
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(defaultProducts[0]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Recommendations state
  const [prefInput, setPrefInput] = useState("");
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  // Auth & Database States
  const [user, setUser] = useState<any>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Cart calculation
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Fetch dynamic AI recommendation
  const handleGetRecommendation = async () => {
    setRecLoading(true);
    setRecommendation(null);
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPreferences: prefInput,
          currentCartIds: cart.map((i) => i.product.id),
        }),
      });
      const data = await response.json();
      if (data.recommendation) {
        setRecommendation(data.recommendation);
      }
    } catch (err) {
      console.error("Failed to load recommendation:", err);
    } finally {
      setRecLoading(false);
    }
  };

  // Fetch user's orders history from PostgreSQL
  const fetchOrdersHistory = async (token: string | null) => {
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/orders", { headers });
      const data = await response.json();
      if (data.orders) {
        setOrdersHistory(data.orders);
      }
    } catch (err) {
      console.error("Failed to retrieve order history:", err);
    }
  };

  // Firebase auth state listener
  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
          sessionStorage.setItem("id_token", token);
          
          // Sync profile to database users table
          await fetch("/api/register-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });

          fetchOrdersHistory(token);
        } catch (e) {
          console.error("Authentication synchronization failed:", e);
        }
      } else {
        setUser(null);
        setIdToken(null);
        sessionStorage.removeItem("id_token");
        fetchOrdersHistory(null);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between overflow-x-hidden font-sans">
      
      {/* Header Navigation */}
      <nav className="h-20 flex items-center justify-between px-4 sm:px-6 md:px-12 border-b border-white/10 shrink-0 select-none">
        <div className="flex items-center gap-4 sm:gap-12 shrink-0">
          <div className="text-xl sm:text-2xl font-black tracking-tighter cursor-pointer animate-fade-in text-white hover:opacity-80 transition-opacity" onClick={() => setActiveView("home")}>
            InnovateCart
          </div>
          <div className="flex gap-4 sm:gap-6 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/50">
            <button
              onClick={() => setActiveView("home")}
              className={`pb-1 transition-all uppercase ${activeView === "home" ? "text-white border-b-2 border-[#635bff]" : "hover:text-white cursor-pointer"}`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveView("about")}
              className={`pb-1 transition-all uppercase ${activeView === "about" ? "text-white border-b-2 border-[#635bff]" : "hover:text-white cursor-pointer"}`}
            >
              About Us
            </button>
            <button
              onClick={() => setActiveView("contact")}
              className={`pb-1 transition-all uppercase ${activeView === "contact" ? "text-white border-b-2 border-[#635bff]" : "hover:text-white cursor-pointer"}`}
            >
              Contact Us
            </button>
          </div>
        </div>

        {/* Global Navigation Search Bar */}
        <div className="flex items-center relative flex-1 max-w-[140px] sm:max-w-xs md:max-w-md mx-2 sm:mx-6">
          <div className="absolute left-3 text-white/30 pointer-events-none">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="SEARCH CATALOGUE..."
            className="w-full h-9 pl-9 pr-8 bg-white/5 hover:bg-white/15 focus:bg-white/10 border border-white/10 hover:border-white/20 focus:border-[#635bff] focus:outline-none text-[10px] text-white placeholder-white/30 tracking-widest transition-all font-mono uppercase"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 text-white/40 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  fetchOrdersHistory(idToken);
                  setIsHistoryOpen(true);
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white border border-white/10 px-3 py-2 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <History className="h-3 w-3" />
                <span>Orders</span>
              </button>
              <div className="flex items-center gap-2">
                <div 
                  title={user.email || ""}
                  className="w-8 h-8 rounded-full bg-[#635bff] flex items-center justify-center font-bold text-xs uppercase border border-white/20"
                >
                  {user.displayName ? user.displayName[0] : (user.email ? user.email[0] : "U")}
                </div>
                <button
                  onClick={() => signOut(auth)}
                  className="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={async () => {
                try {
                  await signInWithPopup(auth, googleAuthProvider);
                } catch (e) {
                  console.error("Sign-in failed:", e);
                }
              }}
              className="text-xs font-bold uppercase tracking-widest border border-[#635bff] text-[#635bff] hover:bg-[#635bff] hover:text-white px-4 py-2 transition-all duration-300 cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 hover:border-white/30 px-4 py-2"
          >
            <span>BAG</span>
            <span className="bg-white text-black px-2 py-0.5 text-[10px] font-black font-mono">
              {totalCartItems.toString().padStart(2, "0")}
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {activeView === "home" ? (
          <motion.div
            key="home-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* AI Setup Configurator Bar */}
            <div className="border-b border-white/10 bg-[#0c0c0c] px-4 sm:px-6 md:px-12 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#635bff] shrink-0">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  <span>AI Setup Configurator</span>
                </div>
                <p className="hidden md:block text-[11px] text-white/50 max-w-sm">
                  Search your product by describing as your thought
                </p>
              </div>

              <div className="flex-1 max-w-xl w-full flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prefInput}
                    onChange={(e) => setPrefInput(e.target.value)}
                    placeholder="e.g., minimalist desk, coding setup, high-fidelity audio..."
                    className="flex-1 h-9 bg-white/5 border border-white/10 px-3 text-xs text-white placeholder-white/20 focus:border-[#635bff] focus:outline-none focus:bg-white/10 transition-all font-mono"
                  />
                  <button
                    onClick={handleGetRecommendation}
                    disabled={recLoading || !prefInput.trim()}
                    className="bg-white text-black hover:bg-[#635bff] hover:text-white disabled:bg-white/5 disabled:text-white/20 px-4 text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer h-9 flex items-center justify-center shrink-0"
                  >
                    {recLoading ? "Analyzing..." : "Consult AI"}
                  </button>
                </div>

                <AnimatePresence>
                  {recommendation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 bg-white/5 border border-[#635bff]/20 rounded text-xs space-y-2 mt-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold uppercase text-[9px] text-white/40 font-mono tracking-widest">
                            Gemini Recommendation
                          </span>
                          <div className="flex gap-4">
                            <button
                              onClick={() => {
                                const p = defaultProducts.find((p: Product) => p.id === recommendation.productId);
                                if (p) {
                                  setSelectedProduct(p);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                              }}
                              className="text-[9px] text-[#635bff] uppercase font-bold tracking-widest hover:underline"
                            >
                              Focus Product
                            </button>
                            <button
                              onClick={() => setRecommendation(null)}
                              className="text-[9px] text-white/40 hover:text-white uppercase font-bold tracking-widest"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                        <p className="text-white/80 leading-relaxed font-mono text-[10px]">
                          {recommendation.reason}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Main Split Layout */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
              
              {/* Left Pane: Interactive Big Feature Pane */}
              <div className="w-full lg:w-3/5 border-b lg:border-b-0 lg:border-r border-white/10 p-6 md:p-12 flex flex-col justify-between relative bg-gradient-to-b from-transparent to-[#0a0a0a]">
                
                <AnimatePresence mode="wait">
                  {selectedProduct && (
                    <motion.div
                      key={selectedProduct.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col flex-1 justify-start py-6"
                    >
                      <div>
                        <span className="text-[10px] border border-white/30 rounded-full px-3 py-1 uppercase tracking-widest">
                          Featured Edition
                        </span>
                      </div>

                      <h1 className="text-5xl md:text-[80px] leading-[0.85] font-black tracking-tighter uppercase mt-6 mb-4">
                        {selectedProduct.name.split(" ").map((word, i) => (
                          <span key={i} className={i === 1 ? "text-white/40 block" : "block"}>
                            {word}
                          </span>
                        ))}
                      </h1>

                      <p className="text-sm text-white/60 max-w-lg leading-relaxed mb-8">
                        {selectedProduct.description}
                      </p>

                      {/* Big Visual Mock */}
                      <div className="flex flex-col md:flex-row gap-8 items-stretch mb-8">
                        <div
                          className={`w-full md:w-64 h-64 bg-gradient-to-br ${selectedProduct.imageBg} border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0`}
                        >
                          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:15px_15px]"></div>
                          {selectedProduct.imageUrl ? (
                            <img 
                              src={selectedProduct.imageUrl} 
                              alt={selectedProduct.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover relative z-10"
                            />
                          ) : (
                            <div className="w-24 h-24 border-2 border-white/10 rounded-full flex items-center justify-center">
                              <Cpu className="h-8 w-8 text-white/30" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block mb-2">
                              Technical Specs
                            </span>
                            <ul className="space-y-1">
                              {selectedProduct.specs?.map((spec, i) => {
                                const cleanSpec = typeof spec === 'string' && spec.includes('[object Object]')
                                  ? spec.replace('[object Object]', '4.7')
                                  : spec;
                                return (
                                  <li key={i} className="text-xs text-white/80 font-mono flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-[#635bff] rounded-full"></span>
                                    {cleanSpec}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>

                          <div className="mt-6 flex items-baseline gap-4">
                            <span className="text-3xl font-bold font-mono">
                              ${selectedProduct.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-white/40 uppercase font-mono">Stripe Secured</span>
                          </div>
                        </div>
                      </div>

                      {/* Buy Button */}
                      <div className="flex flex-wrap gap-4 mt-2">
                        <button
                          onClick={() => handleAddToCart(selectedProduct)}
                          className="bg-white hover:bg-[#635bff] text-black hover:text-white px-8 py-4 font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center gap-2 cursor-pointer"
                        >
                          Add {selectedProduct.name} to Bag <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Pane: Catalog grid */}
              <div className="w-full lg:w-2/5 flex flex-col bg-[#0d0d0d] overflow-hidden min-h-0">
                <ProductSection
                  onAddToCart={handleAddToCart}
                  selectedProductId={selectedProduct?.id || null}
                  onSelectProduct={(p) => {
                    setSelectedProduct(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  searchTerm={searchTerm}
                />

                {/* Stripe Badge Banner */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#635bff]/10 border border-[#635bff]/30 text-[#635bff]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white">Stripe Checkout Ready</div>
                      <div className="text-[9px] text-white/40 uppercase font-mono">Accepting Card payments worldwide</div>
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-white/30 border border-white/10 rounded px-2 py-0.5">
                    TLS 1.3
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeView === "about" ? (
          <AboutSection key="about-view" />
        ) : (
          <ContactSection key="contact-view" />
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden select-none">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                className="w-screen max-w-md bg-[#0a0a0a] border-l border-white/10 text-white flex flex-col h-full"
              >
                <div className="h-20 border-b border-white/10 px-6 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest">SHOPPING BAG ({totalCartItems})</span>
                  <button onClick={() => setIsCartOpen(false)} className="text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-white px-3 py-1.5 transition-all cursor-pointer">CLOSE</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-white/30">
                      <ShoppingBag className="h-8 w-8 mb-3" />
                      <p className="text-xs uppercase font-bold tracking-widest">Your bag is empty</p>
                      <p className="text-[10px] font-mono mt-1">Add items from our catalog to proceed.</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="flex gap-4 border-b border-white/5 pb-6">
                        <div className={`w-20 h-20 bg-gradient-to-br ${item.product.imageBg} border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden`}>
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            <Cpu className="h-5 w-5 text-white/20" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold uppercase tracking-wider">{item.product.name}</h4>
                              <span className="font-mono text-xs">${(item.product.price * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <span className="text-[9px] font-mono text-white/40 block mt-0.5">{item.product.category}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center border border-white/10">
                              <button onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-0.5 text-xs text-white/60 hover:text-white">-</button>
                              <span className="px-3 py-0.5 text-xs font-mono font-bold bg-white/5">{item.quantity}</span>
                              <button onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)} className="px-2 py-0.5 text-xs text-white/60 hover:text-white">+</button>
                            </div>
                            <button onClick={() => handleRemoveFromCart(item.product.id)} className="text-white/30 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-6 bg-white/5 border-t border-white/10 space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold uppercase tracking-widest text-white/40">Subtotal</span>
                      <span className="text-xl font-black font-mono">${cartSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full bg-[#635bff] hover:bg-[#5851d8] text-white py-4 font-black uppercase tracking-widest text-xs transition-all duration-300 text-center cursor-pointer">SECURE STRIPE CHECKOUT</button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Orders History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden select-none">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                className="w-screen max-w-md bg-[#0a0a0a] border-l border-white/10 text-white flex flex-col h-full"
              >
                <div className="h-20 border-b border-white/10 px-6 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest">ORDER HISTORY ({ordersHistory.length})</span>
                  <button onClick={() => setIsHistoryOpen(false)} className="text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-white px-3 py-1.5 transition-all cursor-pointer">CLOSE</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {ordersHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-white/30">
                      <ShoppingBag className="h-8 w-8 mb-3" />
                      <p className="text-xs uppercase font-bold tracking-widest">No order history</p>
                    </div>
                  ) : (
                    ordersHistory.map((order) => (
                      <div key={order.id} className="border border-white/10 p-4 space-y-4 rounded bg-white/5 font-mono">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/40 font-bold">{order.id}</span>
                          <span className="text-[9px] uppercase tracking-wider bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-0.5 rounded">{order.paymentStatus}</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-white/80">
                          {order.items?.map((it: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span className="uppercase text-white/60">{it.name} <span className="text-[9px] text-white/30">x{it.quantity}</span></span>
                              <span>${(it.price * it.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-white/5 pt-3 flex justify-between items-baseline text-sm">
                          <span className="text-[10px] uppercase text-white/40">Total Charged</span>
                          <span className="font-bold text-[#635bff]">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} cartItems={cart} subtotal={cartSubtotal} idToken={idToken} onCheckoutSuccess={() => setCart([])} />
      <Chatbot />
    </div>
  );
}