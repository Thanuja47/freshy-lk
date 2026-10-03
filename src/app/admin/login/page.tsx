"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div className="min-h-screen bg-ice flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-sand rounded-xl p-8 shadow-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-sea-glass text-tide font-serif font-bold text-2xl rounded-full flex items-center justify-center mx-auto mb-3">
            F
          </div>
          <h1 className="font-serif text-2xl font-bold text-sea-ink">Freshy.lk Admin</h1>
          <p className="text-xs text-sea-ink/70 mt-1">Sign in to manage prices, stock, and orders</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@freshy.lk"
              className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-tide text-white font-bold rounded-lg hover:bg-tide/90 transition-colors shadow-sm disabled:opacity-50 text-sm"
          >
            {isLoading ? "Signing in..." : "Sign In to Admin"}
          </button>
        </form>

        {/* Demo Mode Passcode Login Section */}
        <div className="border-t border-sand pt-6 mt-6">
          <div className="text-center mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Demo Access Mode
            </span>
          </div>

          {demoError && (
            <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs">
              {demoError}
            </div>
          )}

          <form onSubmit={handleDemoLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-sea-ink/70 mb-1">
                Demo Passcode
              </label>
              <input
                type="password"
                required
                value={demoPasscode}
                onChange={(e) => setDemoPasscode(e.target.value)}
                placeholder="Enter DEMO_ADMIN_PASSCODE"
                className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isDemoLoading}
              className="w-full py-2.5 bg-amber-800 text-white font-bold rounded-lg hover:bg-amber-900 transition-colors shadow-sm disabled:opacity-50 text-sm"
            >
              {isDemoLoading ? "Verifying Passcode..." : "Enter Demo Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
