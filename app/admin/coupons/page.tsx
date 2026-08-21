"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Ticket,
  Plus,
  CheckCircle2,
  XCircle,
  Tag,
  Trash2,
  Calendar,
  IndianRupee,
  Percent,
  Clock,
  Sparkles,
  RefreshCw,
  Zap,
  Info,
  ShieldAlert,
  Sliders,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type Coupon, type CouponDiscountType } from "@/lib/supabase";
import { TermsSelector, type SelectedTermItem } from "@/components/TermsSelector";

interface TemplateDefinition {
  title: string;
  code: string;
  discount_type: CouponDiscountType;
  value: number;
  min_order_value: number;
  max_discount?: number;
  per_user_limit: number;
  description: string;
  badge: string;
}

const PREBUILT_TEMPLATES: TemplateDefinition[] = [
  {
    title: "Flat ₹50 OFF above ₹299",
    code: "FLAT50",
    discount_type: "flat",
    value: 50,
    min_order_value: 299,
    per_user_limit: 1,
    description: "Flat ₹50 discount for orders above ₹299",
    badge: "Popular",
  },
  {
    title: "20% OFF (Cap ₹150)",
    code: "SAVE20",
    discount_type: "percent",
    value: 20,
    min_order_value: 499,
    max_discount: 150,
    per_user_limit: 2,
    description: "20% discount capped at ₹150 max for orders above ₹499",
    badge: "Best Value",
  },
  {
    title: "Free Delivery (₹40 OFF)",
    code: "FREEDEL",
    discount_type: "flat",
    value: 40,
    min_order_value: 399,
    per_user_limit: 3,
    description: "Waives standard ₹40 delivery fee for orders above ₹399",
    badge: "Delivery",
  },
  {
    title: "First Order — Flat 15% OFF",
    code: "WELCOME15",
    discount_type: "percent",
    value: 15,
    min_order_value: 0,
    per_user_limit: 1,
    description: "15% discount exclusively for 1-time new customer use",
    badge: "New User",
  },
  {
    title: "Weekend Special — 10% OFF",
    code: "WEEKEND10",
    discount_type: "percent",
    value: 10,
    min_order_value: 250,
    per_user_limit: 2,
    description: "10% special discount on weekend orders above ₹250",
    badge: "Weekend",
  },
  {
    title: "₹100 OFF Mega Discount",
    code: "MEGA100",
    discount_type: "flat",
    value: 100,
    min_order_value: 599,
    per_user_limit: 1,
    description: "Flat ₹100 discount for high-value orders above ₹599",
    badge: "High Value",
  },
];

export default function CouponManagementPage() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(350);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("flat");
  const [value, setValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [validTo, setValidTo] = useState("");
  const [isTemplate, setIsTemplate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState<SelectedTermItem[]>([]);

  // Code Uniqueness Check State
  const [codeCheckStatus, setCodeCheckStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCoupons();
    fetchStoreStats();
  }, []);

  async function fetchStoreStats() {
    try {
      const res = await fetch("/api/admin/coupons/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.averageOrderValue) setAvgOrderValue(data.averageOrderValue);
      }
    } catch (e) {
      console.warn("Error fetching AOV stats:", e);
    }
  }

  async function fetchCoupons() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load coupons");
      } else {
        setCoupons((data as Coupon[]) || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Real-time debounced code uniqueness check
  useEffect(() => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 3) {
      setCodeCheckStatus("idle");
      return;
    }

    setCodeCheckStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/coupons/check-code?code=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setCodeCheckStatus(data.available ? "available" : "taken");
        }
      } catch (e) {
        setCodeCheckStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [code]);

  // Helper to fetch session bearer headers
  async function getAuthHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  }

  // Enable Template As-Is (One-Click)
  async function handleEnableTemplateAsIs(tpl: TemplateDefinition) {
    setSubmitting(true);
    try {
      const authHeaders = await getAuthHeaders();
      const payload = {
        code: tpl.code,
        discount_type: tpl.discount_type,
        value: tpl.value,
        min_order_value: tpl.min_order_value,
        max_discount: tpl.max_discount || null,
        per_user_limit: tpl.per_user_limit,
        is_template: true,
        is_active: true,
      };

      const res = await fetch("/api/admin/coupons/create", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to enable template coupon");
      } else {
        toast.success(`🎉 Template Coupon ${tpl.code} Enabled & Activated!`);
        fetchCoupons();
      }
    } catch (e) {
      console.error(e);
      toast.error("Error creating template coupon");
    } finally {
      setSubmitting(false);
    }
  }

  // Pre-fill form from template for customization
  function handleCustomizeTemplate(tpl: TemplateDefinition) {
    setCode(tpl.code);
    setDiscountType(tpl.discount_type);
    setValue(tpl.value.toString());
    setMinOrderValue(tpl.min_order_value.toString());
    setMaxDiscount(tpl.max_discount ? tpl.max_discount.toString() : "");
    setPerUserLimit(tpl.per_user_limit.toString());
    setIsTemplate(true);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
    toast.info(`Pre-filled form with ${tpl.code} template. Edit values below and save!`);
  }

  // Manual / Customized Coupon Submission
  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !value.trim()) {
      toast.error("Coupon code and discount value are required");
      return;
    }

    if (codeCheckStatus === "taken") {
      toast.error(`Coupon code ${code.toUpperCase()} is already in use`);
      return;
    }

    const numVal = parseFloat(value);
    if (discountType === "percent" && numVal > 25 && (!maxDiscount || parseFloat(maxDiscount) <= 0)) {
      toast.error("Security Guard: Percent discounts above 25% require a 'Max Discount Cap' (₹)");
      return;
    }

    setSubmitting(true);
    try {
      const authHeaders = await getAuthHeaders();
      const payload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        value: numVal,
        min_order_value: minOrderValue ? parseFloat(minOrderValue) : 0,
        max_discount: maxDiscount ? parseFloat(maxDiscount) : null,
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        per_user_limit: perUserLimit ? parseInt(perUserLimit) : 1,
        valid_to: validTo || null,
        is_active: true,
        is_template: isTemplate,
      };

      const res = await fetch("/api/admin/coupons/create", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to publish coupon");
      } else {
        const createdId = data.coupon?.id;
        if (createdId && selectedTerms.length > 0) {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          await fetch("/api/admin/offer-terms/save", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({
              coupon_id: createdId,
              terms: selectedTerms,
            }),
          });
        }
        toast.success(`Coupon ${data.coupon?.code || code} published successfully!`);
        resetForm();
        fetchCoupons();
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setCode("");
    setValue("");
    setMinOrderValue("");
    setMaxDiscount("");
    setUsageLimit("");
    setPerUserLimit("1");
    setValidTo("");
    setIsTemplate(false);
    setCodeCheckStatus("idle");
    setSelectedTerms([]);
  }

  async function toggleCouponActive(coupon: Coupon) {
    const nextState = !coupon.is_active;
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: nextState })
        .eq("id", coupon.id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Coupon ${coupon.code} ${nextState ? "activated" : "deactivated"}`);
        await supabase.from("audit_logs").insert({
          action: "coupon.toggle_active",
          entity: "coupons",
          entity_id: coupon.id,
          details: { code: coupon.code, is_active: nextState },
        });
        fetchCoupons();
      }
    } catch (e) {
      toast.error("Failed to update coupon status");
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    if (!confirm(`Are you sure you want to delete coupon ${coupon.code}?`)) return;

    try {
      const { error } = await supabase.from("coupons").delete().eq("id", coupon.id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Coupon ${coupon.code} deleted`);
        await supabase.from("audit_logs").insert({
          action: "coupon.delete",
          entity: "coupons",
          entity_id: coupon.id,
          details: { code: coupon.code },
        });
        fetchCoupons();
      }
    } catch (e) {
      toast.error("Failed to delete coupon");
    }
  }

  const numVal = parseFloat(value || "0");
  const showCapWarning = discountType === "percent" && numVal > 25 && (!maxDiscount || parseFloat(maxDiscount) <= 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-pine/10 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-bold text-pine flex items-center gap-2">
            <Ticket className="w-6 h-6 text-marigold" /> Coupon Code Manager
          </h1>
          <p className="text-xs text-charcoal/60 mt-0.5">
            1-click starter templates, smart hints, and backend abuse prevention (Owner Only)
          </p>
        </div>

        <button
          onClick={fetchCoupons}
          className="p-2.5 rounded-2xl bg-pine/10 text-pine hover:bg-pine/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── SECTION A: Quick Add Pre-Built Templates ── */}
      <div className="space-y-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-3xl border border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h2 className="font-heading text-base font-bold text-pine">Quick Add Starter Templates</h2>
          </div>
          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            1-Click Enable
          </span>
        </div>
        <p className="text-xs text-charcoal/70">
          Enable high-converting cafe promo codes instantly or click Customize to tweak values before saving.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {PREBUILT_TEMPLATES.map((tpl) => (
            <div
              key={tpl.code}
              className="bg-white rounded-2xl border border-pine/15 p-3.5 shadow-xs flex flex-col justify-between space-y-3 hover:border-amber-400 transition"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold bg-marigold/20 text-pine border border-marigold/40 px-2.5 py-0.5 rounded-lg">
                    {tpl.code}
                  </span>
                  <span className="text-[9px] font-extrabold text-pine bg-stone px-2 py-0.5 rounded-full border border-pine/10">
                    {tpl.badge}
                  </span>
                </div>

                <h3 className="font-heading text-xs font-bold text-pine leading-tight pt-1">
                  {tpl.title}
                </h3>
                <p className="text-[11px] text-charcoal/60 leading-tight">
                  {tpl.description}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-pine/10">
                <button
                  onClick={() => handleEnableTemplateAsIs(tpl)}
                  disabled={submitting}
                  className="flex-1 bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold text-[11px] py-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <Zap className="w-3 h-3" />
                  <span>Enable As-Is</span>
                </button>
                <button
                  onClick={() => handleCustomizeTemplate(tpl)}
                  className="px-3 py-2 bg-stone hover:bg-pine/10 text-pine font-bold text-[11px] rounded-xl border border-pine/15 transition cursor-pointer"
                >
                  Customize
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION B: Form & Coupon List Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Coupon Creation Form (5 cols) */}
        <div ref={formRef} className="md:col-span-5 bg-white p-6 rounded-3xl border border-pine/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-pine/10 pb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-pine" />
              <h2 className="font-heading text-lg font-bold text-pine">
                {isTemplate ? "Customize Template Coupon" : "Create Manual Coupon"}
              </h2>
            </div>
            {isTemplate && (
              <span className="text-[9px] font-extrabold text-amber-800 bg-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                Template Mode
              </span>
            )}
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
            {/* Coupon Code with Real-Time Uniqueness Indicator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-pine">Coupon Promo Code *</label>
                {codeCheckStatus === "available" && (
                  <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5">
                    <Check className="w-3 h-3 text-emerald-600" /> Code Available
                  </span>
                )}
                {codeCheckStatus === "taken" && (
                  <span className="text-[10px] text-red-600 font-extrabold flex items-center gap-0.5">
                    <XCircle className="w-3 h-3 text-red-500" /> Already Taken!
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="e.g. WELCOME50 or SAVE20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={`w-full border rounded-xl px-3.5 py-2.5 bg-stone font-mono font-bold text-xs uppercase ${
                  codeCheckStatus === "taken"
                    ? "border-red-500 ring-1 ring-red-500"
                    : codeCheckStatus === "available"
                    ? "border-emerald-500 ring-1 ring-emerald-500"
                    : "border-pine/20"
                }`}
              />
              <p className="text-[10px] text-charcoal/50 mt-1">
                Short, memorable, uppercase (e.g. SAVE20). Auto-validated for uniqueness.
              </p>
            </div>

            {/* Discount Type Radio */}
            <div>
              <label className="block font-bold text-pine mb-1.5">Discount Type *</label>
              <div className="grid grid-cols-2 gap-2 bg-stone p-1.5 rounded-2xl border border-pine/15">
                <button
                  type="button"
                  onClick={() => setDiscountType("flat")}
                  className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    discountType === "flat"
                      ? "bg-pine text-stone shadow-xs"
                      : "text-charcoal/70 hover:bg-white"
                  }`}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Flat ₹ Discount</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiscountType("percent")}
                  className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    discountType === "percent"
                      ? "bg-marigold text-pineDark shadow-xs"
                      : "text-charcoal/70 hover:bg-white"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Percentage %</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-pine mb-1">
                  Value ({discountType === "flat" ? "₹ Amount" : "% Off"}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={discountType === "percent" ? 100 : undefined}
                  placeholder={discountType === "flat" ? "e.g. 50" : "e.g. 15"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-pine mb-1">Min Order Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder={`e.g. ${avgOrderValue}`}
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone text-xs font-medium"
                />
              </div>
            </div>

            {/* Smart Hint based on Store AOV */}
            <p className="text-[10px] text-amber-800 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Smart Hint:</strong> Cafe Average Order Value is <strong>₹{avgOrderValue}</strong>. Setting min order around ₹{Math.max(199, Math.round(avgOrderValue * 0.9))} is recommended.
              </span>
            </p>

            {/* Max Discount Cap Field & Margin Guard Alert */}
            <div>
              <label className="block font-bold text-pine mb-1">
                Max Discount Cap (₹) {discountType === "percent" && numVal > 25 && <span className="text-red-600">* Required</span>}
              </label>
              <input
                type="number"
                min="1"
                placeholder={discountType === "percent" ? "e.g. 150 (required for >25%)" : "Optional cap"}
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2.5 bg-stone text-xs font-medium ${
                  showCapWarning ? "border-red-500 ring-1 ring-red-500" : "border-pine/20"
                }`}
              />
              {showCapWarning && (
                <p className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>Margin Guard: Percent discounts above 25% require a Max Cap (₹) to prevent loss.</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-pine mb-1">Total Usage Limit</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited if empty"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-pine mb-1">Per User Limit *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="1"
                  value={perUserLimit}
                  onChange={(e) => setPerUserLimit(e.target.value)}
                  className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone font-bold text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-charcoal/50">
              Per User Limit = 1 prevents repeat abuse by the same customer account.
            </p>

            <div>
              <label className="block font-bold text-pine mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone text-xs font-medium"
              />
            </div>

            {/* Structured Terms & Conditions (T&C) Selector */}
            <div className="pt-2 border-t border-pine/10">
              <TermsSelector
                selectedTerms={selectedTerms}
                onChangeTerms={setSelectedTerms}
                autoValues={{
                  min_order_value: minOrderValue ? Number(minOrderValue) : undefined,
                  valid_to: validTo,
                  max_discount: maxDiscount ? Number(maxDiscount) : undefined,
                  per_user_limit: perUserLimit ? Number(perUserLimit) : undefined,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || codeCheckStatus === "taken"}
              className="w-full mt-2 bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold py-3 rounded-2xl text-xs shadow-md transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? "Publishing…" : "Publish Coupon Code"}
            </button>
          </form>
        </div>

        {/* Coupons List (7 cols) */}
        <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-pine/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-pine/10 pb-3">
            <h2 className="font-heading text-base font-bold text-pine flex items-center gap-2">
              <span>Active & Past Promo Coupons</span>
              <span className="bg-pine/10 text-pine text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                {coupons.length}
              </span>
            </h2>
          </div>

          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            {coupons.length === 0 ? (
              <p className="text-xs text-charcoal/50 text-center py-8">
                No coupons created yet. Enable a template or create one using the form!
              </p>
            ) : (
              coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`p-4 rounded-2xl border transition space-y-2 text-xs ${
                    coupon.is_active
                      ? "bg-white border-pine/15 shadow-xs"
                      : "bg-stone/50 border-pine/10 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-extrabold text-sm text-pine tracking-wider bg-marigold/20 border border-marigold/40 px-2.5 py-1 rounded-xl">
                        {coupon.code}
                      </span>
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px]">
                        {coupon.discount_type === "flat"
                          ? `₹${coupon.value} OFF`
                          : `${coupon.value}% OFF`}
                      </span>
                      {coupon.is_template && (
                        <span className="text-[9px] font-extrabold text-amber-800 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                          Template
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCouponActive(coupon)}
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full cursor-pointer transition ${
                          coupon.is_active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-stone text-charcoal/60 hover:bg-pine/10"
                        }`}
                      >
                        {coupon.is_active ? "Active ✓" : "Inactive"}
                      </button>

                      <button
                        onClick={() => deleteCoupon(coupon)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-charcoal/70 pt-1 border-t border-pine/10">
                    <div>
                      <span>Min Order: </span>
                      <span className="font-bold text-pine">
                        {coupon.min_order_value ? `₹${coupon.min_order_value}` : "None"}
                      </span>
                    </div>
                    {coupon.max_discount && (
                      <div>
                        <span>Max Cap: </span>
                        <span className="font-bold text-pine">₹{coupon.max_discount}</span>
                      </div>
                    )}
                    <div>
                      <span>Total Usage Limit: </span>
                      <span className="font-bold text-pine">
                        {coupon.usage_limit ? coupon.usage_limit : "Unlimited"}
                      </span>
                    </div>
                    <div>
                      <span>Per User Limit: </span>
                      <span className="font-bold text-pine">{coupon.per_user_limit} use(s)</span>
                    </div>
                  </div>

                  {coupon.valid_to && (
                    <p className="text-[10px] text-amber-800 font-semibold flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3" /> Valid until:{" "}
                      {new Date(coupon.valid_to).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
