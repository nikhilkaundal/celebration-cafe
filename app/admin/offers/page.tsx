"use client";

import React, { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Zap,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  Edit2,
  Sliders,
  Check,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type Coupon } from "@/lib/supabase";
import { MenuImagePicker } from "@/components/MenuImagePicker";
import { TermsSelector, type SelectedTermItem } from "@/components/TermsSelector";

interface ScheduleRules {
  days?: string[]; // e.g. ["sat", "sun"]
  daily_start?: string; // "16:00"
  daily_end?: string; // "19:00"
}

interface OfferBanner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  banner_image_url: string | null;
  badge_text: string | null;
  linked_coupon_id: string | null;
  display_location: "home_top" | "menu_top" | "category_banner";
  starts_at: string | null;
  ends_at: string | null;
  schedule_rules: ScheduleRules | null;
  is_active: boolean;
  is_template?: boolean;
  template_key?: string | null;
  sort_order: number;
  created_at: string;
  coupons?: Coupon | null;
}

interface OfferTemplate {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  badge_text: string;
  default_image: string;
  display_location: "home_top" | "menu_top" | "category_banner";
  schedule_rules?: ScheduleRules;
  badge: string;
}

const OFFER_TEMPLATES: OfferTemplate[] = [
  {
    key: "weekend_special",
    title: "Weekend Special — 20% Off",
    subtitle: "Valid this Sat & Sun only",
    description: "Exclusive weekend discount on all delicious snacks and pizzas",
    badge_text: "WEEKEND",
    default_image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    display_location: "home_top",
    schedule_rules: { days: ["sat", "sun"] },
    badge: "Popular",
  },
  {
    key: "new_item_launch",
    title: "Just Landed on the Menu!",
    subtitle: "Try our new artisan dishes before anyone else",
    description: "Freshly introduced gourmet cafe delights available for ordering",
    badge_text: "NEW",
    default_image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80",
    display_location: "home_top",
    badge: "Launch",
  },
  {
    key: "free_delivery",
    title: "Free Delivery Above ₹399",
    subtitle: "Order your favorite meals with zero delivery charges",
    description: "Standard ₹40 delivery fee waived on orders above ₹399",
    badge_text: "FREE DELIVERY",
    default_image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&auto=format&fit=crop&q=80",
    display_location: "home_top",
    badge: "Delivery",
  },
  {
    key: "festive_offer",
    title: "Celebrate with 15% Off",
    subtitle: "Festive season special promotion",
    description: "Special celebratory discount for Hamirpur food lovers",
    badge_text: "FESTIVE",
    default_image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
    display_location: "home_top",
    badge: "Festive",
  },
  {
    key: "happy_hours",
    title: "Happy Hours — 10% Off Snacks",
    subtitle: "4 PM – 7 PM daily evening special",
    description: "Enjoy hot tea, coffee and crispy snacks at discounted prices",
    badge_text: "HAPPY HOURS",
    default_image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
    display_location: "menu_top",
    schedule_rules: { daily_start: "16:00", daily_end: "19:00" },
    badge: "Daily 4-7 PM",
  },
  {
    key: "combo_deal",
    title: "Meal Combo — Save More",
    subtitle: "Pair your pizza with cold coffee & fries",
    description: "Gourmet meal combinations handcrafted for savings",
    badge_text: "COMBO",
    default_image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80",
    display_location: "home_top",
    badge: "Combo",
  },
];

const DAYS_OF_WEEK = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

export default function OffersBannersManagementPage() {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<OfferBanner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [linkedCouponId, setLinkedCouponId] = useState("");
  const [displayLocation, setDisplayLocation] = useState<"home_top" | "menu_top" | "category_banner">("home_top");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dailyStart, setDailyStart] = useState("");
  const [dailyEnd, setDailyEnd] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isTemplate, setIsTemplate] = useState(false);
  const [templateKey, setTemplateKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [enablingKey, setEnablingKey] = useState<string | null>(null);
  const [selectedTerms, setSelectedTerms] = useState<SelectedTermItem[]>([]);

  useEffect(() => {
    fetchOffersAndCoupons();
  }, []);

  async function fetchOffersAndCoupons() {
    setLoading(true);
    try {
      const [offersRes, couponsRes] = await Promise.all([
        supabase
          .from("offers")
          .select("*, coupons(*)")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      ]);

      if (offersRes.data) setOffers(offersRes.data as OfferBanner[]);
      if (couponsRes.data) setCoupons(couponsRes.data as Coupon[]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  }

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
  async function handleEnableTemplateAsIs(tpl: OfferTemplate) {
    setSubmitting(true);
    setEnablingKey(tpl.key);
    try {
      const authHeaders = await getAuthHeaders();
      const payload = {
        title: tpl.title,
        subtitle: tpl.subtitle,
        description: tpl.description,
        badge_text: tpl.badge_text,
        banner_image_url: tpl.default_image,
        display_location: tpl.display_location,
        schedule_rules: tpl.schedule_rules || {},
        is_active: true,
        is_template: true,
        template_key: tpl.key,
      };

      const res = await fetch("/api/admin/offers/create-or-update", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to enable offer banner template");
      } else {
        toast.success(`🎉 Offer Banner '${tpl.title}' Enabled & Activated!`);
        fetchOffersAndCoupons();
      }
    } catch (e) {
      console.error(e);
      toast.error("Error creating offer banner");
    } finally {
      setSubmitting(false);
      setEnablingKey(null);
    }
  }

  // Customize Template
  function handleCustomizeTemplate(tpl: OfferTemplate) {
    setEditingOfferId(null);
    setTitle(tpl.title);
    setSubtitle(tpl.subtitle);
    setDescription(tpl.description);
    setBadgeText(tpl.badge_text);
    setBannerImageUrl(tpl.default_image);
    setLinkedCouponId("");
    setDisplayLocation(tpl.display_location as any);
    setStartsAt("");
    setEndsAt("");
    setSelectedDays(tpl.schedule_rules?.days || []);
    setDailyStart(tpl.schedule_rules?.daily_start || "");
    setDailyEnd(tpl.schedule_rules?.daily_end || "");
    setIsActive(true);
    setIsTemplate(true);
    setTemplateKey(tpl.key);
    setSelectedTerms([]);
    setIsModalOpen(true);
  }

  function handleOpenCreateModal() {
    setEditingOfferId(null);
    setTitle("");
    setSubtitle("");
    setDescription("");
    setBadgeText("");
    setBannerImageUrl("");
    setLinkedCouponId("");
    setDisplayLocation("home_top");
    setStartsAt("");
    setEndsAt("");
    setSelectedDays([]);
    setDailyStart("");
    setDailyEnd("");
    setIsActive(true);
    setIsTemplate(false);
    setTemplateKey(null);
    setSelectedTerms([]);
    setIsModalOpen(true);
  }

  async function handleOpenEditModal(offer: OfferBanner) {
    setEditingOfferId(offer.id);
    setTitle(offer.title || "");
    setSubtitle(offer.subtitle || "");
    setDescription(offer.description || "");
    setBadgeText(offer.badge_text || "");
    setBannerImageUrl(offer.banner_image_url || "");
    setLinkedCouponId(offer.linked_coupon_id || "");
    setDisplayLocation(offer.display_location || "home_top");
    setStartsAt(offer.starts_at ? offer.starts_at.substring(0, 10) : "");
    setEndsAt(offer.ends_at ? offer.ends_at.substring(0, 10) : "");
    setSelectedDays(offer.schedule_rules?.days || []);
    setDailyStart(offer.schedule_rules?.daily_start || "");
    setDailyEnd(offer.schedule_rules?.daily_end || "");
    setIsActive(offer.is_active);
    setIsTemplate(Boolean(offer.is_template));
    setTemplateKey(offer.template_key || null);
    setSelectedTerms([]);
    setIsModalOpen(true);

    // Fetch terms for this offer
    try {
      const res = await fetch(`/api/offers/terms?offer_id=${offer.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.terms) {
          setSelectedTerms(
            data.terms.map((t: any) => ({
              tnc_template_id: t.tnc_template_id || null,
              custom_text: t.custom_text || null,
              label: t.text,
              param_value: t.param_value || null,
            }))
          );
        }
      }
    } catch (e) {
      console.warn("Failed to fetch offer terms:", e);
    }
  }

  async function handleSaveOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Banner title is required");
      return;
    }

    setSubmitting(true);
    try {
      const scheduleRules: ScheduleRules = {};
      if (selectedDays.length > 0) scheduleRules.days = selectedDays;
      if (dailyStart) scheduleRules.daily_start = dailyStart;
      if (dailyEnd) scheduleRules.daily_end = dailyEnd;

      const payload = {
        id: editingOfferId,
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        badge_text: badgeText.trim(),
        banner_image_url: bannerImageUrl.trim(),
        linked_coupon_id: linkedCouponId || null,
        display_location: displayLocation,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
        schedule_rules: scheduleRules,
        is_active: isActive,
        is_template: isTemplate,
        template_key: templateKey,
      };

      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/admin/offers/create-or-update", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save offer banner");
      } else {
        const savedId = data.offer?.id || editingOfferId;
        if (savedId && selectedTerms.length > 0) {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          await fetch("/api/admin/offer-terms/save", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({
              offer_id: savedId,
              terms: selectedTerms,
            }),
          });
        }

        toast.success(`Banner '${data.offer?.title || title}' saved successfully!`);
        setIsModalOpen(false);
        fetchOffersAndCoupons();
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleOfferActive(offer: OfferBanner) {
    const nextState = !offer.is_active;
    try {
      const res = await fetch("/api/admin/offers/toggle-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: offer.id, is_active: nextState }),
      });

      if (!res.ok) {
        toast.error("Failed to update status");
      } else {
        toast.success(`Banner '${offer.title}' ${nextState ? "activated" : "deactivated"}`);
        fetchOffersAndCoupons();
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  }

  async function deleteOffer(offer: OfferBanner) {
    if (!confirm(`Are you sure you want to delete offer '${offer.title}'?`)) return;

    try {
      const { error } = await supabase.from("offers").delete().eq("id", offer.id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Offer '${offer.title}' deleted`);
        fetchOffersAndCoupons();
      }
    } catch (e) {
      toast.error("Failed to delete offer");
    }
  }

  function toggleDaySelection(dayKey: string) {
    setSelectedDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  }

  const linkedCoupon = coupons.find((c) => c.id === linkedCouponId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-pine/10 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-bold text-pine flex items-center gap-2">
            <Tag className="w-6 h-6 text-marigold" /> Offers & Promotional Banners
          </h1>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Create visual marketing banners, 1-click starter templates, and schedule recurring promotions (Owner Only)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOffersAndCoupons}
            className="p-2.5 rounded-2xl bg-pine/10 text-pine hover:bg-pine/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Banner</span>
          </button>
        </div>
      </div>

      {/* ── SECTION A: Quick Add Starter Templates ── */}
      <div className="space-y-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-3xl border border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h2 className="font-heading text-base font-bold text-pine">Quick Add Offer Templates</h2>
          </div>
          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            1-Click Enable
          </span>
        </div>
        <p className="text-xs text-charcoal/70">
          Activate high-converting promotional banners with preset images & recurring schedules.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {OFFER_TEMPLATES.map((tpl) => (
            <div
              key={tpl.key}
              className="bg-white rounded-2xl border border-pine/15 overflow-hidden shadow-xs flex flex-col justify-between hover:border-amber-400 transition"
            >
              {/* Template Image Banner Header */}
              <div className="relative h-24 bg-stone overflow-hidden">
                <img
                  src={tpl.default_image}
                  alt={tpl.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-marigold text-pineDark font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase shadow-xs">
                  {tpl.badge_text}
                </div>
                <div className="absolute top-2 right-2 bg-black/60 text-white font-bold text-[9px] px-2 py-0.5 rounded-full">
                  {tpl.badge}
                </div>
              </div>

              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-xs font-bold text-pine leading-tight">
                    {tpl.title}
                  </h3>
                  <p className="text-[11px] text-charcoal/60 leading-tight mt-0.5">
                    {tpl.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-pine/10">
                  <button
                    onClick={() => handleEnableTemplateAsIs(tpl)}
                    disabled={submitting || enablingKey === tpl.key}
                    className="flex-1 bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold text-[11px] py-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-60"
                  >
                    {enablingKey === tpl.key ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-pineDark" />
                        <span>Enabling…</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>Enable As-Is</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleCustomizeTemplate(tpl)}
                    disabled={submitting}
                    className="px-3 py-2 bg-stone hover:bg-pine/10 text-pine font-bold text-[11px] rounded-xl border border-pine/15 transition cursor-pointer disabled:opacity-60"
                  >
                    Customize
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION B: Active Banners Grid ── */}
      <div className="bg-white p-6 rounded-3xl border border-pine/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-pine/10 pb-3">
          <h2 className="font-heading text-lg font-bold text-pine flex items-center gap-2">
            <span>Configured Promotional Banners</span>
            <span className="bg-pine/10 text-pine text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              {offers.length}
            </span>
          </h2>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Tag className="w-10 h-10 text-pine/30 mx-auto" />
            <p className="text-xs text-charcoal/60 font-bold">No active promotional banners configured.</p>
            <p className="text-xs text-charcoal/50">Enable a template above or click Create New Banner to add your first banner!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => {
              const isCouponInactive = offer.coupons && !offer.coupons.is_active;

              return (
                <div
                  key={offer.id}
                  className={`rounded-2xl border overflow-hidden transition flex flex-col justify-between ${
                    offer.is_active
                      ? "bg-white border-pine/20 shadow-xs"
                      : "bg-stone/60 border-pine/10 opacity-75"
                  }`}
                >
                  {/* Banner Image & Overlay Badges */}
                  <div className="relative h-32 bg-stone overflow-hidden">
                    {offer.banner_image_url ? (
                      <img
                        src={offer.banner_image_url}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-pine/10 flex items-center justify-center text-pine/40">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}

                    {offer.badge_text && (
                      <span className="absolute top-2 left-2 bg-marigold text-pineDark font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase shadow-md">
                        {offer.badge_text}
                      </span>
                    )}

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {offer.is_template && (
                        <span className="bg-amber-500/90 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow-xs">
                          Template
                        </span>
                      )}
                      <span
                        className={`font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow-xs ${
                          offer.is_active
                            ? "bg-emerald-600 text-white"
                            : "bg-charcoal/60 text-white"
                        }`}
                      >
                        {offer.is_active ? "Active ✓" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Banner Info Body */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h3 className="font-heading text-sm font-bold text-pine leading-tight">
                        {offer.title}
                      </h3>
                      {offer.subtitle && (
                        <p className="text-xs font-semibold text-charcoal/80">{offer.subtitle}</p>
                      )}
                      {offer.description && (
                        <p className="text-[11px] text-charcoal/60 line-clamp-2">{offer.description}</p>
                      )}
                    </div>

                    {/* Linked Coupon Badge & Warning */}
                    {offer.coupons && (
                      <div className="pt-2 border-t border-pine/10">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-charcoal/60 font-semibold">Linked Promo Code:</span>
                          <span className="font-mono font-extrabold text-pine bg-marigold/20 px-2 py-0.5 rounded-lg border border-marigold/40">
                            {offer.coupons.code}
                          </span>
                        </div>
                        {isCouponInactive && (
                          <p className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                            <span>Warning: Linked coupon is inactive!</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Schedule Badge */}
                    {offer.schedule_rules && (offer.schedule_rules.days?.length || offer.schedule_rules.daily_start) && (
                      <div className="text-[10px] text-amber-800 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-bold">
                          Schedule:{" "}
                          {offer.schedule_rules.days?.length
                            ? offer.schedule_rules.days.map((d) => d.toUpperCase()).join(", ")
                            : ""}{" "}
                          {offer.schedule_rules.daily_start ? `${offer.schedule_rules.daily_start}–${offer.schedule_rules.daily_end}` : ""}
                        </span>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-pine/10 gap-2">
                      <button
                        onClick={() => toggleOfferActive(offer)}
                        className={`text-[10px] font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition ${
                          offer.is_active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-pine text-stone hover:bg-pineDark"
                        }`}
                      >
                        {offer.is_active ? "Deactivate" : "Activate"}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(offer)}
                          className="p-1.5 rounded-lg bg-stone hover:bg-pine/10 text-pine transition cursor-pointer"
                          title="Edit banner"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteOffer(offer)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                          title="Delete banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT BANNER MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-pine/20 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-pine/10 pb-3">
              <h2 className="font-heading text-lg font-bold text-pine flex items-center gap-2">
                <Tag className="w-5 h-5 text-marigold" />
                <span>{editingOfferId ? "Edit Offer Banner" : "Create New Offer Banner"}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-charcoal/50 hover:text-pine hover:bg-stone transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4 text-xs">
              {/* LIVE BANNER VISUAL PREVIEW CARD */}
              <div className="space-y-1">
                <label className="font-bold text-pine text-[11px] flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-marigold" /> Live Visual Banner Preview
                </label>
                <div className="relative rounded-2xl overflow-hidden border border-pine/20 bg-stone p-4 text-white shadow-md min-h-[110px] flex flex-col justify-end">
                  {bannerImageUrl ? (
                    <img
                      src={bannerImageUrl}
                      alt="Banner preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-pineDark via-pine to-emerald-900" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                  <div className="relative z-10 space-y-1">
                    {badgeText && (
                      <span className="inline-block bg-marigold text-pineDark font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                        {badgeText}
                      </span>
                    )}
                    <h4 className="font-heading font-bold text-sm text-white leading-tight">
                      {title || "Your Banner Title Here"}
                    </h4>
                    {subtitle && <p className="text-xs text-stone/90 font-medium">{subtitle}</p>}
                    {linkedCoupon && (
                      <span className="inline-block text-[9px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/30 mt-1">
                        🎁 Code: {linkedCoupon.code} ({linkedCoupon.discount_type === "flat" ? `₹${linkedCoupon.value} OFF` : `${linkedCoupon.value}% OFF`})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-pine mb-1">Banner Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekend Special — 20% Off"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-pine mb-1">Subtitle / Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Valid Saturday & Sunday only"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-pine mb-1">Badge Ribbon Text</label>
                  <input
                    type="text"
                    placeholder="e.g. WEEKEND, NEW, 20% OFF"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-xs uppercase font-bold text-marigold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-pine mb-1">Description / Offer Details</label>
                <textarea
                  rows={2}
                  placeholder="Terms and promotional details…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-xs"
                />
              </div>

              {/* Banner Image Picker & Supabase Storage */}
              <MenuImagePicker
                dishName={title || "Banner"}
                value={bannerImageUrl}
                onChange={(url) => setBannerImageUrl(url)}
              />

              {/* Linked Coupon Selection */}
              <div>
                <label className="block font-bold text-pine mb-1">Link to Active Coupon Code (Optional)</label>
                <select
                  value={linkedCouponId}
                  onChange={(e) => setLinkedCouponId(e.target.value)}
                  className="w-full border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-xs font-bold"
                >
                  <option value="">-- No Linked Coupon (Informational Banner) --</option>
                  {coupons.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.discount_type === "flat" ? `₹${c.value} OFF` : `${c.value}% OFF`} {!c.is_active ? "(Inactive)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recurring Schedule Rules */}
              <div className="space-y-2 bg-stone/50 p-3 rounded-2xl border border-pine/15">
                <label className="font-bold text-pine flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-marigold" /> Recurring Schedule Rules
                </label>

                {/* Day of week checkboxes */}
                <div>
                  <span className="text-[10px] text-charcoal/60 font-semibold block mb-1">Active Days of Week:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSel = selectedDays.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => toggleDaySelection(d.key)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                            isSel
                              ? "bg-marigold text-pineDark shadow-xs"
                              : "bg-white text-charcoal/70 border border-pine/10 hover:bg-stone"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time of day inputs */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-charcoal/60 font-semibold block mb-1">Daily Start Time:</span>
                    <input
                      type="time"
                      value={dailyStart}
                      onChange={(e) => setDailyStart(e.target.value)}
                      className="w-full border border-pine/20 rounded-xl px-2.5 py-1.5 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-charcoal/60 font-semibold block mb-1">Daily End Time:</span>
                    <input
                      type="time"
                      value={dailyEnd}
                      onChange={(e) => setDailyEnd(e.target.value)}
                      className="w-full border border-pine/20 rounded-xl px-2.5 py-1.5 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Structured Terms & Conditions (T&C) Selector */}
              <div className="pt-2 border-t border-pine/10">
                <TermsSelector
                  selectedTerms={selectedTerms}
                  onChangeTerms={setSelectedTerms}
                  autoValues={{
                    valid_to: endsAt,
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-pine/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-pine/20 text-pine font-bold text-xs hover:bg-stone transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
                >
                  {submitting ? "Saving…" : "Save Offer Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
