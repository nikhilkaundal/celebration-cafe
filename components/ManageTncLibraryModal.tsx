"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Check, ShieldAlert, Sparkles, SlidersHorizontal, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ManageTncLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshLibrary: () => void;
}

export function ManageTncLibraryModal({ isOpen, onClose, onRefreshLibrary }: ManageTncLibraryModalProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [paramType, setParamType] = useState<string>("none");
  const [paramLabel, setParamLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLibraryTemplates();
    }
  }, [isOpen]);

  async function loadLibraryTemplates() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tnc-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (e) {
      console.warn("Failed to load T&C templates library:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) {
      toast.error("Please enter a condition text label");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/admin/tnc-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          label: newLabel.trim(),
          param_type: paramType === "none" ? null : paramType,
          param_label: paramLabel.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("New reusable condition added to library! ✨");
        setNewLabel("");
        setParamType("none");
        setParamLabel("");
        loadLibraryTemplates();
        onRefreshLibrary();
      } else {
        toast.error(data.error || "Failed to add template");
      }
    } catch (e: any) {
      toast.error("Error creating T&C template");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/admin/tnc-templates", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          id,
          is_active: !currentActive,
        }),
      });

      if (res.ok) {
        toast.success(`Condition ${!currentActive ? "activated" : "deactivated"}`);
        loadLibraryTemplates();
        onRefreshLibrary();
      }
    } catch (e) {
      toast.error("Failed to update status");
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
          className="relative z-10 bg-card text-card-foreground border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Manage T&C Reusable Library
                </h3>
                <p className="text-xs text-muted-foreground">
                  Add or deactivate reusable terms available store-wide
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
            {/* Form to Add New Reusable Condition */}
            <form onSubmit={handleAddTemplate} className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-accent" /> Add New Reusable Condition Template
              </h4>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  Condition Text (Use <code className="bg-muted px-1.5 py-0.5 rounded text-accent">[param]</code> for placeholders)
                </label>
                <input
                  type="text"
                  placeholder='e.g. Valid only on orders above ₹[param]'
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">Parameter Type</label>
                  <select
                    value={paramType}
                    onChange={(e) => setParamType(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="none">No parameter (Static text)</option>
                    <option value="currency">Currency (Amount ₹)</option>
                    <option value="percent">Percentage (%)</option>
                    <option value="date">Date picker</option>
                    <option value="text">Custom Text / Choice</option>
                  </select>
                </div>

                {paramType !== "none" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Parameter Input Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Minimum order amount"
                      value={paramLabel}
                      onChange={(e) => setParamLabel(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </div>
                )}
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-accent text-accent-foreground font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:opacity-90 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? "Adding..." : "Add to Library"}</span>
                </button>
              </div>
            </form>

            {/* List of Existing Templates */}
            <div className="space-y-3">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                Existing Library Templates ({templates.length})
              </h4>

              {loading ? (
                <div className="py-6 text-center text-muted-foreground text-xs">Loading library...</div>
              ) : templates.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground text-xs">No library templates found</div>
              ) : (
                <div className="space-y-2">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="p-3 bg-card border border-border rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-xs">{tpl.label}</p>
                        {tpl.param_type && (
                          <span className="text-[10px] text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-full inline-block mt-1">
                            Param: {tpl.param_type} ({tpl.param_label || "No label"})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleActive(tpl.id, tpl.is_active)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                          tpl.is_active
                            ? "bg-green-500/15 text-green-600 hover:bg-green-500/25"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {tpl.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        <span>{tpl.is_active ? "Active" : "Disabled"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-border flex justify-end bg-card">
            <button
              onClick={onClose}
              className="bg-muted text-foreground font-bold px-4 py-2 rounded-xl text-xs hover:bg-muted/80 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
