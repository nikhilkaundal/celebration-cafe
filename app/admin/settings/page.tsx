"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Copy,
  Building2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type Profile } from "@/lib/supabase";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form State
  const [upiId, setUpiId] = useState("celebrationcafe@upi");
  const [currentQrUrl, setCurrentQrUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Verify User Profile
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (prof) setProfile(prof as Profile);
        }

        // 2. Fetch Existing Payment Settings
        const res = await fetch("/api/settings/public");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            if (data.settings.upi_id) setUpiId(data.settings.upi_id);
            if (data.settings.payment_qr_url) setCurrentQrUrl(data.settings.payment_qr_url);
          }
        }
      } catch (e) {
        console.error("Settings load error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WebP image file.");
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!upiId.trim()) {
      setErrorMessage("UPI ID cannot be blank.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("upi_id", upiId.trim());
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/admin/settings/payment-qr", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update payment settings");
        toast.error(data.error || "Failed to update payment settings");
      } else {
        toast.success("Payment settings updated & audit logged!");
        if (data.payment_qr_url) {
          setCurrentQrUrl(data.payment_qr_url);
          setFilePreview(null);
          setSelectedFile(null);
        }
      }
    } catch (err: any) {
      console.error("Save settings error:", err);
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#1F3B2C]">
        <Loader2 className="w-8 h-8 animate-spin text-marigold mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading Settings…</p>
      </div>
    );
  }

  // Access restriction check: Owner only
  if (profile?.role !== "owner") {
    return (
      <div className="max-w-lg mx-auto my-12 bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="font-heading text-xl font-bold text-red-800">Owner Access Required</h2>
        <p className="text-xs text-red-700 leading-relaxed">
          Payment QR Code & financial settings can only be managed by the Cafe Owner role. Your current role is <strong>"{profile?.role}"</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <span className="text-[10px] font-extrabold bg-marigold/20 text-[#1F3B2C] border border-marigold/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Financial & Payment Settings
          </span>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#1F3B2C] mt-1.5 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-marigold" /> Restaurant Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your real UPI Payment QR code and store payment info for customer checkout
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-800 text-xs p-4 rounded-2xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: QR Code Upload & Preview */}
        <div className="bg-white border border-border rounded-3xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="font-heading text-base font-bold text-[#1F3B2C] flex items-center gap-2">
              <QrCode className="w-5 h-5 text-marigold" /> Payment QR Code Image
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload your restaurant's official Google Pay, Paytm, or PhonePe UPI QR code image. Customers will scan this directly on the checkout screen.
            </p>

            {/* Image Preview Box */}
            <div className="mt-4 p-4 bg-[#FAF7F0] border border-border/60 rounded-2xl text-center space-y-3">
              {filePreview ? (
                <div className="space-y-2">
                  <div className="w-48 h-48 bg-white border border-gray-300 rounded-2xl mx-auto p-2 shadow-inner overflow-hidden flex items-center justify-center">
                    <img src={filePreview} alt="Selected QR Preview" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block">
                    New Image Selected (Click Save Below)
                  </span>
                </div>
              ) : currentQrUrl ? (
                <div className="space-y-2">
                  <div className="w-48 h-48 bg-white border border-gray-300 rounded-2xl mx-auto p-2 shadow-inner overflow-hidden flex items-center justify-center">
                    <img src={currentQrUrl} alt="Active Payment QR" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                    Active QR Code Saved
                  </span>
                </div>
              ) : (
                <div className="w-48 h-48 bg-white border border-dashed border-gray-300 rounded-2xl mx-auto flex flex-col items-center justify-center p-4 space-y-2 text-muted-foreground">
                  <QrCode className="w-12 h-12 opacity-40" />
                  <p className="text-xs font-semibold">No QR Code Uploaded</p>
                  <p className="text-[10px]">Upload your UPI QR image below</p>
                </div>
              )}

              {/* Upload Input */}
              <div className="pt-2">
                <label className="bg-[#1F3B2C] hover:bg-[#15281e] text-[#FAF7F0] font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer inline-flex items-center gap-2 transition shadow-md">
                  <Upload className="w-4 h-4 text-marigold" />
                  <span>{currentQrUrl || filePreview ? "Change QR Image" : "Upload QR Image"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Supported: PNG, JPEG, WebP · Max 5MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: UPI ID & Save Button */}
        <div className="bg-white border border-border rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="font-heading text-base font-bold text-[#1F3B2C] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-marigold" /> Store UPI Details
            </h2>

            <div>
              <label className="block text-xs font-bold text-[#1F3B2C] mb-1.5">
                Official Cafe UPI ID *
              </label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. celebrationcafe@upi"
                className="w-full border border-border rounded-2xl px-4 py-3 bg-[#FAF7F0] font-mono text-sm font-bold text-[#1F3B2C] focus:outline-none focus:ring-2 focus:ring-marigold/50"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                This UPI ID will be displayed on the customer checkout page with a 1-click copy button.
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" /> Security & Audit Guarantee
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                All changes to the payment QR code and UPI ID are logged in the System Audit Trail with your Owner Account ID to prevent fraud or unauthorized modifications.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#1F3B2C] hover:bg-[#15281e] text-[#FAF7F0] font-extrabold py-4 px-6 rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-marigold" />
                <span>Saving Payment Settings…</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-marigold" />
                <span>Save Payment Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
