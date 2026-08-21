"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  Building,
  Tag,
  Trash2,
  Edit2,
  CheckCircle2,
  ArrowLeft,
  Phone,
  User,
  ShieldCheck,
  Compass,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AddressModal, type AddressData } from "@/components/AddressModal";
import CustomerUserMenu from "@/components/CustomerUserMenu";

export default function MyAddressesPage() {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const customerId = user?.id || "";

      const res = await fetch(`/api/customer/addresses?customer_id=${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
        return;
      }
    } catch (e) {
      console.warn("Failed to fetch addresses:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetDefault(addr: AddressData) {
    if (addr.is_default || !addr.id) return;
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: addr.id, is_default: true }),
      });

      if (res.ok) {
        toast.success(`'${addr.label}' set as default address!`);
        fetchAddresses();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to set default address");
      }
    } catch (e) {
      toast.error("Failed to update default address");
    }
  }

  async function handleDelete(addr: AddressData) {
    if (!addr.id) return;
    if (!confirm(`Are you sure you want to delete address '${addr.label}'?`)) return;

    try {
      const res = await fetch(`/api/customer/addresses?id=${addr.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Address '${addr.label}' deleted from Supabase`);
        fetchAddresses();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete address");
      }
    } catch (e) {
      toast.error("Error deleting address");
    }
  }

  function getLabelIcon(label: string) {
    if (label.toLowerCase() === "home") return Home;
    if (label.toLowerCase() === "work" || label.toLowerCase() === "office") return Briefcase;
    if (label.toLowerCase() === "other") return Building;
    return Tag;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-md px-4 py-3 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/order" className="font-heading font-extrabold text-lg text-foreground flex items-center gap-2">
            ☕ Celebration Cafe
          </Link>
          <CustomerUserMenu />
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-accent transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to My Profile
            </Link>
            <h1 className="font-heading text-2xl font-extrabold text-foreground flex items-center gap-2">
              <MapPin className="w-6 h-6 text-accent" /> Saved Delivery Addresses
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage your delivery locations with GPS pin precision & delivery zone status
            </p>
          </div>

          <button
            onClick={() => {
              setEditingAddress(null);
              setModalOpen(true);
            }}
            disabled={addresses.length >= 10}
            className="bg-accent text-accent-foreground font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </button>
        </div>

        {/* Address Cards List */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-xs">Loading your addresses...</div>
        ) : addresses.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto my-8 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto">
              <Compass className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-foreground">No Saved Addresses Found</h3>
              <p className="text-xs text-muted-foreground">
                Add your Home, Work, or Custom address for fast 1-click checkout!
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAddress(null);
                setModalOpen(true);
              }}
              className="bg-accent text-accent-foreground font-bold px-5 py-2.5 rounded-2xl text-xs shadow-md inline-flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Address Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => {
              const IconComp = getLabelIcon(addr.label);

              return (
                <div
                  key={addr.id}
                  className={`bg-card border-2 rounded-3xl p-5 space-y-3 flex flex-col justify-between shadow-xs transition-all ${
                    addr.is_default
                      ? "border-accent bg-accent/5 shadow-md"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header Row: Label & Default Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <h3 className="font-heading font-bold text-sm text-foreground">{addr.label}</h3>
                      </div>

                      {addr.is_default ? (
                        <span className="text-[10px] font-extrabold bg-accent text-accent-foreground px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3" /> Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(addr)}
                          className="text-[10px] font-semibold text-muted-foreground hover:text-accent transition-colors cursor-pointer"
                        >
                          Make Default
                        </button>
                      )}
                    </div>

                    {/* Receiver Info */}
                    {(addr.receiver_name || addr.receiver_phone) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-foreground/90 bg-muted/40 p-2 rounded-xl border border-border/50">
                        {addr.receiver_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-accent" /> {addr.receiver_name}
                          </span>
                        )}
                        {addr.receiver_phone && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-accent" /> {addr.receiver_phone}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Address Text */}
                    <div className="text-xs text-foreground/80 leading-relaxed space-y-0.5 font-medium">
                      <p className="font-bold text-foreground">{addr.line1}</p>
                      {addr.line2 && <p>{addr.line2}</p>}
                      {addr.landmark && <p className="text-muted-foreground text-[11px]">Landmark: {addr.landmark}</p>}
                      <p className="text-muted-foreground text-[11px]">
                        {addr.city}, {addr.state} — <span className="font-mono font-bold">{addr.pincode}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {addr.latitude && addr.longitude ? (
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> GPS Pin Set
                        </span>
                      ) : (
                        <span>Standard Address</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingAddress(addr);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                        title="Edit address"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(addr)}
                        className="p-1.5 rounded-xl bg-muted text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <AddressModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => fetchAddresses()}
          initialAddress={editingAddress}
        />
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © Celebration Cafe Hamirpur. All rights reserved.
      </footer>
    </div>
  );
}
