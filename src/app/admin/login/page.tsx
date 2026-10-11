"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Lock, Mail, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoPasscode, setDemoPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Invalid login credentials.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoError(null);
    setIsDemoLoading(true);

    try {
      const res = await fetch("/api/admin/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: demoPasscode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDemoError(data.error || "Failed to log in with demo passcode.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setDemoError("An error occurred during demo login.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center p-4 font-sans selection:bg-[#1E88E5]/20">
      <div className="w-full max-w-[420px] bg-white border border-black/[0.06] rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#1E88E5]/10 text-[#1E88E5] font-semibold text-xl rounded-2xl flex items-center justify-center mx-auto border border-[#1E88E5]/20">
            F
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            Freshy<span className="text-[#1E88E5]">.lk</span> Admin
          </h1>
          <p className="text-[13px] text-[#6E6E73]">
            Sign in to manage daily prices, stock, and orders
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#C62828]/10 border border-[#C62828]/20 text-[#C62828] rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* Database Auth Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6E6E73] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@freshy.lk"
                className="w-full pl-9 pr-3 py-2.5 bg-[#F5F5F7]/50 border border-black/[0.08] rounded-xl text-[#1D1D1F] placeholder:text-[#6E6E73]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6E6E73] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-[#F5F5F7]/50 border border-black/[0.08] rounded-xl text-[#1D1D1F] placeholder:text-[#6E6E73]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E88E5]/40 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#1E88E5] text-white font-semibold rounded-xl hover:bg-[#1E88E5]/90 transition-all duration-150 shadow-sm disabled:opacity-50 text-sm active:scale-[0.99]"
          >
            {isLoading ? "Signing in..." : "Sign In to Admin"}
          </button>
        </form>

        {/* Demo Passcode Login Section */}
        <div className="border-t border-black/[0.06] pt-6 mt-6">
          <div className="text-center mb-3">
            <span className="text-[11px] font-semibold tracking-wider text-[#B26A00] bg-[#B26A00]/10 px-3 py-1 rounded-full border border-[#B26A00]/20 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Demo Access Mode
            </span>
          </div>

          {demoError && (
            <div className="p-3 mb-3 bg-[#C62828]/10 border border-[#C62828]/20 text-[#C62828] rounded-xl text-xs font-medium">
              {demoError}
            </div>
          )}

          <form onSubmit={handleDemoLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#6E6E73] mb-1">
                Demo Passcode
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#6E6E73] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={demoPasscode}
                  onChange={(e) => setDemoPasscode(e.target.value)}
                  placeholder="Enter DEMO_ADMIN_PASSCODE"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F5F5F7]/50 border border-black/[0.08] rounded-xl text-[#1D1D1F] placeholder:text-[#6E6E73]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B26A00]/40 text-sm font-mono transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isDemoLoading}
              className="w-full py-2.5 bg-[#1D1D1F] text-white font-semibold rounded-xl hover:bg-black transition-all duration-150 shadow-sm disabled:opacity-50 text-sm active:scale-[0.99]"
            >
              {isDemoLoading ? "Verifying Passcode..." : "Enter Demo Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
