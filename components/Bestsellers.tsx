"use client";

import React, { useState, useRef } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Heart, ArrowRight, Star } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";

// ── Organic Vector Wave Shapes (Crisp vector shapes matching Figma) ──────

function VectorOrganicBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Top-Left Organic Wave Shape */}
      <svg
        className="absolute top-0 left-0 w-[55%] max-w-[750px] text-[#7A3B1E] opacity-60"
        viewBox="0 0 600 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 0 H600 C480 140, 320 250, 140 220 C60 205, 0 140, 0 0 Z"
          fill="currentColor"
        />
      </svg>

      {/* Top-Right Layered Wave Shape */}
      <svg
        className="absolute top-0 right-0 w-[45%] max-w-[600px] text-[#7A3B1E] opacity-45"
        viewBox="0 0 500 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M500 0 H0 C140 90, 310 180, 440 160 C480 150, 500 90, 500 0 Z"
          fill="currentColor"
        />
      </svg>

      {/* Bottom-Right Organic Wave Shape */}
      <svg
        className="absolute bottom-0 right-0 w-[58%] max-w-[800px] text-[#7A3B1E] opacity-65"
        viewBox="0 0 700 350"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M700 350 V0 C560 140, 380 260, 200 290 C90 305, 0 350, 0 350 Z"
          fill="currentColor"
        />
      </svg>

      {/* Bottom-Left Wave Shape */}
      <svg
        className="absolute bottom-0 left-0 w-[40%] max-w-[500px] text-[#7A3B1E] opacity-50"
        viewBox="0 0 450 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 220 V40 C110 130, 270 190, 450 220 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

// ── Hand-Drawn Cream / Gold Line-Art Doodles ──────────────────────────────────

function MotionLinesLeft({ className = "w-5 h-5 text-[#F5B942]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M7 12L2 9" />
      <path d="M8 16L3 18" />
      <path d="M9 8L6 4" />
    </svg>
  );
}

function MotionLinesRight({ className = "w-5 h-5 text-[#F5B942]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M17 12l5-3" />
      <path d="M16 16l5 2" />
      <path d="M15 8l3-4" />
    </svg>
  );
}

function HeartOutlineDoodle({ className = "w-6 h-6 text-[#FAF6ED]/70" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function CutleryDoodle({ className = "w-7 h-7 text-[#FAF6ED]/70" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v6a3 3 0 0 0 6 0V2" />
      <path d="M9 2v18" />
      <path d="M17 2a3 3 0 0 1 3 3v5h-6V5a3 3 0 0 1 3-3z" />
      <path d="M17 10v10" />
    </svg>
  );
}

function SteamingCoffeeCupDoodle({ className = "w-8 h-8 text-[#FAF6ED]/80" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
      <path d="M6 2c.5 1 .5 2 0 3" />
      <path d="M10 2c.5 1 .5 2 0 3" />
      <path d="M14 2c.5 1 .5 2 0 3" />
    </svg>
  );
}

function SparkleBurstDoodle({ className = "w-5 h-5 text-[#F5B942]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

function SquiggleLineDoodle({ className = "w-10 h-6 text-[#FAF6ED]/50" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 10 Q10 2, 18 10 T34 10" />
    </svg>
  );
}

function HeartDoodleUnderline() {
  return (
    <div className="relative flex items-center justify-center my-2 select-none">
      <div className="w-28 sm:w-36 h-[2px] bg-gradient-to-r from-transparent via-[#F5B942] to-transparent" />
      <div className="absolute bg-[#965330] px-1.5 text-[#F5B942]">
        <svg className="w-4 h-4 fill-[#F5B942]" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
    </div>
  );
}

// ── Types & Bestseller Items Data ──────────────────────────────────────────────

export interface BestsellerItem {
  id: string;
  name: string;
  categoryTag: string;
  categoryLabel: string;
  badge: string;
  price: number;
  rating: number;
  description: string;
  photo: string;
  rotateDeg: number;
}

const BESTSELLERS_DATA: BestsellerItem[] = [
  {
    id: "pizza-1",
    name: "Artisan Tandoori Paneer Pizza",
    categoryTag: "WOOD-FIRED PIZZA",
    categoryLabel: "Wood-Fired Pizza",
    badge: "CHEF'S SPECIAL",
    price: 349,
    rating: 4.9,
    description: "Spiced cottage cheese, caramelised onions, mint glaze on hand-tossed...",
    photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&auto=format&q=80",
    rotateDeg: -2,
  },
  {
    id: "burger-1",
    name: "Double Smash Gourmet Burger",
    categoryTag: "BURGERS & BUNS",
    categoryLabel: "Burgers & Buns",
    badge: "BEST SELLER",
    price: 279,
    rating: 4.8,
    description: "Crispy grilled fillet, house coleslaw, honey mustard & melted cheese.",
    photo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&auto=format&q=80",
    rotateDeg: 1.5,
  },
  {
    id: "cake-1",
    name: "Belgian Chocolate Truffle Cake",
    categoryTag: "CELEBRATION CAKES",
    categoryLabel: "Celebration Cakes",
    badge: "SIGNATURE",
    price: 180,
    rating: 5.0,
    description: "Dark chocolate ganache, moist cocoa sponge, edible gold dust.",
    photo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop&auto=format&q=80",
    rotateDeg: -1.5,
  },
  {
    id: "coffee-1",
    name: "Slow-Steeped Cold Brew Latte",
    categoryTag: "SPECIALTY COFFEE",
    categoryLabel: "Specialty Coffee",
    badge: "TOP RATED",
    price: 149,
    rating: 4.9,
    description: "18-hour single-origin cold brew, poured over hand-carved ice.",
    photo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&auto=format&q=80",
    rotateDeg: 2,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const cardEntranceVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 25, mass: 0.8 },
  },
};

// ── BestsellerCard Single Component (Apple Motion & Spring Physics) ────────────

export function BestsellerCard({
  item,
  onClick,
}: {
  item: BestsellerItem;
  onClick?: () => void;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
  };

  return (
    <motion.div
      variants={cardEntranceVariants}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20, rotate: item.rotateDeg }}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              scale: 1.03,
              rotate: 0,
              y: -6,
            }
      }
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 25, mass: 0.8 }}
      style={{ transform: `rotate(${item.rotateDeg}deg)` }}
      className="relative h-full rounded-[22px] overflow-hidden bg-[#18261C] border-2 border-[#FAF6ED]/25 hover:border-[#F5B942] shadow-xl hover:shadow-2xl transition-colors duration-300 group cursor-pointer flex flex-col justify-between transform-gpu will-change-transform"
      onClick={onClick}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[20px] shrink-0">
        <ImageWithFallback
          src={item.photo}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-108"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#18261C]/90 via-transparent to-black/20" />

        {/* Top-Left Category Badge */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className="bg-[#F5B942] text-[#1F3B2C] font-heading font-black text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md border border-[#1F3B2C]/10 select-none">
            {item.badge}
          </span>
        </div>

        {/* Top-Right Favorite Heart Button */}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={`Mark ${item.name} as favorite`}
          className="absolute top-3.5 right-3.5 z-10 bg-[#FAF6ED] text-[#2A1508] hover:text-red-500 w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-transform duration-200 cursor-pointer select-none active:scale-90"
        >
          <motion.div
            animate={isFavorite ? { scale: [1, 1.35, 1] } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 450, damping: 18 }}
          >
            <Heart
              className={`w-4 h-4 transition-colors duration-200 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-[#2A1508]"
              }`}
            />
          </motion.div>
        </button>
      </div>

      {/* Bottom Dark Green Info Panel */}
      <div className="p-4 sm:p-5 bg-[#18261C] rounded-b-[20px] flex flex-col justify-between flex-1 space-y-3 text-left">
        <div>
          <p className="text-[10px] font-heading font-extrabold text-[#F5B942] tracking-wider uppercase mb-1">
            {item.categoryTag}
          </p>
          <h3 className="font-heading text-lg sm:text-xl font-bold text-[#FAF6ED] leading-tight line-clamp-2 group-hover:text-[#F5B942] transition-colors duration-200 min-h-[2.6rem]">
            {item.name}
          </h3>
          <p className="text-[#FAF6ED]/75 text-xs line-clamp-1 font-medium mt-1">
            {item.description}
          </p>
        </div>

        {/* Thin Divider Line */}
        <div className="pt-2.5 border-t border-[#FAF6ED]/15 flex items-center justify-between mt-auto">
          <span className="font-extrabold text-lg sm:text-xl text-[#F5B942] flex items-center gap-0.5">
            <span>₹</span>
            <span>{item.price}</span>
          </span>

          <div className="bg-[#FAF6ED] text-[#1F3B2C] px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-xs select-none">
            <Star className="w-3.5 h-3.5 fill-[#F5B942] text-[#F5B942]" />
            <span>{item.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Bestsellers Section Component ───────────────────────────────────────

export function Bestsellers({
  onExploreMenu,
}: {
  onExploreMenu?: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    const width = containerRef.current.clientWidth;
    const index = Math.round(scrollLeft / (width * 0.75));
    setActiveIndex(Math.min(Math.max(index, 0), BESTSELLERS_DATA.length - 1));
  };

  const scrollToSlide = (idx: number) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    containerRef.current.scrollTo({
      left: idx * (width * 0.78),
      behavior: "smooth",
    });
    setActiveIndex(idx);
  };

  return (
    <section className="relative w-full bg-[#965330] text-[#FAF6ED] py-16 sm:py-24 px-4 sm:px-6 lg:px-12 overflow-hidden select-none">
      {/* ── 1. ORGANIC VECTOR WAVE BACKGROUND ── */}
      <VectorOrganicBackground />

      {/* ── 2. SCATTERED FIGMA DOODLE CLUSTER ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Right Cutlery Line Icon near Card 4 */}
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [0, -4, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[6%] right-[5%] sm:right-[10%] opacity-85 transform-gpu"
        >
          <CutleryDoodle className="w-7 h-7 sm:w-9 sm:h-9 text-[#FAF6ED]/80" />
        </motion.div>

        {/* Top-Right Sparkle / Star Icon near Card 4 */}
        <motion.div
          animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[18%] right-[8%] sm:right-[14%] transform-gpu"
        >
          <SparkleBurstDoodle className="w-5 h-5 text-[#F5B942]" />
        </motion.div>

        {/* Card 2 Motion Accent Lines above Burger Card */}
        <div className="absolute top-[28%] left-[34%] hidden lg:block opacity-80">
          <MotionLinesLeft className="w-5 h-5 text-[#FAF6ED]/70" />
        </div>

        {/* Card 3 Motion Accent Lines above Cake Card */}
        <div className="absolute top-[28%] right-[34%] hidden lg:block opacity-80">
          <MotionLinesRight className="w-5 h-5 text-[#FAF6ED]/70" />
        </div>

        {/* Lower-Left Squiggle Line Doodle beside Card 1 */}
        <motion.div
          animate={shouldReduceMotion ? {} : { rotate: [-4, 4, -4] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[28%] left-[2%] sm:left-[4%] transform-gpu"
        >
          <SquiggleLineDoodle className="w-10 h-6 text-[#FAF6ED]/60" />
        </motion.div>
      </div>

      {/* ── 3. SECTION HEADER ── */}
      <div className="max-w-4xl mx-auto text-center space-y-2 relative z-10 mb-12 sm:mb-16">
        {/* Eyebrow Label flanked by motion lines */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-heading font-extrabold tracking-[0.25em] text-[#F5B942] uppercase">
          <MotionLinesLeft className="w-4 h-4 text-[#F5B942]" />
          <span>MOST LOVED IN HAMIRPUR</span>
          <MotionLinesRight className="w-4 h-4 text-[#F5B942]" />
        </div>

        {/* Main Heading flanked by Left & Right Heart Doodles */}
        <div className="relative inline-block pt-1">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <HeartOutlineDoodle className="w-6 h-6 sm:w-7 sm:h-7 text-[#FAF6ED]/80 shrink-0" />
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-[#FAF6ED] tracking-tight leading-tight">
              Our Bestselling Favorites
            </h2>
            <HeartOutlineDoodle className="w-6 h-6 sm:w-7 sm:h-7 text-[#FAF6ED]/80 shrink-0" />
          </div>

          {/* Underline with Centered Heart */}
          <HeartDoodleUnderline />
        </div>

        {/* Subheading Description */}
        <p className="text-[#FAF6ED]/85 text-xs sm:text-sm md:text-base max-w-[600px] mx-auto font-medium leading-relaxed pt-1">
          Handcrafted wood-fired pizzas, smash burgers, truffle cakes &amp; specialty brews prepared fresh every day.
        </p>
      </div>

      {/* ── 4. PRODUCT CARDS (Scattered Sticker Rotations) ── */}
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          ref={containerRef}
          onScroll={handleScroll}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="flex md:grid md:grid-cols-4 gap-5 sm:gap-6 lg:gap-7 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-6 md:pb-0 px-2 md:px-0 -mx-2 md:mx-0"
        >
          {BESTSELLERS_DATA.map((item) => (
            <div
              key={item.id}
              className="w-[78vw] max-w-[300px] md:w-auto flex-shrink-0 snap-center md:snap-align-none h-full"
            >
              <BestsellerCard item={item} onClick={onExploreMenu} />
            </div>
          ))}
        </motion.div>

        {/* Mobile Pagination Indicators (— • • • • —) */}
        <div className="flex md:hidden items-center justify-center gap-2 pt-6">
          <MotionLinesLeft className="w-3.5 h-3.5 text-[#F5B942]/60" />
          {BESTSELLERS_DATA.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to bestseller ${idx + 1}`}
              onClick={() => scrollToSlide(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeIndex === idx
                  ? "w-8 bg-[#F5B942] shadow-md"
                  : "w-2.5 bg-[#FAF6ED]/30 hover:bg-[#FAF6ED]/50"
              }`}
            />
          ))}
          <MotionLinesRight className="w-3.5 h-3.5 text-[#F5B942]/60" />
        </div>
      </div>

      {/* ── 5. "VIEW FULL MENU" CTA BUTTON (Flanked by Motion Lines & Coffee Cup) ── */}
      <div className="pt-12 sm:pt-16 text-center relative z-10 flex items-center justify-center gap-3">
        <div className="flex items-center gap-3">
          {/* Motion lines on left of button */}
          <MotionLinesLeft className="w-5 h-5 text-[#F5B942]" />

          {/* Pill-shaped button, transparent bg, dashed gold border, gold text */}
          <button
            type="button"
            onClick={onExploreMenu}
            className="group relative bg-transparent border-2 border-dashed border-[#F5B942]/80 hover:border-[#F5B942] text-[#FAF6ED] hover:text-[#F5B942] font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase px-7 py-3 rounded-full shadow-md transition-all duration-300 flex items-center gap-2 cursor-pointer select-none transform-gpu active:scale-95"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1.5 text-[#F5B942]" />
          </button>

          {/* Steaming Coffee Cup doodle on right of button */}
          <SteamingCoffeeCupDoodle className="w-7 h-7 text-[#FAF6ED]/80 ml-1" />
        </div>
      </div>

      {/* ── 6. SECTION FOOTER TAGLINE CARD ── */}
      <div className="max-w-md sm:max-w-lg mx-auto mt-10 sm:mt-14 relative z-10 px-2 sm:px-0">
        <div className="bg-[#FCEFD9] border-2 border-[#F5B942]/40 rounded-3xl sm:rounded-full p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4 select-none relative overflow-hidden">
          {/* Left Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#965330]/15 text-[#965330] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 fill-[#965330] text-[#965330]" />
            </div>
            <p className="font-heading italic font-bold text-xs sm:text-base text-[#2A1508] leading-tight">
              Made with love, shared with joy.
            </p>
          </div>

          {/* Right Logo Badge */}
          <div className="bg-[#18261C] text-[#FAF6ED] rounded-full w-14 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center border-2 border-[#F5B942]/60 shadow-md text-center shrink-0 p-1">
            <SteamingCoffeeCupDoodle className="w-3.5 h-3.5 text-[#F5B942]" />
            <span className="font-heading font-black text-[8px] sm:text-[9px] uppercase tracking-tighter leading-none mt-0.5 text-[#F5B942]">
              Celebration
            </span>
            <span className="text-[7px] font-bold uppercase tracking-widest text-[#FAF6ED]/80 leading-none">
              CAFE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Bestsellers;
