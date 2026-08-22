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
import { supabase, type Category, type MenuItem, type OrderType, type ItemCustomization } from "@/lib/supabase";
import { useCart, getLineKey } from "@/lib/cart-context";
import CustomerUserMenu from "@/components/CustomerUserMenu";
import { LocationAddressSelector } from "@/components/LocationAddressSelector";
import AnimatedBackground from "@/components/ui/animated-background";
import { BorderTrail } from "@/components/ui/border-trail";

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
  const [dbGroups, setDbGroups] = useState<ItemCustomization[]>([]);
  const [dbSelections, setDbSelections] = useState<Record<string, string[]>>({}); // group_id -> selected option labels

  const sizes = item.sizes || (item.name.toLowerCase().includes("coffee") ? DEFAULT_SIZES : undefined);
  const extras = item.extras || DEFAULT_EXTRAS;

  const defaultSize = sizes?.[0]?.label ?? "";
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  // Fetch DB Customizations if any exist
  useEffect(() => {
    async function loadDbCustomizations() {
      try {
        const { data: groups } = await supabase
          .from("item_customizations")
          .select("*, options:customization_options(*)")
          .eq("menu_item_id", item.id)
          .order("sort_order");

        if (groups && groups.length > 0) {
          setDbGroups(groups as ItemCustomization[]);
          const initialSelections: Record<string, string[]> = {};
          groups.forEach((g: any) => {
            if (g.options && g.options.length > 0) {
              if (g.is_required || g.max_select === 1) {
                initialSelections[g.id] = [g.options[0].label];
              } else {
                initialSelections[g.id] = [];
              }
            }
          });
          setDbSelections(initialSelections);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadDbCustomizations();
  }, [item.id]);

  function computeUnitPrice(): number {
    if (dbGroups.length > 0) {
      let extraTotal = 0;
      dbGroups.forEach((g) => {
        const selected = dbSelections[g.id] || [];
        g.options?.forEach((opt: any) => {
          if (selected.includes(opt.label)) {
            extraTotal += Number(opt.extra_price || 0);
          }
        });
      });
      return item.price + extraTotal;
    }

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

  function toggleDbOption(groupId: string, optLabel: string, maxSelect: number) {
    setDbSelections((prev) => {
      const current = prev[groupId] || [];
      if (maxSelect === 1) {
        return { ...prev, [groupId]: [optLabel] };
      }
      if (current.includes(optLabel)) {
        return { ...prev, [groupId]: current.filter((l) => l !== optLabel) };
      }
      if (current.length >= maxSelect) {
        toast.error(`Maximum ${maxSelect} option(s) allowed`);
        return prev;
      }
      return { ...prev, [groupId]: [...current, optLabel] };
    });
  }

  function handleAdd() {
    let sizeStr = selectedSize || undefined;
    let extraList: string[] = [...selectedExtras];

    if (dbGroups.length > 0) {
      const allSelected: string[] = [];
      dbGroups.forEach((g) => {
        const selected = dbSelections[g.id] || [];
        selected.forEach((lbl) => {
          allSelected.push(`${g.group_name}: ${lbl}`);
        });
      });
      extraList = allSelected;
    }

    onAdd(item, qty, sizeStr, extraList, computeUnitPrice());
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
        className="relative z-10 bg-card w-full md:w-[480px] md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 overflow-hidden"
      >
        <BorderTrail
          size={150}
          className="bg-gradient-to-r from-marigold via-amber-400 to-marigold opacity-70"
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: "linear",
          }}
        />
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

          {/* DYNAMIC DB CUSTOMIZATION GROUPS */}
          {dbGroups.length > 0 ? (
            <div className="space-y-4">
              {dbGroups.map((group) => {
                const selectedLabels = dbSelections[group.id] || [];

                return (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                      <span>{group.group_name}</span>
                      {group.is_required && (
                        <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Required
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {group.options?.map((opt: any) => {
                        const isSelected = selectedLabels.includes(opt.label);

                        return (
                          <div
                            key={opt.id}
                            onClick={() => toggleDbOption(group.id, opt.label, group.max_select)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5 text-foreground shadow-xs font-medium"
                                : "border-border hover:border-primary/40 text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="text-sm">{opt.label}</span>
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {opt.extra_price > 0 ? `+₹${opt.extra_price}` : "Free"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {/* Fallback Static Size options */}
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

              {/* Fallback Static Extras options */}
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
            </>
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
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="relative z-10 bg-[#FAF7F0] text-[#2A1508] w-full max-w-sm h-full flex flex-col shadow-2xl border-l border-[#1F3B2C]/15"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F3B2C]/15 bg-[#FAF7F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#C4622D]/15 border border-[#C4622D]/30 flex items-center justify-center text-[#C4622D]">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h2 className="font-heading text-xl font-black text-[#2A1508]">Your Cart</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#6B4226] hover:bg-[#1F3B2C]/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3.5 custom-scrollbar">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 rounded-full bg-[#C4622D]/10 flex items-center justify-center text-[#C4622D]/40 mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-heading text-xl font-bold text-[#2A1508]">Your cart is empty</p>
              <p className="text-sm text-[#6B4226]/80 mt-1.5 font-medium">Explore our menu and add delicious items!</p>
            </div>
          ) : (
            lines.map((l) => {
              const key = getLineKey(l.item, l.size, l.extras);
              const uPrice = l.unitPrice ?? l.item.price;
              const sub = l.subtotal ?? uPrice * l.quantity;

              return (
                <div
                  key={key}
                  className="flex gap-3.5 p-3.5 rounded-2xl bg-[#F5EFE6] border border-[#1F3B2C]/10 shadow-xs relative"
                >
                  <div className="w-16 h-16 rounded-xl bg-[#FAF7F0] overflow-hidden flex-shrink-0 relative border border-[#1F3B2C]/10">
                    <ImageWithFallback
                      src={getItemPhoto(l.item)}
                      alt={l.item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-heading font-bold text-[#2A1508] leading-tight truncate">
                          {l.item.name}
                        </p>
                        {l.size && (
                          <p className="text-xs text-[#6B4226]/80 mt-0.5 font-medium">Size: {l.size}</p>
                        )}
                        {l.extras && l.extras.length > 0 && (
                          <p className="text-xs text-[#6B4226]/80 leading-relaxed truncate font-medium">
                            + {l.extras.join(", ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(key)}
                        className="text-[#6B4226]/60 hover:text-red-600 transition-colors flex-shrink-0 mt-0.5"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(key, l.quantity - 1)}
                          className="w-7 h-7 rounded-full border border-[#1F3B2C]/20 bg-[#FAF7F0] text-[#2A1508] flex items-center justify-center hover:bg-[#C4622D] hover:text-[#F4E4C0] hover:border-[#C4622D] transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </motion.button>
                        <span className="text-xs font-heading font-extrabold w-4 text-center tabular-nums text-[#2A1508]">
                          {l.quantity}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(key, l.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-[#C4622D] text-[#F4E4C0] flex items-center justify-center hover:brightness-110 transition-all shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </motion.button>
                      </div>

                      <p className="font-heading font-extrabold text-sm text-[#C4852A] tabular-nums">
                        ₹{sub}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="px-6 py-5 border-t border-[#1F3B2C]/15 space-y-4 bg-[#F5EFE6]">
            <div className="flex justify-between items-center">
              <span className="text-[#6B4226] font-medium text-sm">Subtotal</span>
              <span className="font-heading font-extrabold text-[#C4852A] tabular-nums text-xl">₹{total}</span>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-full flex items-center justify-center gap-2 hover:brightness-110 transition shadow-[0_6px_20px_rgba(196,98,45,0.38)] text-center block"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <p className="text-[11px] text-[#6B4226]/75 text-center font-medium">
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
  const { total } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 25);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full bg-[#3B4A2F]/95 text-[#F4E4C0] backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "border-b border-white/10 shadow-lg" : "border-b border-transparent shadow-none"
      }`}
    >
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
              className="h-10 md:h-12 w-auto object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            />
            <span className="sr-only">Celebration Food Cafe</span>
          </button>

          <div className="hidden lg:inline-block">
            <LocationAddressSelector />
          </div>
        </div>
        {/* Desktop Navigation Links with AnimatedBackground */}
        <nav className="hidden md:flex items-center">
          <AnimatedBackground
            defaultValue={page}
            className="bg-[#C4622D] shadow-md shadow-[#C4622D]/35"
            transition={{
              type: "spring",
              bounce: 0.15,
              duration: 0.35,
            }}
            enableHover
          >
            {[
              { id: "home", label: "HOME" },
              { id: "menu", label: "MENU" },
              { id: "story", label: "OUR STORY" },
            ].map((item) => (
              <motion.button
                key={item.id}
                data-id={item.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setPage(item.id as PageView);
                  if (item.id === "menu") {
                    const el = document.getElementById("menu-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`px-5 py-2 text-xs font-heading font-extrabold tracking-[0.18em] uppercase whitespace-nowrap transition-colors duration-200 ${
                  page === item.id ? "text-[#F4E4C0]" : "text-[#F4E4C0]/85 hover:text-white"
                }`}
              >
                {item.label}
              </motion.button>
            ))}
          </AnimatedBackground>
        </nav>

        {/* Right Actions: Hours + User Login / Profile Avatar + Cart Pill */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden xl:block text-[11px] font-semibold tracking-wider text-[#F4E4C0]/80 uppercase">
            Open 8am – 10pm
          </div>

          <CustomerUserMenu />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCartOpen(true)}
            className="bg-[#C4622D] text-[#F4E4C0] hover:brightness-110 px-5 py-2.5 rounded-full font-extrabold text-xs flex items-center gap-2 shadow-xl transition-all"
          >
            <div className="relative flex items-center">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 w-4 h-4 bg-[#8B4D2A] text-white text-[9px] font-bold rounded-full flex items-center justify-center tabular-nums shadow-xs">
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
        <div className="pt-20 pb-20">
          {/* 1. Story Hero Banner with Organic Top Wave & Earthy Cream Canvas */}
          <section className="relative bg-[#F4E4C0] text-[#2A1508] pt-16 pb-24 px-4 sm:px-6 overflow-hidden">
            {/* Background Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(80px,16vw,260px)] font-heading font-black text-[#2A1508]/[0.04] select-none pointer-events-none whitespace-nowrap uppercase tracking-tighter">
              OUR STORY
            </div>

            <div className="max-w-5xl mx-auto text-center relative z-10">
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-[#8B4D2A] text-xs font-heading font-extrabold tracking-[0.28em] uppercase mb-3"
              >
                OUR HERITAGE & PASSION
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-[#2A1508] tracking-tight leading-[1.08] mb-6 max-w-3xl mx-auto"
              >
                Crafting Unforgettable Flavors in Hamirpur Since 2018
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[#6B4226]/90 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium mb-8"
              >
                From a humble tea corner to Hamirpur's favorite dining destination — built on a passion for comforting food, fresh local ingredients, and warm Himalayan hospitality.
              </motion.p>

              {/* Established Badge Pill */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-flex items-center gap-2.5 bg-[#FAF7F0] backdrop-blur-md px-6 py-2.5 rounded-full border border-[#C4622D]/35 shadow-[0_6px_22px_rgba(42,21,8,0.18)]"
              >
                <div className="flex items-center gap-1 text-[#E8A93B]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#E8A93B]" />
                  ))}
                </div>
                <span className="font-heading font-extrabold text-xs tracking-wider uppercase text-[#2A1508]">
                  ESTD. 2018 · HAMIRPUR, HP
                </span>
              </motion.div>
            </div>

            {/* Story Hero Image Showcase */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-5xl mx-auto mt-12 relative z-10"
            >
              <div className="aspect-[21/9] rounded-3xl overflow-hidden bg-[#F5EFE6] shadow-[0_20px_45px_rgba(42,21,8,0.22)] border-2 border-white/40 relative group">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&h=700&fit=crop&auto=format&q=80"
                  alt="Celebration Food Cafe Warm Ambience"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <span className="text-[#F4E4C0] text-xs font-heading font-extrabold tracking-widest uppercase bg-[#C4622D] px-3.5 py-1 rounded-full border border-white/20">
                      Main Bazar Road
                    </span>
                    <h3 className="font-heading text-xl sm:text-2xl font-bold mt-2 text-white">
                      Where Friends & Flavors Meet
                    </h3>
                  </div>
                  <p className="text-white/80 text-xs sm:text-sm font-medium">Open Daily 9:00 AM – 10:00 PM</p>
                </div>
              </div>
            </motion.div>

            {/* Bottom Terracotta Wave Transition */}
            <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-0">
              <svg
                className="relative block w-full h-10 md:h-16 text-[#8B4D2A]"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                fill="currentColor"
              >
                <path d="M0,0 C150,90 350,-40 500,45 C650,120 900,10 1200,50 L1200,120 L0,120 Z" />
              </svg>
            </div>
          </section>

          {/* 2. Impact Stats & Milestones Grid */}
          <section className="bg-[#FAF7F0] py-16 px-4 sm:px-6 relative z-10 border-b border-[#1F3B2C]/10">
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[
                { number: "2018", label: "Year Established", sub: "Main Bazar Road" },
                { number: "50,000+", label: "Happy Guests", sub: "Served with smile" },
                { number: "100%", label: "Fresh Ingredients", sub: "Locally sourced" },
                { number: "4.9 ★", label: "Average Rating", sub: "2,400+ Reviews" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-[#F5EFE6] rounded-3xl p-6 text-center border border-[#1F3B2C]/10 shadow-md hover:shadow-xl transition-all"
                >
                  <p className="font-heading font-black text-3xl sm:text-4xl text-[#C4852A] mb-1">
                    {stat.number}
                  </p>
                  <p className="font-heading font-extrabold text-xs sm:text-sm text-[#2A1508] tracking-wider uppercase">
                    {stat.label}
                  </p>
                  <p className="text-xs text-[#6B4226]/80 mt-1 font-medium">{stat.sub}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* 3. Timeline / Our Journey Chapters (Scroll-Triggered Reveals) */}
          <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[#8B4D2A] text-xs font-heading font-extrabold tracking-[0.24em] uppercase mb-2">
                THE JOURNEY
              </p>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-[#2A1508]">
                How We Built Celebration Cafe
              </h2>
            </div>

            <div className="space-y-16">
              {[
                {
                  chapter: "CHAPTER 01",
                  year: "2018",
                  title: "A Humble Corner with Big Dreams",
                  description:
                    "Celebration Food Cafe started as a cozy tea and snack nook in Hamirpur market. Driven by a simple vision — serving piping hot Masala Chai, freshly made samosas, and comforting sandwiches with genuine warmth.",
                  image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=500&fit=crop&auto=format&q=80",
                },
                {
                  chapter: "CHAPTER 02",
                  year: "2020",
                  title: "Expanding Our Artisan Kitchen",
                  description:
                    "Listening to our growing cafe family, we expanded our kitchen menu to introduce handcrafted wood-fired pizzas, gourmet burgers, sizzling starters, and full Himachali & Indian thali platters.",
                  image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop&auto=format&q=80",
                },
                {
                  chapter: "CHAPTER 03",
                  year: "PRESENT DAY",
                  title: "Hamirpur’s Favorite Gathering Spot",
                  description:
                    "Today, Celebration Cafe is a vibrant community hub where students study over cold brews, families celebrate birthdays, and friends share laughter over memorable meals — online or in person.",
                  image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=500&fit=crop&auto=format&q=80",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={`grid md:grid-cols-2 gap-8 items-center ${
                    idx % 2 === 1 ? "md:grid-flow-dense" : ""
                  }`}
                >
                  <div className={idx % 2 === 1 ? "md:col-start-2" : ""}>
                    <div className="inline-flex items-center gap-2 text-[#C4622D] font-heading font-extrabold text-xs tracking-widest uppercase mb-2">
                      <span className="px-3 py-1 rounded-full bg-[#C4622D]/15 border border-[#C4622D]/30">
                        {item.chapter}
                      </span>
                      <span>· {item.year}</span>
                    </div>
                    <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#2A1508] mb-3 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[#6B4226] text-sm sm:text-base leading-relaxed font-medium">
                      {item.description}
                    </p>
                  </div>

                  <div className={`aspect-[4/3] rounded-3xl overflow-hidden bg-[#F5EFE6] border border-[#1F3B2C]/10 shadow-xl group ${
                    idx % 2 === 1 ? "md:col-start-1" : ""
                  }`}>
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* 4. Bottom Call-To-Action Container */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-12">
            <div className="bg-[#1F3B2C] text-[#F4E4C0] rounded-3xl p-10 lg:p-14 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4622D]/20 rounded-full filter blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-xl mx-auto">
                <p className="text-[#E8A93B] text-xs font-heading font-extrabold tracking-[0.24em] uppercase mb-2">
                  JOIN OUR TABLE
                </p>
                <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#F4E4C0] mb-4">
                  Taste the Tradition Today
                </h3>
                <p className="text-[#F4E4C0]/85 text-sm sm:text-base font-medium leading-relaxed mb-8">
                  Dine in with us on Main Bazar Road or order online for direct delivery to your doorstep in Hamirpur.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setPage("menu");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-[0_6px_24px_rgba(196,98,45,0.42)] hover:brightness-110 transition flex items-center gap-2 mx-auto"
                >
                  <span>Explore Menu & Order</span>
                  <span>→</span>
                </motion.button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── MENU VIEW ── */}
      {/* ── MENU VIEW ── */}
      {(page === "menu" || page === "home") && (
        <section id="menu-section" className={`${page === "home" ? "pt-12" : "pt-28"} max-w-6xl mx-auto px-4 sm:px-6 pb-16`}>
          <div className="text-center mb-10">
            <p className="text-[#8B4D2A] text-xs font-heading font-extrabold tracking-[0.24em] uppercase mb-2">
              Fresh & Authentic
            </p>
            <h2 className="font-heading text-4xl md:text-5xl font-black text-[#2A1508] tracking-tight">
              Explore Our Menu
            </h2>
            <p className="text-[#6B4226]/85 text-sm md:text-base mt-2 max-w-lg mx-auto font-medium leading-relaxed">
              Handcrafted delicacies prepared fresh daily with authentic spices and rich ingredients.
            </p>
          </div>

          {/* Search Bar & Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-10">
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8B4D2A]" />
              <input
                type="text"
                placeholder="Search dishes or beverages…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-full border border-[#1F3B2C]/15 bg-[#FAF7F0] text-[#2A1508] placeholder-[#6B4226]/60 text-sm font-medium focus:outline-none focus:border-[#C4622D] focus:ring-2 focus:ring-[#C4622D]/20 shadow-sm transition-all"
              />
            </div>

            {/* Filter Controls Bar */}
            <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 no-scrollbar">
              {/* Veg Only Toggle Pill */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setVegOnly(!vegOnly)}
                className={`px-4 py-2 rounded-full text-xs font-heading font-extrabold tracking-wider uppercase border flex items-center gap-2 transition-all shadow-xs whitespace-nowrap flex-shrink-0 ${
                  vegOnly
                    ? "bg-[#1F3B2C] text-[#F4E4C0] border-[#1F3B2C] shadow-md"
                    : "bg-[#FAF7F0] text-[#2A1508] border-[#1F3B2C]/20 hover:border-[#1F3B2C]"
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                Veg Only
              </motion.button>

              {/* Category Filter Chips with AnimatedBackground */}
              <AnimatedBackground
                defaultValue={selectedCategory}
                onValueChange={(val) => val && setSelectedCategory(val)}
                className="bg-[#C4622D] shadow-md shadow-[#C4622D]/35 rounded-full"
                transition={{
                  type: "spring",
                  bounce: 0.15,
                  duration: 0.35,
                }}
                enableHover
              >
                {[
                  { id: "all", name: "All" },
                  ...categories.map((c) => ({ id: c.name, name: c.name })),
                ].map((cat) => (
                  <motion.button
                    key={cat.id}
                    data-id={cat.id}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 text-xs font-heading font-extrabold tracking-wider uppercase whitespace-nowrap transition-colors duration-200 ${
                      selectedCategory === cat.id ? "text-[#F4E4C0]" : "text-[#2A1508]/80 hover:text-[#2A1508]"
                    }`}
                  >
                    {cat.name}
                  </motion.button>
                ))}
              </AnimatedBackground>
            </div>
          </div>

          {/* Menu Items Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="relative bg-[#FAF7F0] rounded-3xl border border-[#1F3B2C]/10 p-5 shadow-sm flex items-center justify-between gap-5 overflow-hidden"
                >
                  <BorderTrail
                    size={110}
                    className="bg-gradient-to-r from-[#E8A93B] via-[#C4622D] to-[#E8A93B]"
                    transition={{
                      repeat: Infinity,
                      duration: 2.5 + idx * 0.4,
                      ease: "linear",
                    }}
                  />
                  <div className="w-28 h-28 rounded-2xl bg-[#F5EFE6] animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-5 bg-[#F5EFE6] rounded-md w-3/4 animate-pulse" />
                    <div className="h-3.5 bg-[#F5EFE6] rounded-md w-full animate-pulse" />
                    <div className="h-4 bg-[#F5EFE6] rounded-md w-1/3 animate-pulse" />
                  </div>
                  <div className="w-20 h-9 rounded-full bg-[#F5EFE6] animate-pulse flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center text-[#6B4226] py-20 bg-[#FAF7F0] rounded-3xl border border-[#1F3B2C]/10 p-8 shadow-sm">
              <p className="font-heading text-xl font-bold text-[#2A1508]">No dishes found</p>
              <p className="text-sm mt-1 text-[#6B4226]/80">Try clearing your search query or selecting a different category.</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08 },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 25 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
                  }}
                  whileHover={{ y: -5, scale: 1.015 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  onClick={() => setModalItem(item)}
                  className="bg-[#FAF7F0] rounded-3xl border border-[#1F3B2C]/10 p-4 sm:p-5 shadow-md hover:shadow-2xl hover:border-[#C4622D]/40 transition-all duration-300 flex items-center justify-between gap-4 sm:gap-5 group cursor-pointer"
                >
                  {/* Item Image with Fallback & Gradient Overlay */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#F5EFE6] overflow-hidden flex-shrink-0 relative shadow-inner">
                    <ImageWithFallback
                      src={getItemPhoto(item)}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <VegDot isVeg={item.is_veg} />
                      <h3 className="font-heading text-base sm:text-lg font-bold text-[#2A1508] truncate group-hover:text-[#C4622D] transition-colors">
                        {item.name}
                      </h3>
                    </div>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-[#6B4226]/85 line-clamp-2 mb-2 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    )}
                    <p className="font-heading font-extrabold text-base sm:text-lg text-[#C4852A] tabular-nums">
                      ₹{item.price}
                    </p>
                  </div>

                  {/* Add Button Pill */}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalItem(item);
                    }}
                    className="bg-[#C4622D] text-[#F4E4C0] font-heading font-extrabold text-xs tracking-wider uppercase px-4 sm:px-5 py-2.5 rounded-full hover:brightness-110 transition flex-shrink-0 shadow-[0_4px_16px_rgba(196,98,45,0.35)] flex items-center gap-1"
                  >
                    <span>Add</span>
                    <Plus className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
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
