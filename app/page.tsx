"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import Hero from "@/components/Hero";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  ArrowRight,
  Check,
  MapPin,
  Clock,
  ChevronRight,
  Search,
  Filter,
  Star,
  Menu as MenuIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { supabase, type Category, type MenuItem, type OrderType } from "@/lib/supabase";
import { useCart, getLineKey } from "@/lib/cart-context";
import CustomerUserMenu from "@/components/CustomerUserMenu";

// ── Types ─────────────────────────────────────────────────────────────────────

type PageView = "home" | "menu" | "story";

interface SizeOption {
  label: string;
  extra: number;
}
interface ExtraOption {
  label: string;
  price: number;
}

const DEFAULT_SIZES: SizeOption[] = [
  { label: "Regular", extra: 0 },
  { label: "Medium", extra: 60 },
  { label: "Large", extra: 120 },
];

const DEFAULT_EXTRAS: ExtraOption[] = [
  { label: "Extra Cheese", price: 40 },
  { label: "Special Sauce / Dip", price: 25 },
  { label: "Jalapeños & Olives", price: 30 },
];

// Default fallback categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-bev", name: "Beverages", display_order: 1 },
  { id: "cat-snk", name: "Snacks", display_order: 2 },
  { id: "cat-mls", name: "Meals", display_order: 3 },
  { id: "cat-des", name: "Desserts", display_order: 4 },
];

// Default fallback menu items with high resolution Unsplash photos
const DEFAULT_ITEMS: (MenuItem & { photo?: string; sizes?: SizeOption[]; extras?: ExtraOption[] })[] = [
  {
    id: "item-1",
    category_id: "cat-bev",
    name: "Masala Chai",
    description: "Cardamom, ginger, local single-estate tea, velvety steamed milk",
    price: 20,
    image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
  },
  {
    id: "item-2",
    category_id: "cat-bev",
    name: "Cold Coffee with Ice Cream",
    description: "18-hour slow-steeped espresso blend poured over vanilla ice cream",
    price: 80,
    image_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
    sizes: DEFAULT_SIZES,
    extras: DEFAULT_EXTRAS,
  },
  {
    id: "item-3",
    category_id: "cat-snk",
    name: "Veg Grilled Sandwich",
    description: "Crispy grilled sandwich with spiced mint chutney, cheese & fresh veggies",
    price: 60,
    image_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=400&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
    extras: DEFAULT_EXTRAS,
  },
  {
    id: "item-4",
    category_id: "cat-snk",
    name: "Classic Masala Maggi",
    description: "Hill-station style masala Maggi with sweet corn & crushed herbs",
    price: 50,
    image_url: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
    extras: [{ label: "Extra Cheese", price: 30 }, { label: "Add Butter", price: 15 }],
  },
  {
    id: "item-5",
    category_id: "cat-mls",
    name: "Special Veg Thali",
    description: "Dal makhani, paneer butter masala, 3 butter rotis, fragrant rice, salad & sweet",
    price: 150,
    image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
  },
  {
    id: "item-6",
    category_id: "cat-mls",
    name: "Chicken Thali",
    description: "Himachali chicken curry, aromatic basmati rice, tandoori rotis & salad",
    price: 220,
    image_url: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop&auto=format&q=80",
    is_veg: false,
    is_available: true,
  },
  {
    id: "item-7",
    category_id: "cat-des",
    name: "Gulab Jamun (2 pcs)",
    description: "Warm, soft gulab jamun soaked in cardamom rose syrup",
    price: 40,
    image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop&auto=format&q=80",
    is_veg: true,
    is_available: true,
    extras: [{ label: "Ice Cream Scoop", price: 40 }],
  },
];

// Helper to get fallback photo by item name/category
function getItemPhoto(item: MenuItem): string {
  if (item.image_url) return item.image_url;
  const name = item.name.toLowerCase();
  if (name.includes("chai") || name.includes("tea")) {
    return "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop&auto=format&q=80";
  }
  if (name.includes("coffee")) {
    return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop&auto=format&q=80";
  }
  if (name.includes("sandwich")) {
    return "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=400&fit=crop&auto=format&q=80";
  }
  if (name.includes("maggi") || name.includes("noodle")) {
    return "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop&auto=format&q=80";
  }
  if (name.includes("thali") || name.includes("meal")) {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop&auto=format&q=80";
  }
  if (name.includes("jamun") || name.includes("dessert") || name.includes("cake")) {
    return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop&auto=format&q=80";
  }
  return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop&auto=format&q=80";
}

// ── VegDot Indicator Component ────────────────────────────────────────────────

function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <div
      className={`w-[18px] h-[18px] rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${isVeg ? "border-green-600" : "border-red-700"
        }`}
      title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
    >
      <div className={`w-[8px] h-[8px] rounded-full ${isVeg ? "bg-green-600" : "bg-red-700"}`} />
    </div>
  );
}

// ── Decorative Mountain Ridge Divider ─────────────────────────────────────────

function DecorativeDivider() {
  return (
    <div className="flex justify-center items-center py-8 px-6 overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 560 36" className="w-full max-w-sm" fill="none">
        <line x1="0" y1="18" x2="195" y2="18" stroke="#C4852A" strokeWidth="0.75" strokeOpacity="0.3" />
        <polyline
          points="195,18 215,6 233,13 255,1 275,18 295,1 315,13 335,6 355,18"
          stroke="#C4852A"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
        <polygon
          points="275,1 280,7 275,13 270,7"
          fill="#C4852A"
          fillOpacity="0.25"
          stroke="#C4852A"
          strokeWidth="0.8"
          strokeOpacity="0.65"
        />
        <circle cx="275" cy="7" r="1.8" fill="#C4852A" fillOpacity="0.75" />
        <circle cx="195" cy="18" r="2.5" fill="#C4852A" fillOpacity="0.4" />
        <circle cx="355" cy="18" r="2.5" fill="#C4852A" fillOpacity="0.4" />
        <line x1="355" y1="18" x2="560" y2="18" stroke="#C4852A" strokeWidth="0.75" strokeOpacity="0.3" />
      </svg>
    </div>
  );
}

// ── ItemDetailModal ───────────────────────────────────────────────────────────

function ItemDetailModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem & { sizes?: SizeOption[]; extras?: ExtraOption[] };
  onClose: () => void;
  onAdd: (item: MenuItem, qty: number, size?: string, extras?: string[], unitPrice?: number) => void;
}) {
  const sizes = item.sizes || (item.name.toLowerCase().includes("coffee") ? DEFAULT_SIZES : undefined);
  const extras = item.extras || DEFAULT_EXTRAS;

  const defaultSize = sizes?.[0]?.label ?? "";
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  function computeUnitPrice(): number {
    const sizeExtra = sizes?.find((s) => s.label === selectedSize)?.extra ?? 0;
    const extrasTotal = selectedExtras.reduce((sum, lbl) => {
      return sum + (extras?.find((e) => e.label === lbl)?.price ?? 0);
    }, 0);
    return item.price + sizeExtra + extrasTotal;
  }

  function computeTotal(): number {
    return computeUnitPrice() * qty;
  }

  function toggleExtra(label: string) {
    setSelectedExtras((prev) =>
      prev.includes(label) ? prev.filter((e) => e !== label) : [...prev, label]
    );
  }

  function handleAdd() {
    onAdd(item, qty, selectedSize || undefined, selectedExtras, computeUnitPrice());
    toast.success(`Added ${qty}× ${item.name} to cart!`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 bg-card w-full md:w-[480px] md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Item image */}
        <div className="relative h-56 bg-muted overflow-hidden md:rounded-t-3xl rounded-t-3xl flex-shrink-0">
          <ImageWithFallback
            src={getItemPhoto(item)}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name & description */}
          <div className="flex items-start gap-2.5">
            <div className="mt-1">
              <VegDot isVeg={item.is_veg} />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground leading-tight">{item.name}</h2>
              {item.description && (
                <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">{item.description}</p>
              )}
            </div>
          </div>

          {/* Size options */}
          {sizes && sizes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2.5">Choose Size</p>
              <div className="flex gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setSelectedSize(s.label)}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${selectedSize === s.label
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background border-border text-foreground hover:border-primary/40"
                      }`}
                  >
                    <span className="block">{s.label}</span>
                    {s.extra > 0 && (
                      <span className={`block text-xs mt-0.5 ${selectedSize === s.label ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        +₹{s.extra}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extras options */}
          {extras && extras.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2.5">Add Extras</p>
              <div className="space-y-2">
                {extras.map((ex) => {
                  const checked = selectedExtras.includes(ex.label);
                  return (
                    <label
                      key={ex.label}
                      className="flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? "bg-primary border-primary" : "border-border"
                            }`}
                        >
                          {checked && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm text-foreground">{ex.label}</span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleExtra(ex.label)}
                        />
                      </div>
                      {ex.price > 0 && <span className="text-sm text-muted-foreground">+₹{ex.price}</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Qty + Add CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-semibold w-5 text-center tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              className="bg-accent text-accent-foreground px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-md"
            >
              Add to Cart · ₹{computeTotal()}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── CartDrawer Slide-over ─────────────────────────────────────────────────────

function CartDrawer({
  onClose,
}: {
  onClose: () => void;
}) {
  const { lines, removeItem, updateQuantity, total } = useCart();
  const isEmpty = lines.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 bg-card w-full max-w-sm h-full flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold text-foreground">Your Cart</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <ShoppingBag className="w-14 h-14 text-muted-foreground/20 mb-4" />
              <p className="font-heading text-xl text-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1.5">Add delicious items to get started.</p>
            </div>
          ) : (
            lines.map((l) => {
              const key = getLineKey(l.item, l.size, l.extras);
              const uPrice = l.unitPrice ?? l.item.price;
              const sub = l.subtotal ?? uPrice * l.quantity;

              return (
                <div key={key} className="flex gap-3 py-2 border-b border-border/40 last:border-0">
                  <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={getItemPhoto(l.item)}
                      alt={l.item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight truncate">
                          {l.item.name}
                        </p>
                        {l.size && (
                          <p className="text-xs text-muted-foreground mt-0.5">Size: {l.size}</p>
                        )}
                        {l.extras && l.extras.length > 0 && (
                          <p className="text-xs text-muted-foreground leading-relaxed truncate">
                            + {l.extras.join(", ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(key)}
                        className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 mt-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(key, l.quantity - 1)}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center tabular-nums">{l.quantity}</span>
                        <button
                          onClick={() => updateQuantity(key, l.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-foreground tabular-nums">₹{sub}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="px-5 py-5 border-t border-border space-y-4 bg-muted/20">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Subtotal</span>
              <span className="font-semibold text-foreground tabular-nums text-lg">₹{total}</span>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md text-center block"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-muted-foreground text-center">
              Taxes & delivery fees calculated at checkout
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Top Navigation Bar Component ──────────────────────────────────────────────

function Navbar({
  page,
  setPage,
  cartCount,
  setCartOpen,
}: {
  page: PageView;
  setPage: (p: PageView) => void;
  cartCount: number;
  setCartOpen: (o: boolean) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const { total } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 25);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      const p = localStorage.getItem("celebration_customer_profile");
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed.name) setCustomerName(parsed.name);
      }
    } catch (e) {}
  }, []);

  const isSolid = scrolled || page !== "home";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#121110]/90 text-stone backdrop-blur-xl border-b border-white/10 shadow-lg transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo & Location Tag */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setPage("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 text-left focus:outline-none group flex-shrink-0"
          >
            <img
              src="/images/logos/logo.svg"
              alt="Celebration Food Cafe"
              className="h-11 md:h-13 w-auto object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            />
            <span className="sr-only">Celebration Food Cafe</span>
          </button>

          <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-marigold bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <MapPin className="w-3 h-3 text-marigold" />
            Hamirpur, HP
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-10">
          {[
            { id: "home", label: "Home" },
            { id: "menu", label: "Menu" },
            { id: "story", label: "Our Story" },
          ].map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id as PageView);
                  if (item.id === "menu") {
                    const el = document.getElementById("menu-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`relative text-xs font-bold uppercase tracking-[0.15em] transition-colors py-1.5 px-3.5 rounded-full ${
                  active
                    ? "text-pineDark bg-marigold shadow-md font-extrabold"
                    : "text-stone/90 hover:text-marigold hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: User Login / Profile Avatar + Cart Pill + Mobile Toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <CustomerUserMenu />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCartOpen(true)}
            className="bg-marigold text-pineDark hover:bg-marigoldLight px-5 py-2.5 rounded-full font-extrabold text-xs flex items-center gap-2 shadow-xl transition-all"
          >
            <div className="relative flex items-center">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 w-4 h-4 bg-maroon text-white text-[9px] font-bold rounded-full flex items-center justify-center tabular-nums shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span>Cart</span>
            {total > 0 && <span className="hidden sm:inline font-bold">· ₹{total}</span>}
          </motion.button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-stone hover:bg-white/10 transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-marigold" /> : <MenuIcon className="w-6 h-6 text-stone" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-pine text-stone border-t border-marigold/20 px-6 py-5 shadow-2xl space-y-4"
          >
            <div className="flex flex-col space-y-3">
              {[
                { id: "home", label: "Home" },
                { id: "menu", label: "Explore Menu" },
                { id: "story", label: "Our Story" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPage(item.id as PageView);
                    setMobileMenuOpen(false);
                    if (item.id === "menu") {
                      const el = document.getElementById("menu-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    } else {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`text-left text-base font-medium py-2 border-b border-stone/10 last:border-0 ${page === item.id ? "text-marigold font-semibold" : "text-stone/90 hover:text-marigold"
                    }`}
                >
                  {item.label}
                </button>
              ))}

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-left text-base font-medium py-2 text-marigold flex items-center justify-between"
              >
                <span>Customer Login</span>
                <span>→</span>
              </Link>
            </div>

            <div className="pt-2 text-xs text-stone/70 space-y-1">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-marigold" /> Main Bazar Road, Hamirpur, HP
              </p>
              <p className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-marigold" /> Open Daily: 9 AM – 10 PM
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function MenuPage() {
  const [page, setPage] = useState<PageView>("home");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Modal
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const { addItem, itemCount } = useCart();

  useEffect(() => {
    async function load() {
      try {
        const [{ data: cats }, { data: menu }] = await Promise.all([
          supabase.from("categories").select("*").order("display_order"),
          supabase.from("menu_items").select("*").eq("is_available", true),
        ]);
        setCategories(cats && cats.length > 0 ? cats : DEFAULT_CATEGORIES);
        setItems(menu && menu.length > 0 ? menu : DEFAULT_ITEMS);
      } catch {
        setCategories(DEFAULT_CATEGORIES);
        setItems(DEFAULT_ITEMS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filtered menu items
  const filteredItems = items.filter((item) => {
    if (vegOnly && !item.is_veg) return false;
    if (selectedCategory !== "all") {
      const cat = categories.find((c) => c.id === item.category_id || c.name === selectedCategory);
      if (cat && cat.id !== item.category_id && cat.name !== selectedCategory) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-background text-foreground pb-24 overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        page={page}
        setPage={setPage}
        cartCount={itemCount}
        setCartOpen={setCartOpen}
      />

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
      </AnimatePresence>

      {/* Item Customization Modal */}
      <AnimatePresence>
        {modalItem && (
          <ItemDetailModal
            item={modalItem}
            onClose={() => setModalItem(null)}
            onAdd={(item, qty, size, extras, unitPrice) => {
              addItem(item, qty, size, extras, unitPrice);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── HOME VIEW ── */}
      {page === "home" && (
        <Hero
          onExploreMenu={() => {
            const el = document.getElementById("menu-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          onOrderNow={() => {
            const el = document.getElementById("menu-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}

      {/* ── STORY VIEW ── */}
      {page === "story" && (
        <section className="pt-24 max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <p className="text-accent text-xs font-semibold tracking-[0.2em] uppercase mb-2">Our Story</p>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">Celebration Food Cafe</h1>
            <p className="text-muted-foreground text-base mt-3 max-w-lg mx-auto">
              Bringing happiness and authentic taste to Hamirpur since 2018.
            </p>
          </div>

          <div className="space-y-8 text-foreground/80 leading-relaxed text-base">
            <div className="aspect-video rounded-3xl overflow-hidden bg-muted shadow-md mb-8">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop&auto=format&q=80"
                alt="Cafe ambience"
                className="w-full h-full object-cover"
              />
            </div>
            <p>
              Located on Main Bazar Road in Hamirpur, Celebration Food Cafe is built on a passion for comforting food and warm hospitality. Whether you are stopping by for a quick Masala Chai or ordering a feast for family and friends, we prepare every item with carefully selected ingredients.
            </p>
            <p>
              Our menu offers something for everyone, from vegetarian thalis and classic Indian snacks to special beverages and handcrafted desserts. We are open daily from 9:00 AM to 10:00 PM for dine-in, pickup, and delivery across Hamirpur.
            </p>
          </div>
        </section>
      )}

      {/* ── MENU VIEW ── */}
      {(page === "menu" || page === "home") && (
        <section id="menu-section" className={`${page === "home" ? "pt-4" : "pt-24"} max-w-5xl mx-auto px-4`}>
          <div className="text-center mb-6">
            <p className="text-accent text-xs font-semibold tracking-[0.2em] uppercase mb-2">Fresh & Delicious</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Explore Our Menu</h2>
          </div>

          {/* Search & Veg Filter */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-6">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search dishes or beverages…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition ${vegOnly
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-card text-foreground border-border hover:border-green-600"
                  }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Veg Only
              </button>

              {/* Category tabs */}
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition ${selectedCategory === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border"
                  }`}
              >
                All
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition ${selectedCategory === cat.name
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border"
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          {loading ? (
            <p className="text-center text-muted-foreground py-16">Loading menu items…</p>
          ) : filteredItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <p className="font-heading text-lg text-foreground">No dishes found</p>
              <p className="text-sm mt-1">Try clearing filters or searching for something else.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-card rounded-2xl border border-border p-4 shadow-xs flex items-center justify-between gap-4"
                >
                  <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden flex-shrink-0 relative">
                    <ImageWithFallback
                      src={getItemPhoto(item)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <VegDot isVeg={item.is_veg} />
                      <h3 className="font-heading text-base font-semibold text-foreground truncate">
                        {item.name}
                      </h3>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-primary">₹{item.price}</p>
                  </div>

                  <button
                    onClick={() => setModalItem(item)}
                    className="bg-accent text-accent-foreground px-4 py-2 rounded-xl font-medium text-xs hover:opacity-90 transition flex-shrink-0 shadow-xs"
                  >
                    Add +
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sticky Cart Bar (Mobile/Bottom) */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 pointer-events-auto max-w-lg mx-auto">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-primary text-primary-foreground rounded-2xl px-5 py-3.5 shadow-xl flex items-center justify-between hover:bg-pineDark transition"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-accent" />
              <span className="font-medium text-sm">
                {itemCount} item{itemCount > 1 ? "s" : ""} in cart
              </span>
            </div>
            <span className="font-semibold text-accent text-sm">View Cart →</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8 text-sm">
            <div>
              <img
                src="/images/logos/logo.svg"
                alt="Celebration Food Cafe"
                className="h-10 w-auto object-contain mb-3"
              />
              <p className="text-muted-foreground leading-relaxed">
                Celebration Food Cafe. Hamirpur's favourite cafe serving fresh pizza, burgers, thalis, teas, and sweets.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Address & Hours</p>
              <p className="flex items-start gap-2 text-muted-foreground mb-2">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                Main Bazar Road, Hamirpur, Himachal Pradesh 177001
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                Open Daily: 9:00 AM – 10:00 PM
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-3">Order Online</p>
              <p className="text-muted-foreground mb-3">
                Order for dine-in, pickup, or home delivery directly through our web app.
              </p>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Celebration Food Cafe. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
