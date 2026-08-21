"use client";

import React, { useEffect, useState } from "react";
import {
  Sliders,
  Plus,
  UtensilsCrossed,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sparkles,
  ChevronRight,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import {
  supabase,
  type MenuItem,
  type ItemCustomization,
  type CustomizationOption,
} from "@/lib/supabase";

export default function CustomizationsManagerPage() {
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [customizations, setCustomizations] = useState<ItemCustomization[]>([]);

  // New Group Form State
  const [groupName, setGroupName] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [maxSelect, setMaxSelect] = useState("1");
  const [submittingGroup, setSubmittingGroup] = useState(false);

  // New Option Form State per Group ID
  const [optionForm, setOptionForm] = useState<Record<string, { label: string; extraPrice: string }>>({});
  const [submittingOption, setSubmittingOption] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (selectedItemId) {
      fetchCustomizationsForItem(selectedItemId);
    } else {
      setCustomizations([]);
    }
  }, [selectedItemId]);

  async function fetchMenuItems() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        toast.error("Failed to load menu items");
      } else {
        setMenuItems((data as MenuItem[]) || []);
        if (data && data.length > 0) {
          setSelectedItemId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomizationsForItem(itemId: string) {
    try {
      const { data: groups, error: gErr } = await supabase
        .from("item_customizations")
        .select("*, options:customization_options(*)")
        .eq("menu_item_id", itemId)
        .order("sort_order", { ascending: true });

      if (gErr) {
        toast.error("Failed to load customizations");
      } else {
        setCustomizations((groups as ItemCustomization[]) || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim() || !selectedItemId) {
      toast.error("Group name is required");
      return;
    }

    setSubmittingGroup(true);
    try {
      const newGroup = {
        menu_item_id: selectedItemId,
        group_name: groupName.trim(),
        is_required: isRequired,
        max_select: parseInt(maxSelect) || 1,
        sort_order: customizations.length + 1,
      };

      const { data, error } = await supabase
        .from("item_customizations")
        .insert(newGroup)
        .select()
        .single();

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Customization group "${groupName}" added!`);
        // Log audit
        await supabase.from("audit_logs").insert({
          action: "customization.create_group",
          entity: "item_customizations",
          entity_id: data?.id,
          details: newGroup,
        });

        setGroupName("");
        setIsRequired(false);
        setMaxSelect("1");
        fetchCustomizationsForItem(selectedItemId);
      }
    } catch (e) {
      toast.error("Failed to add group");
    } finally {
      setSubmittingGroup(false);
    }
  }

  async function handleDeleteGroup(groupId: string, groupTitle: string) {
    if (!confirm(`Delete customization group "${groupTitle}" and all its options?`)) return;

    try {
      const { error } = await supabase.from("item_customizations").delete().eq("id", groupId);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Group "${groupTitle}" deleted`);
        fetchCustomizationsForItem(selectedItemId);
      }
    } catch (e) {
      toast.error("Failed to delete group");
    }
  }

  async function handleAddOption(groupId: string, e: React.FormEvent) {
    e.preventDefault();
    const form = optionForm[groupId];
    if (!form || !form.label.trim()) {
      toast.error("Option label is required");
      return;
    }

    setSubmittingOption((prev) => ({ ...prev, [groupId]: true }));
    try {
      const newOpt = {
        customization_id: groupId,
        label: form.label.trim(),
        extra_price: form.extraPrice ? parseFloat(form.extraPrice) : 0,
        is_available: true,
      };

      const { data, error } = await supabase
        .from("customization_options")
        .insert(newOpt)
        .select()
        .single();

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Option "${form.label}" added!`);
        setOptionForm((prev) => ({ ...prev, [groupId]: { label: "", extraPrice: "" } }));
        fetchCustomizationsForItem(selectedItemId);
      }
    } catch (e) {
      toast.error("Failed to add option");
    } finally {
      setSubmittingOption((prev) => ({ ...prev, [groupId]: false }));
    }
  }

  async function handleDeleteOption(optionId: string, optionLabel: string) {
    try {
      const { error } = await supabase.from("customization_options").delete().eq("id", optionId);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Option "${optionLabel}" deleted`);
        fetchCustomizationsForItem(selectedItemId);
      }
    } catch (e) {
      toast.error("Failed to delete option");
    }
  }

  const selectedItem = menuItems.find((m) => m.id === selectedItemId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-pine/10 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-bold text-pine flex items-center gap-2">
            <Sliders className="w-6 h-6 text-marigold" /> Item Customizations Manager
          </h1>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Add dynamic add-ons, sizes, and spice levels with extra pricing per dish (Owner & Manager)
          </p>
        </div>

        <button
          onClick={fetchMenuItems}
          className="p-2.5 rounded-2xl bg-pine/10 text-pine hover:bg-pine/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Menu</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Menu Item Selector Column (4 cols) */}
        <div className="md:col-span-4 bg-white p-5 rounded-3xl border border-pine/10 shadow-xs space-y-3">
          <h2 className="font-heading text-base font-bold text-pine flex items-center gap-2 border-b border-pine/10 pb-2.5">
            <UtensilsCrossed className="w-4 h-4 text-marigold" /> Select Menu Item
          </h2>

          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
            {menuItems.map((item) => {
              const selected = item.id === selectedItemId;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                    selected
                      ? "bg-pine text-stone shadow-xs"
                      : "bg-stone/60 text-charcoal/80 hover:bg-pine/10"
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate">{item.name}</p>
                    <p className={`text-[10px] font-medium ${selected ? "text-marigold" : "text-charcoal/60"}`}>
                      ₹{item.price}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${selected ? "text-marigold" : "text-charcoal/40"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Customizations Config Column (8 cols) */}
        <div className="md:col-span-8 space-y-6">
          {/* Active Dish Banner */}
          {selectedItem && (
            <div className="bg-pine text-stone p-5 rounded-3xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-marigold uppercase tracking-wider font-extrabold block">
                  Configuring Customizations For
                </span>
                <h2 className="font-heading text-xl font-bold">{selectedItem.name}</h2>
              </div>
              <span className="font-heading text-lg font-bold text-marigold">
                Base ₹{selectedItem.price}
              </span>
            </div>
          )}

          {/* Add New Customization Group Card */}
          <div className="bg-white p-5 rounded-3xl border border-pine/10 shadow-xs space-y-4">
            <h3 className="font-heading text-sm font-bold text-pine flex items-center gap-2">
              <Plus className="w-4 h-4 text-marigold" /> Add Customization Group
            </h3>

            <form onSubmit={handleAddGroup} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  required
                  placeholder="Group Name (e.g. Size, Spice Level)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full border border-pine/20 rounded-xl px-3 py-2 bg-stone font-bold text-xs"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={maxSelect}
                  onChange={(e) => setMaxSelect(e.target.value)}
                  className="w-full border border-pine/20 rounded-xl px-3 py-2 bg-stone font-semibold text-xs"
                >
                  <option value="1">Single Choice (Radio)</option>
                  <option value="2">Multi Choose (Max 2)</option>
                  <option value="5">Multi Choose (Max 5)</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center gap-1.5 pl-1">
                <input
                  type="checkbox"
                  id="req_check"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded text-pine focus:ring-pine cursor-pointer"
                />
                <label htmlFor="req_check" className="font-bold text-pine text-[11px] cursor-pointer">
                  Required
                </label>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submittingGroup}
                  className="w-full bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold py-2 px-3 rounded-xl shadow-xs transition text-xs cursor-pointer disabled:opacity-60"
                >
                  {submittingGroup ? "Adding…" : "Add Group"}
                </button>
              </div>
            </form>
          </div>

          {/* Groups & Options List */}
          <div className="space-y-4">
            {customizations.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-pine/10 text-center text-charcoal/50 space-y-1">
                <Sliders className="w-8 h-8 text-pine/30 mx-auto" />
                <p className="text-xs font-bold text-pine">No customization groups configured</p>
                <p className="text-[11px]">Add a group like "Size" or "Extra Cheese" above.</p>
              </div>
            ) : (
              customizations.map((group) => (
                <div
                  key={group.id}
                  className="bg-white p-5 rounded-3xl border border-pine/10 shadow-xs space-y-4"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between border-b border-pine/10 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-base font-bold text-pine">
                        {group.group_name}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-pine/10 text-pine">
                        {group.is_required ? "Required" : "Optional"}
                      </span>
                      <span className="text-[10px] font-bold text-charcoal/60">
                        ({group.max_select === 1 ? "Radio Single" : `Multi max ${group.max_select}`})
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteGroup(group.id, group.group_name)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      title="Delete Group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    {group.options?.map((opt) => (
                      <div
                        key={opt.id}
                        className="p-2.5 bg-stone/50 rounded-2xl border border-pine/10 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-marigold" />
                          <span className="font-bold text-pine">{opt.label}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg text-[11px]">
                            {opt.extra_price > 0 ? `+₹${opt.extra_price}` : "Free (+₹0)"}
                          </span>
                          <button
                            onClick={() => handleDeleteOption(opt.id, opt.label)}
                            className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Option Form inside Group */}
                  <form
                    onSubmit={(e) => handleAddOption(group.id, e)}
                    className="pt-2 border-t border-pine/10 flex flex-col sm:flex-row items-center gap-2 text-xs"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Option name (e.g. Large / Extra Cheese)"
                      value={optionForm[group.id]?.label || ""}
                      onChange={(e) =>
                        setOptionForm((prev) => ({
                          ...prev,
                          [group.id]: {
                            label: e.target.value,
                            extraPrice: prev[group.id]?.extraPrice || "",
                          },
                        }))
                      }
                      className="w-full sm:flex-1 border border-pine/20 rounded-xl px-3 py-2 bg-stone font-medium text-xs"
                    />

                    <input
                      type="number"
                      min="0"
                      placeholder="Extra ₹ (0 if free)"
                      value={optionForm[group.id]?.extraPrice || ""}
                      onChange={(e) =>
                        setOptionForm((prev) => ({
                          ...prev,
                          [group.id]: {
                            label: prev[group.id]?.label || "",
                            extraPrice: e.target.value,
                          },
                        }))
                      }
                      className="w-full sm:w-32 border border-pine/20 rounded-xl px-3 py-2 bg-stone font-bold text-xs"
                    />

                    <button
                      type="submit"
                      disabled={submittingOption[group.id]}
                      className="w-full sm:w-auto bg-pine text-stone hover:bg-pineDark font-bold py-2 px-4 rounded-xl shadow-xs transition cursor-pointer text-xs disabled:opacity-60"
                    >
                      {submittingOption[group.id] ? "Adding…" : "+ Add Option"}
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
