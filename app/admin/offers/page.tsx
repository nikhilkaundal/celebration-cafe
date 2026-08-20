"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Tag,
  Plus,
  Trash2,
  Check,
  X,
  Percent,
  Calendar,
  Sparkles,
  AlertTriangle,
  Copy,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type Offer } from "@/lib/supabase";

export default function AdminOffersPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [addOfferModalOpen, setAddOfferModalOpen] = useState(false);
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState<number>(100);
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function verifyOwnerAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data: staffRow } = await supabase
        .from("staff")
        .select("role")
        .eq("id", user.id)
        .single();

      if (staffRow?.role !== "owner") {
        toast.error("Only the cafe owner can manage offers & coupons");
        router.push("/admin/orders");
        return;
      }

      setIsOwner(true);
      setChecking(false);
      loadOffers();
    }

    verifyOwnerAccess();
  }, [router]);

  async function loadOffers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast.error("Failed to load offers");
      } else {
        setOffers((data as Offer[]) || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Quick toggle is_active without full edit form
  async function toggleOfferActive(offer: Offer) {
    const nextVal = !offer.is_active;

    // Optimistic UI update
    setOffers((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, is_active: nextVal } : o))
    );

    const { error } = await supabase
      .from("offers")
      .update({ is_active: nextVal })
      .eq("id", offer.id);

    if (error) {
      toast.error("Failed to update coupon status");
      loadOffers();
    } else {
      toast.success(
        `Coupon ${offer.coupon_code} is now ${nextVal ? "Active" : "Disabled"}`
      );
    }
  }

  // Create Offer
  async function handleCreateOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !couponCode.trim()) {
      toast.error("Title and Coupon Code are required");
      return;
    }

    setSubmitting(true);
    try {
      const { data: created, error } = await supabase
        .from("offers")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          coupon_code: couponCode.trim().toUpperCase(),
          discount_type: discountType,
          discount_value: discountValue,
          is_active: isActive,
          valid_until: validUntil || null,
        })
        .select()
        .single();

      if (error || !created) {
        console.error(error);
        toast.error("Failed to create offer");
      } else {
        toast.success(`Coupon ${created.coupon_code} created!`);
        setOffers((prev) => [created as Offer, ...prev]);
        setAddOfferModalOpen(false);
        resetForm();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCouponCode("");
    setDiscountType("flat");
    setDiscountValue(100);
    setValidUntil("");
    setIsActive(true);
  }

  // Delete Offer
  async function confirmDeleteOffer() {
    if (!deletingOfferId) return;

    try {
      const { error } = await supabase
        .from("offers")
        .delete()
        .eq("id", deletingOfferId);

      if (error) {
        toast.error("Failed to delete offer");
      } else {
        toast.success("Coupon deleted");
        setOffers((prev) => prev.filter((o) => o.id !== deletingOfferId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingOfferId(null);
    }
  }

  if (checking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs font-bold text-pine">
        Verifying Owner Access…
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-pine/10 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-bold text-pine flex items-center gap-2">
            <Tag className="w-6 h-6 text-marigold" /> Offers & Coupons Management
          </h1>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Create promotional discount codes and toggle active offers (Owner Only)
          </p>
        </div>

        <button
          onClick={() => setAddOfferModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-marigold text-pineDark hover:bg-marigoldLight text-xs font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="text-center py-16 text-xs text-charcoal/60">
          Loading offers…
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center space-y-3 border border-pine/10">
          <Tag className="w-10 h-10 text-pine/30 mx-auto" />
          <h3 className="font-heading text-lg font-bold text-pine">No active coupons created</h3>
          <p className="text-xs text-charcoal/60 max-w-sm mx-auto">
            Create promo codes like CELEB20 or FREEDEL to give discounts to Hamirpur customers.
          </p>
          <button
            onClick={() => setAddOfferModalOpen(true)}
            className="mt-2 bg-pine text-stone px-5 py-2.5 rounded-2xl text-xs font-bold"
          >
            Create First Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`bg-white rounded-3xl border ${
                offer.is_active ? "border-pine/20" : "border-gray-200 bg-gray-50/50"
              } p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold bg-marigold/20 text-pine border border-marigold/40 px-3 py-1 rounded-xl">
                    {offer.coupon_code}
                  </span>

                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => toggleOfferActive(offer)}
                    className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    title="Click to toggle active status"
                  >
                    {offer.is_active ? (
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                        <ToggleRight className="w-4 h-4 text-emerald-600" /> Active
                      </span>
                    ) : (
                      <span className="text-gray-500 font-bold flex items-center gap-1 bg-gray-200 px-2 py-0.5 rounded-full text-[10px]">
                        <ToggleLeft className="w-4 h-4 text-gray-400" /> Disabled
                      </span>
                    )}
                  </button>
                </div>

                <h3 className="font-heading text-base font-bold text-pine leading-tight pt-1">
                  {offer.title}
                </h3>

                {offer.description && (
                  <p className="text-xs text-charcoal/60 leading-relaxed">
                    {offer.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-pine/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-charcoal/50 uppercase block font-semibold">
                    Discount Value
                  </span>
                  <span className="font-heading text-sm font-extrabold text-pine">
                    {offer.discount_type === "flat"
                      ? `₹${offer.discount_value} OFF`
                      : `${offer.discount_value}% OFF`}
                  </span>
                </div>

                <button
                  onClick={() => setDeletingOfferId(offer.id)}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                  title="Delete offer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Add New Offer ── */}
      <AnimatePresence>
        {addOfferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setAddOfferModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-white border border-pine/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-pine/10 pb-3">
                <h2 className="font-heading text-lg font-bold text-pine">Create New Coupon Offer</h2>
                <button onClick={() => setAddOfferModalOpen(false)}>
                  <X className="w-5 h-5 text-charcoal/60" />
                </button>
              </div>

              <form onSubmit={handleCreateOffer} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-pine mb-1">Coupon Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 20% OFF Above ₹499"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-pine mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CELEB20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone font-mono font-bold text-sm uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-pine mb-1">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone text-xs"
                    >
                      <option value="flat">Flat Amount (₹)</option>
                      <option value="percent">Percentage (%)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-pine mb-1">Discount Value *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-pine mb-1">Valid Until (Optional)</label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-pine mb-1">Description / T&C</label>
                  <textarea
                    rows={2}
                    placeholder="Valid on orders above ₹499 across Hamirpur town…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 bg-stone/60 p-3 rounded-xl border border-pine/10">
                  <input
                    type="checkbox"
                    id="offerActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-pine rounded cursor-pointer"
                  />
                  <label htmlFor="offerActiveCheck" className="font-bold text-pine cursor-pointer">
                    Enable Coupon Immediately on Online Order Page
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddOfferModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-pine/20 text-charcoal font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-marigold text-pineDark font-extrabold shadow-md hover:bg-marigoldLight transition cursor-pointer"
                  >
                    {submitting ? "Creating…" : "Save Offer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Delete Confirmation ── */}
      <AnimatePresence>
        {deletingOfferId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeletingOfferId(null)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-white border border-red-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-pine">Delete Coupon?</h3>
              <p className="text-xs text-charcoal/60">
                Are you sure you want to delete this promotional coupon offer?
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeletingOfferId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-pine/20 text-xs font-bold text-charcoal"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteOffer}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 transition cursor-pointer"
                >
                  Delete Offer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
