import React, { useState } from "react";
import { CartItem } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, Shield, Check, Loader2, AlertCircle, X } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onClearCart: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  onClearCart,
}: CheckoutModalProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);
  const [sandboxInfo, setSandboxInfo] = useState<string | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 500 ? 0 : 25; // free express over $500
  const total = subtotal + tax + shipping;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format card input with spaces
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 16) v = v.substring(0, 16);
    let parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    setCardNumber(parts.join(" "));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 4) v = v.substring(0, 4);
    if (v.length > 2) {
      setExpiry(v.substring(0, 2) + "/" + v.substring(2));
    } else {
      setExpiry(v);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 3) v = v.substring(0, 3);
    setCvc(v);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !cardNumber || !expiry || !cvc) {
      setError("Please complete all payment fields.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSandboxInfo(null);

    try {
      // 1. Create Payment Intent
      const piResponse = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          metadata: { name, email, item_count: cart.length.toString() }
        })
      });

      if (!piResponse.ok) {
        throw new Error("Stripe creation failed.");
      }

      const piData = await piResponse.json();
      
      if (piData.isSimulated) {
        setSandboxInfo("Stripe Developer Mode: Sandbox transaction simulated successfully.");
      }

      // 2. Complete order insertion on success
      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      }));

      const token = sessionStorage.getItem("id_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const orderResponse = await fetch("/api/place-order", {
        method: "POST",
        headers,
        body: JSON.stringify({
          items: orderItems,
          total,
          paymentMethod: "Stripe Card",
          paymentStatus: "completed"
        })
      });

      const orderData = await orderResponse.json();

      if (orderData.success) {
        // Stagger complete screen for premium hardware checkout feel
        setTimeout(() => {
          setSuccessOrder(orderData.order);
          setIsProcessing(false);
          onClearCart();
        }, 1500);
      } else {
        throw new Error("Could not process order records.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected checkout error occurred.");
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 text-white flex flex-col md:flex-row relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {!successOrder ? (
            <>
              {/* Left Column: Order Summary (Matte Black) */}
              <div className="w-full md:w-1/2 p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
                <div>
                  <div className="uppercase text-[10px] font-black tracking-[0.2em] text-white/40 mb-8">
                    Items Under Review
                  </div>

                  <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between items-start gap-4">
                        <div>
                          <div className="font-bold uppercase text-sm">{item.product.name}</div>
                          <div className="text-xs text-white/40">
                            Qty: {item.quantity} • {item.product.category}
                          </div>
                        </div>
                        <div className="font-mono text-sm">
                          ${(item.product.price * item.quantity).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 space-y-3">
                  <div className="flex justify-between text-xs text-white/40">
                    <div>Subtotal</div>
                    <div className="font-mono">${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="flex justify-between text-xs text-white/40">
                    <div>Shipping</div>
                    <div className="font-mono">{shipping === 0 ? "Complimentary" : `$${shipping.toFixed(2)}`}</div>
                  </div>
                  <div className="flex justify-between text-xs text-white/40">
                    <div>Estimated Tax (8%)</div>
                    <div className="font-mono">${tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="flex justify-between text-lg font-black uppercase tracking-tight pt-4 border-t border-white/10">
                    <div>Total</div>
                    <div className="font-mono text-[#635bff]">
                      ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Stripe Payment Form */}
              <form
                onSubmit={handleCheckout}
                className="w-full md:w-1/2 p-8 md:p-12 bg-[#0d0d0d] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <div className="uppercase text-[10px] font-black tracking-[0.2em] text-white/40">
                      SECURE CHECKOUT
                    </div>
                    <svg className="h-5 w-auto text-[#635bff]" viewBox="0 0 40 18" fill="currentColor">
                      <path d="M5.2 7.3C5.2 6.5 5.9 6.2 6.9 6.2c1.4 0 3.3.4 4.7 1l.5-4.1C10.7 2.6 8.7 2.2 7 2.2 2.9 2.2 0 4.4 0 8.3c0 6.1 8.4 5.1 8.4 7.7 0 1-.9 1.4-2 1.4-1.6 0-3.7-.6-5.3-1.4l-.6 4.1c1.6.7 4 1.1 5.8 1.1 4.3 0 7.3-2.1 7.3-6.1.1-6.4-8.4-5.3-8.4-7.8z" />
                    </svg>
                  </div>

                  {error && (
                    <div className="p-4 mb-6 bg-red-950/40 border border-red-800 text-red-200 text-xs flex gap-2 items-start">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>{error}</div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Customer Email */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="developer@studio.com"
                        className="w-full h-10 bg-white/5 border border-white/10 px-3 text-xs text-white placeholder-white/25 focus:border-white focus:outline-none focus:bg-white/10 transition-all font-mono"
                      />
                    </div>

                    {/* Cardholder Name */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ALEX MERCER"
                        className="w-full h-10 bg-white/5 border border-white/10 px-3 text-xs text-white placeholder-white/25 focus:border-white focus:outline-none focus:bg-white/10 transition-all uppercase font-mono"
                      />
                    </div>

                    {/* Stripe Card fields visual mockup */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
                          Payment Credentials
                        </span>
                        <div className="flex gap-1.5 text-white/40">
                          <CreditCard className="h-3.5 w-3.5" />
                          <Shield className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Card Number */}
                        <div>
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4242 4242 4242 4242"
                            className="w-full h-10 bg-white/5 border border-white/10 px-3 text-xs text-white placeholder-white/20 focus:border-white focus:outline-none focus:bg-white/10 transition-all font-mono"
                          />
                        </div>

                        {/* Exp / CVC */}
                        <div className="flex gap-3">
                          <input
                            type="text"
                            required
                            value={expiry}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="h-10 flex-1 bg-white/5 border border-white/10 px-3 text-xs text-white placeholder-white/20 focus:border-white focus:outline-none focus:bg-white/10 transition-all font-mono text-center"
                          />
                          <input
                            type="password"
                            required
                            value={cvc}
                            onChange={handleCvcChange}
                            placeholder="CVC"
                            maxLength={3}
                            className="h-10 w-24 bg-white/5 border border-white/10 px-3 text-xs text-white placeholder-white/20 focus:border-white focus:outline-none focus:bg-white/10 transition-all font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-[#635bff] hover:bg-[#5851d8] disabled:bg-white/10 disabled:text-white/40 text-white py-4 font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing Purchase...
                      </>
                    ) : (
                      `Authorize $${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    )}
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2 opacity-30 text-[9px] uppercase tracking-widest text-center">
                    <Shield className="h-3 w-3" />
                    <span>Encrypted with TLS 1.3 via Stripe</span>
                  </div>
                </div>
              </form>
            </>
          ) : (
            /* Success confirmation screen */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-12 text-center flex flex-col items-center justify-center min-h-[450px]"
            >
              <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mb-6">
                <Check className="h-8 w-8 text-black stroke-[3px]" />
              </div>

              <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">
                Purchase Confirmed
              </h2>
              <p className="text-sm text-white/60 max-w-md mx-auto mb-8">
                Your high-performance creative gear is scheduled for dispatch. An invoice and tracking receipt have been dispatched.
              </p>

              {sandboxInfo && (
                <div className="mb-6 px-4 py-2 bg-white/5 border border-white/10 rounded-full inline-flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-wider font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  {sandboxInfo}
                </div>
              )}

              <div className="p-6 bg-white/5 border border-white/10 rounded w-full max-w-md text-left font-mono text-xs space-y-3 mb-8">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40 uppercase">Order Identity</span>
                  <span className="text-white font-bold">{successOrder.id}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40 uppercase">Authorized Amount</span>
                  <span className="text-[#635bff] font-bold">
                    ${successOrder.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 uppercase">Delivery Window</span>
                  <span className="text-white uppercase font-bold">3-5 Business Days (Express)</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="bg-white text-black hover:bg-[#635bff] hover:text-white px-8 py-3.5 font-black uppercase tracking-widest text-xs transition-all duration-300"
              >
                Return to Storefront
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
