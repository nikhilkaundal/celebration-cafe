"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
  AnimatePresence,
  type Variants,
} from "motion/react";
import {
  ArrowRight,
  ShoppingBag,
  Star,
  MapPin,
  Clock,
  Utensils,
  Truck,
  Store,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import ServiceCards from "@/components/ServiceCards";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MenuPreviewCard {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  isVeg: boolean;
  description: string;
  photo: string;
  tag: string;
}

const MENU_CARDS: MenuPreviewCard[] = [
  {
    id: "pizza-1",
    name: "Artisan Tandoori Paneer Pizza",
    category: "Wood-Fired Pizza",
    price: 349,
    rating: 4.9,
    isVeg: true,
    description: "Spiced cottage cheese, caramelised onions, mint glaze on hand-stretched crust",
    photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&auto=format&q=80",
    tag: "Chef's Special",
  },
  {
    id: "burger-1",
    name: "Double Smash Gourmet Burger",
    category: "Burgers & Buns",
    price: 279,
    rating: 4.8,
    isVeg: false,
    description: "Crispy grilled fillet, house coleslaw, honey mustard & melted cheese",
    photo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&auto=format&q=80",
    tag: "Best Seller",
  },
  {
    id: "cake-1",
    name: "Belgian Chocolate Truffle Cake",
    category: "Celebration Cakes",
    price: 180,
    rating: 5.0,
    isVeg: true,
    description: "Dark chocolate ganache, moist cocoa sponge, edible gold dust & fresh berries",
    photo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop&auto=format&q=80",
    tag: "Signature",
  },
  {
    id: "coffee-1",
    name: "Slow-Steeped Cold Brew Latte",
    category: "Specialty Coffee",
    price: 149,
    rating: 4.9,
    isVeg: true,
    description: "18-hour single-origin cold brew, poured over hand-carved ice with creamy milk",
    photo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&auto=format&q=80",
    tag: "Top Rated",
  },
];

// ── Magnetic Button Component ──────────────────────────────────────────────────

function MagneticButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shouldReduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    x.set(distanceX * 0.3);
    y.set(distanceY * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// ── 3D Perspective Tilt Card Component ─────────────────────────────────────────

function TiltCard({
  card,
  onExplore,
}: {
  card: MenuPreviewCard;
  onExplore?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["14.5deg", "-14.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-14.5deg", "14.5deg"]);

  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: shouldReduceMotion ? 0 : rotateX,
        rotateY: shouldReduceMotion ? 0 : rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative aspect-[3/4] w-full rounded-3xl bg-card border border-pine/15 shadow-xl transition-shadow duration-300 hover:shadow-2xl overflow-hidden cursor-pointer group"
      onClick={onExplore}
    >
      {/* Background dish photo with 3D depth scaling */}
      <div
        className="absolute inset-0 overflow-hidden rounded-3xl"
        style={{ transform: "translateZ(0px)" }}
      >
        <ImageWithFallback
          src={card.photo}
          alt={card.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      </div>

      {/* Layer 1: Top Tag Badge (translateZ pop forward) */}
      <div
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-marigold/90 backdrop-blur-md text-pineDark font-semibold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md"
        style={{ transform: "translateZ(30px)" }}
      >
        <span>{card.tag}</span>
      </div>

      {/* Layer 2: Veg / Non-Veg Indicator Dot */}
      <div
        className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md p-1.5 rounded-lg shadow-md"
        style={{ transform: "translateZ(25px)" }}
      >
        <div
          className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${card.isVeg ? "border-green-600" : "border-red-700"
            }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${card.isVeg ? "bg-green-600" : "bg-red-700"}`} />
        </div>
      </div>

      {/* Layer 3: Main Content Card Body (translateZ 40px for real 3D pop) */}
      <div
        className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white space-y-2.5 flex flex-col justify-end"
        style={{ transform: "translateZ(45px)" }}
      >
        <p className="text-xs font-semibold text-marigold tracking-widest uppercase">{card.category}</p>
        <h3 className="font-heading text-xl font-bold leading-tight drop-shadow-sm">{card.name}</h3>
        <p className="text-xs text-stone/80 line-clamp-2 leading-relaxed font-normal">{card.description}</p>

        <div className="pt-2 flex items-center justify-between border-t border-white/15">
          <span className="font-bold text-lg text-marigold">₹{card.price}</span>
          <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{card.rating}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Chef's Signature Showcase Component ───────────────────────────────────────

interface SignatureItem {
  id: string;
  name: string;
  category: string;
  prepTime: string;
  price: number;
  rating: number;
  isVeg: boolean;
  photo: string;
  description: string;
  highlights: string[];
}

const SIGNATURE_ITEMS: SignatureItem[] = [
  {
    id: "sig-pizza",
    name: "Artisan Tandoori Paneer Wood-Fired Pizza",
    category: "Wood-Fired Pizza",
    prepTime: "15 - 20 mins",
    price: 349,
    rating: 4.9,
    isVeg: true,
    photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000&h=700&fit=crop&auto=format&q=80",
    description: "Hand-stretched 48-hour fermented dough baked at 450°C, topped with marinated paneer tikka, caramelized onions, capsicum, and fresh coriander mint glaze.",
    highlights: ["Hand-stretched Dough", "Smoky Tandoori Spices", "100% Fresh Mozzarella"],
  },
  {
    id: "sig-coffee",
    name: "18-Hour Slow-Steeped Cold Brew Latte",
    category: "Specialty Coffee",
    prepTime: "5 mins",
    price: 149,
    rating: 4.9,
    isVeg: true,
    photo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&h=700&fit=crop&auto=format&q=80",
    description: "Single-origin Arabica coffee beans cold-brewed for 18 hours, poured over hand-cut ice with velvety milk and organic honey.",
    highlights: ["Single-Origin Arabica", "Low Acidic Smooth Taste", "Hand-Carved Ice"],
  },
  {
    id: "sig-burger",
    name: "Smoky Double Smash Chicken Burger",
    category: "Gourmet Burgers",
    prepTime: "12 - 15 mins",
    price: 279,
    rating: 4.8,
    isVeg: false,
    description: "Two crispy smash chicken patties layered with melted cheddar, house coleslaw, dill pickles, and sriracha mayo on a toasted brioche bun.",
    highlights: ["Double Smash Patties", "House Secret Sauce", "Fresh Brioche Bun"],
    photo: ""
  },
  {
    id: "sig-cake",
    name: "Belgian Dark Chocolate Ganache Cake",
    category: "Celebration Cakes",
    prepTime: "Fresh Daily",
    price: 180,
    rating: 5.0,
    isVeg: true,
    description: "70% dark Belgian chocolate ganache layered between moist cocoa sponge cakes, decorated with gold dust and fresh berries.",
    highlights: ["70% Dark Chocolate", "Eggless Recipe", "Edible Gold Accent"],
    photo: ""
  },
];

function ChefSignatureShowcase({ onExploreMenu }: { onExploreMenu?: () => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const current = SIGNATURE_ITEMS[activeTab];

  return (
    <div className="space-y-8">
      <div className="text-center mb-10 space-y-2">
        <p className="text-xs font-bold tracking-[0.25em] text-pine uppercase">
          Chef's Culinary Showcase
        </p>
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-pineDark">
          Crafted with Perfection
        </h2>
        <p className="text-pine/85 text-sm md:text-base max-w-lg mx-auto leading-relaxed font-medium">
          Discover our highest-rated signature dishes, lovingly prepared right here in Hamirpur.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {SIGNATURE_ITEMS.map((item, idx) => {
          const selected = activeTab === idx;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(idx)}
              className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                selected
                  ? "bg-marigold text-pineDark font-bold shadow-lg scale-105"
                  : "bg-white/80 border border-pine/20 text-pineDark hover:bg-white"
              }`}
            >
              {item.category}
            </button>
          );
        })}
      </div>

      {/* Active Showcase Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-0"
        >
          {/* Dish Image Column */}
          <div className="relative min-h-[300px] lg:min-h-[420px] overflow-hidden group">
            <ImageWithFallback
              src={current.photo}
              alt={current.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:hidden" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="bg-accent text-accent-foreground font-bold text-xs px-3 py-1 rounded-full shadow-md">
                {current.category}
              </span>
              <div className="bg-background/90 backdrop-blur-md p-1.5 rounded-lg shadow-md border border-border">
                <div
                  className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
                    current.isVeg ? "border-green-600" : "border-red-700"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      current.isVeg ? "bg-green-600" : "bg-red-700"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>Prep Time: {current.prepTime}</span>
            </div>
          </div>

          {/* Dish Details Column */}
          <div className="p-8 lg:p-10 flex flex-col justify-between space-y-6 bg-white text-pineDark">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-marigold/20 text-pine font-extrabold text-xs px-3 py-1 rounded-full border border-marigold/40">
                  <Star className="w-3.5 h-3.5 fill-marigold text-marigold" />
                  <span>{current.rating} / 5.0 Rating</span>
                </div>
                <span className="font-bold text-2xl text-pineDark">₹{current.price}</span>
              </div>

              <h3 className="font-heading text-2xl lg:text-3xl font-bold text-pineDark leading-tight">
                {current.name}
              </h3>

              <p className="text-pine/85 text-sm lg:text-base leading-relaxed font-medium">
                {current.description}
              </p>

              {/* Highlight Badges */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-pine/60 uppercase tracking-wider">
                  Key Highlights:
                </p>
                <div className="flex flex-wrap gap-2">
                  {current.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="bg-stone-100 border border-pine/15 text-pineDark text-xs font-semibold px-3 py-1 rounded-xl flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-pine" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-pine/10 flex items-center justify-between">
              <p className="text-xs text-pine/70 font-medium">
                Freshly prepared on order at Celebration Cafe.
              </p>
              <MagneticButton
                onClick={onExploreMenu}
                className="bg-marigold text-pineDark font-bold px-6 py-3 rounded-2xl text-sm shadow-lg flex items-center gap-2 hover:bg-marigoldLight transition-colors"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Subtle Cursor Follower Glow Component ─────────────────────────────────────

function CursorGlow() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 250 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 100);
      cursorY.set(e.clientY - 100);
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <motion.div
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
      }}
      className="pointer-events-none fixed top-0 left-0 w-48 h-48 rounded-full bg-marigold/15 blur-3xl z-30"
    />
  );
}

// ── Main Hero Component ───────────────────────────────────────────────────────

export function Hero({
  onExploreMenu,
  onOrderNow,
}: {
  onExploreMenu?: () => void;
  onOrderNow?: () => void;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const shouldReduceMotion = useReducedMotion();

  // Layered Parallax Transformations
  const yBg = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const yHeadline = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const yFloating1 = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const yFloating2 = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Staggered Container Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const featureVariants: Variants = {
    hidden: { opacity: 0, y: 30, rotateX: 15 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div ref={targetRef} className="relative bg-[#121110] text-stone overflow-hidden">
      {/* Subtle Cursor Follower Glow */}
      <CursorGlow />

      {/* ── 1. LAYERED PARALLAX HERO BANNER ── */}
      <motion.section
        style={{ opacity: opacityHero }}
        className="relative min-h-[92vh] flex flex-col justify-center items-center px-6 pt-24 pb-16 text-center overflow-hidden"
      >
        {/* Parallax Background Layer - Rich Obsidian Charcoal & Gold Ambiance */}
        <motion.div
          style={{ y: shouldReduceMotion ? 0 : yBg }}
          className="absolute inset-0 z-0 pointer-events-none"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_var(--tw-gradient-stops))] from-marigold/20 via-[#161514] to-[#121110]" />
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&h=900&fit=crop&auto=format&q=80"
            alt="Cafe Ambiance"
            className="w-full h-full object-cover opacity-25 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#121110]/40 via-transparent to-[#121110]" />
        </motion.div>

        {/* Floating Decorative 3D Elements (Depth Layer 1) */}
        <motion.div
          style={{ y: shouldReduceMotion ? 0 : yFloating1 }}
          className="absolute top-24 left-[8%] hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shadow-2xl z-10"
        >
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-stone">Open Daily: 9 AM – 10 PM</span>
        </motion.div>

        {/* Floating Decorative 3D Elements (Depth Layer 2) */}
        <motion.div
          style={{ y: shouldReduceMotion ? 0 : yFloating2 }}
          className="absolute bottom-32 right-[8%] hidden lg:flex items-center gap-3 bg-marigold text-pineDark px-4 py-3 rounded-2xl font-bold text-xs shadow-2xl z-10"
        >
          <Star className="w-4 h-4 fill-pineDark text-pineDark" />
          <span>4.8 Rating (1,200+ Reviews)</span>
        </motion.div>

        {/* Main Headline & CTA Container (Parallax Layer 3) */}
        <motion.div
          style={{ y: shouldReduceMotion ? 0 : yHeadline }}
          className="relative z-10 max-w-4xl mx-auto flex flex-col items-center space-y-6"
        >
          <motion.p
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase text-marigold bg-white/10 px-4 py-1.5 rounded-full border border-marigold/30"
          >
            <MapPin className="w-3.5 h-3.5 text-marigold" />
            Hamirpur, Himachal Pradesh
          </motion.p>

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, type: "spring", stiffness: 200 }}
            className="my-2"
          >
            <img
              src="/images/logos/logo.svg"
              alt="Celebration Food Cafe"
              className="h-32 sm:h-40 md:h-48 w-auto object-contain filter drop-shadow-2xl"
            />
            <h1 className="sr-only">Celebration Food Cafe - Hamirpur</h1>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-heading text-4xl sm:text-6xl md:text-7xl font-bold text-stone leading-[1.08] tracking-tight"
          >
            Every Bite,{" "}
            <span className="text-marigold italic font-serif">a Celebration</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-stone/80 text-base md:text-xl max-w-2xl leading-relaxed font-normal"
          >
            Artisan wood-fired pizza, gourmet burgers, fresh thalis & celebration cakes crafted with love in the hills of HP.
          </motion.p>

          {/* Magnetic CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <MagneticButton
              onClick={onExploreMenu}
              className="bg-marigold text-pineDark font-bold px-8 py-4 rounded-2xl text-base shadow-xl flex items-center justify-center gap-3 hover:bg-marigoldLight transition-colors w-full sm:w-auto"
            >
              <span>Explore Menu</span>
              <ArrowRight className="w-5 h-5" />
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone/50"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase font-semibold">Scroll to Explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-marigold" />
        </motion.div>
      </motion.section>

      {/* ── 2. SERVICE CARDS SECTION (Warm Off-White Stone Background) ── */}
      <div className="bg-[#FAF7F0] border-y border-border/40 py-6">
        <ServiceCards onSelectService={onExploreMenu} />
      </div>

      {/* ── 3. 3D PERSPECTIVE TILT CARDS SECTION (Rich Dark Obsidian Charcoal Background) ── */}
      <section className="bg-[#141210] text-stone py-20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12 space-y-2">
            <p className="text-xs font-bold tracking-[0.25em] text-marigold uppercase">
              Most Loved in Hamirpur
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-stone">
              Our Bestselling Favorites
            </h2>
            <p className="text-stone/80 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              Handcrafted wood-fired pizzas, smash burgers, truffle cakes & specialty brews prepared fresh every day.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MENU_CARDS.map((card) => (
              <TiltCard key={card.id} card={card} onExplore={onExploreMenu} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. CHEF'S CULINARY SHOWCASE (Warm Light Gourmet Cream Background) ── */}
      <section className="bg-[#F5EFE6] text-foreground py-20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <ChefSignatureShowcase onExploreMenu={onExploreMenu} />
        </div>
      </section>

      {/* ── 5. STAGGERED REVEAL FEATURE SECTION (Rich Deep Pine Emerald Background) ── */}
      <section className="bg-[#193225] text-stone py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <motion.div
              variants={featureVariants}
              className="bg-white/5 border border-white/15 rounded-3xl p-8 space-y-4 hover:border-marigold/40 transition-colors shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-marigold/20 border border-marigold/40 flex items-center justify-center text-marigold">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-stone">Rooted in Hamirpur</h3>
              <p className="text-sm text-stone/75 leading-relaxed">
                Serving local families, students, and mountain travelers since 2018 at Main Bazar Road.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={featureVariants}
              className="bg-white/5 border border-white/15 rounded-3xl p-8 space-y-4 hover:border-marigold/40 transition-colors shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-marigold/20 border border-marigold/40 flex items-center justify-center text-marigold">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-stone">Made to Order</h3>
              <p className="text-sm text-stone/75 leading-relaxed">
                100% fresh ingredients, handcrafted sauces, and freshly baked goods prepared upon every order.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={featureVariants}
              className="bg-white/5 border border-white/15 rounded-3xl p-8 space-y-4 hover:border-marigold/40 transition-colors shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-marigold/20 border border-marigold/40 flex items-center justify-center text-marigold">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-stone">Dine-in / Takeaway / Delivery</h3>
              <p className="text-sm text-stone/75 leading-relaxed">
                Enjoy cozy cafe dining, quick takeaway, or fast home delivery straight to your doorstep.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Hero;
