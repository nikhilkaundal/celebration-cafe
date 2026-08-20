"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  UtensilsCrossed,
  Tag,
  Users,
  LogOut,
  Menu,
  X,
  Shield,
  Coffee,
  ChevronRight,
} from "lucide-react";
import { supabase, type Staff } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on login page, skip admin layout wrappers
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    async function checkAuthAndStaff() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data: staffRow, error } = await supabase
        .from("staff")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !staffRow) {
        console.warn("User authenticated but not in staff table:", error);
        router.push("/admin/login");
        return;
      }

      setCurrentStaff(staffRow as Staff);
      setLoading(false);
    }

    checkAuthAndStaff();
  }, [pathname, isLoginPage, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F3B2C] text-[#FAF7F0] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-marigold border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-heading text-sm font-bold tracking-wider text-marigold uppercase">
          Verifying Cafe Staff Access…
        </p>
      </div>
    );
  }

  const isOwner = currentStaff?.role === "owner";

  const navItems = [
    {
      name: "Live Orders",
      href: "/admin/orders",
      icon: ShoppingBag,
      ownerOnly: false,
    },
    {
      name: "Menu Items",
      href: "/admin/menu",
      icon: UtensilsCrossed,
      ownerOnly: true,
    },
    {
      name: "Offers & Coupons",
      href: "/admin/offers",
      icon: Tag,
      ownerOnly: true,
    },
    {
      name: "Staff Members",
      href: "/admin/staff",
      icon: Users,
      ownerOnly: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2A2622] flex flex-col md:flex-row">
      {/* ── Desktop Sidebar Nav ── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1F3B2C] text-[#FAF7F0] border-r border-marigold/20 shadow-2xl flex-shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-marigold/20 border border-marigold/40 flex items-center justify-center text-marigold group-hover:scale-105 transition-transform">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-base text-[#FAF7F0] leading-tight">
                Celebration Cafe
              </h1>
              <p className="text-[10px] text-marigold uppercase tracking-wider font-extrabold">
                Admin Operations
              </p>
            </div>
          </Link>
        </div>

        {/* Current Staff User Card */}
        {currentStaff && (
          <div className="mx-4 my-4 p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-marigold text-[#1F3B2C] font-extrabold flex items-center justify-center text-sm shadow-md">
              {currentStaff.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#FAF7F0] truncate">{currentStaff.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-marigold" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-marigold">
                  {currentStaff.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1.5 py-2">
          {navItems.map((item) => {
            if (item.ownerOnly && !isOwner) return null;
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                  active
                    ? "bg-marigold text-pineDark shadow-lg font-extrabold"
                    : "text-[#FAF7F0]/80 hover:bg-white/10 hover:text-[#FAF7F0]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? "text-pineDark" : "text-marigold"}`} />
                  <span>{item.name}</span>
                </div>
                {active && <ChevronRight className="w-4 h-4 text-pineDark" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Staff</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Topbar & Drawer ── */}
      <div className="md:hidden bg-[#1F3B2C] text-[#FAF7F0] border-b border-marigold/20 px-4 py-3 sticky top-0 z-40 flex items-center justify-between shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-marigold/20 border border-marigold/40 flex items-center justify-center text-marigold">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-sm text-[#FAF7F0]">Celebration Cafe</h1>
            <p className="text-[9px] text-marigold uppercase tracking-wider font-bold">Admin</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {currentStaff && (
            <span className="text-[10px] font-extrabold bg-marigold text-pineDark px-2 py-0.5 rounded-full uppercase">
              {currentStaff.role}
            </span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/10 text-[#FAF7F0]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1F3B2C] border-b border-white/10 px-4 py-4 space-y-2 sticky top-[57px] z-30 shadow-2xl">
          {navItems.map((item) => {
            if (item.ownerOnly && !isOwner) return null;
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  active
                    ? "bg-marigold text-pineDark font-extrabold shadow-md"
                    : "text-[#FAF7F0]/80 hover:bg-white/10 text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-pineDark" : "text-marigold"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full mt-3 bg-red-500/10 text-red-300 border border-red-500/30 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Staff</span>
          </button>
        </div>
      )}

      {/* ── Main Content Body ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
