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
  ClipboardList,
  LogOut,
  Loader2,
  CheckCircle2,
  Calendar,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface CustomerData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address?: string | null;
  created_at: string;
  avatar_url?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Editable fields
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

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
                address: parsed.address || null,
                created_at: parsed.loggedInAt || new Date().toISOString(),
                avatar_url: parsed.avatar_url,
              });
              setAvatarUrl(parsed.avatar_url || null);
              setEditName(parsed.name);
              setEditPhone(parsed.phone || "");
              setEditAddress(parsed.address || "");
              setLoading(false);
              return;
            }
          }
          router.push("/login?redirect=/profile");
          return;
        }

        // Fetch from customers table
        const { data: customerRow } = await supabase
          .from("customers")
          .select("*")
          .eq("id", user.id)
          .single();

        const avatar =
          user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        setAvatarUrl(avatar);

        if (customerRow) {
          setCustomer({ ...customerRow, avatar_url: avatar });
          setEditName(customerRow.name || "");
          setEditPhone(customerRow.phone || "");
          setEditAddress((customerRow as any).address || "");
        } else {
          // User exists in auth but not in customers — build from metadata
          const fallbackCustomer: CustomerData = {
            id: user.id,
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Customer",
            email: user.email || null,
            phone: user.phone || null,
            created_at: user.created_at || new Date().toISOString(),
            avatar_url: avatar,
          };
          setCustomer(fallbackCustomer);
          setEditName(fallbackCustomer.name);
          setEditPhone(fallbackCustomer.phone || "");
          setEditAddress("");
        }
      } catch (e) {
        console.error("Profile load error:", e);
        router.push("/login?redirect=/profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleSave(field: string) {
    setSaving(true);
    try {
      const updates: Record<string, string | null> = {};

      if (field === "name") updates.name = editName.trim();
      if (field === "phone") updates.phone = editPhone.trim() || null;

      if (customer?.id && customer.id !== "local") {
        const { error } = await supabase
          .from("customers")
          .update(updates)
          .eq("id", customer.id);

        if (error) {
          console.warn("Update warning:", error.message);
        }
      }

      // Sync localStorage
      const savedProfile = localStorage.getItem("celebration_customer_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (field === "name") parsed.name = editName.trim();
        if (field === "phone") parsed.phone = editPhone.trim();
        if (field === "address") parsed.address = editAddress.trim();
        localStorage.setItem("celebration_customer_profile", JSON.stringify(parsed));
      }

      // Update local state
      if (customer) {
        const updated = { ...customer };
        if (field === "name") updated.name = editName.trim();
        if (field === "phone") updated.phone = editPhone.trim();
        if (field === "address") (updated as any).address = editAddress.trim();
        setCustomer(updated);
      }

      setEditingField(null);
      toast.success("Profile updated!", {
        description: `Your ${field} has been saved.`,
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("celebration_customer_profile");
      toast.success("Logged out successfully");
      router.push("/");
    } catch (e) {
      console.error(e);
    }
  }

  const initial = customer?.name ? customer.name.charAt(0).toUpperCase() : "C";

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121110] text-stone flex flex-col items-center justify-center p-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-marigold/15 blur-3xl pointer-events-none" />
        <div className="text-center space-y-4 z-10">
          <div className="w-16 h-16 rounded-3xl bg-marigold/20 border border-marigold/40 text-marigold flex items-center justify-center mx-auto shadow-2xl animate-pulse">
            <User className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2 text-marigold font-bold text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading profile…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const profileFields = [
    {
      key: "name",
      label: "Full Name",
      icon: User,
      value: customer.name,
      editValue: editName,
      setter: setEditName,
      placeholder: "Your name",
    },
    {
      key: "phone",
      label: "Phone Number",
      icon: Phone,
      value: customer.phone || "Not set",
      editValue: editPhone,
      setter: setEditPhone,
      placeholder: "+91 98765 43210",
      inputType: "tel",
    },
    {
      key: "address",
      label: "Default Delivery Address",
      icon: MapPin,
      value: (customer as any).address || "Not set",
      editValue: editAddress,
      setter: setEditAddress,
      placeholder: "House No., Ward, Main Bazar, Hamirpur",
    },
  ];

  return (
    <div className="min-h-screen bg-[#121110] text-stone relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-marigold/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121110]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone/80 hover:text-marigold transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-marigold" />
            <span className="font-heading font-bold text-stone text-sm">My Profile</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 z-10 relative space-y-6">
        {/* Profile Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-white/8 to-white/3 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={customer.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-3 border-marigold shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-marigold to-marigoldLight text-pineDark font-extrabold text-3xl flex items-center justify-center shadow-xl">
                  {initial}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-[#121110] flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1 min-w-0 space-y-1.5">
              <h2 className="font-heading text-2xl font-bold text-stone truncate">
                {customer.name}
              </h2>
              {customer.email && (
                <p className="text-stone/60 text-xs flex items-center gap-1.5 justify-center sm:justify-start">
                  <Mail className="w-3.5 h-3.5 text-marigold/70" />
                  <span className="truncate">{customer.email}</span>
                </p>
              )}
              <p className="text-stone/50 text-[11px] flex items-center gap-1.5 justify-center sm:justify-start">
                <Calendar className="w-3 h-3 text-marigold/60" />
                <span>Member since {formatDate(customer.created_at)}</span>
              </p>
              <div className="inline-flex items-center gap-1.5 bg-green-500/15 text-green-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-green-500/30 mt-1">
                <Shield className="w-3 h-3" />
                <span>Verified Customer</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Editable Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="text-xs font-bold text-stone/60 uppercase tracking-wider px-1">
            Personal Information
          </h3>

          {profileFields.map((field) => (
            <div
              key={field.key}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 transition hover:border-white/20"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-marigold/15 text-marigold flex items-center justify-center shrink-0">
                    <field.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-stone/50 font-bold uppercase tracking-wider">
                      {field.label}
                    </p>
                    {editingField === field.key ? (
                      <input
                        type={field.inputType || "text"}
                        value={field.editValue}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                        autoFocus
                        className="w-full bg-transparent border-b border-marigold/50 text-stone text-sm font-medium py-1 focus:outline-none focus:border-marigold transition placeholder:text-stone/30"
                      />
                    ) : (
                      <p
                        className={`text-sm font-medium truncate ${
                          field.value === "Not set"
                            ? "text-stone/40 italic"
                            : "text-stone"
                        }`}
                      >
                        {field.value}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit / Save / Cancel buttons */}
                {editingField === field.key ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSave(field.key)}
                      disabled={saving}
                      className="w-8 h-8 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center justify-center transition cursor-pointer"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingField(null)}
                      className="w-8 h-8 rounded-xl bg-white/10 text-stone/60 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingField(field.key)}
                    className="w-8 h-8 rounded-xl bg-white/10 text-marigold/80 hover:bg-marigold/20 hover:text-marigold flex items-center justify-center transition cursor-pointer shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-xs font-bold text-stone/60 uppercase tracking-wider px-1">
            Quick Links
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                href: "/orders",
                label: "My Orders",
                description: "View order history & reorder",
                icon: ClipboardList,
                color: "text-blue-400",
                bg: "bg-blue-500/15",
              },
              {
                href: "/order",
                label: "Order Food",
                description: "Browse menu & place order",
                icon: ShoppingBag,
                color: "text-marigold",
                bg: "bg-marigold/15",
              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-marigold/40 hover:bg-white/8 transition group"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${link.bg} ${link.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <link.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-stone">{link.label}</p>
                  <p className="text-[10px] text-stone/50">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 font-bold py-3.5 rounded-2xl transition cursor-pointer text-xs"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out of Your Account</span>
          </button>
        </motion.div>
      </main>
    </div>
  );
}
