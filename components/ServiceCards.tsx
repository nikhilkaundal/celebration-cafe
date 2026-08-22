"use client";

import React, { useState, useRef } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ShoppingBag, Utensils, PartyPopper, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";

// ── Line-Art Doodle Accents matching Celebration Cafe Brand System ─────────────

function SparkleStarDoodle({ className = "w-5 h-5 text-[#F5B942]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

function CoffeeBeanDoodle({ className = "w-7 h-7 text-[#6B4226]/50" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <ellipse cx="12" cy="12" rx="7" ry="10" transform="rotate(-30 12 12)" />
      <path d="M12 4C10 8 14 16 12 20" />
    </svg>
  );
}

function HeartOutlineDoodle({ className = "w-6 h-6 text-[#C4622D]/60" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function LeafDoodle({ className = "w-7 h-7 text-[#3B4A2F]/60" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A9 9 0 0 1 2 11C2 6.5 5.5 3 10 3a9 9 0 0 1 9 9c0 4.5-3.5 8-8 8Z" />
      <path d="M2 21c3-3 7-5 10-6" />
    </svg>
  );
}

// ── Nested Reusable Components ───────────────────────────────────────────────

export function StickerBadge({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span
      className={`bg-[#F5B942] text-[#1F3B2C] font-heading font-black text-[10px] sm:text-[11px] uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md border border-[#1F3B2C]/10 flex items-center gap-1 select-none ${className}`}
    >
      {text}
    </span>
  );
}

export function IconBadge({
  icon: Icon,
  className = "",
}: {
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <div
      className={`w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-sm select-none ${className}`}
    >
      <Icon className="w-5 h-5 text-white" />
    </div>
  );
}

// ── Types & Services Data ─────────────────────────────────────────────────────

export interface ServiceItem {
  id: string;
  title: string;
  tag: string;
  icon: React.ElementType;
  description: string;
  ctaText: string;
  href: string;
  image: string;
  rotation: string;
  tagRotation: string;
}

const SERVICES: ServiceItem[] = [
  {
    id: "online-order",
    title: "Online Order",
    tag: "Delivery & Pickup",
    icon: ShoppingBag,
    description: "Order fresh pizza, thalis, and beverages online. Fast doorstep delivery across Hamirpur.",
    ctaText: "ORDER NOW",
    href: "/order",
    image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&h=600&fit=crop&auto=format&q=80",
    rotation: "-rotate-1 sm:-rotate-2",
    tagRotation: "rotate-2",
  },
  {
    id: "dine-in",
    title: "Dine-In Experience",
    tag: "Cafe Ambiance",
    icon: Utensils,
    description: "Cozy seating, mountain views, and handcrafted coffee. Visit us on Main Bazar Road.",
    ctaText: "RESERVE TABLE",
    href: "/reserve",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&auto=format&q=80",
    rotation: "rotate-0 sm:rotate-1",
    tagRotation: "-rotate-1",
  },
  {
    id: "book-parties",
    title: "Book for Parties",
    tag: "Events & Birthdays",
    icon: PartyPopper,
    description: "Hosting a birthday, anniversary, or get-together? We custom-cater food & cakes for your event.",
    ctaText: "ENQUIRE NOW",
    href: "/parties",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop&auto=format&q=80",
    rotation: "rotate-1 sm:rotate-2",
    tagRotation: "-rotate-2",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
  },
};

// ── ServiceCard Single Component (Apple Spring Motion Physics) ────────────────

export function ServiceCard({
  service,
  onClick,
}: {
  service: ServiceItem;
  onClick: () => void;
}) {
  const Icon = service.icon;
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={cardVariants}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              rotate: 0,
              scale: 1.03,
              y: -8,
            }
      }
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 25, mass: 0.8 }}
      className={`relative aspect-[3/4] sm:aspect-[4/5] rounded-[24px] sm:rounded-[28px] overflow-hidden border-2 border-[#1F3B2C]/15 shadow-[0_15px_35px_rgba(31,59,44,0.22)] hover:shadow-[0_22px_50px_rgba(245,185,66,0.35)] transition-all duration-300 group cursor-pointer flex flex-col justify-between p-6 sm:p-7 transform-gpu will-change-transform ${service.rotation}`}
      onClick={onClick}
    >
      {/* Background Image with Dark Green Gradient Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <ImageWithFallback
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-108"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#152A1F] via-[#1F3B2C]/75 to-black/20" />
      </div>

      {/* Top Header Row: Icon Badge (Top-Left) & Sticker Tag Badge (Top-Right) */}
      <div className="relative z-10 flex items-center justify-between">
        <IconBadge icon={Icon} />
        <StickerBadge text={service.tag} className={service.tagRotation} />
      </div>

      {/* Bottom Text Block */}
      <div className="relative z-10 space-y-3 pt-10">
        <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#FAF6ED] group-hover:text-[#F5B942] transition-colors duration-200 drop-shadow-md">
          {service.title}
        </h3>
        <p className="text-[#FAF6ED]/90 text-xs sm:text-sm leading-relaxed font-medium line-clamp-2">
          {service.description}
        </p>

        {/* Thin Muted Divider Line */}
        <div className="pt-3 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-heading font-extrabold text-[#F5B942] group-hover:text-[#FDE08B] tracking-wider uppercase flex items-center gap-2 transition-colors duration-200">
            <span>{service.ctaText}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1.5" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ServiceCards Section (Horizontal Carousel on Mobile, Grid on Desktop) ───

export function ServiceCards({
  onSelectService,
}: {
  onSelectService?: (href: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    const width = containerRef.current.clientWidth;
    const index = Math.round(scrollLeft / (width * 0.8));
    setActiveIndex(Math.min(Math.max(index, 0), SERVICES.length - 1));
  };

  const scrollToSlide = (idx: number) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    containerRef.current.scrollTo({
      left: idx * (width * 0.82),
      behavior: "smooth",
    });
    setActiveIndex(idx);
  };

  const handleClick = (href: string) => {
    if (href.startsWith("http")) {
      window.open(href, "_blank");
      return;
    }
    if (href.startsWith("/")) {
      window.location.href = href;
      return;
    }
    if (onSelectService) {
      onSelectService(href);
      return;
    }
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full bg-[#FAF6ED] text-[#2A1508] py-16 sm:py-24 px-4 sm:px-6 md:px-8 overflow-hidden select-none">
      {/* ── 1. AMBIENT BACKGROUND GRADIENT BLOBS ── */}
      <div className="absolute top-[-80px] left-[-80px] sm:top-[-120px] sm:left-[-120px] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-[50%_50%_70%_30%/60%_40%_50%_50%] bg-gradient-to-br from-[#F5B942]/35 via-[#E8A93B]/20 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-[-100px] right-[-100px] sm:bottom-[-140px] sm:right-[-140px] w-[380px] sm:w-[540px] h-[380px] sm:h-[540px] rounded-[60%_40%_35%_65%/45%_55%_50%_50%] bg-gradient-to-tl from-[#3B4A2F]/30 via-[#1F3B2C]/20 to-transparent blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/2 right-[5%] -translate-y-1/2 w-[280px] sm:w-[400px] h-[280px] sm:h-[400px] rounded-full bg-[#F5B942]/15 blur-3xl pointer-events-none z-0" />

      {/* ── 2. SCATTERED HAND-DRAWN DOODLE ACCENTS ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Left Coffee Bean */}
        <div className="absolute top-[12%] left-[4%] sm:left-[8%] opacity-70 hidden sm:block">
          <CoffeeBeanDoodle className="w-8 h-8 sm:w-10 sm:h-10 text-[#6B4226]/50" />
        </div>

        {/* Top-Right Heart Outline */}
        <div className="absolute top-[10%] right-[5%] sm:right-[9%] opacity-75 hidden sm:block">
          <HeartOutlineDoodle className="w-7 h-7 sm:w-9 sm:h-9 text-[#C4622D]/60" />
        </div>

        {/* Mid-Left Leaf */}
        <div className="absolute top-[55%] left-[3%] sm:left-[6%] opacity-70 hidden md:block">
          <LeafDoodle className="w-8 h-8 sm:w-10 sm:h-10 text-[#3B4A2F]/60" />
        </div>

        {/* Bottom-Right Sparkle */}
        <div className="absolute bottom-[10%] right-[4%] sm:right-[8%] opacity-80">
          <SparkleStarDoodle className="w-6 h-6 sm:w-8 sm:h-8 text-[#F5B942]" />
        </div>
      </div>

      {/* ── 3. SECTION HEADER ── */}
      <div className="max-w-4xl mx-auto text-center space-y-3 relative z-10 mb-10 sm:mb-16">
        <p className="text-xs sm:text-sm font-heading font-extrabold tracking-[0.25em] text-[#C4852A] uppercase flex items-center justify-center gap-2">
          <span>CELEBRATION SERVICES</span>
        </p>

        <div className="relative inline-block">
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-[#2A1508] tracking-tight leading-tight">
            How would you like to celebrate?
          </h2>
          {/* Sparkle Star Doodle accent beside heading */}
          <div className="absolute -top-3 -right-6 sm:-top-4 sm:-right-8 text-[#F5B942] animate-pulse">
            <SparkleStarDoodle className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
        </div>

        <p className="text-[#6B4226]/85 text-xs sm:text-sm md:text-base max-w-[500px] mx-auto font-medium leading-relaxed">
          From doorstep delivery to cozy dining & hosting special events in Hamirpur.
        </p>
      </div>

      {/* ── 4. STICKER CARDS (Swipeable Horizontal Carousel on Mobile 1|2|3, Grid on Desktop) ── */}
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          ref={containerRef}
          onScroll={handleScroll}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="flex md:grid md:grid-cols-3 gap-5 md:gap-8 lg:gap-10 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-4 md:pb-0 px-2 md:px-0 -mx-2 md:mx-0"
        >
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className="w-[84vw] max-w-[320px] md:w-auto flex-shrink-0 snap-center md:snap-align-none"
            >
              <ServiceCard
                service={service}
                onClick={() => handleClick(service.href)}
              />
            </div>
          ))}
        </motion.div>

        {/* Mobile Carousel Indicators (1 | 2 | 3 Dots) */}
        <div className="flex md:hidden items-center justify-center gap-2 pt-6">
          {SERVICES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to service card ${idx + 1}`}
              onClick={() => scrollToSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeIndex === idx
                  ? "w-8 bg-[#F5B942] shadow-md"
                  : "w-2.5 bg-[#1F3B2C]/25 hover:bg-[#1F3B2C]/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServiceCards;
