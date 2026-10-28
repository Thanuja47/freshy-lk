"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { submitContactInquiry } from "@/actions/contact";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await submitContactInquiry({
        name,
        phone,
        email: email || undefined,
        message,
      });

      if (res.success) {
        setSuccessMsg(res.message || "Thank you! Your message has been received.");
        setName("");
        setPhone("");
        setEmail("");
        setMessage("");
      } else {
        setErrorMsg(res.message || "Failed to submit message. Please try again.");
      }
    } catch {
      setErrorMsg("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[#CFE6F9] rounded-[20px] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
      <div className="text-center max-w-xl mx-auto mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#0D2137]">
          Send Us a Message
        </h2>
        <p className="text-xs sm:text-sm text-[#0D2137]/60 mt-1">
          Have an inquiry, bulk order question, or need assistance? Leave a message below.
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-[#2E7D32]/10 border border-[#2E7D32]/20 rounded-xl text-xs sm:text-sm font-semibold text-[#2E7D32] flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-[#C62828]/10 border border-[#C62828]/20 rounded-xl text-xs sm:text-sm font-semibold text-[#C62828] flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#0D2137]/70 mb-1.5">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kasun Perera"
              className="w-full px-4 py-2.5 bg-[#F7FBFF] border border-[#CFE6F9] rounded-xl text-sm text-[#0D2137] placeholder:text-[#0D2137]/35 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#0D2137]/70 mb-1.5">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 077 123 4567"
              className="w-full px-4 py-2.5 bg-[#F7FBFF] border border-[#CFE6F9] rounded-xl text-sm text-[#0D2137] placeholder:text-[#0D2137]/35 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/30 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#0D2137]/70 mb-1.5">
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. kasun@example.com"
            className="w-full px-4 py-2.5 bg-[#F7FBFF] border border-[#CFE6F9] rounded-xl text-sm text-[#0D2137] placeholder:text-[#0D2137]/35 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#0D2137]/70 mb-1.5">
            Message *
          </label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we assist you with your seafood order?"
            className="w-full px-4 py-2.5 bg-[#F7FBFF] border border-[#CFE6F9] rounded-xl text-sm text-[#0D2137] placeholder:text-[#0D2137]/35 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/30 transition-all resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[#1E88E5] text-white font-semibold text-sm rounded-xl hover:bg-[#1565C0] transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending Message...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Message</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
