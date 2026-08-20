"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  ArrowRight,
  Search,
  MapPin,
  Copy,
  Check,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Gift,
  Percent,
  Truck,
  Cake,
  ArrowUpDown,
  ChevronDown,
  Trash2,
  Flame,
  CheckSquare,
  Square,
  MessageSquare,
  RotateCcw,
  History,
  Sparkles,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type MenuItem, type Category } from "@/lib/supabase";
import { useCart, getLineKey } from "@/lib/cart-context";
import CustomerUserMenu from "@/components/CustomerUserMenu";
import { ImageWithFallback } from "@/components/ImageWithFallback";

// ── Types for Past Orders & Reordering ──────────────────────────────────────────

export type PastOrderItem = {
  item_id: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  extras?: string[];
  spiceLevel?: string;
  notes?: string;
  photo?: string;
};

export type PastOrder = {
  id: string;
  date: string;
  order_type: "dine-in" | "pickup" | "delivery";
  total_amount: number;
  items: PastOrderItem[];
};

const DEFAULT_PAST_ORDERS: PastOrder[] = [
  {
    id: "ORD-984210",
    date: "2 days ago",
    order_type: "delivery",
    total_amount: 329,
    items: [
      {
        item_id: "ord-8",
        name: "Special Paneer Butter Masala Thali",
        quantity: 1,
        price: 180,
        photo: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&auto=format&q=80",
        spiceLevel: "Medium",
      },
      {
        item_id: "ord-6",
        name: "18-Hour Slow-Steeped Cold Brew Latte",
        quantity: 1,
        price: 149,
        photo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&auto=format&q=80",
      },
    ],
  },
  {
    id: "ORD-871402",
    date: "5 days ago",
    order_type: "dine-in",
    total_amount: 349,
    items: [
      {
        item_id: "ord-1",
        name: "Artisan Tandoori Paneer Pizza",
        quantity: 1,
        price: 349,
        size: "Medium (10 inch)",
        photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&auto=format&q=80",
      },
    ],
  },
];

// ── Default Categories & Menu Items ────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: "cat-pizza", name: "Wood-Fired Pizza", display_order: 1 },
  { id: "cat-burger", name: "Gourmet Burgers", display_order: 2 },
  { id: "cat-cakes", name: "Celebration Cakes", display_order: 3 },
  { id: "cat-bev", name: "Specialty Coffee & Teas", display_order: 4 },
  { id: "cat-mls", name: "Thalis & Meals", display_order: 5 },
];

const PROMO_OFFERS = [
  {
    id: "offer-1",
    badge: "20% OFF",
    icon: Percent,
    title: "Flat 20% OFF Above ₹499",
    subtitle: "Valid on all food orders across Hamirpur",
    code: "CELEB20",
    border: "border-marigold/50",
    badgeBg: "bg-marigold text-pineDark",
    accentGlow: "bg-marigold/10",
  },
  {
    id: "offer-2",
    badge: "FREE DELIVERY",
    icon: Truck,
    title: "Free Doorstep Delivery",
    subtitle: "Zero delivery fees on orders above ₹199 today",
    code: "FREEDEL",
    border: "border-emerald-500/50",
    badgeBg: "bg-emerald-600 text-white",
    accentGlow: "bg-emerald-500/10",
  },
  {
    id: "offer-3",
    badge: "₹100 OFF CAKES",
    icon: Cake,
    title: "₹100 OFF Bakery Cakes",
    subtitle: "Save ₹100 on eggless truffle & fruit cakes",
    code: "CAKE100",
    border: "border-rose-500/50",
    badgeBg: "bg-maroon text-white",
    accentGlow: "bg-rose-500/10",
  },
];

type CustomizationConfig = {
  sizes?: { name: string; extraPrice: number }[];
  extras?: { name: string; price: number }[];
  spices?: string[];
};

const ITEM_CUSTOMIZATIONS: Record<string, CustomizationConfig> = {
  "ord-1": {
    sizes: [
      { name: "Small (7 inch)", extraPrice: 0 },
      { name: "Medium (10 inch)", extraPrice: 80 },
      { name: "Large (12 inch)", extraPrice: 150 },
    ],
    extras: [
      { name: "Extra Mozzarella Cheese", price: 40 },
      { name: "Garlic Crust Glaze", price: 30 },
      { name: "Jalapeño Cheese Dip", price: 25 },
    ],
    spices: ["Mild", "Medium", "Spicy"],
  },
  "ord-2": {
    sizes: [
      { name: "Small (7 inch)", extraPrice: 0 },
      { name: "Medium (10 inch)", extraPrice: 80 },
      { name: "Large (12 inch)", extraPrice: 150 },
    ],
    extras: [
      { name: "Extra Mozzarella Cheese", price: 40 },
      { name: "Double Corn & Mushroom", price: 35 },
      { name: "Jalapeño Cheese Dip", price: 25 },
    ],
    spices: ["Mild", "Medium", "Spicy"],
  },
  "ord-3": {
    sizes: [
      { name: "Single Patty", extraPrice: 0 },
      { name: "Double Patty Smash", extraPrice: 70 },
    ],
    extras: [
      { name: "Melted Cheddar Cheese", price: 30 },
      { name: "Crispy Fried Bacon", price: 50 },
      { name: "Extra Mint Mayo Dip", price: 20 },
    ],
    spices: ["Mild", "Medium", "Spicy"],
  },
  "ord-4": {
    sizes: [
      { name: "Single Patty", extraPrice: 0 },
      { name: "Double Paneer Slab", extraPrice: 60 },
    ],
    extras: [
      { name: "Melted Cheddar Cheese", price: 30 },
      { name: "Extra Mint Mayo", price: 20 },
      { name: "Pickled Jalapeños", price: 20 },
    ],
    spices: ["Mild", "Medium", "Spicy"],
  },
  "ord-5": {
    sizes: [
      { name: "500g (Regular)", extraPrice: 0 },
      { name: "1 Kg (Large)", extraPrice: 400 },
    ],
    extras: [
      { name: "Candle & Birthday Topper", price: 30 },
      { name: "Personalized Gift Note", price: 20 },
      { name: "Extra Belgian Chocolate Drizzle", price: 40 },
    ],
  },
  "ord-6": {
    sizes: [
      { name: "Regular (250ml)", extraPrice: 0 },
      { name: "Large (400ml)", extraPrice: 40 },
    ],
    extras: [
      { name: "Almond Milk Substitute", price: 30 },
      { name: "Extra Scoop Vanilla Ice Cream", price: 35 },
    ],
  },
  "ord-8": {
    extras: [
      { name: "Extra Butter Roti (1 Pc)", price: 15 },
      { name: "Extra Gulab Jamun (1 Pc)", price: 30 },
      { name: "Sweet Lassi Glass", price: 50 },
    ],
    spices: ["Mild", "Medium", "Spicy"],
  },
};

const MENU_ITEMS: (MenuItem & {
  photo: string;
  is_highly_reordered?: boolean;
  reorder_rate?: string;
  reorder_count?: string;
})[] = [
  {
    id: "ord-1",
    category_id: "cat-pizza",
    name: "Artisan Tandoori Paneer Pizza",
    description: "Marinated paneer tikka, caramelized onions, mint glaze on hand-stretched crust",
    price: 349,
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&auto=format&q=80",
    photo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
    is_highly_reordered: true,
    reorder_rate: "94% Reordered",
    reorder_count: "1.2k+ repeat orders",
  },
  {
    id: "ord-2",
    category_id: "cat-pizza",
    name: "Farmhouse Loaded Veggie Pizza",
    description: "Bell peppers, sweet corn, mushrooms, black olives & 100% mozzarella",
    price: 319,
    image_url: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&h=600&fit=crop&auto=format&q=80",
    photo: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&h=600&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
  },
  {
    id: "ord-3",
    category_id: "cat-burger",
    name: "Double Smash Gourmet Chicken Burger",
    description: "Two crispy smash chicken patties, melted cheddar, house coleslaw & brioche bun",
    price: 279,
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&auto=format&q=80",
    photo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&auto=format&q=80",
    is_veg: false,
    is_available: true,
    is_highly_reordered: true,
    reorder_rate: "89% Reordered",
    reorder_count: "830+ repeat orders",
  },
  {
    id: "ord-4",
    category_id: "cat-burger",
    name: "Crispy Paneer Supreme Burger",
    description: "Crispy fried cottage cheese slab, spicy mint mayonnaise & pickled onions",
    price: 199,
    image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop&auto=format&q=80",
    photo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
  },
  {
    id: "ord-5",
    category_id: "cat-cakes",
    name: "Belgian Dark Chocolate Truffle Cake (500g)",
    description: "70% Belgian dark chocolate ganache, eggless moist sponge & edible gold dust",
    price: 499,
    image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop&auto=format&q=80",
    photo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
    is_highly_reordered: true,
    reorder_rate: "91% Reordered",
    reorder_count: "980+ repeat orders",
  },
  {
    id: "ord-6",
    category_id: "cat-bev",
    name: "18-Hour Slow-Steeped Cold Brew Latte",
    description: "Single-origin Arabica espresso poured over vanilla ice cream & cold milk",
    price: 149,
    image_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&auto=format&q=80",
    photo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
    is_highly_reordered: true,
    reorder_rate: "87% Reordered",
    reorder_count: "750+ repeat orders",
  },
  {
    id: "ord-7",
    category_id: "cat-bev",
    name: "Special Himachali Masala Chai",
    description: "Fresh crushed ginger, green cardamom, single-estate tea leaves & warm milk",
    price: 30,
    image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=600&fit=crop&auto=format&q=80",
    photo: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=600&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
  },
  {
    id: "ord-8",
    category_id: "cat-mls",
    name: "Special Paneer Butter Masala Thali",
    description: "Rich paneer butter masala, dal makhani, fragrant rice, 3 butter rotis & sweet",
    price: 180,
    image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&auto=format&q=80",
    photo: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
    is_highly_reordered: true,
    reorder_rate: "92% Reordered",
    reorder_count: "1.8k+ repeat orders",
  },
];

// ── Custom Premium Sort Dropdown Component ──────────────────────────────────

const SORT_OPTIONS = [
  { id: "popular", label: "Popular" },
  { id: "low", label: "Price: Low to High" },
  { id: "high", label: "Price: High to Low" },
];

function CustomSortDropdown({
  value,
  onChange,
}: {
  value: "popular" | "low" | "high";
  onChange: (val: "popular" | "low" | "high") => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = SORT_OPTIONS.find((o) => o.id === value) || SORT_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-30" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-card hover:bg-muted border border-border text-foreground text-xs font-semibold rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-xs hover:border-accent/50 transition-all cursor-pointer"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-accent" />
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180 text-accent" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-44 bg-card border border-border text-card-foreground rounded-2xl shadow-xl p-1.5 z-50 overflow-hidden"
          >
            {SORT_OPTIONS.map((opt) => {
              const selected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id as any);
                    setOpen(false);
                  }}
                  className={`w-full text-left text-xs px-3 py-2 rounded-xl flex items-center justify-between font-medium transition-colors ${
                    selected
                      ? "bg-accent/15 text-accent font-bold"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OnlineOrderPage() {
  // State
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "low" | "high">("popular");

  // Past Orders State
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);

  // Mobile Auto-Swipe Offer state
  const [activeOfferIndex, setActiveOfferIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Cart & Drawer
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const { lines, addItem, itemCount, total, updateQuantity, removeItem } = useCart();

  // Customization Modal State
  const [customizingItem, setCustomizingItem] = useState<(MenuItem & { photo: string }) | null>(null);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedSpice, setSelectedSpice] = useState<string>("Medium");
  const [notes, setNotes] = useState("");
  const [modalQty, setModalQty] = useState(1);
  // Customer profile state
  const [customerName, setCustomerName] = useState<string | null>(null);

  // Added animation micro-interaction state per item
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Fetch Past Orders & Customer Profile from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("celebration_past_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPastOrders(parsed);
        }
      }

      const profileStr = localStorage.getItem("celebration_customer_profile");
      if (profileStr) {
        const p = JSON.parse(profileStr);
        if (p.name) setCustomerName(p.name);
      }
    } catch (e) {
    }
    // Fallback to demo past orders so user experiences the Swiggy-like feature immediately
    setPastOrders(DEFAULT_PAST_ORDERS);
  }, []);

  // Auto Swipe Timer for mobile offers
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveOfferIndex((prev) => (prev + 1) % PROMO_OFFERS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon ${code} copied! Apply at checkout.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Reorder entire past order with one click
  const handleReorderEntireOrder = (order: PastOrder) => {
    let addedCount = 0;
    order.items.forEach((pastItem) => {
      const menuItem = MENU_ITEMS.find(
        (m) => m.id === pastItem.item_id || m.name === pastItem.name
      );
      if (menuItem) {
        addItem(
          menuItem,
          pastItem.quantity,
          pastItem.size,
          pastItem.extras,
          pastItem.price,
          pastItem.spiceLevel,
          pastItem.notes
        );
        addedCount += pastItem.quantity;
      }
    });

    if (addedCount > 0) {
      toast.success(`Reordered ${addedCount} item${addedCount > 1 ? "s" : ""} from your past order!`);
      setCartDrawerOpen(true);
    }
  };

  const clearPastOrders = () => {
    setPastOrders([]);
    try {
      localStorage.removeItem("celebration_past_orders");
    } catch (e) {}
    toast.info("Past order history cleared.");
  };

  // Open modal or add directly to cart
  const handleAddClick = (item: MenuItem & { photo: string }) => {
    const config = ITEM_CUSTOMIZATIONS[item.id];
    if (config && (config.sizes || config.extras || config.spices)) {
      // Open customization modal
      setCustomizingItem(item);
      setSelectedSizeIndex(0);
      setSelectedExtras([]);
      setSelectedSpice(config.spices ? config.spices[1] || config.spices[0] : "Medium");
      setNotes("");
      setModalQty(1);
    } else {
      // Direct Add to Cart with micro-animation
      triggerAddedAnimation(item.id);
      addItem(item, 1);
      toast.success(`Added ${item.name} to cart`);
    }
  };

  const triggerAddedAnimation = (id: string) => {
    setAddedItemIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [id]: false }));
    }, 1500);
  };

  // Calculate live total inside modal
  const calculateModalTotal = () => {
    if (!customizingItem) return 0;
    const config = ITEM_CUSTOMIZATIONS[customizingItem.id];
    let unitPrice = customizingItem.price;

    if (config?.sizes && config.sizes[selectedSizeIndex]) {
      unitPrice += config.sizes[selectedSizeIndex].extraPrice;
    }
    if (config?.extras) {
      selectedExtras.forEach((extraName) => {
        const found = config.extras?.find((e) => e.name === extraName);
        if (found) unitPrice += found.price;
      });
    }
    return unitPrice * modalQty;
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem) return;
    const config = ITEM_CUSTOMIZATIONS[customizingItem.id];
    const sizeObj = config?.sizes ? config.sizes[selectedSizeIndex] : undefined;
    const sizeName = sizeObj ? sizeObj.name : undefined;

    let unitPrice = customizingItem.price;
    if (sizeObj) unitPrice += sizeObj.extraPrice;
    if (config?.extras) {
      selectedExtras.forEach((extraName) => {
        const found = config.extras?.find((e) => e.name === extraName);
        if (found) unitPrice += found.price;
      });
    }

    addItem(
      customizingItem,
      modalQty,
      sizeName,
      selectedExtras,
      unitPrice,
      config?.spices ? selectedSpice : undefined,
      notes.trim() ? notes.trim() : undefined
    );

    triggerAddedAnimation(customizingItem.id);
    toast.success(`Added ${customizingItem.name} to cart`);
    setCustomizingItem(null);
  };

  const toggleExtra = (extraName: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extraName) ? prev.filter((e) => e !== extraName) : [...prev, extraName]
    );
  };

  // Filtered menu
  const filtered = MENU_ITEMS.filter((item) => {
    if (vegOnly && !item.is_veg) return false;
    if (selectedCat === "highly_reordered" && !item.is_highly_reordered) return false;
    if (selectedCat !== "all" && selectedCat !== "highly_reordered" && item.category_id !== selectedCat)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "low") return a.price - b.price;
    if (sortBy === "high") return b.price - a.price;
    return 0;
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-50 w-full bg-[#121110]/90 text-stone backdrop-blur-xl border-b border-white/10 shadow-lg px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/images/logos/logo.svg"
                alt="Celebration Food Cafe"
                className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span className="sr-only">Celebration Cafe</span>
            </Link>
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-marigold bg-white/5 border border-marigold/20 px-3 py-1 rounded-full">
              <MapPin className="w-3 h-3 text-marigold" />
              Hamirpur, HP
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <CustomerUserMenu />

            <Link
              href="/"
              className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-stone/85 hover:text-marigold transition-colors"
            >
              ← Back to Home
            </Link>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCartDrawerOpen(true)}
              className="bg-marigold text-pineDark font-extrabold px-5 py-2 rounded-full text-xs md:text-sm flex items-center gap-2 shadow-xl hover:bg-marigoldLight transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="bg-maroon text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {itemCount}
                </span>
              )}
              {total > 0 && <span className="hidden sm:inline font-bold">· ₹{total}</span>}
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Page Hero Title (Deep Obsidian Gold Banner) ── */}
      <section className="bg-[#121110] text-stone pt-8 pb-12 px-6 border-b border-marigold/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_var(--tw-gradient-stops))] from-marigold/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-marigold uppercase mb-1 flex items-center gap-1.5">
              Fast Delivery & Pickup in Hamirpur
            </p>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-stone">
              Online Food Ordering
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone/80 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 w-fit backdrop-blur-md">
            <MapPin className="w-4 h-4 text-marigold" />
            <span>Delivering to Hamirpur Town (9 AM to 10 PM)</span>
          </div>
        </div>
      </section>

      {/* ── Coupon Ticket Offers Section ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 -mt-6 relative z-20">
        {/* Desktop 3-Column Coupon Grid */}
        <div className="hidden md:grid grid-cols-3 gap-4">
          {PROMO_OFFERS.map((offer) => {
            const IconComponent = offer.icon;
            return (
              <motion.div
                key={offer.id}
                whileHover={{ y: -3 }}
                className={`bg-card text-card-foreground border-2 border-dashed ${offer.border} rounded-2xl p-4 sm:p-5 shadow-[0_8px_25px_-5px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.12)] flex flex-col justify-between h-[155px] relative overflow-hidden group transition-all duration-300`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${offer.accentGlow} blur-2xl pointer-events-none`} />

                <div className="flex items-center justify-between gap-2 relative z-10">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs ${offer.badgeBg}`}>
                    {offer.badge}
                  </span>
                  <IconComponent className="w-4 h-4 text-accent" />
                </div>

                <div className="space-y-0.5 relative z-10">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    {offer.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {offer.subtitle}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between relative z-10">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">COUPON CODE</span>
                  <button
                    onClick={() => handleCopyCode(offer.code)}
                    className="bg-muted hover:bg-accent hover:text-accent-foreground border border-border text-foreground font-mono text-[11px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    {copiedCode === offer.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-accent" />
                        <span>{offer.code}</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Interactive Auto-Swipe Coupon Card */}
        <div className="md:hidden">
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`bg-card text-card-foreground border-2 border-dashed ${PROMO_OFFERS[activeOfferIndex].border} rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden transition-all duration-300`}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${PROMO_OFFERS[activeOfferIndex].badgeBg}`}>
                {PROMO_OFFERS[activeOfferIndex].badge}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setActiveOfferIndex((prev) => (prev === 0 ? PROMO_OFFERS.length - 1 : prev - 1))
                  }
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setActiveOfferIndex((prev) => (prev + 1) % PROMO_OFFERS.length)
                  }
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-base font-bold text-foreground">
                {PROMO_OFFERS[activeOfferIndex].title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {PROMO_OFFERS[activeOfferIndex].subtitle}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                {PROMO_OFFERS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveOfferIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      activeOfferIndex === idx ? "w-5 bg-accent" : "w-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => handleCopyCode(PROMO_OFFERS[activeOfferIndex].code)}
                className="bg-accent text-accent-foreground font-mono text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                {copiedCode === PROMO_OFFERS[activeOfferIndex].code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>USE: {PROMO_OFFERS[activeOfferIndex].code}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Swiggy-Style "Order Again / Past Orders" Section ── */}
      {pastOrders.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
          <div className="bg-gradient-to-r from-[#17241e] via-[#1c2c25] to-[#14201a] text-stone border border-marigold/30 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-marigold/10 blur-3xl pointer-events-none rounded-full" />

            <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-marigold/20 border border-marigold/40 flex items-center justify-center text-marigold shadow-inner">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading text-lg md:text-xl font-bold text-stone flex items-center gap-2">
                    Order Again
                    <span className="text-[10px] font-extrabold bg-marigold text-pineDark px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      Past Favorites
                    </span>
                  </h2>
                  <p className="text-xs text-stone/70">
                    Repeat your past delicious orders in one tap, just like Swiggy!
                  </p>
                </div>
              </div>

              <button
                onClick={clearPastOrders}
                className="text-[11px] text-stone/50 hover:text-stone/90 underline transition-colors cursor-pointer"
              >
                Clear History
              </button>
            </div>

            {/* Horizontal Scrollable Past Order Cards */}
            <div className="flex gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar relative z-10">
              {pastOrders.map((pastOrder) => (
                <motion.div
                  key={pastOrder.id}
                  whileHover={{ y: -3 }}
                  className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 min-w-[270px] sm:min-w-[310px] max-w-[330px] flex-shrink-0 space-y-3 flex flex-col justify-between shadow-lg hover:border-marigold/40 transition-all"
                >
                  <div className="flex items-center justify-between text-[11px] text-stone/70 border-b border-white/10 pb-2">
                    <span className="font-semibold text-marigold flex items-center gap-1">
                      <History className="w-3 h-3 text-marigold" />
                      {pastOrder.date}
                    </span>
                    <span className="bg-white/10 px-2 py-0.5 rounded-md font-mono text-[10px] text-stone/80 uppercase">
                      {pastOrder.order_type}
                    </span>
                  </div>

                  {/* List of items inside this past order */}
                  <div className="space-y-2.5">
                    {pastOrder.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {it.photo ? (
                          <img
                            src={it.photo}
                            alt={it.name}
                            className="w-12 h-12 rounded-xl object-cover border border-white/20 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-marigold flex-shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-stone truncate">{it.name}</p>
                          <p className="text-[10px] text-stone/60">
                            {it.quantity}x · ₹{it.price * it.quantity}
                            {it.size ? ` · ${it.size}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total & Reorder Button */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone/60 uppercase block font-semibold">Total</span>
                      <span className="font-heading text-sm font-bold text-marigold">₹{pastOrder.total_amount}</span>
                    </div>

                    <button
                      onClick={() => handleReorderEntireOrder(pastOrder)}
                      className="bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder All</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Highly Reordered Spotlight Section ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-xs">
              <Flame className="w-5 h-5 fill-orange-500/20" />
            </div>
            <div>
              <h2 className="font-heading text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                Highly Reordered Dishes
                <span className="text-[10px] font-bold bg-orange-500/15 text-orange-600 border border-orange-500/30 px-2.5 py-0.5 rounded-full">
                  Customer Favorites
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Top rated dishes our Hamirpur customers order again & again
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal Carousel of Highly Reordered Items */}
        <div className="flex gap-4 overflow-x-auto pb-3 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar">
          {MENU_ITEMS.filter((i) => i.is_highly_reordered).map((item) => {
            const isJustAdded = addedItemIds[item.id];

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                className="bg-card border-2 border-amber-500/20 hover:border-amber-500/50 rounded-2xl p-3.5 min-w-[240px] sm:min-w-[270px] max-w-[280px] flex-shrink-0 space-y-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
              >
                <div className="relative h-36 rounded-xl overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={item.photo}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Reorder Rate Badge */}
                  <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md text-amber-400 font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-400/40 shadow-md">
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span>{item.reorder_rate || "Highly Reordered"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-3.5 h-3.5 rounded-xs border-2 flex items-center justify-center ${
                        item.is_veg ? "border-green-600" : "border-red-600"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.is_veg ? "bg-green-600" : "bg-red-600"
                        }`}
                      />
                    </div>
                    <h3 className="font-heading text-sm font-bold text-foreground truncate">
                      {item.name}
                    </h3>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">₹{item.price}</p>
                    {item.reorder_count && (
                      <p className="text-[9px] text-muted-foreground font-medium">{item.reorder_count}</p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => handleAddClick(item)}
                    className={`font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer ${
                      isJustAdded
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-accent text-accent-foreground hover:opacity-90"
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>ADDED!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Sticky Filter & Search Bar ── */}
      <div className="sticky top-[60px] z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 my-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Category Chips Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar">
            <button
              onClick={() => setSelectedCat("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCat === "all"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All Items
            </button>

            {/* Highly Reordered Filter Tab */}
            <button
              onClick={() => setSelectedCat("highly_reordered")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCat === "highly_reordered"
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border border-orange-500/20"
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500/30" />
              <span>Highly Reordered</span>
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCat === cat.id
                    ? "bg-accent text-accent-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search, Veg Toggle & Custom Sort controls */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search dishes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* Veg Toggle */}
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                vegOnly
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Veg
            </button>

            {/* Custom Premium Sort Dropdown */}
            <CustomSortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        </div>
      </div>

      {/* ── Main Content Grid & Desktop Sidebar Layout ── */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Dish Cards Grid (8 Columns on Desktop) */}
        <div className="lg:col-span-8">
          {filtered.length === 0 ? (
            /* Empty State */
            <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <SlidersHorizontal className="w-10 h-10 text-accent/60 mx-auto" />
              <h3 className="font-heading text-xl font-bold text-foreground">No matching dishes found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try clearing your search query or unchecking the Veg-only filter to see more items.
              </p>
              <button
                onClick={() => {
                  setSelectedCat("all");
                  setVegOnly(false);
                  setSearchQuery("");
                }}
                className="mt-2 text-xs font-bold text-accent underline hover:opacity-80 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filtered.map((item) => {
                const config = ITEM_CUSTOMIZATIONS[item.id];
                const isCustomizable = !!(config && (config.sizes || config.extras || config.spices));
                const isJustAdded = addedItemIds[item.id];

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -3 }}
                    className={`bg-card border ${
                      item.is_highly_reordered
                        ? "border-amber-500/30 hover:border-amber-500/60"
                        : "border-border hover:border-accent/40"
                    } rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-4 group relative`}
                  >
                    <div className="flex gap-3.5">
                      {/* Image */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
                        <ImageWithFallback
                          src={item.photo}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {item.is_highly_reordered && (
                          <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-md text-amber-400 font-extrabold text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-amber-400/30">
                            <Flame className="w-2.5 h-2.5 text-orange-400 fill-orange-400" />
                            <span>Top Reordered</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
                              item.is_veg ? "border-green-600" : "border-red-600"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.is_veg ? "bg-green-600" : "bg-red-600"
                              }`}
                            />
                          </div>
                          <h3 className="font-heading text-sm font-bold text-foreground truncate">
                            {item.name}
                          </h3>
                        </div>

                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <p className="text-sm font-bold text-foreground">₹{item.price}</p>
                          {isCustomizable && (
                            <span className="text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full">
                              Customizable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Add Button Action */}
                    <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                      {item.reorder_rate ? (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {item.reorder_rate}
                        </span>
                      ) : (
                        <span />
                      )}

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => handleAddClick(item)}
                        className={`font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                          isJustAdded
                            ? "bg-green-600 text-white shadow-md"
                            : "bg-accent text-accent-foreground hover:opacity-90"
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>ADDED!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>ADD</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Desktop Sticky Cart Panel (4 Columns on Desktop) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-28 bg-pine text-stone border border-marigold/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-heading text-lg font-bold text-stone flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-marigold" /> Your Order
              </h3>
              <span className="text-xs font-bold text-marigold">{itemCount} items</span>
            </div>

            {lines.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <ShoppingBag className="w-10 h-10 text-stone/30 mx-auto" />
                <p className="text-xs text-stone/60">
                  Your cart is empty. Click "ADD" on any dish to customize & order!
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {lines.map((line) => {
                  const key = getLineKey(
                    line.item,
                    line.size,
                    line.extras,
                    line.spiceLevel,
                    line.notes
                  );
                  const uPrice = line.unitPrice ?? line.item.price;

                  return (
                    <div
                      key={key}
                      className="bg-white/5 border border-white/10 rounded-2xl p-3 text-xs space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 pr-2 space-y-0.5">
                          <p className="font-bold text-stone text-xs leading-snug">{line.item.name}</p>
                          {/* Customization Details Subtext */}
                          {(line.size || (line.extras && line.extras.length > 0) || line.spiceLevel || line.notes) && (
                            <p className="text-[10px] text-marigold font-medium leading-tight">
                              {[
                                line.size,
                                line.spiceLevel ? `Spice: ${line.spiceLevel}` : null,
                                line.extras && line.extras.length > 0 ? line.extras.join(", ") : null,
                                line.notes ? `"${line.notes}"` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(key)}
                          className="text-stone/40 hover:text-red-400 p-1 transition-colors cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-2 py-0.5 font-bold">
                          <button
                            onClick={() => updateQuantity(key, line.quantity - 1)}
                            className="p-0.5 text-stone hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-4 text-center tabular-nums text-marigold">{line.quantity}</span>
                          <button
                            onClick={() => updateQuantity(key, line.quantity + 1)}
                            className="p-0.5 text-stone hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-bold text-marigold tabular-nums text-sm">
                          ₹{uPrice * line.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cart Subtotal & Checkout Button */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-stone">
                <span>Subtotal</span>
                <span className="text-marigold text-base tabular-nums">₹{total}</span>
              </div>

              {itemCount > 0 ? (
                <Link
                  href="/checkout"
                  className="w-full bg-marigold text-pineDark font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xl hover:bg-marigoldLight transition-colors"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full bg-white/10 text-stone/40 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm cursor-not-allowed border border-white/10"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile Persistent Sticky Bottom Bar ── */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="w-full bg-marigold text-pineDark font-bold py-3.5 px-6 rounded-2xl shadow-2xl flex items-center justify-between text-sm active:scale-98 transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{itemCount} item{itemCount > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>View Cart · ₹{total}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* ── Item Customization Modal / Bottom Sheet (White Card & Hidden Scrollbars) ── */}
      <AnimatePresence>
        {customizingItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setCustomizingItem(null)}
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="relative z-10 bg-card text-card-foreground border border-border w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Top Photo & Header */}
              <div className="relative h-48 sm:h-52 overflow-hidden bg-muted flex-shrink-0">
                <ImageWithFallback
                  src={customizingItem.photo}
                  alt={customizingItem.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                <button
                  onClick={() => setCustomizingItem(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 text-foreground border border-border flex items-center justify-center hover:bg-background transition-colors shadow-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
                        customizingItem.is_veg ? "border-green-600" : "border-red-600"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          customizingItem.is_veg ? "bg-green-600" : "bg-red-600"
                        }`}
                      />
                    </div>
                    <h2 className="font-heading text-xl font-bold text-foreground">
                      {customizingItem.name}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Scrollable Customization Body (NO SCROLLBAR) */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar">
                {/* Full Untruncated Description */}
                {customizingItem.description && (
                  <p className="text-muted-foreground text-xs leading-relaxed border-b border-border/60 pb-4">
                    {customizingItem.description}
                  </p>
                )}

                {/* 1. Size Selector */}
                {ITEM_CUSTOMIZATIONS[customizingItem.id]?.sizes && (
                  <div className="space-y-3">
                    <h3 className="font-heading text-sm font-bold text-foreground flex items-center justify-between">
                      <span>Select Size</span>
                      <span className="text-[10px] text-accent uppercase font-bold tracking-wider">Required</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {ITEM_CUSTOMIZATIONS[customizingItem.id].sizes!.map((size, idx) => {
                        const selected = selectedSizeIndex === idx;
                        return (
                          <button
                            key={size.name}
                            type="button"
                            onClick={() => setSelectedSizeIndex(idx)}
                            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                              selected
                                ? "bg-accent text-accent-foreground border-accent font-bold shadow-md ring-2 ring-accent/30"
                                : "bg-muted/30 border-border text-foreground hover:bg-muted/60"
                            }`}
                          >
                            <span className="text-xs font-bold">{size.name}</span>
                            <span
                              className={`text-[10px] mt-1 ${
                                selected ? "text-accent-foreground/90" : "text-muted-foreground"
                              }`}
                            >
                              {size.extraPrice > 0 ? `+₹${size.extraPrice}` : "Included"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Add-ons / Extras Checklist */}
                {ITEM_CUSTOMIZATIONS[customizingItem.id]?.extras && (
                  <div className="space-y-3 pt-2">
                    <h3 className="font-heading text-sm font-bold text-foreground flex items-center justify-between">
                      <span>Add Extra Toppings & Dips</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                    </h3>
                    <div className="space-y-2">
                      {ITEM_CUSTOMIZATIONS[customizingItem.id].extras!.map((extra) => {
                        const checked = selectedExtras.includes(extra.name);
                        return (
                          <button
                            key={extra.name}
                            type="button"
                            onClick={() => toggleExtra(extra.name)}
                            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                              checked
                                ? "bg-accent/10 border-accent text-foreground font-semibold"
                                : "bg-muted/30 border-border text-foreground/80 hover:bg-muted/60"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {checked ? (
                                <CheckSquare className="w-4 h-4 text-accent" />
                              ) : (
                                <Square className="w-4 h-4 text-muted-foreground/40" />
                              )}
                              <span className="text-xs font-medium">{extra.name}</span>
                            </div>
                            <span className="font-bold text-accent">+₹{extra.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Spice Level Selector */}
                {ITEM_CUSTOMIZATIONS[customizingItem.id]?.spices && (
                  <div className="space-y-3 pt-2">
                    <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-accent" />
                      <span>Select Spice Level</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border">
                      {ITEM_CUSTOMIZATIONS[customizingItem.id].spices!.map((spice) => {
                        const selected = selectedSpice === spice;
                        return (
                          <button
                            key={spice}
                            type="button"
                            onClick={() => setSelectedSpice(spice)}
                            className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              selected
                                ? "bg-accent text-accent-foreground font-bold shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {spice}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Special Instructions */}
                <div className="space-y-2 pt-2">
                  <label className="font-heading text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-accent" />
                    <span>Special Instructions (Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Less spicy, no onions, extra crispy crust"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                  />
                </div>
              </div>

              {/* Sticky Bottom Modal Action Bar */}
              <div className="p-4 bg-card border-t border-border flex items-center justify-between gap-4 flex-shrink-0">
                {/* Quantity Stepper */}
                <div className="flex items-center gap-3 bg-muted/50 rounded-2xl px-3 py-2 border border-border">
                  <button
                    type="button"
                    onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-foreground tabular-nums w-4 text-center">{modalQty}</span>
                  <button
                    type="button"
                    onClick={() => setModalQty((q) => q + 1)}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Confirm Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleConfirmCustomization}
                  className="flex-1 bg-accent text-accent-foreground font-bold py-3.5 rounded-2xl text-xs md:text-sm flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span>Add to Cart</span>
                  <span>·</span>
                  <span className="tabular-nums">₹{calculateModalTotal()}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Mobile Cart Drawer ── */}
      <AnimatePresence>
        {cartDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setCartDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-10 bg-pine text-stone border-l border-white/15 w-full max-w-sm h-full flex flex-col justify-between shadow-2xl p-6"
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-4">
                  <h2 className="font-heading text-xl font-bold text-stone flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-marigold" /> Your Cart
                  </h2>
                  <button onClick={() => setCartDrawerOpen(false)} className="cursor-pointer">
                    <X className="w-5 h-5 text-stone/70 hover:text-stone" />
                  </button>
                </div>

                {lines.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <ShoppingBag className="w-10 h-10 text-stone/30 mx-auto" />
                    <p className="text-xs text-stone/60">Your cart is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {lines.map((l) => {
                      const key = getLineKey(l.item, l.size, l.extras, l.spiceLevel, l.notes);
                      const uPrice = l.unitPrice ?? l.item.price;
                      return (
                        <div
                          key={key}
                          className="bg-white/5 border border-white/10 rounded-2xl p-3 text-xs space-y-2"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-bold text-stone text-xs leading-snug">{l.item.name}</p>
                              {(l.size || (l.extras && l.extras.length > 0) || l.spiceLevel || l.notes) && (
                                <p className="text-[10px] text-marigold font-medium leading-tight">
                                  {[
                                    l.size,
                                    l.spiceLevel ? `Spice: ${l.spiceLevel}` : null,
                                    l.extras && l.extras.length > 0 ? l.extras.join(", ") : null,
                                    l.notes ? `"${l.notes}"` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(key)}
                              className="text-stone/40 hover:text-red-400 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-white/10">
                            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-2 py-0.5 font-bold">
                              <button
                                onClick={() => updateQuantity(key, l.quantity - 1)}
                                className="p-0.5 text-stone hover:text-white cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-bold text-marigold">{l.quantity}</span>
                              <button
                                onClick={() => updateQuantity(key, l.quantity + 1)}
                                className="p-0.5 text-stone hover:text-white cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-bold text-marigold">₹{uPrice * l.quantity}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/15 space-y-3">
                <div className="flex justify-between text-stone font-bold text-base">
                  <span>Total Amount</span>
                  <span className="text-marigold">₹{total}</span>
                </div>
                {itemCount > 0 ? (
                  <Link
                    href="/checkout"
                    onClick={() => setCartDrawerOpen(false)}
                    className="w-full bg-marigold text-pineDark font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xl hover:bg-marigoldLight transition-colors"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-white/10 text-stone/40 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm cursor-not-allowed"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
