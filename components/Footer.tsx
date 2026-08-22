"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  Sparkles,
  Heart,
  Navigation,
  CheckCircle2,
  UtensilsCrossed,
  Pizza,
  Coffee,
} from "lucide-react";
import { BorderTrail } from "@/components/ui/border-trail";

interface FooterProps {
  onNavigate?: (page: "home" | "menu" | "story") => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const handleNav = (p: "home" | "menu" | "story") => {
    if (onNavigate) {
      onNavigate(p);
      if (p === "menu") {
        const el = document.getElementById("menu-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="relative bg-[#13241B] text-[#F4E4C0] pt-20 pb-12 overflow-hidden border-t border-[#C4852A]/20">
      {/* Subtle Glow & Watermark Background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C4622D]/15 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#E8A93B]/10 rounded-full filter blur-[140px] pointer-events-none" />
      
      {/* Giant Typography Background Watermark */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[clamp(70px,15vw,240px)] font-heading font-black text-white/[0.025] select-none pointer-events-none whitespace-nowrap uppercase tracking-tighter z-0">
        CELEBRATION
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        {/* ── Top CTA Card / Newsletter Banner ── */}
        <div className="relative bg-gradient-to-r from-[#193325] via-[#214231] to-[#193325] rounded-3xl p-8 sm:p-10 mb-16 border border-[#C4852A]/30 shadow-2xl overflow-hidden">
          <BorderTrail
            size={160}
            className="bg-gradient-to-r from-[#E8A93B] via-[#C4622D] to-[#E8A93B] opacity-80"
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "linear",
            }}
          />
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C4622D]/20 border border-[#C4622D]/40 text-[#E8A93B] text-xs font-heading font-extrabold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Special Offers & Updates</span>
              </div>
              <h3 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                Craving Hot Wood-Fired Pizza & Chai?
              </h3>
              <p className="text-[#F4E4C0]/80 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
                Order directly from our web app for lightning-fast table service, takeaway pickup, or home delivery in Hamirpur.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleNav("menu")}
                className="w-full sm:w-auto bg-[#C4622D] text-[#F4E4C0] hover:bg-[#d96d33] font-heading font-extrabold text-xs uppercase tracking-widest px-8 py-4 rounded-2xl shadow-[0_6px_25px_rgba(196,98,45,0.45)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <Link
                href="/parties"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white font-heading font-extrabold text-xs uppercase tracking-widest px-6 py-4 rounded-2xl border border-white/20 transition-all text-center flex items-center justify-center gap-2"
              >
                <span>Book Event</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Main Footer Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-16 border-b border-white/10">
          {/* Brand Column (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <img
                src="/images/logos/logo.svg"
                alt="Celebration Food Cafe"
                className="h-12 w-auto object-contain filter drop-shadow-lg"
              />
            </div>

            <p className="text-[#F4E4C0]/75 text-sm leading-relaxed font-medium">
              Hamirpur’s favorite dining spot — serving handcrafted gourmet pizzas, sizzling fast food, authentic thalis, and refreshing single-estate teas.
            </p>

            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Open Daily: 9:00 AM – 10:00 PM</span>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#C4622D] text-[#F4E4C0] border border-white/10 hover:border-[#C4622D] flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 shadow-md"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-emerald-600 text-[#F4E4C0] border border-white/10 hover:border-emerald-600 flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 shadow-md"
                aria-label="WhatsApp"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-.981z"/>
                </svg>
              </a>
              <a
                href="tel:+919876543210"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#C4852A] text-[#F4E4C0] border border-white/10 hover:border-[#C4852A] flex items-center justify-center transition-all duration-300 transform hover:-translate-y-1 shadow-md"
                aria-label="Call Us"
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links Column (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-heading text-base font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C4852A]" />
              Quick Explore
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-[#F4E4C0]/80">
              <li>
                <button
                  onClick={() => handleNav("home")}
                  className="hover:text-[#E8A93B] hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#C4622D]" />
                  <span>Home</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav("menu")}
                  className="hover:text-[#E8A93B] hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#C4622D]" />
                  <span>Explore Menu</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav("story")}
                  className="hover:text-[#E8A93B] hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#C4622D]" />
                  <span>Our Story</span>
                </button>
              </li>
              <li>
                <Link
                  href="/parties"
                  className="hover:text-[#E8A93B] hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#C4622D]" />
                  <span>Parties & Catering</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="hover:text-[#E8A93B] hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#C4622D]" />
                  <span>My Orders</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Location & Contact Column (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-heading text-base font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C4622D]" />
              Visit Cafe
            </h4>

            <div className="space-y-3 text-sm text-[#F4E4C0]/80">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#E8A93B] flex-shrink-0 mt-1" />
                <p className="leading-relaxed font-medium">
                  Main Bazar Road, Hamirpur, Himachal Pradesh 177001
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#E8A93B] flex-shrink-0" />
                <p className="font-medium">9:00 AM – 10:00 PM (Mon – Sun)</p>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#E8A93B] flex-shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white font-medium transition-colors">
                  +91 98765 43210
                </a>
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=Main+Bazar+Road+Hamirpur+Himachal+Pradesh"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-heading font-extrabold text-[#E8A93B] hover:text-white uppercase tracking-wider bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
            </a>
          </div>

          {/* Specialities Column (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-heading text-base font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E8A93B]" />
              Highlights
            </h4>
            <div className="space-y-2 text-xs font-medium text-[#F4E4C0]/75">
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                <Pizza className="w-4 h-4 text-[#C4622D]" />
                <span>Wood-Fired Pizza</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                <Coffee className="w-4 h-4 text-[#C4852A]" />
                <span>Artisanal Chai</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                <UtensilsCrossed className="w-4 h-4 text-[#E8A93B]" />
                <span>Himachali Thalis</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>100% Fresh Daily</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Sub-Footer ── */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#F4E4C0]/60">
          <p className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} Celebration Food Cafe. Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
            <span>in Hamirpur, HP.</span>
          </p>

          <div className="flex items-center gap-6">
            <Link href="/admin/login" className="hover:text-[#E8A93B] transition-colors">
              Staff & Admin Portal
            </Link>
            <span>·</span>
            <Link href="/order" className="hover:text-[#E8A93B] transition-colors">
              Order Online
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
