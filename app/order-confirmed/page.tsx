"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronLeft, ShoppingBag, ClipboardList, CheckCircle2, Sparkles, Coffee } from "lucide-react";
import LiveOrderTracker from "@/components/LiveOrderTracker";
import { supabase } from "@/lib/supabase";

function OrderConfirmedContent() {
  const params = useSearchParams();
  const id = params.get("id");

  if (!id) {
    return (
      <main className="min-h-screen bg-[#121110] text-stone flex flex-col items-center justify-center p-6 text-center">
        <div className="space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-marigold/15 border border-marigold/30 text-marigold flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-stone">Order Placed</h1>
          <p className="text-xs text-stone/60">
            Thank you for ordering with Celebration Food Cafe! Visit your orders tab to track status live.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/orders"
              className="flex-1 bg-marigold text-pineDark font-extrabold px-5 py-3 rounded-2xl text-xs hover:bg-marigoldLight transition text-center"
            >
              View My Orders
            </Link>
            <Link
              href="/order"
              className="flex-1 bg-white/10 text-stone font-bold px-5 py-3 rounded-2xl text-xs hover:bg-white/20 transition text-center"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#121110] text-stone relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-marigold/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121110]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone/80 hover:text-marigold transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-marigold" />
            <span className="font-heading font-bold text-stone text-sm">Live Order Tracking</span>
          </div>
          <Link
            href="/orders"
            className="flex items-center gap-1.5 text-marigold text-xs font-bold hover:underline"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>All Orders</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 z-10 relative space-y-6">
        {/* Celebration Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-extrabold shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>Order Confirmed & Received!</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-stone">
            Preparing Your Feast 🍽️
          </h1>
          <p className="text-xs text-stone/60 max-w-sm mx-auto">
            Celebration Food Cafe has received your order. Follow real-time progress below!
          </p>
        </motion.div>

        {/* Live Tracker Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LiveOrderTracker orderId={id} />
        </motion.div>

        {/* Bottom CTA Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/orders"
            className="flex-1 flex items-center justify-center gap-2 bg-marigold text-pineDark font-extrabold py-3.5 px-5 rounded-2xl text-xs hover:bg-marigoldLight transition shadow-xl"
          >
            <ClipboardList className="w-4 h-4" />
            <span>View All My Orders</span>
          </Link>
          <Link
            href="/order"
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 border border-white/15 text-stone font-bold py-3.5 px-5 rounded-2xl text-xs hover:bg-white/20 transition"
          >
            <ShoppingBag className="w-4 h-4 text-marigold" />
            <span>Order More Food</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#121110] text-stone flex flex-col items-center justify-center p-6 text-center">
          <p className="text-xs text-stone/60">Loading live order details…</p>
        </main>
      }
    >
      <OrderConfirmedContent />
    </Suspense>
  );
}
