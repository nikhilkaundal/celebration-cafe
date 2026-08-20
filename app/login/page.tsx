"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Phone,
  Mail,
  ArrowRight,
  Coffee,
  ChevronLeft,
  UserPlus,
  LogIn,
  AlertCircle,
  MapPin,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function CustomerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  let targetRedirect = searchParams.get("redirect") || searchParams.get("next") || "/";
  if (targetRedirect === "/login" || targetRedirect.includes("/login")) {
    targetRedirect = "/";
  }
  const redirectUrl = targetRedirect;

  // Login Mode: "signin" (default) or "register"
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  // Sub-method: "email" or "phone"
  const [method, setMethod] = useState<"email" | "phone">("email");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Check URL error parameter on mount (e.g. ?error=not_registered_google)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "not_registered_google") {
      setErrorMessage(
        "No registered customer account found for this Google email. Please switch to the Register tab to create your account."
      );
      setAuthMode("register");
    }
  }, [searchParams]);

  // Handle session check and database registration verification
  async function handleSessionVerification(user: any, currentMode: "signin" | "register") {
    try {
      // Query the customers table for this user's ID
      const { data: customerRow } = await supabase
        .from("customers")
        .select("*")
        .eq("id", user.id)
        .single();

      // Case 1: User tries to SIGN IN, but NO account exists in customers table
      if (!customerRow && currentMode === "signin") {
        await supabase.auth.signOut();
        localStorage.removeItem("celebration_customer_profile");
        setErrorMessage(
          "No registered customer account found for this Google account. Please switch to 'Register Account' to sign up."
        );
        setAuthMode("register");
        setCheckingSession(false);
        return;
      }

      // Case 2: User is REGISTERING, create customer row if missing
      if (!customerRow && currentMode === "register") {
        const displayName =
          name.trim() ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Customer";

        const { error: insertErr } = await supabase.from("customers").insert({
          id: user.id,
          name: displayName,
          email: user.email,
          phone: phone.trim() || null,
        });

        if (insertErr) {
          console.warn("Insert customer warning:", insertErr.message);
        }
      }

      // Case 3: Customer verified / registered! Save profile and redirect to /
      const displayName =
        customerRow?.name ||
        name.trim() ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Customer";

      const profile = {
        name: displayName,
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        isLoggedIn: true,
      };

      localStorage.setItem("celebration_customer_profile", JSON.stringify(profile));
      toast.success(`Welcome ${displayName}!`);
      router.push(redirectUrl);
    } catch (e) {
      console.error("Session verification error:", e);
      setCheckingSession(false);
    }
  }

  // Check initial session & listen for auth state changes
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const errorParam = searchParams.get("error");
        if (errorParam === "not_registered_google") {
          setCheckingSession(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await handleSessionVerification(session.user, authMode);
        } else {
          // Check saved localStorage profile fallback
          const savedProfile = localStorage.getItem("celebration_customer_profile");
          if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            if (parsed.isLoggedIn && parsed.name) {
              router.push(redirectUrl);
              return;
            }
          }
          setCheckingSession(false);
        }
      } catch (e) {
        console.error(e);
        setCheckingSession(false);
      }
    }

    checkAuthSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const errorParam = searchParams.get("error");
      if (errorParam === "not_registered_google") {
        setCheckingSession(false);
        return;
      }

      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        await handleSessionVerification(session.user, authMode);
      } else {
        setCheckingSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, redirectUrl, searchParams, authMode]);

  // Google OAuth Login / Register
  async function handleGoogleLogin() {
    setErrorMessage("");
    setGoogleLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?mode=${authMode}&next=${encodeURIComponent(redirectUrl)}`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (oauthError) {
      setErrorMessage(oauthError.message);
      toast.error(oauthError.message);
      setGoogleLoading(false);
    }
  }

  // Mobile Fast Access (Local Quick Profile)
  function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!phone.trim() || phone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }

    if (authMode === "register" && !name.trim()) {
      setErrorMessage("Please enter your name to register");
      return;
    }

    setSubmitting(true);

    try {
      const profileName = name.trim() || "Customer (" + phone.slice(-4) + ")";
      const profile = {
        name: profileName,
        phone: phone.trim(),
        address: address.trim() || "Hamirpur, HP",
        isLoggedIn: true,
        loggedInAt: new Date().toISOString(),
      };

      localStorage.setItem("celebration_customer_profile", JSON.stringify(profile));
      toast.success(`Welcome ${profileName}!`, {
        description: "Your details have been saved for quick ordering.",
      });

      setTimeout(() => {
        router.push(redirectUrl);
      }, 400);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save session");
    } finally {
      setSubmitting(false);
    }
  }

  // Email Sign In / Sign Up Handler
  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Email and password are required");
      return;
    }

    setSubmitting(true);

    try {
      if (authMode === "signin") {
        // --- SIGN IN FLOW ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          console.warn("Sign in error:", error.message);
          setErrorMessage(
            "Account not found or password incorrect for this email. Please switch to the Register tab to create your account."
          );
        } else if (data.user) {
          await handleSessionVerification(data.user, "signin");
        }
      } else {
        // --- REGISTER / SIGN UP FLOW ---
        if (!name.trim()) {
          setErrorMessage("Please enter your full name to register");
          setSubmitting(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: { display_name: name.trim() },
          },
        });

        if (error) {
          setErrorMessage(error.message);
        } else if (data.user) {
          await handleSessionVerification(data.user, "register");
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Authentication failed. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  }

  // Full Screen Loading State
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#121110] text-stone flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-marigold/15 blur-3xl pointer-events-none" />
        <div className="text-center space-y-4 z-10">
          <div className="w-16 h-16 rounded-3xl bg-marigold/20 border border-marigold/40 text-marigold flex items-center justify-center mx-auto shadow-2xl animate-pulse">
            <Coffee className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2 text-marigold font-bold text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying session…</span>
          </div>
          <p className="text-xs text-stone/60">Celebration Food Cafe Customer Portal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121110] text-stone flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-marigold/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-stone/80 hover:text-marigold transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Cafe
        </Link>

        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-marigold" />
          <span className="font-heading font-bold text-stone text-sm">Celebration Cafe</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full my-auto py-6 z-10 space-y-5">
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-marigold/20 border border-marigold/40 text-marigold flex items-center justify-center mx-auto shadow-xl">
            {authMode === "signin" ? <LogIn className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
          </div>
          <h1 className="font-heading text-3xl font-bold text-stone">
            {authMode === "signin" ? "Customer Sign In" : "Register New Account"}
          </h1>
          <p className="text-stone/70 text-xs max-w-xs mx-auto">
            {authMode === "signin"
              ? "Sign in to save your address, reorder past orders & enjoy quick checkout"
              : "Create a new account with Email, Mobile or Google to start ordering"}
          </p>
        </div>

        {/* 1. Main Mode Switcher: Sign In vs Register */}
        <div className="bg-white/10 p-1.5 rounded-2xl border border-white/15 grid grid-cols-2 text-xs font-bold">
          <button
            onClick={() => {
              setAuthMode("signin");
              setErrorMessage("");
            }}
            className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
              authMode === "signin"
                ? "bg-marigold text-pineDark font-extrabold shadow-md"
                : "text-stone/80 hover:text-stone"
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => {
              setAuthMode("register");
              setErrorMessage("");
            }}
            className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
              authMode === "register"
                ? "bg-marigold text-pineDark font-extrabold shadow-md"
                : "text-stone/80 hover:text-stone"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Account</span>
          </button>
        </div>

        {/* Sub-Method Switcher: Email vs Mobile Fast Access */}
        <div className="flex justify-center gap-4 text-xs font-bold text-stone/70">
          <button
            onClick={() => setMethod("email")}
            className={`pb-1 border-b-2 transition ${
              method === "email" ? "border-marigold text-marigold" : "border-transparent hover:text-stone"
            }`}
          >
            Email Login
          </button>
          <button
            onClick={() => setMethod("phone")}
            className={`pb-1 border-b-2 transition ${
              method === "phone" ? "border-marigold text-marigold" : "border-transparent hover:text-stone"
            }`}
          >
            Mobile Fast Access
          </button>
        </div>

        {/* Error Message Box */}
        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-xs p-3.5 rounded-2xl space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{errorMessage}</p>
            </div>
            {authMode === "signin" && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setErrorMessage("");
                }}
                className="w-full bg-marigold text-pineDark font-extrabold py-2 rounded-xl text-xs shadow-md hover:bg-marigoldLight transition mt-1 cursor-pointer"
              >
                Click here to Register New Account →
              </button>
            )}
          </div>
        )}

        {/* Form 1: Email Auth Form (Sign In / Register) */}
        {method === "email" && (
          <form
            onSubmit={handleEmailAuth}
            className="bg-white/5 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-xs"
          >
            {authMode === "register" && (
              <div>
                <label className="block font-bold text-stone mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1816] border border-white/20 rounded-2xl px-4 py-3 text-stone font-medium text-xs focus:outline-none focus:border-marigold transition"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-stone mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                placeholder="customer@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A1816] border border-white/20 rounded-2xl px-4 py-3 text-stone font-medium text-xs focus:outline-none focus:border-marigold transition"
              />
            </div>

            <div>
              <label className="block font-bold text-stone mb-1.5">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1816] border border-white/20 rounded-2xl px-4 py-3 text-stone font-medium text-xs focus:outline-none focus:border-marigold transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold py-3.5 rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing…</span>
                </>
              ) : (
                <>
                  <span>
                    {authMode === "register" ? "Register & Create Account" : "Sign In with Email"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form 2: Mobile Phone Fast Access Form */}
        {method === "phone" && (
          <form
            onSubmit={handlePhoneLogin}
            className="bg-white/5 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-xs"
          >
            {authMode === "register" && (
              <div>
                <label className="block font-bold text-stone mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-marigold" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1816] border border-white/20 rounded-2xl px-4 py-3 text-stone font-medium text-xs focus:outline-none focus:border-marigold transition"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-stone mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-marigold" />
                <span>Mobile Number *</span>
              </label>
              <div className="flex gap-2">
                <span className="bg-[#1A1816] border border-white/20 px-3 py-3 rounded-2xl text-stone/80 font-mono font-bold flex items-center">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 bg-[#1A1816] border border-white/20 rounded-2xl px-4 py-3 text-stone placeholder:text-stone/40 font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-marigold transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-marigold" />
                <span>Delivery Address (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="House No., Ward, Main Bazar, Hamirpur"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#1A1816] border border-white/20 rounded-2xl px-4 py-3 text-stone placeholder:text-stone/40 font-medium text-xs focus:outline-none focus:border-marigold transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold py-3.5 rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving details…</span>
                </>
              ) : (
                <>
                  <span>
                    {authMode === "register" ? "Register with Mobile" : "Sign In with Mobile"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/15" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#121110] px-3 text-stone/60 font-bold">OR</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleLogin}
          className="w-full bg-stone text-charcoal border border-stone/30 hover:bg-white font-bold py-3.5 px-4 rounded-2xl transition flex items-center justify-center gap-3 cursor-pointer text-xs shadow-md disabled:opacity-60"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-pine" />
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
              <span>
                {authMode === "register" ? "Register with Google" : "Sign In with Google"}
              </span>
            </>
          )}
        </button>

        {/* Footer Toggle Text */}
        <div className="text-center pt-2">
          {authMode === "signin" ? (
            <p className="text-xs text-stone/70">
              Don't have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setErrorMessage("");
                }}
                className="text-marigold font-bold hover:underline"
              >
                Register Here
              </button>
            </p>
          ) : (
            <p className="text-xs text-stone/70">
              Already registered?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setErrorMessage("");
                }}
                className="text-marigold font-bold hover:underline"
              >
                Sign In Here
              </button>
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-stone/50 z-10 py-2">
        © {new Date().getFullYear()} Celebration Food Cafe, Hamirpur. All rights reserved.
      </footer>
    </div>
  );
}
