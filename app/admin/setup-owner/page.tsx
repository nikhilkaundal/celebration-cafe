"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Crown, Mail, Lock, User, ArrowRight, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SetupOwnerPage() {
  const router = useRouter();
  const [name, setName] = useState("Celebration Owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/setup-first-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to setup owner account");
      } else {
        toast.success(data.message || "Owner account created!");
        setSuccessMsg(data.message);
        setTimeout(() => {
          router.push("/admin/login");
        }, 2000);
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#121110] text-stone flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-marigold/15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 border border-white/12 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 z-10 relative">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <Crown className="w-8 h-8" />
          </div>

          <h1 className="font-heading text-2xl font-extrabold text-stone">Setup Cafe Owner Account</h1>
          <p className="text-xs text-stone/60">
            Create or upgrade your account to full <span className="text-amber-400 font-bold">Owner</span> privileges.
          </p>
        </div>

        {successMsg ? (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-3 text-emerald-400">
            <CheckCircle2 className="w-10 h-10 mx-auto" />
            <p className="text-xs font-bold">{successMsg}</p>
            <p className="text-[11px] text-emerald-300">Redirecting to Staff Login page…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone/80 mb-1">Your Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone/40 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Nikhil Kaundal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/8 border border-white/12 rounded-xl pl-10 pr-3 py-2.5 text-stone text-xs focus:border-marigold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone/80 mb-1">Owner Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone/40 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="owner@celebrationcafe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/8 border border-white/12 rounded-xl pl-10 pr-3 py-2.5 text-stone text-xs focus:border-marigold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone/80 mb-1">Owner Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone/40 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Min 10 chars (e.g. CafeOwner#2026)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/8 border border-white/12 rounded-xl pl-10 pr-3 py-2.5 text-stone text-xs focus:border-marigold focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-stone/40 mt-1">
                Must be 10+ characters with UPPERCASE, lowercase, number, and symbol (!@#$).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 text-stone-900 font-extrabold py-3 rounded-xl hover:bg-amber-300 transition flex items-center justify-center gap-2 shadow-lg cursor-pointer text-xs mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Make Me Owner & Launch</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/admin/login" className="text-xs text-stone/50 hover:text-stone transition font-semibold">
            Already Owner? Login to Admin Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
