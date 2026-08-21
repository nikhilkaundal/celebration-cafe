"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Clock,
  Sparkles,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type MenuItem, type Category } from "@/lib/supabase";
import { useCart, getLineKey } from "@/lib/cart-context";
import CustomerUserMenu from "@/components/CustomerUserMenu";
import OfferBannerCarousel from "@/components/OfferBannerCarousel";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { LocationAddressSelector } from "@/components/LocationAddressSelector";

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

  // Live Database Menu Items & Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [customizationGroups, setCustomizationGroups] = useState<any[]>([]);
  const [loadingCustomizations, setLoadingCustomizations] = useState(false);

  // Dynamic Active Offers State
  const [promoOffers, setPromoOffers] = useState<any[]>([]);

  // Past Orders State & Auth state
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [pastOrdersLoading, setPastOrdersLoading] = useState(true);
  const [isAuthenticatedCustomer, setIsAuthenticatedCustomer] = useState(false);

  // Highly Reordered Dishes State
  const [topReorderedDishes, setTopReorderedDishes] = useState<any[]>([]);

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

  // Unified Customer Orders & Auth Sync
  const syncCustomerOrders = useCallback(async (activeSession?: any) => {
    try {
      setPastOrdersLoading(true);

      // 1. Get session from parameter or Supabase SDK
      let session = activeSession;
      if (!session) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
      }

      // 2. Check local profile fallback as secondary source of truth
      let hasLocalProfile = false;
      try {
        const storedProfile = localStorage.getItem("celebration_customer_profile");
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          if (parsed.isLoggedIn || parsed.name) {
            hasLocalProfile = true;
            if (parsed.name) setCustomerName(parsed.name);
          }
        }
      } catch (e) {}

      const isAuthed = !!(session?.user || hasLocalProfile);
      setIsAuthenticatedCustomer(isAuthed);

      if (isAuthed) {
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const res = await fetch("/api/customer/orders/recent", { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated !== undefined) {
            setIsAuthenticatedCustomer(data.authenticated || isAuthed);
          }
          if (data.orders) {
            setPastOrders(data.orders);
          }
        }
      } else {
        setPastOrders([]);
      }
    } catch (e) {
      console.warn("Past orders sync error:", e);
      setPastOrders([]);
    } finally {
      setPastOrdersLoading(false);
    }
  }, []);

  // Load Auth Session, Offers, Top Dishes & Live Menu List
  useEffect(() => {
    async function loadPublicContent() {
      // 1. Fetch Live Categories & Menu Items from DB
      try {
        setMenuLoading(true);
        const res = await fetch("/api/menu/public");
        if (res.ok) {
          const data = await res.json();
          if (data.categories) setCategories(data.categories);
          if (data.menuItems) setMenuItems(data.menuItems);
        }
      } catch (e) {
        console.warn("Public menu fetch warning:", e);
      } finally {
        setMenuLoading(false);
      }

      // 2. Fetch Active Banners
      try {
        const res = await fetch("/api/offers/active?location=home_top");
        if (res.ok) {
          const data = await res.json();
          if (data.offers && data.offers.length > 0) {
            setPromoOffers(data.offers);
          }
        }
      } catch (e) {
        console.warn("Public offers fetch warning:", e);
      }

      // 3. Fetch Top Reordered Dishes
      try {
        const res = await fetch("/api/menu/top-reordered");
        if (res.ok) {
          const data = await res.json();
          if (data.dishes && data.dishes.length > 0) {
            setTopReorderedDishes(data.dishes);
          }
        }
      } catch (e) {
        console.warn("Top reordered dishes fetch warning:", e);
      }
    }

    // 1. Load public content & initial customer orders
    loadPublicContent();
    syncCustomerOrders();

    // 2. Subscribe to Auth State Changes (fires on login, hydration, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncCustomerOrders(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncCustomerOrders]);

  // Auto Swipe Timer for mobile offers
  useEffect(() => {
    if (isPaused || promoOffers.length === 0) return;
    const interval = setInterval(() => {
      setActiveOfferIndex((prev) => (prev + 1) % promoOffers.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isPaused, promoOffers.length]);

  // Touch Drag / Swipe Handler for mobile offer cards
  const handleOfferDragEnd = (_: any, info: any) => {
    const swipeThreshold = 30;
    if (info.offset.x < -swipeThreshold) {
      // Swiped Left -> Next offer
      setActiveOfferIndex((prev) => (prev + 1) % promoOffers.length);
    } else if (info.offset.x > swipeThreshold) {
      // Swiped Right -> Prev offer
      setActiveOfferIndex((prev) => (prev === 0 ? promoOffers.length - 1 : prev - 1));
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon ${code} copied! Apply at checkout.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Reorder entire past order with live price & availability verification
  const handleReorderEntireOrder = (pastOrder: any) => {
    let addedCount = 0;

    pastOrder.items.forEach((pastItem: any) => {
      // Find item in current live menu items
      const liveItem = menuItems.find(
        (m: any) => m.id === pastItem.item_id || m.name === pastItem.name
      );

      if (!liveItem) {
        toast.error(`"${pastItem.name}" is no longer on the menu`);
        return;
      }

      if (liveItem.is_available === false) {
        toast.error(`"${liveItem.name}" is currently out of stock`);
        return;
      }

      // Check if price changed
      const livePrice = Number(liveItem.price);
      const storedPrice = Number(pastItem.price);
      if (livePrice !== storedPrice) {
        toast.info(`"${liveItem.name}" price updated from ₹${storedPrice} to ₹${livePrice}`);
      }

      // Extract size, extras, spice level
      let size: string | undefined = undefined;
      let extras: string[] | undefined = undefined;
      let spiceLevel: string | undefined = undefined;

      if (Array.isArray(pastItem.customizations)) {
        pastItem.customizations.forEach((c: any) => {
          if (typeof c === "string") {
            if (!extras) extras = [];
            extras.push(c);
          } else if (c && typeof c === "object") {
            const opt = c.option || c.name || "";
            if (c.group === "Size" || opt.includes("inch")) size = opt;
            else if (c.group === "Spice" || ["Spicy", "Medium", "Mild"].includes(opt)) spiceLevel = opt;
            else {
              if (!extras) extras = [];
              extras.push(opt);
            }
          }
        });
      }

      addItem(
        liveItem,
        pastItem.quantity || 1,
        size,
        extras,
        livePrice,
        spiceLevel,
        pastItem.notes
      );
      addedCount += pastItem.quantity || 1;
    });

    if (addedCount > 0) {
      toast.success(`Reordered ${addedCount} item${addedCount > 1 ? "s" : ""} to your cart!`);
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

  // Helper to get total quantity of a specific menu item in cart
  const getItemCartQuantity = useCallback(
    (itemId: string): number => {
      return lines
        .filter((line) => line.item.id === itemId)
        .reduce((sum, line) => sum + line.quantity, 0);
    },
    [lines]
  );

  // Helper to get all cart lines for a specific menu item
  const getItemCartLines = useCallback(
    (itemId: string): any[] => {
      return lines.filter((line) => line.item.id === itemId);
    },
    [lines]
  );

  // Handle increment stepper on menu item card
  const handleIncrementItem = (item: any) => {
    if (item.is_available === false) {
      toast.error(`"${item.name}" is currently out of stock`);
      return;
    }

    const itemLines = getItemCartLines(item.id);
    if (itemLines.length === 0) {
      handleAddClick(item);
      return;
    }

    // Target the most recent cart line for this item
    const targetLine = itemLines[itemLines.length - 1];
    const key = getLineKey(
      targetLine.item,
      targetLine.size,
      targetLine.extras,
      targetLine.spiceLevel,
      targetLine.notes
    );

    const newQty = targetLine.quantity + 1;
    updateQuantity(key, newQty);
    triggerAddedAnimation(item.id);
    toast.success(`Updated ${item.name} (${getItemCartQuantity(item.id) + 1} in cart)`);
  };

  // Handle decrement stepper on menu item card
  const handleDecrementItem = (item: any) => {
    const itemLines = getItemCartLines(item.id);
    if (itemLines.length === 0) return;

    // Target the most recent cart line for this item
    const targetLine = itemLines[itemLines.length - 1];
    const key = getLineKey(
      targetLine.item,
      targetLine.size,
      targetLine.extras,
      targetLine.spiceLevel,
      targetLine.notes
    );

    if (targetLine.quantity > 1) {
      updateQuantity(key, targetLine.quantity - 1);
      toast.info(`Decreased ${item.name} quantity`);
    } else {
      removeItem(key);
      toast.info(`Removed ${item.name} from cart`);
    }
  };

  // Open modal or add directly to cart
  const handleAddClick = async (item: any) => {
    if (item.is_available === false) {
      toast.error(`"${item.name}" is currently out of stock`);
      return;
    }

    if (item.is_customizable) {
      setCustomizingItem(item);
      setSelectedSizeIndex(0);
      setSelectedExtras([]);
      setSelectedSpice("Medium");
      setNotes("");
      setModalQty(1);
      setCustomizationGroups([]);
      setLoadingCustomizations(true);

      try {
        const res = await fetch(`/api/menu/customizations?menu_item_id=${item.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.groups) {
            setCustomizationGroups(data.groups);
          }
        }
      } catch (e) {
        console.warn("Customizations fetch error:", e);
      } finally {
        setLoadingCustomizations(false);
      }
    } else {
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
    let unitPrice = Number(customizingItem.price);

    customizationGroups.forEach((group) => {
      if (group.options) {
        group.options.forEach((opt: any) => {
          if (selectedExtras.includes(opt.name) || selectedExtras.includes(opt.id)) {
            unitPrice += Number(opt.extraPrice || opt.price || 0);
          }
        });
      }
    });

    return unitPrice * modalQty;
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem) return;

    let unitPrice = Number(customizingItem.price);
    customizationGroups.forEach((group) => {
      if (group.options) {
        group.options.forEach((opt: any) => {
          if (selectedExtras.includes(opt.name) || selectedExtras.includes(opt.id)) {
            unitPrice += Number(opt.extraPrice || opt.price || 0);
          }
        });
      }
    });

    addItem(
      customizingItem,
      modalQty,
      undefined,
      selectedExtras,
      unitPrice,
      selectedSpice,
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
  const filtered = menuItems.filter((item) => {
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
    if (sortBy === "popular") return (b.total_orders || 0) - (a.total_orders || 0);
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
            <div className="hidden md:inline-block">
              <LocationAddressSelector />
            </div>
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

      {/* ── Dynamic Touch-Swipeable Offer Banner Carousel ── */}
      {promoOffers.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 md:px-6 -mt-6 relative z-20">
          <OfferBannerCarousel offers={promoOffers} autoPlayInterval={4500} />
        </section>
      )}

      {/* ── Swiggy-Style "Order Again / Past Orders" Section (ONLY when user has past orders) ── */}
      {isAuthenticatedCustomer && pastOrders.length > 0 && (
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
                      Your History ({pastOrders.length})
                    </span>
                  </h2>
                  <p className="text-xs text-stone/70">
                    Repeat your past delicious orders in one tap!
                  </p>
                </div>
              </div>
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
                      <Clock className="w-3 h-3 text-marigold" />
                      {pastOrder.relative_time || "Recently"}
                    </span>
                    <span className="bg-white/10 px-2 py-0.5 rounded-md font-mono text-[10px] text-stone/80 uppercase">
                      {pastOrder.order_type}
                    </span>
                  </div>

                  {/* List of items inside this past order */}
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {Array.isArray(pastOrder.items) &&
                      pastOrder.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          {it.photo ? (
                            <img
                              src={it.photo}
                              alt={it.name}
                              className="w-11 h-11 rounded-xl object-cover border border-white/20 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-marigold flex-shrink-0">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-stone truncate">{it.name}</p>
                            <p className="text-[10px] text-stone/60">
                              {it.quantity}x · ₹{Number(it.price) * Number(it.quantity)}
                              {it.is_available === false && (
                                <span className="text-rose-400 font-semibold ml-1.5">(Out of stock)</span>
                              )}
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
          {(topReorderedDishes.length > 0 ? topReorderedDishes : menuItems.slice(0, 6)).map((item: any) => {
            const isJustAdded = addedItemIds[item.id];

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                className="bg-card border-2 border-amber-500/20 hover:border-amber-500/50 rounded-2xl p-3.5 min-w-[240px] sm:min-w-[270px] max-w-[280px] flex-shrink-0 space-y-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
              >
                <div className="relative h-36 rounded-xl overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={item.photo || item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Reorder Rate Badge */}
                  <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md text-amber-400 font-extrabold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-400/40 shadow-md">
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                    <span>{item.reorder_rate || "Popular Dish"}</span>
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
                      <p className="text-[9px] text-muted-foreground font-medium">{item.reorder_count} orders</p>
                    )}
                  </div>

                  {getItemCartQuantity(item.id) > 0 ? (
                    <div className="flex items-center gap-1.5 bg-accent text-accent-foreground font-extrabold rounded-xl px-2.5 py-1 shadow-md border border-accent/40">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDecrementItem(item);
                        }}
                        className="p-0.5 hover:opacity-80 active:scale-90 transition-transform cursor-pointer"
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-4 text-center font-extrabold tabular-nums text-xs">
                        {getItemCartQuantity(item.id)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIncrementItem(item);
                        }}
                        className="p-0.5 hover:opacity-80 active:scale-90 transition-transform cursor-pointer"
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
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
                  )}
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

            {categories.map((cat) => (
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
          {menuLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-24 h-24 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded-md w-3/4" />
                      <div className="h-3 bg-muted rounded-md w-full" />
                      <div className="h-4 bg-muted rounded-md w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
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
                const isCustomizable = item.is_customizable;
                const isJustAdded = addedItemIds[item.id];
                const isOutOfStock = item.is_available === false;

                return (
                  <motion.div
                    key={item.id}
                    whileHover={isOutOfStock ? {} : { y: -3 }}
                    className={`bg-card border ${
                      item.is_highly_reordered
                        ? "border-amber-500/30 hover:border-amber-500/60"
                        : "border-border hover:border-accent/40"
                    } ${isOutOfStock ? "opacity-75" : ""} rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-4 group relative`}
                  >
                    <div className="flex gap-3.5">
                      {/* Image */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
                        <ImageWithFallback
                          src={item.photo || item.image_url}
                          alt={item.name}
                          className={`w-full h-full object-cover ${isOutOfStock ? "grayscale-[40%]" : "group-hover:scale-105"} transition-transform`}
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center text-rose-300 font-extrabold text-[10px] tracking-wider uppercase">
                            Out of Stock
                          </div>
                        )}
                        {!isOutOfStock && item.is_highly_reordered && (
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
                      {item.has_sufficient_data && item.reorder_rate ? (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {item.reorder_rate}
                        </span>
                      ) : (
                        <span />
                      )}

                      {isOutOfStock ? (
                        <button
                          disabled
                          className="bg-muted text-muted-foreground/50 border border-border px-4 py-1.5 rounded-xl text-xs font-bold cursor-not-allowed"
                        >
                          UNAVAILABLE
                        </button>
                      ) : getItemCartQuantity(item.id) > 0 ? (
                        <div className="flex items-center gap-1.5 bg-accent text-accent-foreground font-extrabold rounded-xl px-2.5 py-1 shadow-md border border-accent/40">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecrementItem(item);
                            }}
                            className="p-1 hover:opacity-80 active:scale-90 transition-transform cursor-pointer"
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center font-extrabold tabular-nums text-xs">
                            {getItemCartQuantity(item.id)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIncrementItem(item);
                            }}
                            className="p-1 hover:opacity-80 active:scale-90 transition-transform cursor-pointer"
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => handleAddClick(item)}
                          className={`font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all ${
                            isJustAdded
                              ? "bg-green-600 text-white shadow-md cursor-pointer"
                              : "bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
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
                      )}
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

                {/* Dynamic Customization Groups from DB */}
                {loadingCustomizations ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span>Loading customization options…</span>
                  </div>
                ) : (
                  customizationGroups.map((group) => (
                    <div key={group.id} className="space-y-3">
                      <h3 className="font-heading text-sm font-bold text-foreground flex items-center justify-between">
                        <span>{group.group_name}</span>
                        {group.is_required && (
                          <span className="text-[10px] text-accent uppercase font-bold tracking-wider">Required</span>
                        )}
                      </h3>
                      <div className="space-y-2">
                        {group.options.map((opt: any) => {
                          const checked = selectedExtras.includes(opt.name) || selectedExtras.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleExtra(opt.name)}
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
                                <span className="text-xs font-medium">{opt.name}</span>
                              </div>
                              {opt.extraPrice > 0 && (
                                <span className="font-bold text-accent">+₹{opt.extraPrice}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
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
