"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  Coffee,
  Save,
  Edit3,
  X,
  ShoppingBag,
  LogOut,
  Loader2,
  CheckCircle2,
  Calendar,
  Shield,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type Address } from "@/lib/supabase";

interface CustomerData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  avatar_url?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("Hamirpur");
  const [addrPincode, setAddrPincode] = useState("177001");
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [submittingAddr, setSubmittingAddr] = useState(false);

  // Editable fields
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Check localStorage fallback
          const saved = localStorage.getItem("celebration_customer_profile");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.isLoggedIn && parsed.name) {
              setCustomer({
                id: "local",
                name: parsed.name,
                email: parsed.email || null,
                phone: parsed.phone || null,
                created_at: parsed.loggedInAt || new Date().toISOString(),
                avatar_url: parsed.avatar_url,
              });
              setAvatarUrl(parsed.avatar_url || null);
              setEditName(parsed.name);
              setEditPhone(parsed.phone || "");
              setLoading(false);
              return;
            }
          }
          router.push("/login?redirect=/profile");
          return;
        }

        // Fetch from profiles table
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const avatar =
          user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        setAvatarUrl(avatar);

        if (profileRow) {
          setCustomer({
            id: profileRow.id,
            name: profileRow.full_name || "",
            email: profileRow.email,
            phone: profileRow.phone,
            created_at: profileRow.created_at,
            avatar_url: avatar,
          });
          setEditName(profileRow.full_name || "");
          setEditPhone(profileRow.phone || "");

          // Load Saved Addresses
          loadAddresses(user.id);
        } else {
          setCustomer({
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer",
            email: user.email || null,
            phone: user.phone || null,
            created_at: user.created_at || new Date().toISOString(),
            avatar_url: avatar,
          });
          setEditName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer");
        }
      } catch (e) {
        console.error("Profile load error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function loadAddresses(userId: string) {
    try {
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("customer_id", userId)
        .order("is_default", { ascending: false });

      if (data) setAddresses(data as Address[]);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveField(field: "name" | "phone") {
    if (!customer) return;
    setSaving(true);

    try {
      if (customer.id !== "local") {
        const updateObj = field === "name" ? { full_name: editName } : { phone: editPhone };
        const { error } = await supabase
          .from("profiles")
          .update(updateObj)
          .eq("id", customer.id);

        if (error) {
          toast.error("Failed to update profile");
          setSaving(false);
          return;
        }
      }

      // Update local state & localStorage
      const updatedCustomer = {
        ...customer,
        name: field === "name" ? editName : customer.name,
        phone: field === "phone" ? editPhone : customer.phone,
      };
      setCustomer(updatedCustomer);

      const localObj = {
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        avatar_url: avatarUrl,
        isLoggedIn: true,
      };
      localStorage.setItem("celebration_customer_profile", JSON.stringify(localObj));

      toast.success(`${field === "name" ? "Name" : "Phone"} updated!`);
      setEditingField(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || customer.id === "local" || !addrLine1.trim()) return;

    setSubmittingAddr(true);
    try {
      const newAddr = {
        customer_id: customer.id,
        label: addrLabel,
        line1: addrLine1.trim(),
        line2: addrLine2.trim() || null,
        city: addrCity.trim(),
        pincode: addrPincode.trim(),
        is_default: addrIsDefault,
      };

      const { data, error } = await supabase
        .from("addresses")
        .insert(newAddr)
        .select()
        .single();

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Delivery address saved!");
        setShowAddAddressModal(false);
        setAddrLine1("");
        setAddrLine2("");
        loadAddresses(customer.id);
      }
    } catch (e) {
      toast.error("Failed to save address");
    } finally {
      setSubmittingAddr(false);
    }
  }

  async function handleDeleteAddress(addrId: string) {
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", addrId);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Address deleted");
        if (customer) loadAddresses(customer.id);
      }
    } catch (e) {
      toast.error("Failed to delete address");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("celebration_customer_profile");
    toast.success("Logged out successfully");
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-xs font-semibold text-muted-foreground">Loading Your Profile…</p>
      </div>
    );
  }

  if (!customer) return null;

  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-background text-foreground max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Menu
      </Link>

      {/* Header Profile Card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-heading font-extrabold text-xl flex items-center justify-center shrink-0 overflow-hidden shadow-md">
          {avatarUrl && !avatarError ? (
            <img
              src={avatarUrl}
              alt={customer.name}
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-xl font-bold text-foreground truncate">{customer.name}</h1>
          <p className="text-xs text-muted-foreground truncate">{customer.email || "No email linked"}</p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
            <Shield className="w-3.5 h-3.5" /> Verified Customer Account
          </div>
        </div>
      </div>

      {/* Account Details Box */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="font-heading text-base font-bold text-foreground border-b border-border pb-3">
          Account Profile Details
        </h2>

        {/* Full Name */}
        <div className="flex items-center justify-between py-2 border-b border-border/40 text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Full Name</span>
            {editingField === "name" ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border border-border rounded-lg px-2 py-1 bg-background text-foreground font-bold mt-1"
              />
            ) : (
              <span className="font-bold text-foreground text-sm">{customer.name}</span>
            )}
          </div>

          {editingField === "name" ? (
            <button
              onClick={() => handleSaveField("name")}
              disabled={saving}
              className="p-2 rounded-xl bg-primary text-primary-foreground font-bold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
          ) : (
            <button onClick={() => setEditingField("name")} className="text-primary hover:underline font-semibold">
              Edit
            </button>
          )}
        </div>

        {/* Phone Number */}
        <div className="flex items-center justify-between py-2 border-b border-border/40 text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Phone Number</span>
            {editingField === "phone" ? (
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="border border-border rounded-lg px-2 py-1 bg-background text-foreground font-bold mt-1"
              />
            ) : (
              <span className="font-bold text-foreground text-sm">{customer.phone || "Not set"}</span>
            )}
          </div>

          {editingField === "phone" ? (
            <button
              onClick={() => handleSaveField("phone")}
              disabled={saving}
              className="p-2 rounded-xl bg-primary text-primary-foreground font-bold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
          ) : (
            <button onClick={() => setEditingField("phone")} className="text-primary hover:underline font-semibold">
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Saved Delivery Addresses Section */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Saved Delivery Addresses
          </h2>

          {customer.id !== "local" && (
            <button
              onClick={() => setShowAddAddressModal(true)}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          )}
        </div>

        {addresses.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No saved addresses found. Add a home or office address for fast checkout!
          </p>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-3.5 bg-muted/40 rounded-2xl border border-border flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <span>{addr.label}</span>
                    {addr.is_default && (
                      <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}</p>
                </div>

                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Links & Actions */}
      <div className="space-y-3">
        <Link
          href="/orders"
          className="w-full bg-card border border-border hover:border-primary/40 p-4 rounded-2xl font-semibold text-xs flex items-center justify-between transition shadow-xs"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <span>View My Past Orders & Live Tracker</span>
          </div>
          <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/30 p-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Log Out Account
        </button>
      </div>

      {/* Modal: Add Address */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-lg font-bold text-foreground">Add New Delivery Address</h3>
              <button onClick={() => setShowAddAddressModal(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Address Label</label>
                <select
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 bg-background text-xs font-semibold"
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">House No & Street *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. H.No 45, Near Bus Stand"
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 bg-background text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Landmark / Area</label>
                <input
                  type="text"
                  placeholder="e.g. Near Cafe Celebration"
                  value={addrLine2}
                  onChange={(e) => setAddrLine2(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 bg-background text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-foreground mb-1">City</label>
                  <input
                    type="text"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2 bg-background text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-foreground mb-1">Pincode</label>
                  <input
                    type="text"
                    value={addrPincode}
                    onChange={(e) => setAddrPincode(e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2 bg-background text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="set_default_addr"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="rounded text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="set_default_addr" className="font-bold text-foreground text-xs cursor-pointer">
                  Set as Default Delivery Address
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAddr}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md cursor-pointer"
                >
                  {submittingAddr ? "Saving…" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
