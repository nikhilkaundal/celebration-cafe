"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { ShoppingBag, LogIn, UserPlus, X, Coffee, ShieldCheck } from "lucide-react";

type AuthGateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pendingItemName?: string;
};

export function AuthGateModal({ isOpen, onClose, pendingItemName }: AuthGateModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose();
    router.push("/login?redirect=/order&action=add_pending");
  };

  const handleRegister = () => {
    onClose();
    router.push("/login?mode=register&redirect=/order&action=add_pending");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="relative z-10 bg-[#171513] text-stone border border-marigold/30 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 overflow-hidden"
        >
          {/* Top Decorative Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-marigold/15 blur-3xl pointer-events-none rounded-full" />

          {/* Header */}
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-marigold/20 border border-marigold/40 flex items-center justify-center text-marigold shadow-inner">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold bg-marigold/20 text-marigold border border-marigold/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Guest Browsing
                </span>
                <h3 className="font-heading text-xl font-bold text-stone mt-1">
                  Sign in to Add to Cart
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone/60 hover:text-stone bg-white/5 hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2 relative z-10 text-xs text-stone/80 leading-relaxed">
            {pendingItemName ? (
              <p>
                To add <strong className="text-marigold font-semibold">"{pendingItemName}"</strong> to your cart and customize your order, please log in or create a customer account.
              </p>
            ) : (
              <p>
                Please log in or create an account to add delicious items to your cart, save your address, and place an order.
              </p>
            )}

            <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-stone/60 font-medium">
              <ShieldCheck className="w-4 h-4 text-marigold shrink-0" />
              <span>We'll save your selected dish and add it automatically once you log in!</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-1 relative z-10">
            <button
              type="button"
              onClick={handleSignIn}
              className="w-full bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold py-3.5 px-4 rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Existing Account</span>
            </button>

            <button
              type="button"
              onClick={handleRegister}
              className="w-full bg-white/10 hover:bg-white/15 text-stone border border-white/20 font-bold py-3.5 px-4 rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-marigold" />
              <span>Create New Customer Account</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-xs font-semibold text-stone/60 hover:text-stone py-2 transition cursor-pointer"
            >
              Keep Browsing Menu
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
