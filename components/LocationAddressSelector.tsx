"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Plus, Check, Home, Briefcase, Building, Tag, ChevronDown, Compass, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AddressModal, type AddressData } from "./AddressModal";

export function LocationAddressSelector() {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    try {
      setLoading(true);
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
      }
      const token = session?.access_token;

      if (token) {
        const res = await fetch("/api/customer/addresses", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const list: AddressData[] = data.addresses || [];
          setAddresses(list);

          if (list.length > 0) {
            const defaultAddr = list.find((a) => a.is_default) || list[0];
            setSelectedAddressId(defaultAddr.id || null);
          }
          return;
        }
      }

      // Guest local storage fallback
      const raw = localStorage.getItem("celebration_saved_addresses");
      if (raw) {
        const localList: AddressData[] = JSON.parse(raw);
        setAddresses(localList);
        if (localList.length > 0) {
          const defaultAddr = localList.find((a) => a.is_default) || localList[0];
          setSelectedAddressId(defaultAddr.id || null);
        }
      } else {
        setAddresses([]);
      }
    } catch (e) {
      console.warn("Failed to fetch location addresses:", e);
    } finally {
      setLoading(false);
    }
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  function handleSelect(addr: AddressData) {
    if (addr.id) {
      setSelectedAddressId(addr.id);
      setPopoverOpen(false);
      toast.success(`Delivery address set to '${addr.label}'`);
    }
  }

  function getLabelIcon(label: string) {
    const l = label.toLowerCase();
    if (l === "home") return Home;
    if (l === "work" || l === "office") return Briefcase;
    if (l === "other") return Building;
    return Tag;
  }

  return (
    <div className="relative inline-block">
      {/* Header Pill Trigger */}
      <button
        type="button"
        onClick={() => setPopoverOpen(!popoverOpen)}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-marigold bg-white/10 hover:bg-white/20 border border-marigold/30 px-3 py-1 rounded-full transition-all cursor-pointer shadow-xs max-w-[200px] sm:max-w-[260px] truncate"
        title="Change delivery location"
      >
        <MapPin className="w-3.5 h-3.5 text-marigold shrink-0" />
        <span className="truncate">
          {selectedAddress
            ? `${selectedAddress.label}: ${selectedAddress.line1}`
            : "Hamirpur, HP"}
        </span>
        <ChevronDown className="w-3 h-3 text-marigold/70 shrink-0 ml-0.5" />
      </button>

      {/* Address Selector Popover */}
      <AnimatePresence>
        {popoverOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:absolute sm:inset-auto sm:top-10 sm:left-0 sm:z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs sm:hidden"
              onClick={() => setPopoverOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative z-10 w-full max-w-sm sm:w-80 bg-[#1A1816] text-stone border border-white/15 rounded-3xl p-4 shadow-2xl space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-marigold/15 text-marigold flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-xs text-stone">Select Delivery Location</h4>
                    <p className="text-[10px] text-stone/60">Choose active address for orders</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPopoverOpen(false)}
                  className="w-6 h-6 rounded-full bg-white/10 text-stone/70 hover:text-stone flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Saved Address Radio List */}
              {loading ? (
                <div className="py-4 text-center text-stone/60">Loading addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="py-3 text-center space-y-2">
                  <p className="text-[11px] text-stone/70">No saved addresses found in Hamirpur.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPopoverOpen(false);
                      setAddressModalOpen(true);
                    }}
                    className="bg-marigold text-pineDark font-bold px-3.5 py-1.5 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Address Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const IconComp = getLabelIcon(addr.label);

                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelect(addr)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                          isSelected
                            ? "bg-marigold/15 border-marigold text-stone font-medium shadow-xs"
                            : "bg-white/5 border-white/10 hover:bg-white/10 text-stone/80"
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <IconComp className="w-3.5 h-3.5 text-marigold shrink-0" />
                            <span className="font-bold text-stone text-xs">{addr.label}</span>
                            {addr.is_default && (
                              <span className="text-[9px] font-extrabold bg-marigold text-pineDark px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-stone/90 text-xs font-semibold truncate">{addr.line1}</p>
                          <p className="text-[10px] text-stone/60 truncate">
                            {addr.city}, {addr.pincode}
                          </p>
                        </div>

                        <div className="shrink-0 pt-1">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-marigold bg-marigold" : "border-white/30"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-pineDark" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add New Address Button */}
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setPopoverOpen(false);
                    setAddressModalOpen(true);
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/15 text-marigold font-extrabold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Address with Map Pin</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        onSuccess={() => fetchAddresses()}
      />
    </div>
  );
}
