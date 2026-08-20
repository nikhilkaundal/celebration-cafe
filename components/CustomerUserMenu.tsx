"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  LogOut,
  ShoppingBag,
  ChevronDown,
  ClipboardList,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface CustomerProfile {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  isLoggedIn: boolean;
}

export default function CustomerUserMenu() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function syncProfile() {
    try {
      // 1. Check Supabase authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Customer";
        const avatar_url = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        const email = user.email;

        const updatedProfile: CustomerProfile = {
          name,
          email,
          avatar_url,
          isLoggedIn: true,
        };

        // Save to local storage for instant offline access
        localStorage.setItem("celebration_customer_profile", JSON.stringify(updatedProfile));
        setProfile(updatedProfile);
        return;
      }

      // 2. Check local profile fallback
      const saved = localStorage.getItem("celebration_customer_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isLoggedIn || parsed.name) {
          setProfile(parsed);
          return;
        }
      }

      setProfile(null);
    } catch (e) {
      console.error("Profile sync error:", e);
    }
  }

  useEffect(() => {
    syncProfile();

    // Listen for auth changes (e.g. Google OAuth login completion)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncProfile();
    });

    // Close menu when clicking outside
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("celebration_customer_profile");
      setProfile(null);
      setMenuOpen(false);
      toast.success("Logged out successfully");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  if (!profile || !profile.isLoggedIn) {
    return (
      <Link
        href="/login"
        className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-stone bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-full transition cursor-pointer"
      >
        <User className="w-3.5 h-3.5 text-marigold" />
        <span>Login</span>
      </Link>
    );
  }

  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : "C";

  const menuLinks = [
    { href: "/profile", label: "My Profile", icon: User },
    { href: "/orders", label: "My Orders", icon: ClipboardList },
    { href: "/order", label: "Order Food", icon: ShoppingBag },
  ];

  return (
    <div ref={menuRef} className="relative z-50">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center justify-center bg-white/10 hover:bg-white/20 border border-marigold/50 p-1 rounded-full text-xs font-extrabold text-stone transition cursor-pointer shadow-md hover:scale-105 active:scale-95"
        title={profile.name}
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.name}
            className="w-8 h-8 rounded-full object-cover border border-marigold"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-marigold text-pineDark font-extrabold text-xs flex items-center justify-center shadow-xs">
            {initial}
          </div>
        )}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-60 bg-[#1A1816] text-stone border border-white/15 rounded-2xl p-3 shadow-2xl space-y-1 text-xs"
          >
            {/* User Header */}
            <div className="p-2.5 border-b border-white/10 flex items-center gap-3 mb-1">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-marigold shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-marigold text-pineDark font-extrabold text-sm flex items-center justify-center shadow-md">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-stone text-xs truncate">{profile.name}</p>
                {profile.email && (
                  <p className="text-[10px] text-stone/60 truncate">{profile.email}</p>
                )}
                {profile.phone && (
                  <p className="text-[10px] text-stone/60 truncate">+91 {profile.phone}</p>
                )}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-0.5 py-1">
              {menuLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone/90 hover:bg-white/10 hover:text-marigold font-bold transition"
                >
                  <link.icon className="w-4 h-4 text-marigold/80" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Logout Action */}
            <div className="pt-1 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300 hover:bg-red-500/10 font-bold transition cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
