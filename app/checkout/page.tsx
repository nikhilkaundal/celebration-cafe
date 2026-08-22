"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  Store,
  Utensils,
  CheckCircle,
  Ticket,
  MapPin,
  QrCode,
  Sparkles,
  Tag,
  X,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useCart, getLineKey } from "@/lib/cart-context";
import { supabase, type OrderType, type Address } from "@/lib/supabase";
import { AddressModal, type AddressData } from "@/components/AddressModal";

export default function CheckoutPage() {
  const { lines, total, clearCart, updateQuantity, removeItem } = useCart();
  const router = useRouter();

  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null);
  const [upiId, setUpiId] = useState<string>("celebrationcafe@upi");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Saved Addresses for Logged-In User
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  async function refreshAddressesAndSelect(newAddr?: AddressData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: addrs } = await supabase
          .from("addresses")
          .select("*")
          .eq("customer_id", user.id)
          .order("is_default", { ascending: false });

        if (addrs && addrs.length > 0) {
          setSavedAddresses(addrs as Address[]);
          const target = newAddr ? addrs.find((a) => a.id === newAddr.id) : addrs[0];
          if (target) {
            setSelectedAddressId(target.id);
            setAddress(
              `${target.line1}${target.line2 ? `, ${target.line2}` : ""}, ${target.city}`
            );
          }
          return;
        }
      }

      // Guest fallback
      const raw = localStorage.getItem("celebration_saved_addresses");
      if (raw) {
        const localList: Address[] = JSON.parse(raw);
        setSavedAddresses(localList);
        const target = newAddr ? localList.find((a) => a.id === newAddr.id) : localList[0];
        if (target) {
          setSelectedAddressId(target.id);
          setAddress(
            `${target.line1}${target.line2 ? `, ${target.line2}` : ""}, ${target.city}`
          );
        }
      }
    } catch (e) {
      console.warn("Failed to refresh addresses:", e);
    }
  }

  // Coupons
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    coupon_id: string;
  } | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");

  // Payment Options & GPay QR Modal
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi">("cash");
  const [showQrModal, setShowQrModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill logged-in customer profile & saved addresses
  useEffect(() => {
    async function loadCustomerData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Load Profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) {
            setName(profile.full_name || "");
            if (profile.phone) setPhone(profile.phone);
          }

          // Load Saved Addresses
          const { data: addrs } = await supabase
            .from("addresses")
            .select("*")
            .eq("customer_id", user.id)
            .order("is_default", { ascending: false });

          if (addrs && addrs.length > 0) {
            setSavedAddresses(addrs as Address[]);
            const defaultAddr = addrs[0];
            setSelectedAddressId(defaultAddr.id);
            setAddress(
              `${defaultAddr.line1}${defaultAddr.line2 ? `, ${defaultAddr.line2}` : ""}, ${defaultAddr.city}`
            );
          }
        } else {
          // Fallback local storage
          const p = localStorage.getItem("celebration_customer_profile");
          if (p) {
            const parsed = JSON.parse(p);
            if (parsed.name) setName(parsed.name);
            if (parsed.phone) setPhone(parsed.phone);
            if (parsed.address) setAddress(parsed.address);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    async function loadAvailableCoupons() {
      try {
        const res = await fetch("/api/coupons/active");
        if (res.ok) {
          const data = await res.json();
          if (data.coupons) setAvailableCoupons(data.coupons);
        }
      } catch (e) {
        console.warn("Error fetching active coupons:", e);
      }
    }

    async function fetchPublicSettings() {
      try {
        const res = await fetch("/api/settings/public");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            if (data.settings.payment_qr_url) setPaymentQrUrl(data.settings.payment_qr_url);
            if (data.settings.upi_id) setUpiId(data.settings.upi_id);
          }
        }
      } catch (e) {
        console.warn("Error fetching public settings:", e);
      }
    }

    loadCustomerData();
    loadAvailableCoupons();
    fetchPublicSettings();
  }, []);

  // Re-validate applied coupon whenever cart subtotal changes
  useEffect(() => {
    if (!appliedCoupon) return;

    const currentCoupon = availableCoupons.find(
      (c) => c.code.toUpperCase() === appliedCoupon.code.toUpperCase()
    );

    if (currentCoupon) {
      const minVal = Number(currentCoupon.min_order_value || 0);
      if (total < minVal) {
        const removedCode = appliedCoupon.code;
        setAppliedCoupon(null);
        toast.info(
          `Coupon "${removedCode}" removed because order subtotal (₹${total}) fell below minimum required ₹${minVal}`
        );
      } else {
        let newDiscount = 0;
        if (currentCoupon.discount_type === "flat") {
          newDiscount = Math.min(Number(currentCoupon.value), total);
        } else {
          newDiscount = Math.round((total * Number(currentCoupon.value)) / 100);
          if (currentCoupon.max_discount) {
            newDiscount = Math.min(newDiscount, Number(currentCoupon.max_discount));
          }
        }
        newDiscount = Math.min(newDiscount, total);
        setAppliedCoupon((prev) => (prev ? { ...prev, discount: newDiscount } : null));
      }
    }
  }, [total, availableCoupons]);

  const deliveryFee = orderType === "delivery" ? 40 : 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, total - discountAmount + deliveryFee);

  async function applyCouponByCode(codeToApply: string) {
    if (!codeToApply.trim()) return;

    setCouponLoading(true);
    setApplyingCode(codeToApply.trim().toUpperCase());
    setCouponError("");

    try {
      const { data, error: rpcErr } = await supabase.rpc("validate_coupon", {
        p_code: codeToApply.trim().toUpperCase(),
        p_subtotal: total,
      });

      if (rpcErr || !data || data.length === 0) {
        setCouponError(rpcErr?.message || "Invalid coupon code");
        setAppliedCoupon(null);
        toast.error(rpcErr?.message || "Invalid coupon code");
      } else {
        const res = data[0];
        setAppliedCoupon({
          code: codeToApply.trim().toUpperCase(),
          discount: Number(res.calculated_discount),
          coupon_id: res.coupon_id,
        });
        toast.success(`Coupon ${codeToApply.toUpperCase()} applied! You saved ₹${res.calculated_discount}`);
      }
    } catch (err: any) {
      setCouponError(err.message || "Failed to validate coupon");
    } finally {
      setCouponLoading(false);
      setApplyingCode(null);
    }
  }

  // Validate & Apply Coupon
  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    await applyCouponByCode(couponCode);
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon removed");
  }

  function handleSelectSavedAddress(addr: Address) {
    setSelectedAddressId(addr.id);
    setAddress(`${addr.line1}${addr.line2 ? `, ${addr.line2}` : ""}, ${addr.city}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and 10-digit phone number.");
      return;
    }
    if (orderType === "delivery" && !address.trim()) {
      setError("Please enter a valid delivery address in Hamirpur.");
      return;
    }
    if (lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);

    try {
      // Prepare structured cart items payload for server RPC
      const payloadItems = lines.map((l) => ({
        menu_item_id: l.item.id,
        quantity: l.quantity,
        customizations: l.extras
          ? l.extras.map((ex) => ({
              group: "Customization",
              option: ex,
            }))
          : [],
      }));

      const res = await fetch("/api/orders/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payloadItems,
          orderType,
          customerName: name.trim(),
          phone: phone.trim(),
          address: orderType === "delivery" ? address.trim() : null,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to place order");
        toast.error(data.error || "Order placement failed");
      } else {
        clearCart();
        toast.success("Order placed successfully!");
        router.push(`/order-confirmed?id=${data.orderId}`);
      }
    } catch (err: any) {
      console.error("Order submit error:", err);
      setError("Something went wrong placing your order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background text-foreground">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h1 className="font-heading text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground text-sm mb-6">Add delicious food items to place an order.</p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen max-w-xl mx-auto px-4 py-8 bg-background text-foreground space-y-6"
    >
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </Link>

      <h1 className="font-heading text-3xl font-bold text-foreground">
        Checkout & Place Order
      </h1>

      {/* Order Summary Card */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground border-b border-border/60 pb-3">
          Order Summary ({lines.reduce((s, l) => s + l.quantity, 0)} items)
        </h2>

        {lines.map((l) => {
          const key = getLineKey(l.item, l.size, l.extras, l.spiceLevel, l.notes);
          const uPrice = l.unitPrice ?? l.item.price;
          const sub = l.subtotal ?? uPrice * l.quantity;

          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border/30 last:border-0"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-semibold text-foreground truncate">{l.item.name}</p>
                {(l.size || (l.extras && l.extras.length > 0) || l.spiceLevel || l.notes) && (
                  <p className="text-[11px] text-muted-foreground leading-tight">
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
                <p className="text-xs text-muted-foreground font-mono">₹{uPrice} each</p>
              </div>

              {/* Quantity Stepper & Remove Action */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2 py-1 border border-border">
                  <button
                    type="button"
                    onClick={() => {
                      if (l.quantity > 1) {
                        updateQuantity(key, l.quantity - 1);
                      } else {
                        removeItem(key);
                        toast.info(`Removed "${l.item.name}" from order`);
                      }
                    }}
                    className="w-7 h-7 rounded-lg bg-background hover:bg-muted text-foreground flex items-center justify-center font-bold text-sm transition cursor-pointer border border-border"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="font-bold text-foreground tabular-nums w-4 text-center text-xs">
                    {l.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => updateQuantity(key, l.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-background hover:bg-muted text-foreground flex items-center justify-center font-bold text-sm transition cursor-pointer border border-border"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="font-bold text-foreground tabular-nums text-sm min-w-[50px] text-right">
                  ₹{sub}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    removeItem(key);
                    toast.info(`Removed "${l.item.name}" from order`);
                  }}
                  className="p-1.5 text-muted-foreground/60 hover:text-destructive transition cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Pricing Calculation Breakdown */}
        <div className="pt-3 border-t border-border space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Items Subtotal</span>
            <span>₹{total}</span>
          </div>

          {appliedCoupon && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span className="flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" /> Coupon ({appliedCoupon.code})
              </span>
              <span>-₹{appliedCoupon.discount}</span>
            </div>
          )}

          {orderType === "delivery" && (
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee (Hamirpur Town)</span>
              <span>₹{deliveryFee}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-lg text-primary pt-2 border-t border-border">
            <span>Total Payable</span>
            <span>₹{finalTotal}</span>
          </div>
        </div>
      </div>

      {/* Coupon Application Box */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-xs space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" /> Have a Promo Coupon?
        </h3>

        {appliedCoupon ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-800 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Coupon <strong>{appliedCoupon.code}</strong> Applied (-₹{appliedCoupon.discount})
            </span>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-red-500 hover:text-red-700 font-bold text-[11px]"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="ENTER PROMO CODE (e.g. WELCOME50)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 border border-border rounded-xl px-3.5 py-2.5 bg-background font-mono text-xs uppercase font-bold"
              />
              <button
                type="submit"
                disabled={couponLoading}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
              >
                {couponLoading ? "Validating…" : "Apply"}
              </button>
            </form>

            {/* Available Deals & 1-Click Apply List */}
            {availableCoupons.length > 0 && (
              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Available Store Deals for You:
                </p>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {availableCoupons.map((c) => {
                    const minVal = Number(c.min_order_value || 0);
                    const isEligible = total >= minVal;
                    const diff = minVal - total;

                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border transition flex items-center justify-between text-xs ${
                          isEligible
                            ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500"
                            : "bg-muted/40 border-border opacity-80"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-foreground bg-primary/10 px-2 py-0.5 rounded-md text-[11px]">
                              {c.code}
                            </span>
                            <span className="font-bold text-emerald-700 text-[11px]">
                              {c.discount_type === "flat" ? `₹${c.value} OFF` : `${c.value}% OFF`}
                            </span>
                          </div>
                          {isEligible ? (
                            <p className="text-[10px] text-emerald-600 font-semibold">
                              Eligible! Tap to save money instantly.
                            </p>
                          ) : (
                            <p className="text-[10px] text-amber-600 font-semibold">
                              Add ₹{diff} more to unlock (Min Order ₹{minVal})
                            </p>
                          )}
                        </div>

                        {isEligible ? (
                          <button
                            type="button"
                            disabled={couponLoading}
                            onClick={() => {
                              setCouponCode(c.code);
                              applyCouponByCode(c.code);
                            }}
                            className="bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-xl text-[11px] hover:opacity-90 transition cursor-pointer shrink-0 shadow-xs flex items-center gap-1 disabled:opacity-60"
                          >
                            {applyingCode === c.code ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-primary-foreground" />
                                <span>Applying…</span>
                              </>
                            ) : (
                              <span>Apply 1-Click</span>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-xl shrink-0">
                            Min ₹{minVal}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        {couponError && <p className="text-destructive text-xs font-medium">{couponError}</p>}
      </div>

      {/* Checkout Details Form */}
      <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-2xl border border-border p-5 shadow-xs">
        {/* Order type selection */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Select Order Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "dine-in", label: "Dine-in", icon: Utensils },
              { id: "pickup", label: "Takeaway", icon: Store },
              { id: "delivery", label: "Delivery", icon: Truck },
            ].map((mode) => {
              const Icon = mode.icon;
              const selected = orderType === mode.id;
              return (
                <button
                  type="button"
                  key={mode.id}
                  onClick={() => setOrderType(mode.id as OrderType)}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Details */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-foreground">Your Full Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="e.g. Rohit Sharma"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-foreground">Mobile Phone Number *</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="10-digit mobile number"
          />
        </div>

        {/* Saved Delivery Addresses & Input */}
        <AnimatePresence>
          {orderType === "delivery" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-foreground">
                  Delivery Address in Hamirpur *
                </label>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(true)}
                  className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add New Address
                </button>
              </div>

              {savedAddresses.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;

                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition flex items-start justify-between gap-3 ${
                          isSelected
                            ? "border-accent bg-accent/10 font-medium text-foreground shadow-xs"
                            : "border-border hover:border-accent/40 text-muted-foreground bg-card"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-xs">{addr.label}</span>
                            {addr.is_default && (
                              <span className="text-[9px] font-extrabold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-foreground/90 font-semibold">{addr.line1}</p>
                          {addr.line2 && <p>{addr.line2}</p>}
                          <p className="text-[11px] text-muted-foreground">
                            {addr.city}{addr.state ? `, ${addr.state}` : ""} — {addr.pincode}
                          </p>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          <div
                            className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-accent bg-accent" : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  required={orderType === "delivery"}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  rows={3}
                  placeholder="House no, street, landmark, Hamirpur"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Method Selector (Cash vs Google Pay QR) */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMode("cash")}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                paymentMode === "cash"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background text-foreground border-border"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Cash on Delivery / Counter</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMode("upi");
                setShowQrModal(true);
              }}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                paymentMode === "upi"
                  ? "bg-accent text-accent-foreground border-accent shadow-xs"
                  : "bg-background text-foreground border-border"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Google Pay / UPI QR</span>
            </button>
          </div>
        </div>

        {/* Order Notes */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-foreground">Order Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="e.g. Make it extra spicy / Less sugar in tea"
          />
        </div>

        {error && <p className="text-destructive text-xs font-medium">{error}</p>}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-accent text-accent-foreground font-semibold py-4 rounded-2xl shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {submitting ? "Placing Order…" : `Confirm Order · ₹${finalTotal}`}
        </motion.button>
      </form>

      {/* ── Modal: Google Pay / UPI QR Display ── */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowQrModal(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" /> Google Pay / UPI
                </h3>
                <button onClick={() => setShowQrModal(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Dynamic Payment QR Image / Info */}
              <div className="bg-background p-4 rounded-2xl border border-border space-y-3">
                {paymentQrUrl ? (
                  <div className="w-52 h-52 bg-white border border-gray-300 rounded-2xl mx-auto p-2 shadow-inner relative overflow-hidden flex items-center justify-center">
                    <img
                      src={paymentQrUrl}
                      alt="Owner Payment QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-52 h-52 bg-muted/30 border border-dashed border-border rounded-2xl mx-auto p-4 flex flex-col items-center justify-center text-center space-y-2">
                    <QrCode className="w-12 h-12 text-primary/40" />
                    <p className="text-xs font-bold text-foreground">UPI Payment QR</p>
                    <p className="text-[10px] text-muted-foreground">
                      Scan via GPay / PhonePe / Paytm. Pay ₹{finalTotal}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <p className="text-xs text-muted-foreground font-semibold">Official Cafe UPI ID:</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-extrabold text-primary bg-primary/10 border border-primary/20 py-1.5 px-3 rounded-xl text-xs select-all">
                      {upiId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(upiId);
                        setCopiedUpi(true);
                        toast.success(`Copied UPI ID "${upiId}"!`);
                        setTimeout(() => setCopiedUpi(false), 2500);
                      }}
                      className="bg-primary text-primary-foreground p-2 rounded-xl hover:opacity-90 transition cursor-pointer flex items-center justify-center shadow-xs"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Scan the QR code with Google Pay or Paytm. Pay <strong>₹{finalTotal}</strong> and complete checkout.
              </p>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-xs"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSuccess={(newAddr) => {
          refreshAddressesAndSelect(newAddr);
        }}
      />
    </motion.main>
  );
}
