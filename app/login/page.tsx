"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Phone,
  ArrowRight,
  ChevronLeft,
  UserPlus,
  LogIn,
  AlertCircle,
  MapPin,
  Loader2,
  Mail,
  Lock,
} from "lucide-react";
import { Suspense } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { BorderTrail } from "@/components/ui/border-trail";

// ── Custom Line-Art Icons matching reference image ─────────────────────────────

function PartyPopperDoodleIcon({ className = "w-9 h-9 text-[#1F3B2C]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.8 11.3 2 22l10.7-3.8Z" />
      <path d="M4 3h.01" />
      <path d="M22 8h.01" />
      <path d="M15 2h.01" />
      <path d="M22 20h.01" />
      <path d="m22 2-2.24 2.24" />
      <path d="M14 11l-3 3" />
      <path d="m11.3 5.8 4.2 4.2" />
      <path d="M17.5 13.5c1.5-1.5 3-1.5 3.5 0" />
      <path d="M8.5 4.5c1.5 1.5 1.5 3 0 3.5" />
    </svg>
  );
}

function WavingHandIcon({ className = "w-9 h-9 text-[#2A1508]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 0 1 2 2v4a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.83l1.76 1.76V10" />
      <path d="M22 6c.5 1 1 2.5 1 4" strokeDasharray="2 2" />
      <path d="M20 3c1 1.5 2 3.5 2 6" strokeDasharray="2 2" />
    </svg>
  );
}

function SmilingCoffeeMug({ className = "w-9 h-9 text-[#3B4A2F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
      <path d="M6 2c.5 1 .5 2 0 3" />
      <path d="M10 2c.5 1 .5 2 0 3" />
      <path d="M14 2c.5 1 .5 2 0 3" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <path d="M9 15c.8.5 1.2.5 2 0" />
    </svg>
  );
}

function PizzaSliceDoodle({ className = "w-9 h-9 text-[#C4622D]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 22h20L12 2z" />
      <path d="M4 18c4-2 12-2 16 0" />
      <circle cx="12" cy="10" r="1.5" />
      <circle cx="9" cy="15" r="1.5" />
      <circle cx="15" cy="15" r="1.5" />
    </svg>
  );
}

function CakeSliceDoodle({ className = "w-8 h-8 text-[#E8A93B]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
      <path d="M4 16s2-1.5 4-1.5 4 1.5 4 1.5 4-1.5 4-1.5 4 1.5 4 1.5" />
      <path d="M2 21h20" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
    </svg>
  );
}

function SparkleStarDoodle({ className = "w-5 h-5 text-[#F5B942]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

const DoodleSparkle = SparkleStarDoodle;

function CustomerLoginPageContent() {
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

  // Check URL error parameter on mount
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "not_registered_google") {
      setErrorMessage(
        "No registered customer account found for this Google email. Please switch to Register to create your account."
      );
      setAuthMode("register");
    }
  }, [searchParams]);

  // Handle session verification
  async function handleSessionVerification(user: any, currentMode: "signin" | "register") {
    try {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileRow && currentMode === "signin") {
        await supabase.auth.signOut();
        localStorage.removeItem("celebration_customer_profile");
        setErrorMessage(
          "No registered customer account found for this Google account. Please switch to 'Register Account' to sign up."
        );
        setAuthMode("register");
        setCheckingSession(false);
        return;
      }

      if (!profileRow && currentMode === "register") {
        const displayName =
          name.trim() ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Customer";

        const { error: insertErr } = await supabase.from("profiles").insert({
          id: user.id,
          role: "customer",
          full_name: displayName,
          email: user.email,
          phone: phone.trim() || null,
          status: "active",
        });

        if (insertErr) {
          console.warn("Insert profile warning:", insertErr.message);
        }
      }

      const displayName =
        profileRow?.full_name ||
        name.trim() ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Customer";

      const profile = {
        name: displayName,
        email: user.email,
        phone: profileRow?.phone || phone.trim() || undefined,
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

  // Check initial session
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

  // Google OAuth Login
  async function handleGoogleLogin() {
    setErrorMessage("");
    setGoogleLoading(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/auth/callback?mode=${authMode}&next=${encodeURIComponent(redirectUrl)}`;

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

  // Mobile Fast Access
  async function handlePhoneLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }

    if (authMode === "register" && !name.trim()) {
      setErrorMessage("Please enter your name to register");
      return;
    }

    setSubmitting(true);

    try {
      const syntheticEmail = `phone_${cleanPhone}@celebrationcafe.in`;
      const syntheticPassword = `phone_${cleanPhone}_pass`;
      const profileName = name.trim() || "Customer (" + cleanPhone.slice(-4) + ")";

      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: syntheticPassword,
      });

      let user = signInData?.user;

      if (signInError || !user) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: syntheticEmail,
          password: syntheticPassword,
          options: {
            data: { display_name: profileName, phone: cleanPhone },
          },
        });

        if (signUpError) {
          console.warn("Supabase auth signup warning:", signUpError.message);
        } else {
          user = signUpData?.user;
        }
      }

      if (user) {
        await supabase.from("profiles").upsert({
          id: user.id,
          role: "customer",
          full_name: profileName,
          email: syntheticEmail,
          phone: cleanPhone,
          status: "active",
        });
      }

      const profile = {
        name: profileName,
        phone: cleanPhone,
        address: address.trim() || "Hamirpur, HP",
        isLoggedIn: true,
        loggedInAt: new Date().toISOString(),
      };

      localStorage.setItem("celebration_customer_profile", JSON.stringify(profile));
      toast.success(`Welcome ${profileName}!`);

      setTimeout(() => {
        router.push(redirectUrl);
      }, 400);
    } catch (err: any) {
      console.error("Phone login error:", err);
      toast.error("Failed to authenticate user session");
    } finally {
      setSubmitting(false);
    }
  }

  // Email Auth Handler
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
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          console.warn("Sign in error:", error.message);
          setErrorMessage(
            "Account not found or password incorrect for this email. Please switch to Register to create your account."
          );
        } else if (data.user) {
          await handleSessionVerification(data.user, "signin");
        }
      } else {
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

  // Loading Screen
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] text-[#2A1508] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="w-96 h-96 rounded-[50%_60%_70%_40%/60%_50%_40%_50%] bg-[#F5B942]/20 blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="text-center space-y-4 z-10">
          <div className="w-16 h-16 rounded-3xl bg-[#F5B942]/25 border-2 border-[#F5B942] text-[#1F3B2C] flex items-center justify-center mx-auto shadow-[0_8px_30px_rgba(245,185,66,0.4)]">
            <img src="/images/logos/logo.svg" alt="Logo" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center justify-center gap-2 text-[#1F3B2C] font-heading font-extrabold text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-[#F5B942]" />
            <span>Getting ready for food time…</span>
          </div>
          <p className="text-xs text-[#6B4226]/80 font-medium">Celebration Cafe</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2A1508] flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* ── 1. 4 STATIC ORGANIC GRADIENT BLOBS ─────────────── */}
      <div className="absolute top-[-100px] left-[-100px] sm:top-[-140px] sm:left-[-140px] w-[380px] sm:w-[580px] h-[380px] sm:h-[580px] rounded-[45%_55%_65%_35%/50%_60%_40%_50%] bg-gradient-to-br from-[#F5B942]/45 via-[#E8A93B]/25 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="absolute top-[-80px] right-[-80px] sm:top-[-120px] sm:right-[-120px] w-[350px] sm:w-[520px] h-[350px] sm:h-[520px] rounded-[60%_40%_35%_65%/45%_55%_50%_50%] bg-gradient-to-bl from-[#3B4A2F]/35 via-[#2A4B3A]/20 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-[-100px] left-[-100px] sm:bottom-[-130px] sm:left-[-130px] w-[360px] sm:w-[540px] h-[360px] sm:h-[540px] rounded-[50%_50%_70%_30%/60%_40%_50%_50%] bg-gradient-to-tr from-[#2A4B3A]/40 via-[#3B4A2F]/25 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-[-90px] right-[-90px] sm:bottom-[-120px] sm:right-[-120px] w-[380px] sm:w-[560px] h-[380px] sm:h-[560px] rounded-[65%_35%_40%_60%/40%_60%_50%_50%] bg-gradient-to-tl from-[#F5B942]/40 via-[#E8A93B]/20 to-transparent blur-3xl pointer-events-none z-0" />

      {/* ── 2. STATIC LINE-ART FOOD DOODLES (Zero Animations) ────────── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Left Doodle */}
        <div className={`absolute opacity-65 ${authMode === "signin" ? "top-[14%] left-[6%] sm:left-[10%]" : "top-[18%] left-[12%]"}`}>
          {authMode === "signin" ? (
            <PizzaSliceDoodle className="w-8 h-8 sm:w-10 sm:h-10 text-[#C4622D]" />
          ) : (
            <CakeSliceDoodle className="w-8 h-8 sm:w-10 sm:h-10 text-[#E8A93B]" />
          )}
        </div>

        {/* Top-Right Doodle */}
        <div className={`absolute opacity-65 ${authMode === "signin" ? "top-[16%] right-[8%] sm:right-[12%]" : "top-[12%] right-[6%]"}`}>
          {authMode === "signin" ? (
            <DoodleSparkle className="w-6 h-6 sm:w-7 sm:h-7 text-[#3B4A2F]" />
          ) : (
            <PizzaSliceDoodle className="w-8 h-8 sm:w-10 sm:h-10 text-[#C4622D]" />
          )}
        </div>

        {/* Mid-Right Doodle */}
        <div className={`absolute opacity-65 ${authMode === "signin" ? "top-[42%] right-[5%] sm:right-[9%]" : "top-[46%] right-[8%]"}`}>
          {authMode === "signin" ? (
            <CakeSliceDoodle className="w-8 h-8 sm:w-9 sm:h-9 text-[#E8A93B]" />
          ) : (
            <SmilingCoffeeMug className="w-8 h-8 sm:w-10 sm:h-10 text-[#3B4A2F]" />
          )}
        </div>

        {/* Bottom-Left Doodle */}
        <div className={`absolute opacity-70 ${authMode === "signin" ? "bottom-[16%] left-[6%] sm:left-[10%]" : "bottom-[18%] left-[8%]"}`}>
          {authMode === "signin" ? (
            <SmilingCoffeeMug className="w-9 h-9 sm:w-11 sm:h-11 text-[#3B4A2F]" />
          ) : (
            <DoodleSparkle className="w-7 h-7 text-[#F5B942]" />
          )}
        </div>

        {/* Bottom-Right Doodle */}
        <div className={`absolute opacity-70 ${authMode === "signin" ? "bottom-[18%] right-[7%] sm:right-[11%]" : "bottom-[14%] right-[10%]"}`}>
          <CakeSliceDoodle className="w-8 h-8 sm:w-10 sm:h-10 text-[#C4622D]" />
        </div>

        {/* Static Sparkle Stars around Headline */}
        <div className="absolute top-[22%] left-[28%] sm:left-[35%] text-[#F5B942] opacity-80">
          <SparkleStarDoodle className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="absolute top-[21%] right-[28%] sm:right-[35%] text-[#F5B942] opacity-80">
          <SparkleStarDoodle className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between z-10 pt-2">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#6B4226] hover:text-[#1F3B2C] transition-colors text-xs font-heading font-extrabold uppercase tracking-wider group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Cafe</span>
        </Link>

        {/* Brand SVG Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/images/logos/logo.svg"
            alt="Celebration Food Cafe"
            className="h-9 md:h-11 w-auto object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      </header>

      {/* ── 3. STATIC MAIN FORM CONTAINER ───────────────────────────────────── */}
      <main className="max-w-md mx-auto w-full my-auto py-4 sm:py-6 z-10 space-y-5">
        {/* Title Header with Icon */}
        <div className="text-center space-y-3 relative">
          {/* Header Badge Icon */}
          <div className="w-16 h-16 rounded-3xl bg-[#F5B942] border-3 border-[#1F3B2C]/20 text-[#1F3B2C] flex items-center justify-center mx-auto shadow-[0_10px_25px_rgba(245,185,66,0.45)]">
            {authMode === "signin" ? (
              <WavingHandIcon className="w-8 h-8 text-[#1F3B2C]" />
            ) : (
              <PartyPopperDoodleIcon className="w-8 h-8 text-[#1F3B2C]" />
            )}
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#2A1508] tracking-tight">
            {authMode === "signin" ? "Customer Sign In" : "Register Account"}
          </h1>
          <p className="text-[#6B4226]/85 text-xs sm:text-sm max-w-xs mx-auto font-medium leading-relaxed">
            {authMode === "signin"
              ? "Sign in to save your address, reorder past orders & enjoy quick checkout"
              : "Join Celebration Cafe to order thalis, pizzas & handcrafted coffee!"}
          </p>
        </div>

        {/* Static Mode Switcher Slider */}
        <div className="bg-[#F5EFE6] p-1.5 rounded-full border-2 border-[#1F3B2C]/15 grid grid-cols-2 text-xs font-heading font-extrabold tracking-wider uppercase relative shadow-inner">
          <button
            type="button"
            onClick={() => {
              setAuthMode("signin");
              setErrorMessage("");
            }}
            className={`py-3 rounded-full transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              authMode === "signin"
                ? "bg-[#F5B942] text-[#1F3B2C] font-black shadow-md shadow-[#F5B942]/40 border border-[#1F3B2C]/15"
                : "text-[#2A1508]/70 hover:text-[#2A1508]"
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setErrorMessage("");
            }}
            className={`py-3 rounded-full transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              authMode === "register"
                ? "bg-[#F5B942] text-[#1F3B2C] font-black shadow-md shadow-[#F5B942]/40 border border-[#1F3B2C]/15"
                : "text-[#2A1508]/70 hover:text-[#2A1508]"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Account</span>
          </button>
        </div>

        {/* Sub-Method Switcher: Email vs Mobile Fast Access */}
        <div className="flex justify-center gap-6 text-xs font-heading font-extrabold tracking-wider uppercase text-[#6B4226]">
          <button
            onClick={() => setMethod("email")}
            className={`pb-1 border-b-2 transition-all cursor-pointer ${
              method === "email"
                ? "border-[#F5B942] text-[#1F3B2C] font-black"
                : "border-transparent text-[#6B4226]/70 hover:text-[#2A1508]"
            }`}
          >
            Email Login
          </button>
          <button
            onClick={() => setMethod("phone")}
            className={`pb-1 border-b-2 transition-all cursor-pointer ${
              method === "phone"
                ? "border-[#F5B942] text-[#1F3B2C] font-black"
                : "border-transparent text-[#6B4226]/70 hover:text-[#2A1508]"
            }`}
          >
            Mobile Fast Access
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-500/10 border-2 border-red-500/30 text-red-800 text-xs p-4 rounded-2xl space-y-2.5 shadow-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold">{errorMessage}</p>
            </div>
            {authMode === "signin" && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setErrorMessage("");
                }}
                className="w-full bg-[#F5B942] text-[#1F3B2C] font-heading font-extrabold py-2 rounded-full text-xs shadow-sm hover:brightness-105 transition cursor-pointer"
              >
                Click here to Register New Account →
              </button>
            )}
          </div>
        )}

        {/* ── 4. CARD CONTAINER WITH BORDER TRAIL ON LOADING ── */}
        <div className="relative bg-[#FAF7F0] border-3 border-[#F5B942] rounded-[28px] p-6 sm:p-7 shadow-[0_12px_35px_rgba(245,185,66,0.22)] space-y-4 text-xs overflow-hidden">
          {googleLoading && (
            <BorderTrail
              className="bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-100"
              size={140}
              style={{ offsetPath: "rect(0 100% 100% 0 round 28px)", height: 8 }}
              transition={{
                ease: "linear",
                duration: 2.5,
                repeat: Infinity,
              }}
            />
          )}

          {/* Form 1: Email Auth Form */}
          {method === "email" && (
            <form onSubmit={handleEmailAuth} className="space-y-4 text-xs relative z-10">
              {authMode === "register" && (
                <div>
                  <label className="block font-heading font-extrabold text-xs text-[#2A1508] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#F5B942]" />
                    <span>Full Name *</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#6B4226]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F5EFE6] border-2 border-[#1F3B2C]/15 rounded-2xl pl-10 pr-4 py-3 text-[#2A1508] font-medium text-xs focus:outline-none focus:border-[#F5B942] focus:ring-4 focus:ring-[#F5B942]/25 shadow-xs transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-heading font-extrabold text-xs text-[#2A1508] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#F5B942]" />
                  <span>Email Address *</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B4226]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="customer@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F5EFE6] border-2 border-[#1F3B2C]/15 rounded-2xl pl-10 pr-4 py-3 text-[#2A1508] font-medium text-xs focus:outline-none focus:border-[#F5B942] focus:ring-4 focus:ring-[#F5B942]/25 shadow-xs transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-heading font-extrabold text-xs text-[#2A1508] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#F5B942]" />
                  <span>Password *</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B4226]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F5EFE6] border-2 border-[#1F3B2C]/15 rounded-2xl pl-10 pr-4 py-3 text-[#2A1508] font-medium text-xs focus:outline-none focus:border-[#F5B942] focus:ring-4 focus:ring-[#F5B942]/25 shadow-xs transition-all duration-200"
                  />
                </div>
              </div>

              {/* Static Primary Submit Pill CTA Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#F5B942] to-[#E8A93B] text-[#1F3B2C] font-heading font-extrabold py-3.5 rounded-full text-xs uppercase tracking-wider shadow-[0_6px_22px_rgba(245,185,66,0.5)] hover:brightness-105 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-2 border-2 border-[#1F3B2C]/10"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#1F3B2C]" />
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
            <form onSubmit={handlePhoneLogin} className="space-y-4 text-xs relative z-10">
              {authMode === "register" && (
                <div>
                  <label className="block font-heading font-extrabold text-xs text-[#2A1508] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#F5B942]" />
                    <span>Full Name *</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#6B4226]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F5EFE6] border-2 border-[#1F3B2C]/15 rounded-2xl pl-10 pr-4 py-3 text-[#2A1508] font-medium text-xs focus:outline-none focus:border-[#F5B942] focus:ring-4 focus:ring-[#F5B942]/25 shadow-xs transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-heading font-extrabold text-xs text-[#2A1508] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#F5B942]" />
                  <span>Mobile Number *</span>
                </label>
                <div className="flex gap-2">
                  <span className="bg-[#F5EFE6] border-2 border-[#1F3B2C]/15 px-3 py-3 rounded-2xl text-[#2A1508] font-mono font-bold flex items-center">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 bg-[#F5EFE6] border-2 border-[#1F3B2C]/15 rounded-2xl px-4 py-3 text-[#2A1508] placeholder:text-[#6B4226]/50 font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-[#F5B942] focus:ring-4 focus:ring-[#F5B942]/25 shadow-xs transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-heading font-extrabold text-xs text-[#2A1508] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#F5B942]" />
                  <span>Delivery Address (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="House No., Ward, Main Bazar, Hamirpur"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#F5EFE6] border-2 border-[#1F3B2C]/15 rounded-2xl px-4 py-3 text-[#2A1508] placeholder:text-[#6B4226]/50 font-medium text-xs focus:outline-none focus:border-[#F5B942] focus:ring-4 focus:ring-[#F5B942]/25 shadow-xs transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#F5B942] to-[#E8A93B] text-[#1F3B2C] font-heading font-extrabold py-3.5 rounded-full text-xs uppercase tracking-wider shadow-[0_6px_22px_rgba(245,185,66,0.5)] hover:brightness-105 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-2 border-2 border-[#1F3B2C]/10"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#1F3B2C]" />
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
          <div className="relative my-3 z-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-[#1F3B2C]/15" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#FAF7F0] px-3 text-[#6B4226]/70 font-heading font-extrabold">OR</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleLogin}
            className="relative z-10 w-full bg-white text-[#2A1508] border-2 border-[#1F3B2C]/20 hover:border-[#1F3B2C]/40 font-heading font-bold py-3.5 px-4 rounded-full transition-all flex items-center justify-center gap-3 cursor-pointer text-xs shadow-sm disabled:opacity-90 overflow-hidden"
          >
            {googleLoading && (
              <BorderTrail
                className="bg-gradient-to-r from-transparent via-[#F5B942] to-transparent opacity-100"
                size={100}
                style={{ offsetPath: "rect(0 100% 100% 0 round 9999px)", height: 6 }}
                transition={{
                  ease: "linear",
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-3">
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
                  <span>
                    {authMode === "register" ? "Register with Google" : "Sign In with Google"}
                  </span>
                </>
              )}
            </span>
          </button>
        </div>

        {/* Footer Toggle Text */}
        <div className="text-center pt-1">
          {authMode === "signin" ? (
            <p className="text-xs text-[#6B4226] font-medium">
              Don't have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setErrorMessage("");
                }}
                className="text-[#1F3B2C] font-heading font-extrabold hover:underline ml-1 cursor-pointer"
              >
                Register Here →
              </button>
            </p>
          ) : (
            <p className="text-xs text-[#6B4226] font-medium">
              Already registered?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setErrorMessage("");
                }}
                className="text-[#1F3B2C] font-heading font-extrabold hover:underline ml-1 cursor-pointer"
              >
                Sign In Here →
              </button>
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-[#6B4226]/60 z-10 py-2 font-medium">
        © {new Date().getFullYear()} Celebration Food Cafe, Hamirpur. All rights reserved.
      </footer>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F0] text-[#2A1508] flex flex-col items-center justify-center p-6">
          <div className="flex items-center justify-center gap-2 text-[#1F3B2C] font-heading font-extrabold text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-[#F5B942]" />
            <span>Loading Login Page…</span>
          </div>
        </div>
      }
    >
      <CustomerLoginPageContent />
    </Suspense>
  );
}
