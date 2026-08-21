"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Suggestion {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  alt: string;
  photographerName: string;
  photographerUrl: string;
}

interface MenuImagePickerProps {
  dishName: string;
  value: string;
  onChange: (url: string) => void;
}

export function MenuImagePicker({ dishName, value, onChange }: MenuImagePickerProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFullUrl, setSelectedFullUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"suggest" | "upload" | "manual">("suggest");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to fetch session bearer headers
  async function getAuthHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  }

  // 1. Debounced auto-search when dish name changes
  useEffect(() => {
    const trimmed = dishName.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const authHeaders = await getAuthHeaders();
        const res = await fetch(`/api/admin/menu/search-images?query=${encodeURIComponent(trimmed)}`, {
          headers: authHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
        }
      } catch (e) {
        console.warn("Auto image search error:", e);
      } finally {
        setSearching(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [dishName]);

  // 2. Ingest external suggestion URL into Supabase Storage
  async function handleSelectSuggestion(suggestion: Suggestion) {
    setSelectedFullUrl(suggestion.fullUrl);
    setUploading(true);

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/admin/menu/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ imageUrl: suggestion.fullUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to store image in Supabase Storage");
      } else {
        onChange(data.publicUrl);
        toast.success("Image saved to Supabase Storage! 📦", {
          description: `Credit: ${suggestion.photographerName} on Unsplash`,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Error saving image to storage");
    } finally {
      setUploading(false);
    }
  }

  // 3. Direct local file upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP images are allowed");
      return;
    }

    setUploading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/menu/upload-image", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Upload failed");
      } else {
        onChange(data.publicUrl);
        toast.success("Custom photo uploaded to Supabase Storage! 📦");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-bold text-pine text-xs flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-marigold" />
          <span>Dish Image</span>
        </label>

        {/* Picker Mode Switcher */}
        <div className="flex items-center gap-1 bg-stone p-0.5 rounded-xl border border-pine/10 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("suggest")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              activeTab === "suggest"
                ? "bg-marigold text-pineDark shadow-xs font-extrabold"
                : "text-charcoal/70 hover:text-pine"
            }`}
          >
            <Sparkles className="w-3 h-3" /> Auto Suggest
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              activeTab === "upload"
                ? "bg-pine text-stone shadow-xs font-bold"
                : "text-charcoal/70 hover:text-pine"
            }`}
          >
            <Upload className="w-3 h-3" /> Upload Photo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeTab === "manual"
                ? "bg-pine text-stone shadow-xs font-bold"
                : "text-charcoal/70 hover:text-pine"
            }`}
          >
            Paste URL
          </button>
        </div>
      </div>

      {/* Selected Image Preview Card */}
      {value && (
        <div className="relative group rounded-2xl overflow-hidden border border-pine/20 bg-stone/40 p-2 flex items-center gap-3">
          <img
            src={value}
            alt="Dish preview"
            className="w-16 h-16 rounded-xl object-cover border border-pine/10 shrink-0 shadow-xs"
          />
          <div className="min-w-0 flex-1 text-[11px]">
            <p className="font-bold text-pine truncate">Current Dish Photo</p>
            <p className="text-[10px] text-emerald-700 font-semibold truncate flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3 text-emerald-600" /> Saved in Supabase Storage
            </p>
            <p className="text-[9px] text-charcoal/50 font-mono truncate">{value}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer shrink-0"
            title="Clear image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: Auto Suggestions Grid */}
      {activeTab === "suggest" && (
        <div className="space-y-2">
          {searching ? (
            <div className="bg-stone/50 rounded-2xl p-4 border border-pine/10 text-center space-y-2">
              <Loader2 className="w-5 h-5 text-marigold animate-spin mx-auto" />
              <p className="text-[11px] font-bold text-pine">
                Finding relevant food photos for "{dishName}"…
              </p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[10px] text-charcoal/60 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-marigold" /> Select an image (auto-stores to Supabase):
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {suggestions.map((item) => {
                  const isSelected = value && selectedFullUrl === item.fullUrl;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={uploading}
                      onClick={() => handleSelectSuggestion(item)}
                      className={`relative group rounded-xl overflow-hidden border transition-all cursor-pointer aspect-video bg-stone ${
                        isSelected
                          ? "border-marigold ring-2 ring-marigold shadow-md scale-105"
                          : "border-pine/15 hover:border-marigold hover:scale-105"
                      }`}
                    >
                      <img
                        src={item.thumbUrl}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                      />

                      {uploading && selectedFullUrl === item.fullUrl && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-marigold animate-spin" />
                        </div>
                      )}

                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[8px] text-white opacity-0 group-hover:opacity-100 transition truncate">
                        {item.photographerName}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            dishName.trim().length >= 3 && (
              <p className="text-[11px] text-charcoal/50 italic px-1">
                Type a dish name like "Butter Chicken", "Momos", "Pizza" to see instant photo suggestions!
              </p>
            )
          )}
        </div>
      )}

      {/* TAB 2: Upload Custom Photo */}
      {activeTab === "upload" && (
        <div className="bg-stone/50 p-4 rounded-2xl border border-dashed border-pine/30 text-center space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            className="hidden"
            id="dish-photo-upload"
          />

          <label
            htmlFor="dish-photo-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pine text-stone rounded-xl text-xs font-bold hover:bg-pineDark transition cursor-pointer shadow-xs"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Choose Image File (JPG/PNG/WEBP)</span>
          </label>
          <p className="text-[10px] text-charcoal/50 block">Max size: 5MB · Stored in Supabase Bucket</p>
        </div>
      )}

      {/* TAB 3: Manual URL Text Input */}
      {activeTab === "manual" && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone text-xs"
        />
      )}
    </div>
  );
}
