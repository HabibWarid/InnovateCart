import { motion } from "motion/react";
import { Cpu, ShieldCheck, Sparkles, Award, Star, ArrowRight } from "lucide-react";

export default function AboutSection() {
  const values = [
    {
      icon: <Sparkles className="h-5 w-5 text-[#635bff]" />,
      title: "AI-First Intelligence",
      description: "Powered by Gemini, we analyze your exact developer, creator, and productivity needs to recommend precise hardware configurations."
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-[#635bff]" />,
      title: "Stripe-Secured Ecosystem",
      description: "Complete, encrypted payment execution on every single order. Your commercial pipeline is encrypted with TLS 1.3 standards."
    },
    {
      icon: <Cpu className="h-5 w-5 text-[#635bff]" />,
      title: "Minimalist Engineering",
      description: "We avoid visual noise and clunky layouts. Our components and products are custom-curated for hyper-focused creators."
    },
    {
      icon: <Award className="h-5 w-5 text-[#635bff]" />,
      title: "Design-Grade Curation",
      description: "Every item in our catalogue is vetted for material durability, high ergonomics, and stunning visual display aesthetics."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a] text-white"
    >
      {/* Hero Banner Section */}
      <div className="relative border-b border-white/10 overflow-hidden py-16 md:py-24 px-6 md:px-12 bg-gradient-to-br from-[#0c0c0c] via-transparent to-transparent">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
        
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <span className="w-2 h-2 bg-[#635bff] rounded-full animate-ping"></span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/60">Our Story & Ethos</span>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-black tracking-tight uppercase leading-none">
            ENGINEERING THE FUTURE OF <span className="text-white/40">DIGITAL WORKSPACES</span>.
          </h1>
          
          <p className="text-sm md:text-base text-white/60 font-mono leading-relaxed max-w-2xl">
            InnovateCart is a premium digital showcase dedicated to compiling and delivering elite hardware instruments for developer terminals and high-performance creative setups.
          </p>
        </div>
      </div>

      {/* Grid Features / Pillars */}
      <div className="py-16 px-6 md:px-12 max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 border-b border-white/10 pb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 font-mono">
            01 / Core Pillars
          </span>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            How We Build Trust & Polish
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((item, index) => (
            <div
              key={index}
              className="border border-white/10 p-8 rounded bg-white/5 hover:border-white/30 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/5 group-hover:border-[#635bff]/40 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-[#635bff] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  {item.description}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-white/5 text-[9px] font-mono uppercase tracking-widest text-white/30 flex items-center justify-between group-hover:text-white/60 transition-colors">
                <span>Verified System</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Highlights (Bento Section) */}
      <div className="border-t border-white/10 py-16 px-6 md:px-12 bg-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Catalogue Scale */}
          <div className="border border-white/10 p-8 rounded bg-[#0a0a0a] flex flex-col justify-between">
            <div>
              <span className="text-[40px] font-mono font-black text-white/20">100%</span>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mt-4 mb-2">Curated Catalogue</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                No filler. No generic components. Every item listed is calibrated for ergonomics, engineering performance, and design integrity.
              </p>
            </div>
            <div className="text-[10px] text-[#635bff] font-mono uppercase tracking-widest font-bold mt-6">
              Vetted Registry
            </div>
          </div>

          {/* Card 2: AI Capabilities */}
          <div className="border border-white/10 p-8 rounded bg-[#0a0a0a] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-[#635bff]" />
                <Star className="h-4 w-4 text-[#635bff]" />
                <Star className="h-4 w-4 text-[#635bff]" />
                <Star className="h-4 w-4 text-[#635bff]" />
                <Star className="h-4 w-4 text-[#635bff]" />
              </div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mt-4 mb-2">Gemini Recommendation Engine</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                State of the art server-side intelligence helps customize suggestions. Enter your setup desires and let the algorithm choose.
              </p>
            </div>
            <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-6">
              Online Assistance
            </div>
          </div>

          {/* Card 3: Secure Commercial Channels */}
          <div className="border border-white/10 p-8 rounded bg-[#0a0a0a] flex flex-col justify-between">
            <div>
              <span className="text-[40px] font-mono font-black text-[#635bff]">STRIPE</span>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mt-4 mb-2">Instant Financial Clearance</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Safe, simple checkout built securely on top of certified, cloud-hosted Stripe components. Accept credit cards worldwide instantly.
              </p>
            </div>
            <div className="text-[10px] text-green-400 font-mono uppercase tracking-widest mt-6">
              PCI Compliant
            </div>
          </div>

        </div>
      </div>

      {/* Footer message / vision */}
      <div className="py-16 px-6 text-center border-t border-white/10">
        <p className="text-xs uppercase font-mono tracking-widest text-white/30">
          © 2026 InnovateCart Inc. ALL RIGHTS RESERVED. DESIGNED FOR HIGH-FIDELITY WORKSPACES.
        </p>
      </div>
    </motion.div>
  );
}
