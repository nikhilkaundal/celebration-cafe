"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BorderTrail } from "@/components/ui/border-trail";

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Check for error parameter in URL (e.g. ?error=not_staff)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "not_staff") {
      setError("That Google account isn't registered as staff. Ask the owner to add you first.");
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.push("/admin/orders");
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/admin/auth/callback`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1F3B2C] px-4">
      <div className="w-full max-w-sm bg-[#FAF7F0] rounded-2xl p-8 shadow-xl relative overflow-hidden">
        {googleLoading && (
          <BorderTrail
            className="bg-gradient-to-r from-emerald-400 via-[#F5B942] to-emerald-400 opacity-100"
            size={140}
            style={{ offsetPath: "rect(0 100% 100% 0 round 1rem)" }}
            transition={{
              ease: [0, 0.5, 0.8, 0.5],
              duration: 4,
              repeat: Infinity,
            }}
          />
        )}
        <p className="uppercase tracking-[0.2em] text-[#7A2E2E] text-xs mb-2 text-center font-extrabold relative z-10">
          Staff Access
        </p>
        <h1 className="font-display text-2xl font-semibold text-[#1F3B2C] text-center mb-6 relative z-10">
          Celebration Food Cafe
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 text-xs p-3 rounded-md mb-4 leading-relaxed font-medium relative z-10">
            {error}
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div>
            <label className="block text-sm font-medium mb-1 text-[#2A2622]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#1F3B2C]/20 rounded-md px-3 py-2 bg-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#2A2622]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#1F3B2C]/20 rounded-md px-3 py-2 bg-white text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1F3B2C] text-[#FAF7F0] font-semibold py-3 rounded-md hover:bg-[#162A1F] transition disabled:opacity-60 cursor-pointer text-sm shadow-sm"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2A2622]/15" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#FAF7F0] px-3 text-[#2A2622]/60 font-bold">OR</span>
          </div>
        </div>

        {/* Google Sign In Secondary Button */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleLogin}
          className="relative z-10 w-full bg-white text-[#2A2622] border border-gray-300 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-md transition flex items-center justify-center gap-3 cursor-pointer text-sm shadow-xs disabled:opacity-90"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#1F3B2C]" />
              <span>Connecting to Google…</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        <p className="text-xs text-center text-[#2A2622]/60 mt-6 leading-relaxed">
          This portal is for cafe staff only. Pre-registered staff can sign in with Email or Google.
        </p>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#1F3B2C] px-4">
          <p className="text-white text-xs">Loading Staff Login…</p>
        </main>
      }
    >
      <AdminLoginPageContent />
    </Suspense>
  );
}
