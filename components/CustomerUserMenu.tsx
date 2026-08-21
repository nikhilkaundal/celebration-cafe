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
  Crown,
  LayoutDashboard,
  ShieldCheck,
  Briefcase,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface CustomerProfile {
  name: string;
  email?: string;
  phone?: string;
  role?: "owner" | "manager" | "worker" | "customer";
  address?: string;
  avatar_url?: string;
  isLoggedIn: boolean;
}

export default function CustomerUserMenu() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function syncProfile() {
    try {
      // 1. Check Supabase authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Query profiles table for name, phone, and role
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("full_name, phone, role")
          .eq("id", user.id)
          .single();

        const name =
          profileRow?.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Customer";
        const avatar_url = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        const email = user.email;
        const role = (profileRow?.role as CustomerProfile["role"]) || "customer";

        const updatedProfile: CustomerProfile = {
          name,
          email,
          phone: profileRow?.phone || undefined,
          role,
          avatar_url,
          isLoggedIn: true,
        };

        // Save to local storage for instant offline access
        localStorage.setItem("celebration_customer_profile", JSON.stringify(updatedProfile));
        setProfile(updatedProfile);
        setAvatarError(false);
        return;
      }

      // 2. Check local profile fallback
      const saved = localStorage.getItem("celebration_customer_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isLoggedIn || parsed.name) {
          setProfile(parsed);
          setAvatarError(false);
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

  const getInitials = (name?: string) => {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const initial = getInitials(profile.name);
  const isStaffRole = ["owner", "manager", "worker"].includes(profile.role || "");

  const roleLabels: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    owner: { label: "Cafe Owner", bg: "bg-amber-500/20 border-amber-500/40", text: "text-amber-300", icon: Crown },
    manager: { label: "Manager", bg: "bg-emerald-500/20 border-emerald-500/40", text: "text-emerald-300", icon: ShieldCheck },
    worker: { label: "Kitchen Staff", bg: "bg-blue-500/20 border-blue-500/40", text: "text-blue-300", icon: Briefcase },
  };

  const roleBadge = isStaffRole ? roleLabels[profile.role || "owner"] : null;

  return (
    <div ref={menuRef} className="relative z-50 flex items-center gap-2">
      {/* Quick Admin Portal Button for Owner / Manager / Worker */}
      {isStaffRole && (
        <Link
          href="/admin"
          className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-extrabold text-[11px] px-3 py-1.5 rounded-full shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all transform hover:scale-105 active:scale-95 border border-amber-300/40"
          title="Open Admin Dashboard"
        >
          <Crown className="w-3.5 h-3.5 text-stone-950" />
          <span>Admin Portal</span>
        </Link>
      )}

      {/* Avatar Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center justify-center bg-white/10 hover:bg-white/20 border border-marigold/50 p-1 rounded-full text-xs font-extrabold text-stone transition cursor-pointer shadow-md hover:scale-105 active:scale-95"
        title={profile.name}
      >
        {profile.avatar_url && !avatarError ? (
          <img
            src={profile.avatar_url}
            alt={profile.name}
            referrerPolicy="no-referrer"
            onError={() => setAvatarError(true)}
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
            className="absolute right-0 top-12 w-64 bg-[#1A1816] text-stone border border-white/15 rounded-2xl p-3 shadow-2xl space-y-1 text-xs"
          >
            {/* User Header */}
            <div className="p-2.5 border-b border-white/10 flex items-center gap-3 mb-1">
              {profile.avatar_url && !avatarError ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-10 h-10 rounded-full object-cover border-2 border-marigold shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-marigold text-pineDark font-extrabold text-sm flex items-center justify-center shadow-md">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-bold text-stone text-xs truncate">{profile.name}</p>
                {profile.email && (
                  <p className="text-[10px] text-stone/60 truncate">{profile.email}</p>
                )}

                {/* Role Badge if Staff/Owner */}
                {roleBadge && (
                  <div className="pt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${roleBadge.bg} ${roleBadge.text}`}
                    >
                      <roleBadge.icon className="w-2.5 h-2.5" />
                      {roleBadge.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Dashboard Highlight Link for Staff/Owner */}
            {isStaffRole && (
              <div className="pb-1 border-b border-white/10">
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-300 font-extrabold transition hover:bg-amber-500/30"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-amber-400" />
                    <span>Owner / Admin Portal</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider bg-amber-500 text-stone-950 font-black px-1.5 py-0.5 rounded">
                    Open
                  </span>
                </Link>
              </div>
            )}

            {/* Standard Navigation Links */}
            <div className="space-y-0.5 py-1">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-stone/90 hover:bg-white/10 hover:text-marigold font-bold transition"
              >
                <User className="w-4 h-4 text-marigold/80" />
                <span>My Profile</span>
              </Link>

              <Link
                href="/account/addresses"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-stone/90 hover:bg-white/10 hover:text-marigold font-bold transition"
              >
                <MapPin className="w-4 h-4 text-marigold/80" />
                <span>My Addresses</span>
              </Link>

              <Link
                href="/orders"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-stone/90 hover:bg-white/10 hover:text-marigold font-bold transition"
              >
                <ClipboardList className="w-4 h-4 text-marigold/80" />
                <span>My Orders</span>
              </Link>

              <Link
                href="/order"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-stone/90 hover:bg-white/10 hover:text-marigold font-bold transition"
              >
                <ShoppingBag className="w-4 h-4 text-marigold/80" />
                <span>Order Food</span>
              </Link>
            </div>

            {/* Logout Action */}
            <div className="pt-1 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-300 hover:bg-red-500/10 font-bold transition cursor-pointer text-left"
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
