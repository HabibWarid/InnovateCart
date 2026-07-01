import { useEffect, useState } from "react";
import { Product } from "../types";
import { motion } from "motion/react";
import { Cpu, HelpCircle } from "lucide-react";

interface ProductSectionProps {
  onAddToCart: (product: Product) => void;
  selectedProductId: string | null;
  onSelectProduct: (product: Product) => void;
  searchTerm: string;
}

export default function ProductSection({
  onAddToCart,
  selectedProductId,
  onSelectProduct,
  searchTerm,
}: ProductSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        // ডাটা অবজেক্ট হোক কিংবা ডিরেক্ট অ্যারে হোক—দুইটাই হ্যান্ডেল করবে
        const productsList = Array.isArray(data) ? data : (data.products || []);
        
        setProducts(productsList);
        // Auto-select first product
        if (productsList.length > 0 && !selectedProductId) {
          onSelectProduct(productsList[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading products:", err);
        setLoading(false);
      });
  }, []);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = filter === "All" || p.category === filter;
    const matchesSearch =
      searchTerm.trim() === "" ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-white/40">
        <span className="font-mono text-xs uppercase animate-pulse">Initializing Catalogue...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
      {/* Category Filter */}
      <div className="p-8 border-b border-white/10 flex flex-wrap gap-2 items-center">
        {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-all duration-200 border ${
                filter === cat
                  ? "bg-white text-black border-white"
                  : "text-white/60 border-white/10 hover:border-white/30"
              }`}
            >
              {cat}
            </button>
          ))}
      </div>

      {/* Grid of Products */}
      {filteredProducts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-white/30 select-none">
          <HelpCircle className="h-8 w-8 mb-3 text-white/20" />
          <p className="text-xs uppercase font-bold tracking-widest">No products found</p>
          <p className="text-[10px] font-mono mt-1">Try adjusting your search query or selecting a different category.</p>
        </div>
      ) : (
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const isSelected = selectedProductId === product.id;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className={`group cursor-pointer border p-6 flex flex-col justify-between transition-all duration-300 relative ${
                  isSelected
                    ? "border-white bg-white/5"
                    : "border-white/10 hover:border-white/30 bg-transparent"
                }`}
              >
                {/* Category tag */}
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 bg-white/5 px-2 py-0.5 border border-white/5">
                    {product.category}
                  </span>
                  {isSelected && (
                    <span className="text-[9px] font-mono text-[#635bff] font-black uppercase tracking-widest">
                      Selected
                    </span>
                  )}
                </div>

                {/* Product Visual Container */}
                <div
                  className={`w-full h-36 bg-gradient-to-br ${product.imageBg} border border-white/5 flex items-center justify-center relative overflow-hidden mb-6 group-hover:scale-[1.02] transition-all duration-300`}
                >
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:15px_15px]"></div>
                  <div className="w-16 h-16 border border-white/10 rounded-full flex items-center justify-center">
                    <Cpu className="h-6 w-6 text-white/25" />
                  </div>
                </div>

                {/* Product Info */}
                <div>
                  <h3 className="text-lg font-black tracking-tight uppercase group-hover:text-[#635bff] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-2 mt-1 min-h-[32px]">
                    {product.tagline}
                  </p>
                  
                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="text-lg font-bold font-mono">
                      ${product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      className="text-[10px] bg-white text-black hover:bg-[#635bff] hover:text-white px-3 py-1.5 font-bold uppercase tracking-widest transition-all duration-200"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}