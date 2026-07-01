import { useState, useRef, useEffect } from "react";
import { Message, CartItem } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Loader2, Cpu, Sparkles } from "lucide-react";

interface ChatbotProps {
  cart: CartItem[];
}

export default function Chatbot({ cart }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "bot",
      text: "Welcome to MONO_STORE. I am your autonomous AI support concierge. Ask me anything about our hardware or secure checkout.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentCart: cart.map(i => ({ productId: i.product.id, name: i.product.name, qty: i.quantity }))
        })
      });

      if (!response.ok) {
        throw new Error("Chatbot API response error.");
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const botMessage: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: "Apologies, I encountered a connection delay. I am ready to resolve any product specs or payment inquiries.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Tell me about Studio Display",
    "How secure is Stripe?",
    "Complimentary shipping rules",
    "Is there a warranty?"
  ];

  return (
    <div className="fixed bottom-20 right-6 z-40 flex flex-col items-end">
      {/* Expanded Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 md:w-96 h-[480px] bg-[#0a0a0a] border border-white/10 text-white flex flex-col mb-4 overflow-hidden shadow-2xl"
          >
            {/* Chat Header */}
            <div className="h-16 border-b border-white/10 px-4 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">MONO_CONCIERGE</div>
                  <div className="text-[9px] text-white/40 uppercase font-mono tracking-widest">Powered by Gemini AI</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Message Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0d0d0d]"
            >
              {messages.map((m) => {
                const isUser = m.sender === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 text-xs leading-relaxed ${
                        isUser
                          ? "bg-white text-black font-medium"
                          : "bg-white/5 border border-white/10 text-white/90"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[8px] font-mono text-white/30 mt-1 uppercase">
                      {m.timestamp}
                    </span>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-white/40 text-xs font-mono">
                  <Loader2 className="h-3 w-3 animate-spin text-[#635bff]" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="px-4 py-2 border-t border-white/5 bg-[#0a0a0a] flex gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="text-[9px] font-bold uppercase tracking-wider border border-white/10 hover:border-white text-white/60 hover:text-white px-2.5 py-1 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <div className="h-14 border-t border-white/10 flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                placeholder="Ask MONO_CONCIERGE..."
                className="flex-1 bg-transparent px-4 text-xs focus:outline-none placeholder-white/20 font-mono"
              />
              <button
                onClick={() => handleSend(input)}
                className="w-14 h-full border-l border-white/10 hover:bg-white hover:text-black text-white/60 flex items-center justify-center transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full bg-white text-black hover:bg-[#635bff] hover:text-white flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    </div>
  );
}
