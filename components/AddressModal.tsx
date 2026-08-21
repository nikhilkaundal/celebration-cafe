"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  MapPin,
  Compass,
  Check,
  AlertTriangle,
  Home,
  Briefcase,
  Tag,
  Phone,
  User,
  Loader2,
  ShieldCheck,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { InteractiveAddressMap } from "./InteractiveAddressMap";

export interface AddressData {
  id?: string;
  label: string;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedAddress: AddressData) => void;
  initialAddress?: AddressData | null;
}

// Celebration Cafe Hamirpur Default Coordinates
const DEFAULT_LAT = 31.6862;
const DEFAULT_LNG = 76.5213;

export function AddressModal({
  isOpen,
  onClose,
  onSuccess,
  initialAddress,
}: AddressModalProps) {
  const [labelCategory, setLabelCategory] = useState<string>("Home");
  const [customLabel, setCustomLabel] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Hamirpur");
  const [state, setState] = useState("Himachal Pradesh");
  const [pincode, setPincode] = useState("177001");
  const [isDefault, setIsDefault] = useState(false);

  // Geo & Map States
  const [lat, setLat] = useState<number>(DEFAULT_LAT);
  const [lng, setLng] = useState<number>(DEFAULT_LNG);
  const [locating, setLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [zoneStatus, setZoneStatus] = useState<{ isServiceable: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialAddress) {
        const lbl = initialAddress.label || "Home";
        if (["Home", "Work", "Other"].includes(lbl)) {
          setLabelCategory(lbl);
          setCustomLabel("");
        } else {
          setLabelCategory("Custom");
          setCustomLabel(lbl);
        }
        setReceiverName(initialAddress.receiver_name || "");
        setReceiverPhone(initialAddress.receiver_phone || "");
        setLine1(initialAddress.line1 || "");
        setLine2(initialAddress.line2 || "");
        setLandmark(initialAddress.landmark || "");
        setCity(initialAddress.city || "Hamirpur");
        setState(initialAddress.state || "Himachal Pradesh");
        setPincode(initialAddress.pincode || "177001");
        setIsDefault(Boolean(initialAddress.is_default));
        if (initialAddress.latitude && initialAddress.longitude) {
          setLat(Number(initialAddress.latitude));
          setLng(Number(initialAddress.longitude));
          validateDeliveryZone(Number(initialAddress.latitude), Number(initialAddress.longitude));
        } else {
          setLat(DEFAULT_LAT);
          setLng(DEFAULT_LNG);
        }
      } else {
        // New Address defaults
        resetForm();
        // Auto fetch live GPS location on open
        setTimeout(() => {
          handleUseCurrentLocation();
        }, 300);
      }
    }
  }, [isOpen, initialAddress]);

  function resetForm() {
    setLabelCategory("Home");
    setCustomLabel("");
    setReceiverName("");
    setReceiverPhone("");
    setLine1("");
    setLine2("");
    setLandmark("");
    setCity("Hamirpur");
    setState("Himachal Pradesh");
    setPincode("177001");
    setIsDefault(false);
    setLat(DEFAULT_LAT);
    setLng(DEFAULT_LNG);
    setGpsAccuracy(null);
    setZoneStatus(null);
  }

  // Validate Delivery Zone with API
  async function validateDeliveryZone(latitude: number, longitude: number) {
    try {
      const res = await fetch("/api/geo/validate-zone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, city, pincode }),
      });
      if (res.ok) {
        const data = await res.json();
        setZoneStatus({ isServiceable: data.isServiceable, message: data.message });
      }
    } catch (e) {
      console.warn("Zone validation error:", e);
    }
  }

  // Reverse Geocode Position into Text Fields
  async function reverseGeocode(latitude: number, longitude: number) {
    try {
      const res = await fetch(`/api/geo/reverse?lat=${latitude}&lng=${longitude}`);
      if (res.ok) {
        const data = await res.json();
        if (data.line1 && !line1) setLine1(data.line1);
        if (data.landmark && !landmark) setLandmark(data.landmark);
        if (data.city) setCity(data.city);
        if (data.state) setState(data.state);
        if (data.pincode) setPincode(data.pincode);
      }
    } catch (e) {
      console.warn("Reverse geocoding error:", e);
    }
  }

  // Handle High-Accuracy Geolocation Detection on Button Tap
  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    setGpsAccuracy(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        setLat(newLat);
        setLng(newLng);
        setGpsAccuracy(accuracy);
        setLocating(false);

        if (accuracy > 50) {
          toast.info(`Location accuracy is ±${accuracy}m. Please drag the pin to your exact building.`);
        } else {
          toast.success(`Location detected! Accuracy: ±${accuracy}m`);
        }

        await reverseGeocode(newLat, newLng);
        await validateDeliveryZone(newLat, newLng);
      },
      (err) => {
        setLocating(false);
        console.error("GPS Error:", err);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enter address manually.");
        } else {
          toast.error("Could not fetch precise location. Please enter address manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }

  // Handle Dragging Pin on Interactive Map
  async function handleMapPinChange(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
    await reverseGeocode(newLat, newLng);
    await validateDeliveryZone(newLat, newLng);
  }

  // Submit Address Form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!line1.trim()) {
      toast.error("Address Line 1 is required");
      return;
    }

    const cleanedPincode = pincode.replace(/\D/g, "");
    if (cleanedPincode.length !== 6) {
      toast.error("Pincode must be a 6-digit number");
      return;
    }

    const finalLabel = labelCategory === "Custom" ? customLabel.trim() || "Address" : labelCategory;

    setSubmitting(true);
    try {
      // 1. Check active Supabase authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      let customerId = user?.id || null;

      // 2. Check stored customer profile in localStorage
      if (!customerId) {
        try {
          const storedRaw = localStorage.getItem("celebration_customer_profile");
          if (storedRaw) {
            const p = JSON.parse(storedRaw);
            customerId = p.id || p.email || p.phone || null;
          }
        } catch (e) {
          console.warn("Error reading stored profile:", e);
        }
      }

      // 3. Fallback to receiver phone or guest UUID
      if (!customerId && receiverPhone.trim()) {
        customerId = receiverPhone.trim().replace(/\D/g, "");
      }

      if (!customerId) {
        customerId = "00000000-0000-0000-0000-000000000000";
      }

      const payload = {
        id: initialAddress?.id,
        customer_id: customerId,
        label: finalLabel,
        receiver_name: receiverName.trim() || null,
        receiver_phone: receiverPhone.trim() || null,
        line1: line1.trim(),
        line2: line2.trim() || null,
        landmark: landmark.trim() || null,
        city: city.trim() || "Hamirpur",
        state: state.trim() || "Himachal Pradesh",
        pincode: cleanedPincode,
        latitude: lat,
        longitude: lng,
        is_default: isDefault,
      };

      const isEdit = Boolean(initialAddress?.id && !initialAddress.id.startsWith("local_"));
      const res = await fetch("/api/customer/addresses", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save address to Supabase");
        return;
      }

      toast.success(`Address '${finalLabel}' saved successfully!`);
      onSuccess(data.address);
      onClose();
    } catch (e: any) {
      console.error("Error saving address to Supabase:", e);
      toast.error(`Error saving address: ${e.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative z-10 bg-card text-card-foreground border border-border w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-foreground">
                  {initialAddress ? "Edit Delivery Address" : "Add New Delivery Address"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  High-accuracy GPS detection & interactive pin drop
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs custom-scrollbar">
            {/* Live Location Trigger & GPS Accuracy */}
            <div className="bg-accent/10 border border-accent/30 p-3 rounded-2xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  className="bg-accent text-accent-foreground font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {locating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Getting Precise Location…</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4" />
                      <span>Use Current Location</span>
                    </>
                  )}
                </button>

                {gpsAccuracy !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                      gpsAccuracy <= 50
                        ? "bg-green-500/15 text-green-600 border-green-500/30"
                        : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                    }`}
                  >
                    Accuracy: ±{gpsAccuracy}m
                  </span>
                )}
              </div>

              {gpsAccuracy !== null && gpsAccuracy > 50 && (
                <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>GPS accuracy is low indoors. Please drag the pin on the map below to your exact building.</span>
                </p>
              )}
            </div>

            {/* Interactive Leaflet Map */}
            <InteractiveAddressMap
              latitude={lat}
              longitude={lng}
              onPositionChange={handleMapPinChange}
            />

            {/* Serviceability Badge */}
            {zoneStatus && (
              <div
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  zoneStatus.isServiceable
                    ? "bg-green-500/10 border-green-500/30 text-green-600"
                    : "bg-red-500/10 border-red-500/30 text-red-600"
                }`}
              >
                {zoneStatus.isServiceable ? (
                  <ShieldCheck className="w-4 h-4 shrink-0 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{zoneStatus.message}</span>
              </div>
            )}

            {/* Label Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground">Address Label *</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "Home", icon: Home },
                  { key: "Work", icon: Briefcase },
                  { key: "Other", icon: Building },
                  { key: "Custom", icon: Tag },
                ].map((item) => {
                  const IconComp = item.icon;
                  const isSel = labelCategory === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setLabelCategory(item.key)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSel
                          ? "bg-accent text-accent-foreground shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{item.key}</span>
                    </button>
                  );
                })}
              </div>

              {labelCategory === "Custom" && (
                <input
                  type="text"
                  placeholder="e.g. Grandma's House, Gym"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 mt-1"
                />
              )}
            </div>

            {/* Receiver Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">Receiver Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="e.g. Rohit Kumar"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">Receiver Phone (10 Digits)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Address Line 1 & Line 2 */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">Address Line 1 (House/Street) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. H.No 42, Ward No 3, Near Gandhi Chowk"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Market Road"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Opp. City Hospital"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">State *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-2.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent accent-accent cursor-pointer"
              />
              <label htmlFor="is_default" className="text-xs font-bold text-foreground cursor-pointer">
                Set as Default Delivery Address
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-muted text-muted-foreground font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-muted/80 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-accent text-accent-foreground font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Saving Address…" : "Save Address"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
