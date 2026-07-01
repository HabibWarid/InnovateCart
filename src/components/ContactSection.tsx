import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowRight, Shield } from "lucide-react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [ticketId, setTicketId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setStatus("submitting");
    
    // Simulate high-fidelity secure transmission
    setTimeout(() => {
      const generatedId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketId(generatedId);
      setStatus("success");
    }, 1200);
  };

  const handleReset = () => {
    setFormData({ name: "", email: "", subject: "", message: "" });
    setStatus("idle");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a] text-white"
    >
      {/* Page Header */}
      <div className="border-b border-white/10 py-16 px-6 md:px-12 bg-gradient-to-br from-[#0c0c0c] via-transparent to-transparent">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <Shield className="h-3 w-3 text-[#635bff]" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/60">Secure Communications</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tight uppercase">
            CONNECT WITH <span className="text-white/40">OUR SYSTEMS</span>.
          </h1>
          <p className="text-sm text-white/50 font-mono max-w-2xl">
            Have custom workstation requirements or commercial distribution inquiries? Send an encrypted dispatch directly to our fulfillment terminals.
          </p>
        </div>
      </div>

      {/* Main Form + Info Split */}
      <div className="max-w-6xl mx-auto py-16 px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Side: Contact Information channels */}
        <div className="lg:col-span-5 space-y-8">
          <div className="border-b border-white/10 pb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 font-mono">
              01 / Communication Ports
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight mt-1">
              Direct Channels
            </h2>
          </div>

          <p className="text-xs text-white/60 leading-relaxed font-mono">
            Our operational terminals are active 24/7. Digital support and product customization specialists respond within a maximum of 4 hours.
          </p>

          <div className="space-y-6 pt-4">
            {/* Email Port */}
            <div className="flex items-start gap-4 p-4 border border-white/5 bg-white/5 hover:border-white/20 transition-all rounded">
              <div className="p-2 border border-white/10 bg-white/5 text-[#635bff]">
                <Mail className="h-5 w-5" />
              </div>
              <div className="font-mono">
                <span className="block text-[10px] uppercase text-white/40 font-bold">Email Dispatch</span>
                <a href="mailto:support@innovatecart.com" className="text-xs font-bold text-white hover:text-[#635bff] transition-colors">
                  support@innovatecart.com
                </a>
              </div>
            </div>

            {/* Phone Port */}
            <div className="flex items-start gap-4 p-4 border border-white/5 bg-white/5 hover:border-white/20 transition-all rounded">
              <div className="p-2 border border-white/10 bg-white/5 text-[#635bff]">
                <Phone className="h-5 w-5" />
              </div>
              <div className="font-mono">
                <span className="block text-[10px] uppercase text-white/40 font-bold">Support Line</span>
                <span className="text-xs font-bold text-white">
                  +1 (800) 555-0199
                </span>
              </div>
            </div>

            {/* HQ Location */}
            <div className="flex items-start gap-4 p-4 border border-white/5 bg-white/5 hover:border-white/20 transition-all rounded">
              <div className="p-2 border border-white/10 bg-white/5 text-[#635bff]">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="font-mono">
                <span className="block text-[10px] uppercase text-white/40 font-bold">Corporate Station</span>
                <span className="text-xs text-white/80 block leading-relaxed">
                  100 Minimalist Parkway, Suite 404<br />
                  San Francisco, CA 94107
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Form Container */}
        <div className="lg:col-span-7 border border-white/10 bg-white/5 p-8 rounded relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#635bff] to-transparent"></div>
          
          <AnimatePresence mode="wait">
            {status !== "success" ? (
              <motion.form
                key="contact-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="border-b border-white/5 pb-4">
                  <h3 className="text-lg font-black uppercase tracking-tight">Transmission Terminal</h3>
                  <p className="text-[10px] font-mono text-white/40">FILL OUT ALL FIELDS TO ESTABLISH CONNECTION</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-white/40 font-bold block">
                      Name / Handle *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., John Doe"
                      className="w-full h-10 bg-[#0a0a0a] border border-white/10 px-3 text-xs text-white placeholder-white/25 focus:border-[#635bff] focus:outline-none focus:bg-white/5 transition-all font-mono rounded"
                    />
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-white/40 font-bold block">
                      Email address *
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g., mail@example.com"
                      className="w-full h-10 bg-[#0a0a0a] border border-white/10 px-3 text-xs text-white placeholder-white/25 focus:border-[#635bff] focus:outline-none focus:bg-white/5 transition-all font-mono rounded"
                    />
                  </div>
                </div>

                {/* Subject field */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-mono tracking-widest text-white/40 font-bold block">
                    Subject / Port ID
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Custom Terminal Setup Request"
                    className="w-full h-10 bg-[#0a0a0a] border border-white/10 px-3 text-xs text-white placeholder-white/25 focus:border-[#635bff] focus:outline-none focus:bg-white/5 transition-all font-mono rounded"
                  />
                </div>

                {/* Message field */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-mono tracking-widest text-white/40 font-bold block">
                    Your message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Enter details of your project, customization preferences, or specific inquiries..."
                    className="w-full bg-[#0a0a0a] border border-white/10 p-3 text-xs text-white placeholder-white/25 focus:border-[#635bff] focus:outline-none focus:bg-white/5 transition-all font-mono rounded resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full h-11 bg-white hover:bg-[#635bff] text-black hover:text-white disabled:bg-white/5 disabled:text-white/20 font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer rounded"
                >
                  {status === "submitting" ? (
                    <span>Transmitting secure packet...</span>
                  ) : (
                    <>
                      <span>Transmit Dispatch</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8 space-y-6 font-mono"
              >
                <div className="w-16 h-16 border border-[#635bff] rounded-full flex items-center justify-center mx-auto bg-[#635bff]/10 text-[#635bff] animate-bounce">
                  <CheckCircle className="h-8 w-8" />
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] uppercase text-green-400 font-bold tracking-widest">
                    Transmission Complete
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white font-sans">
                    Secure Ticket Dispatched
                  </h3>
                  <div className="text-xs bg-[#0a0a0a] text-white/50 py-1.5 px-3 rounded inline-block font-mono border border-white/5">
                    ID: <span className="text-white font-bold">{ticketId}</span>
                  </div>
                </div>

                <div className="border-y border-white/10 py-4 max-w-md mx-auto text-left text-xs space-y-2 text-white/70">
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase font-bold">sender signature</span>
                    <span className="text-white font-bold">{formData.name}</span> <span className="text-white/30">({formData.email})</span>
                  </div>
                  {formData.subject && (
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase font-bold">subject matter</span>
                      <span className="text-white">{formData.subject}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase font-bold">payload sample</span>
                    <p className="text-white/50 italic line-clamp-2 mt-0.5">"{formData.message}"</p>
                  </div>
                </div>

                <p className="text-[11px] text-white/40 max-w-sm mx-auto leading-relaxed">
                  Our systems have securely recorded this dispatch. An automated routing engineer will establish contact soon.
                </p>

                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 border border-white/15 hover:border-white text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer rounded inline-flex items-center gap-2 text-white/80 hover:text-white"
                >
                  <span>Open New Dispatch</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
