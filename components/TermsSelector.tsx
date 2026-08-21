"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Eye,
  Sparkles,
  RefreshCw,
  Info,
} from "lucide-react";
import { ManageTncLibraryModal } from "./ManageTncLibraryModal";

export type SelectedTermItem = {
  tnc_template_id?: string | null;
  custom_text?: string | null;
  param_value?: string | null;
  label?: string;
  param_type?: string | null;
  param_label?: string | null;
  sort_order?: number;
};

interface TermsSelectorProps {
  selectedTerms: SelectedTermItem[];
  onChangeTerms: (terms: SelectedTermItem[]) => void;
  // Option A auto-derived field helpers from parent coupon/offer form
  autoValues?: {
    min_order_value?: number;
    valid_to?: string;
    max_discount?: number;
    per_user_limit?: number;
  };
}

export function TermsSelector({ selectedTerms, onChangeTerms, autoValues }: TermsSelectorProps) {
  const [libraryTemplates, setLibraryTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [newCustomText, setNewCustomText] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tnc-templates");
      if (res.ok) {
        const data = await res.json();
        setLibraryTemplates(data.templates || []);
      }
    } catch (e) {
      console.warn("Failed to fetch T&C templates:", e);
    } fontally: {
      setLoading(false);
    }
  }

  // Auto sync derived values if template is selected
  useEffect(() => {
    if (!autoValues) return;

    let updated = false;
    const nextTerms = selectedTerms.map((term) => {
      if (!term.tnc_template_id) return term;

      const tplLabel = term.label || "";
      let autoVal: string | null = null;

      if (tplLabel.includes("Minimum order value") && autoValues.min_order_value !== undefined) {
        autoVal = String(autoValues.min_order_value);
      } else if (tplLabel.includes("valid until") && autoValues.valid_to) {
        autoVal = autoValues.valid_to.split("T")[0];
      } else if (tplLabel.includes("Maximum discount capped") && autoValues.max_discount !== undefined) {
        autoVal = String(autoValues.max_discount);
      } else if (tplLabel.includes("Valid once per customer") && autoValues.per_user_limit === 1) {
        autoVal = "1";
      }

      if (autoVal !== null && autoVal !== term.param_value) {
        updated = true;
        return { ...term, param_value: autoVal };
      }
      return term;
    });

    if (updated) {
      onChangeTerms(nextTerms);
    }
  }, [autoValues?.min_order_value, autoValues?.valid_to, autoValues?.max_discount, autoValues?.per_user_limit]);

  // Toggle template selection
  function handleToggleTemplate(tpl: any) {
    const isSelected = selectedTerms.some((t) => t.tnc_template_id === tpl.id);

    if (isSelected) {
      onChangeTerms(selectedTerms.filter((t) => t.tnc_template_id !== tpl.id));
    } else {
      let defaultParamVal = "";
      if (autoValues) {
        if (tpl.label.includes("Minimum order value") && autoValues.min_order_value !== undefined) {
          defaultParamVal = String(autoValues.min_order_value);
        } else if (tpl.label.includes("valid until") && autoValues.valid_to) {
          defaultParamVal = autoValues.valid_to.split("T")[0];
        } else if (tpl.label.includes("Maximum discount capped") && autoValues.max_discount !== undefined) {
          defaultParamVal = String(autoValues.max_discount);
        }
      }

      const newItem: SelectedTermItem = {
        tnc_template_id: tpl.id,
        label: tpl.label,
        param_type: tpl.param_type,
        param_label: tpl.param_label,
        param_value: defaultParamVal,
      };
      onChangeTerms([...selectedTerms, newItem]);
    }
  }

  // Update parameter value
  function handleParamChange(tplId: string, val: string) {
    onChangeTerms(
      selectedTerms.map((t) => (t.tnc_template_id === tplId ? { ...t, param_value: val } : t))
    );
  }

  // Add custom manual condition line
  function handleAddCustomText() {
    if (!newCustomText.trim()) return;
    const newItem: SelectedTermItem = {
      tnc_template_id: null,
      custom_text: newCustomText.trim(),
    };
    onChangeTerms([...selectedTerms, newItem]);
    setNewCustomText("");
  }

  // Remove term item
  function handleRemoveTerm(index: number) {
    const updated = [...selectedTerms];
    updated.splice(index, 1);
    onChangeTerms(updated);
  }

  // Move term item up/down
  function handleMoveTerm(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === selectedTerms.length - 1)
    ) {
      return;
    }
    const updated = [...selectedTerms];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChangeTerms(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div>
          <h4 className="font-heading text-xs font-bold text-foreground flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
            Structured Terms & Conditions (T&C)
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Select common conditions or type custom terms. Enforceable fields auto-derive from coupon rules.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLibraryModalOpen(true)}
          className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          <span>Manage T&C Library</span>
        </button>
      </div>

      {/* Library Checklist */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
          Prebuilt Library Conditions
        </label>

        {loading ? (
          <div className="py-4 text-center text-xs text-muted-foreground">Loading T&C templates...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {libraryTemplates.map((tpl) => {
              const isSelected = selectedTerms.some((t) => t.tnc_template_id === tpl.id);
              const selectedItem = selectedTerms.find((t) => t.tnc_template_id === tpl.id);

              return (
                <div
                  key={tpl.id}
                  className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? "bg-accent/10 border-accent text-foreground font-medium"
                      : "bg-muted/30 border-border text-foreground/80 hover:bg-muted/60"
                  }`}
                >
                  <div
                    onClick={() => handleToggleTemplate(tpl)}
                    className="flex items-start gap-2 cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug">{tpl.label}</span>
                  </div>

                  {/* Inline Parameter Input if selected & has param */}
                  {isSelected && tpl.param_type && (
                    <div className="mt-2 pt-2 border-t border-accent/20 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-bold shrink-0">
                        {tpl.param_label || "Parameter"}:
                      </span>
                      {tpl.param_type === "currency" ? (
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={selectedItem?.param_value || ""}
                            onChange={(e) => handleParamChange(tpl.id, e.target.value)}
                            placeholder="Amount"
                            className="w-full bg-background border border-border rounded-lg pl-5 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                        </div>
                      ) : tpl.param_type === "date" ? (
                        <input
                          type="date"
                          value={selectedItem?.param_value || ""}
                          onChange={(e) => handleParamChange(tpl.id, e.target.value)}
                          className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      ) : (
                        <input
                          type="text"
                          value={selectedItem?.param_value || ""}
                          onChange={(e) => handleParamChange(tpl.id, e.target.value)}
                          placeholder="e.g. delivery or 2 PM - 6 PM"
                          className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Custom Free-Text Condition */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <label className="text-[11px] font-semibold text-foreground">Add Custom Manual Condition</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Valid only on orders containing Paneer items"
            value={newCustomText}
            onChange={(e) => setNewCustomText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomText();
              }
            }}
            className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="button"
            onClick={handleAddCustomText}
            className="bg-accent text-accent-foreground font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Live Customer Preview & Reordering */}
      {selectedTerms.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-accent" /> Live Customer Terms Preview ({selectedTerms.length})
            </span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-3 space-y-2 max-h-48 overflow-y-auto">
            {selectedTerms.map((term, idx) => {
              let text = term.custom_text || term.label || "";
              if (term.param_value && text.includes("[param]")) {
                text = text.replace("[param]", term.param_value);
              }

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 bg-muted/30 border border-border/60 rounded-xl text-xs"
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="font-bold text-accent shrink-0">{idx + 1}.</span>
                    <span className="text-foreground leading-snug">{text}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveTerm(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveTerm(idx, "down")}
                      disabled={idx === selectedTerms.length - 1}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(idx)}
                      className="p-1 text-muted-foreground hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ManageTncLibraryModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        onRefreshLibrary={fetchTemplates}
      />
    </div>
  );
}
