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
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import ServiceCards from "@/components/ServiceCards";
import Bestsellers from "@/components/Bestsellers";
import { MagneticButton } from "@/components/motion/MagneticButton";

// ── Organic SVG Ambient Decorators ───────────────────────────────────────────

const CoffeeBean = ({
  size = 28,
  rotation = 0,
  opacity = 0.7,
}: {
  size?: number;
  rotation?: number;
  opacity?: number;
}) => (
  <svg
    width={size}
    height={size * 1.5}
    viewBox="0 0 20 30"
    fill="none"
    style={{ opacity, transform: `rotate(${rotation}deg)`, display: "block" }}
  >
    <ellipse cx="10" cy="15" rx="9" ry="13.5" fill="#8B4D2A" />
    <path
      d="M10 3 Q7.5 9 7.5 15 Q7.5 21 10 27"
      stroke="rgba(0,0,0,0.22)"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const ChiliFlake = ({
  size = 22,
  rotation = 0,
  opacity = 0.6,
}: {
  size?: number;
  rotation?: number;
  opacity?: number;
}) => (
  <svg
    width={size}
    height={size * 1.4}
    viewBox="0 0 20 28"
    fill="none"
    style={{ opacity, transform: `rotate(${rotation}deg)`, display: "block" }}
  >
    <path
      d="M10 2 C15.5 5 18 13 15.5 19 C13 24.5 7 25.5 4.5 19 C2 13 5 5 10 2Z"
      fill="#C4622D"
    />
    <path
      d="M10 2 Q11 9 9 15 Q8 19.5 10.5 24"
      stroke="rgba(255,210,130,0.55)"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <path
      d="M10 2 C10.5 0.5 12 0 12.5 1"
      stroke="#8B4D2A"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const HerbSprig = ({
  size = 30,
  rotation = 0,
  opacity = 0.7,
}: {
  size?: number;
  rotation?: number;
  opacity?: number;
}) => (
  <svg
    width={size}
    height={size * 1.7}
    viewBox="0 0 24 40"
    fill="none"
    style={{ opacity, transform: `rotate(${rotation}deg)`, display: "block" }}
  >
    <path
      d="M12 38 C12 26 12 12 12 3"
      stroke="#4A5B3C"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <ellipse cx="6.5" cy="14" rx="5.5" ry="3" fill="#5A7048" transform="rotate(-38 6.5 14)" />
    <ellipse cx="17.5" cy="20" rx="5.5" ry="3" fill="#5A7048" transform="rotate(38 17.5 20)" />
    <ellipse cx="7" cy="27" rx="4.5" ry="2.5" fill="#5A7048" transform="rotate(-25 7 27)" />
    <ellipse cx="17" cy="10" rx="4" ry="2.5" fill="#5A7048" transform="rotate(25 17 10)" />
  </svg>
);

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

      <div
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-[#C4622D] text-[#F4E4C0] font-semibold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md"
        style={{ transform: "translateZ(30px)" }}
      >
        <span>{card.tag}</span>
      </div>

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
    photo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1000&h=700&fit=crop&auto=format&q=80",
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
    photo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1000&h=700&fit=crop&auto=format&q=80",
  },
];

function ChefSignatureShowcase({ onExploreMenu }: { onExploreMenu?: () => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const current = SIGNATURE_ITEMS[activeTab];

  return (
    <div className="space-y-8">
      <div className="text-center mb-10 space-y-2">
        <p className="text-xs font-bold tracking-[0.25em] text-[#8B4D2A] uppercase">
          Chef's Culinary Showcase
        </p>
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-[#2A1508]">
          Crafted with Perfection
        </h2>
        <p className="text-[#6B4226] text-sm md:text-base max-w-lg mx-auto leading-relaxed font-medium">
          Discover our highest-rated signature dishes, lovingly prepared right here in Hamirpur.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {SIGNATURE_ITEMS.map((item, idx) => {
          const selected = activeTab === idx;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(idx)}
              className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${selected
                  ? "bg-[#C4622D] text-[#F4E4C0] font-bold shadow-lg scale-105"
                  : "bg-white/80 border border-[#8B4D2A]/20 text-[#2A1508] hover:bg-white"
                }`}
            >
              {item.category}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-0"
        >
          <div className="relative min-h-[300px] lg:min-h-[420px] overflow-hidden group">
            <ImageWithFallback
              src={current.photo}
              alt={current.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:hidden" />

            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="bg-[#C4622D] text-[#F4E4C0] font-bold text-xs px-3 py-1 rounded-full shadow-md">
                {current.category}
              </span>
              <div className="bg-background/90 backdrop-blur-md p-1.5 rounded-lg shadow-md border border-border">
                <div
                  className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${current.isVeg ? "border-green-600" : "border-red-700"
                    }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${current.isVeg ? "bg-green-600" : "bg-red-700"
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

          <div className="p-8 lg:p-10 flex flex-col justify-between space-y-6 bg-white text-pineDark">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-[#C4622D]/15 text-[#C4622D] font-extrabold text-xs px-3 py-1 rounded-full border border-[#C4622D]/30">
                  <Star className="w-3.5 h-3.5 fill-[#C4622D] text-[#C4622D]" />
                  <span>{current.rating} / 5.0 Rating</span>
                </div>
                <span className="font-bold text-2xl text-[#2A1508]">₹{current.price}</span>
              </div>

              <h3 className="font-heading text-2xl lg:text-3xl font-bold text-[#2A1508] leading-tight">
                {current.name}
              </h3>

              <p className="text-[#6B4226] text-sm lg:text-base leading-relaxed font-medium">
                {current.description}
              </p>

              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-[#8B4D2A] uppercase tracking-wider">
                  Key Highlights:
                </p>
                <div className="flex flex-wrap gap-2">
                  {current.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="bg-stone-100 border border-[#8B4D2A]/15 text-[#2A1508] text-xs font-semibold px-3 py-1 rounded-xl flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#3B4A2F]" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-pine/10 flex items-center justify-between">
              <p className="text-xs text-[#6B4226] font-medium">
                Freshly prepared on order at Celebration Cafe.
              </p>
              <MagneticButton
                onClick={onExploreMenu}
                className="bg-[#C4622D] text-[#F4E4C0] font-bold px-6 py-3 rounded-2xl text-sm shadow-lg flex items-center gap-2 hover:brightness-110 transition-all"
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

// ── Bestselling Carousel Component ─────────────────────────────────────

function BestsellingCarousel({
  cards,
  onExploreMenu,
}: {
  cards: MenuPreviewCard[];
  onExploreMenu?: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    const width = containerRef.current.clientWidth;
    const index = Math.round(scrollLeft / (width * 0.8));
    setActiveIndex(Math.min(Math.max(index, 0), cards.length - 1));
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

  return (
    <div className="space-y-6">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex md:grid md:grid-cols-4 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-4 md:pb-0 px-4 md:px-0 -mx-4 md:mx-0"
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className="w-[82vw] max-w-[310px] md:w-auto flex-shrink-0 snap-center md:snap-align-none"
          >
            <TiltCard card={card} onExplore={onExploreMenu} />
          </div>
        ))}
      </div>

      <div className="flex md:hidden items-center justify-center gap-2 pt-2">
        {cards.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Go to item ${idx + 1}`}
            onClick={() => scrollToSlide(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 ${activeIndex === idx
                ? "w-8 bg-[#C4622D] shadow-md"
                : "w-2.5 bg-black/20 hover:bg-black/40"
              }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Awwwards-Level Interactive Hero Component ─────────────────────────────

export function Hero({
  onExploreMenu,
  onOrderNow,
}: {
  onExploreMenu?: () => void;
  onOrderNow?: () => void;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Detect touch device on mount to disable mouse parallax gracefully
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Scroll Progress Parallax & Fade Out on Scroll
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });
  const opacityHero = useTransform(scrollYProgress, [0, 0.75], [1, 0.25]);
  const yHeroScroll = useTransform(scrollYProgress, [0, 0.75], [0, -35]);

  // Scroll Parallax Motion Values for Side Cutouts & Ambient Decorators (Works on Mobile + Desktop)
  const leftImageScrollY = useTransform(scrollYProgress, [0, 1], [0, -85]);
  const rightImageScrollY = useTransform(scrollYProgress, [0, 1], [0, -125]);
  const bgDecoratorsScrollY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  // ── 2. MOUSE-MOVE PARALLAX MOTION VALUES & SPRINGS ──
  // Normalized mouse values (-1 to 1)
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  // Buttery-smooth spring config: stiffness: 50, damping: 20, mass: 0.5
  const springConfig = { stiffness: 50, damping: 20, mass: 0.5 };
  const mouseX = useSpring(rawMouseX, springConfig);
  const mouseY = useSpring(rawMouseY, springConfig);

  // Layer Specific Multiplier Transformations
  const wordmarkX = useTransform(mouseX, [-1, 1], [-5, 5]);
  const wordmarkY = useTransform(mouseY, [-1, 1], [-5, 5]);

  const contentX = useTransform(mouseX, [-1, 1], [-8, 8]);
  const contentY = useTransform(mouseY, [-1, 1], [-8, 8]);

  // Left Drink Cutout: Moves opposite to cursor direction (-18px to 18px)
  const leftImageX = useTransform(mouseX, [-1, 1], [18, -18]);
  const leftImageY = useTransform(mouseY, [-1, 1], [18, -18]);

  // Right Pizza Cutout: Moves in same direction as cursor with higher intensity (-28px to 28px)
  const rightImageX = useTransform(mouseX, [-1, 1], [-28, 28]);
  const rightImageY = useTransform(mouseY, [-1, 1], [-28, 28]);

  // Floating Badges: Rotate slightly based on horizontal mouse position (-2.5deg to 2.5deg)
  const badgeRotateLeft = useTransform(mouseX, [-1, 1], [-8.5, -3.5]);
  const badgeRotateRight = useTransform(mouseX, [-1, 1], [3.5, 8.5]);

  // Scattered Decorators: Foreground layer moves max (-38px to 38px)
  const decoratorX = useTransform(mouseX, [-1, 1], [-38, 38]);
  const decoratorY = useTransform(mouseY, [-1, 1], [-38, 38]);

  // Mouse Move Event Listener with normalized -1 to 1 calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || isTouchDevice || !targetRef.current) return;
    const rect = targetRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);

    rawMouseX.set(Math.max(-1, Math.min(1, normX)));
    rawMouseY.set(Math.max(-1, Math.min(1, normY)));
  };

  const handleMouseLeave = () => {
    rawMouseX.set(0);
    rawMouseY.set(0);
  };

  // ── 3. ENTRANCE STAGGER ANIMATION VARIANTS ──
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemFadeUp: Variants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const btnScaleUp: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  const leftImageEntrance: Variants = {
    hidden: { opacity: 0, x: -70, rotate: -12 },
    visible: {
      opacity: 1,
      x: 0,
      rotate: -6,
      transition: { duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const rightImageEntrance: Variants = {
    hidden: { opacity: 0, x: 70, rotate: 12 },
    visible: {
      opacity: 1,
      x: 0,
      rotate: 6,
      transition: { duration: 0.85, delay: 0.32, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const badgePop: Variants = {
    hidden: { opacity: 0, scale: 0.6 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 340, damping: 18, delay: 0.65 },
    },
  };

  return (
    <div ref={targetRef} className="relative w-full overflow-hidden" style={{ backgroundColor: "#F4E4C0" }}>
      {/* ── 1. HERO BANNER SECTION WITH MOUSE & SCROLL PARALLAX ── */}
      <motion.section
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          opacity: opacityHero,
          y: shouldReduceMotion ? 0 : yHeroScroll,
        }}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-24 lg:pt-28 pb-20 lg:pb-24 overflow-hidden select-none"
      >
        {/* ── TOP ORGANIC SVG WAVE BLOB ─────────────────────────── */}
        <div className="absolute top-0 left-0 w-full z-10 pointer-events-none">
          <svg
            viewBox="0 0 1440 210"
            fill="none"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "clamp(90px, 13vw, 210px)" }}
          >
            <path
              d="M0 0H1440V95C1390 145 1270 48 1080 108C900 162 720 42 540 118C360 188 180 62 0 138V0Z"
              fill="#3B4A2F"
            />
            <path
              d="M0 0H1440V68C1390 118 1270 22 1080 82C900 136 720 16 540 92C360 162 180 36 0 112V0Z"
              fill="#4A5B3C"
              opacity="0.55"
            />
          </svg>
        </div>

        {/* ── BOTTOM ORGANIC SVG WAVE BLOB ──────────────────────── */}
        <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none">
          <svg
            viewBox="0 0 1440 210"
            fill="none"
            preserveAspectRatio="none"
            className="w-full block"
            style={{ height: "clamp(90px, 13vw, 210px)" }}
          >
            <path
              d="M0 210H1440V115C1380 65 1240 162 1040 95C840 32 660 148 460 80C260 16 100 128 0 72V210Z"
              fill="#8B4D2A"
            />
            <path
              d="M0 210H1440V138C1380 88 1240 185 1040 118C840 55 660 172 460 104C260 40 100 152 0 96V210Z"
              fill="#A05A35"
              opacity="0.55"
            />
          </svg>
        </div>

        {/* ── GIANT BACKGROUND WATERMARK WORDMARK (Z-Index: 0) ────────────────── */}
        <motion.div
          style={{
            x: shouldReduceMotion ? 0 : wordmarkX,
            y: shouldReduceMotion ? 0 : wordmarkY,
            willChange: "transform",
          }}
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1.02, opacity: 0.065 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <span
            style={{
              fontFamily: "'Nunito', var(--font-heading), sans-serif",
              fontWeight: 900,
              fontSize: "clamp(90px, 18vw, 320px)",
              color: "#C4622D",
              whiteSpace: "nowrap",
              letterSpacing: "-0.025em",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            CELEBRATION
          </span>
        </motion.div>

        {/* ── SCATTERED AMBIENT DECORATORS (Z-Index: 15, Scroll + Mouse Parallax) ─── */}
        <motion.div
          style={{
            x: shouldReduceMotion ? 0 : decoratorX,
            y: shouldReduceMotion ? 0 : bgDecoratorsScrollY,
            willChange: "transform",
          }}
          className="absolute inset-0 pointer-events-none z-15 overflow-hidden"
        >
          {/* 1. Top Outer Coffee Beans */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [42, 48, 42] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] left-[3%] sm:left-[8%]"
          >
            <CoffeeBean size={24} opacity={0.78} />
          </motion.div>

          <motion.div
            animate={{ y: [0, 7, 0], rotate: [-24, -18, -24] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[12%] right-[4%] sm:right-[9%]"
          >
            <CoffeeBean size={26} rotation={-44} opacity={0.82} />
          </motion.div>

          {/* 2. Mid Outer Coffee Beans */}
          <motion.div
            animate={{ y: [0, 6, 0], rotate: [-18, -12, -18] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-[26%] left-[2%] sm:left-[12%]"
          >
            <CoffeeBean size={20} opacity={0.7} />
          </motion.div>

          <motion.div
            animate={{ y: [0, -7, 0], rotate: [30, 38, 30] }}
            transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            className="absolute top-[28%] right-[3%] sm:right-[11%]"
          >
            <CoffeeBean size={22} opacity={0.72} />
          </motion.div>

          {/* 3. Side Cutout Surrounding Coffee Beans */}
          <motion.div
            animate={{ y: [0, -9, 0], rotate: [-40, -32, -40] }}
            transition={{ duration: 11.2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
            className="absolute top-[48%] left-[4%] sm:left-[7%]"
          >
            <CoffeeBean size={25} opacity={0.75} />
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0], rotate: [15, 24, 15] }}
            transition={{ duration: 8.8, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
            className="absolute top-[46%] right-[5%] sm:right-[10%]"
          >
            <CoffeeBean size={27} opacity={0.78} />
          </motion.div>

          {/* 4. Lower Outer Coffee Beans */}
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [55, 62, 55] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-[68%] left-[3%] sm:left-[6%]"
          >
            <CoffeeBean size={24} rotation={58} opacity={0.75} />
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0], rotate: [-50, -42, -50] }}
            transition={{ duration: 10.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
            className="absolute top-[72%] right-[4%] sm:right-[8%]"
          >
            <CoffeeBean size={25} opacity={0.74} />
          </motion.div>

          {/* 5. Bottom Wave Layer Coffee Beans */}
          <motion.div
            animate={{ y: [0, -6, 0], rotate: [20, 28, 20] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute top-[84%] left-[6%] sm:left-[16%]"
          >
            <CoffeeBean size={23} opacity={0.7} />
          </motion.div>

          <motion.div
            animate={{ y: [0, 7, 0], rotate: [-30, -22, -30] }}
            transition={{ duration: 11.5, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
            className="absolute top-[86%] right-[5%] sm:right-[15%]"
          >
            <CoffeeBean size={24} opacity={0.72} />
          </motion.div>

          {/* 6. Chili Flakes */}
          <motion.div
            animate={{ rotate: [62, 70, 62], y: [0, -5, 0] }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[42%] left-[5%] sm:left-[18%]"
          >
            <ChiliFlake size={20} opacity={0.7} />
          </motion.div>

          <motion.div
            animate={{ y: [0, 6, 0], rotate: [-32, -24, -32] }}
            transition={{ duration: 10.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute top-[64%] right-[5%] sm:right-[18%]"
          >
            <ChiliFlake size={22} rotation={-32} opacity={0.72} />
          </motion.div>

          {/* 7. Herb Sprigs & Leaves */}
          <motion.div
            animate={{ rotate: [18, 26, 18], y: [0, -6, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[16%] left-[6%] sm:left-[14%]"
          >
            <HerbSprig size={30} opacity={0.78} />
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0], rotate: [-33, -25, -33] }}
            transition={{ duration: 11.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            className="absolute top-[34%] right-[4%] sm:right-[14%]"
          >
            <HerbSprig size={32} rotation={-33} opacity={0.76} />
          </motion.div>

          <motion.div
            animate={{ rotate: [45, 52, 45], y: [0, -7, 0] }}
            transition={{ duration: 11.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute top-[76%] left-[7%] sm:left-[24%]"
          >
            <HerbSprig size={34} opacity={0.8} />
          </motion.div>

          <motion.div
            animate={{ rotate: [-40, -32, -40], y: [0, 7, 0] }}
            transition={{ duration: 10.8, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
            className="absolute top-[78%] right-[6%] sm:right-[24%]"
          >
            <HerbSprig size={34} opacity={0.8} />
          </motion.div>
        </motion.div>

        {/* ── LEFT FLOATING PNG CUTOUT — DRINK GLASS (Peeking from Left Edge + Scroll Parallax) ── */}
        <motion.div
          variants={leftImageEntrance}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            x: shouldReduceMotion ? 0 : leftImageX,
            y: shouldReduceMotion ? 0 : leftImageScrollY,
            willChange: "transform",
          }}
          className="absolute z-20 pointer-events-auto top-[48%] sm:top-[42%] md:top-[38%] -translate-y-1/2 left-[-45px] sm:left-[-25px] md:left-[-15px] lg:left-3 xl:left-8 cursor-pointer group"
          onClick={onExploreMenu}
        >
          <div className="relative">
            <img
              src="/images/home%20screen%20png/coffe.png"
              alt="Signature Cold Brew Coffee"
              className="w-[195px] sm:w-[260px] md:w-[340px] lg:w-[380px] xl:w-[410px] h-auto object-contain filter drop-shadow-[0_18px_30px_rgba(42,21,8,0.32)]"
            />
            {/* Floating Sticker Badge */}
            <motion.div
              style={{
                rotate: shouldReduceMotion ? -6 : badgeRotateLeft,
                willChange: "transform",
              }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-6 sm:bottom-10 left-10 sm:left-6 bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-[10px] sm:text-xs md:text-sm tracking-widest uppercase px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xl border border-white/20 whitespace-nowrap group-hover:scale-110 transition-transform"
            >
              COLD BREW
            </motion.div>
          </div>
        </motion.div>

        {/* ── RIGHT FLOATING PNG CUTOUT — PIZZA (Peeking from Right Edge + Scroll Parallax) ── */}
        <motion.div
          variants={rightImageEntrance}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            x: shouldReduceMotion ? 0 : rightImageX,
            y: shouldReduceMotion ? 0 : rightImageScrollY,
            willChange: "transform",
          }}
          className="absolute z-20 pointer-events-auto top-[58%] sm:top-[50%] md:top-[45%] -translate-y-1/2 right-[-50px] sm:right-[-30px] md:right-[-15px] lg:right-3 xl:right-8 cursor-pointer group"
          onClick={onExploreMenu}
        >
          <div className="relative">
            <img
              src="/images/home%20screen%20png/pizza.png"
              alt="Wood-Fired Pizza"
              className="w-[210px] sm:w-[280px] md:w-[360px] lg:w-[420px] xl:w-[450px] h-auto object-contain filter drop-shadow-[0_18px_30px_rgba(42,21,8,0.32)]"
            />
            {/* Floating Sticker Badge */}
            <motion.div
              style={{
                rotate: shouldReduceMotion ? 6 : badgeRotateRight,
                willChange: "transform",
              }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="absolute bottom-6 sm:bottom-10 left-6 bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-[10px] sm:text-xs md:text-sm tracking-widest uppercase px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-xl border border-white/20 whitespace-nowrap group-hover:scale-110 transition-transform"
            >
              SIGNATURE
            </motion.div>
          </div>
        </motion.div>

        {/* ── CENTER HERO CONTENT & ENTRANCE STAGGER (Z-Index: 30) ────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            x: shouldReduceMotion ? 0 : contentX,
            y: shouldReduceMotion ? 0 : contentY,
            willChange: "transform",
          }}
          className="relative z-30 max-w-xl mx-auto flex flex-col items-center text-center space-y-3 pt-2 sm:pt-0 -translate-y-2 sm:-translate-y-6"
        >
          {/* 0. Top Location & Status Badge (Fills top empty gap cleanly) */}
          <motion.div
            variants={itemFadeUp}
            className="inline-flex items-center gap-1.5 bg-[#1F3B2C] text-[#F5B942] font-heading font-extrabold text-[10px] sm:text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border border-[#F5B942]/40 shadow-md backdrop-blur-md mb-0.5 cursor-pointer hover:bg-[#2A4D3A] transition-colors"
            onClick={onExploreMenu}
          >
            <MapPin className="w-3.5 h-3.5 text-[#F5B942]" />
            <span>Hamirpur, HP &middot; Artisan Kitchen</span>
          </motion.div>

          {/* 1. Eyebrow */}
          <motion.p
            variants={itemFadeUp}
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.32em",
              color: "#8B4D2A",
              textTransform: "uppercase",
            }}
          >
            CAFE &amp; RESTAURANT
          </motion.p>

          {/* 2. Headline */}
          <motion.h1
            variants={itemFadeUp}
            style={{
              fontFamily: "'Nunito', var(--font-heading), sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2.2rem, 7.5vw, 4rem)",
              color: "#2A1508",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Where Every<br />Bite Tells<br />a Story
          </motion.h1>

          {/* 3. Accent Divider Pill Row */}
          <motion.div
            variants={itemFadeUp}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              margin: "0.1rem 0 0.3rem 0",
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: 9999, background: "#C4622D", opacity: 0.35 }} />
            <div style={{ width: 22, height: 6, borderRadius: 9999, background: "#C4622D" }} />
            <div style={{ width: 6, height: 6, borderRadius: 9999, background: "#C4622D", opacity: 0.35 }} />
          </motion.div>

          {/* 4. Description Paragraph */}
          <motion.p
            variants={itemFadeUp}
            style={{
              fontSize: "0.88rem",
              color: "#6B4226",
              maxWidth: "310px",
              lineHeight: 1.65,
              fontWeight: 500,
            }}
          >
            Artisan wood-fired pizza, gourmet burgers, fresh thalis &amp; celebration cakes crafted with love in the hills of HP.
          </motion.p>

          {/* 5. CTA Buttons - Clean Responsive Layout */}
          <motion.div
            variants={btnScaleUp}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto z-30"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onExploreMenu}
              className="group relative overflow-hidden bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-[0_6px_24px_rgba(196,98,45,0.42)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer w-[240px] sm:w-auto"
            >
              <span>Explore Menu</span>
              <motion.span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </motion.span>
            </motion.button>

            <button
              onClick={onExploreMenu}
              className="group relative transition-opacity duration-200 hover:opacity-100 flex items-center justify-center gap-1 py-1.5 px-4 text-[#2A1508] font-heading font-bold text-xs sm:text-sm opacity-85 cursor-pointer"
            >
              <span>Our Story</span>
              <motion.span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-[#C4622D] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </button>
          </motion.div>

          {/* 6. Rating Badge Pill (Positioned cleanly) */}
          <motion.div
            variants={badgePop}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            animate={{ y: [0, -4, 0] }}
            transition={{
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
            className="mt-2 sm:mt-1 z-30 relative inline-flex items-center gap-2 bg-[#FAF7F0] backdrop-blur-md px-4 py-2 sm:px-5 sm:py-2 rounded-full border border-[#C4622D]/35 shadow-[0_6px_22px_rgba(42,21,8,0.18)] cursor-pointer"
            onClick={onExploreMenu}
          >
            <span className="text-[#C4622D] text-xs sm:text-sm tracking-wider">★★★★★</span>
            <span className="text-[11px] sm:text-xs text-[#2A1508] font-bold">4.9 &middot; 2,400+ reviews</span>
          </motion.div>

          {/* 7. Bottom Quick Feature Pills Strip (Fills lower empty gap cleanly) */}
          <motion.div
            variants={itemFadeUp}
            className="pt-3 sm:pt-4 flex items-center justify-center gap-2 flex-wrap max-w-sm mx-auto z-30 select-none"
          >
            <div className="bg-[#FAF7F0]/90 backdrop-blur-md border border-[#8B4D2A]/20 text-[#2A1508] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1.5 hover:border-[#C4622D]/50 transition-colors cursor-pointer" onClick={onExploreMenu}>
              <span>🍕</span>
              <span>Wood-Fired Pizza</span>
            </div>
            <div className="bg-[#FAF7F0]/90 backdrop-blur-md border border-[#8B4D2A]/20 text-[#2A1508] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1.5 hover:border-[#C4622D]/50 transition-colors cursor-pointer" onClick={onExploreMenu}>
              <span>☕</span>
              <span>Cold Brew Coffee</span>
            </div>
            <div className="bg-[#FAF7F0]/90 backdrop-blur-md border border-[#8B4D2A]/20 text-[#2A1508] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1.5 hover:border-[#C4622D]/50 transition-colors cursor-pointer" onClick={onExploreMenu}>
              <span>🎂</span>
              <span>Celebration Cakes</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── 2. SERVICE CARDS SECTION ── */}
      <div className="bg-[#FAF7F0] border-y border-border/40 py-6">
        <ServiceCards onSelectService={onExploreMenu} />
      </div>

      {/* ── 3. BESTSELLING FAVORITES SECTION ── */}
      <Bestsellers onExploreMenu={onExploreMenu} />

      {/* ── 4. CHEF'S CULINARY SHOWCASE ── */}
      <section className="bg-[#F5EFE6] text-foreground py-20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <ChefSignatureShowcase onExploreMenu={onExploreMenu} />
        </div>
      </section>

      {/* ── 5. FEATURE SECTION ── */}
      <section className="bg-[#3B4A2F] text-[#F4E4C0] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 border border-white/15 rounded-3xl p-8 space-y-4 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-[#C4622D]/20 border border-[#C4622D]/40 flex items-center justify-center text-[#F4E4C0]">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-[#F4E4C0]">Rooted in Hamirpur</h3>
              <p className="text-sm text-[#F4E4C0]/80 leading-relaxed">
                Serving local families, students, and mountain travelers since 2018 at Main Bazar Road.
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-3xl p-8 space-y-4 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-[#C4622D]/20 border border-[#C4622D]/40 flex items-center justify-center text-[#F4E4C0]">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-[#F4E4C0]">Made to Order</h3>
              <p className="text-sm text-[#F4E4C0]/80 leading-relaxed">
                100% fresh ingredients, handcrafted sauces, and freshly baked goods prepared upon every order.
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-3xl p-8 space-y-4 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-[#C4622D]/20 border border-[#C4622D]/40 flex items-center justify-center text-[#F4E4C0]">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-[#F4E4C0]">Dine-in / Takeaway / Delivery</h3>
              <p className="text-sm text-[#F4E4C0]/80 leading-relaxed">
                Enjoy cozy cafe dining, quick takeaway, or fast home delivery straight to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Hero;
