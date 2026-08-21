"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  Utensils,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Image as ImageIcon,
  FolderPlus,
  Layers,
  Sparkles,
  AlertTriangle,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type Category, type MenuItem } from "@/lib/supabase";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { MenuImagePicker } from "@/components/MenuImagePicker";

export default function AdminMenuPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // New Item Form State
  const [newItemName, setNewItemName] = useState("");
  const [newItemCatId, setNewItemCatId] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState<number>(199);
  const [newItemImage, setNewItemImage] = useState("");
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemIsAvailable, setNewItemIsAvailable] = useState(true);
  const [submittingItem, setSubmittingItem] = useState(false);

  // Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [submittingCat, setSubmittingCat] = useState(false);

  // Auto Description Generator State
  const [generatingDesc, setGeneratingDesc] = useState(false);

  async function handleGenerateDesc(
    dishName: string,
    isVeg: boolean,
    setDesc: (d: string) => void
  ) {
    if (!dishName || dishName.trim().length < 2) {
      toast.error("Please enter a Dish Name first");
      return;
    }
    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/admin/menu/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishName, isVeg }),
      });
      const data = await res.json();
      if (res.ok && data.description) {
        setDesc(data.description);
        toast.success("Appetizing description generated! ✨");
      } else {
        toast.error(data.error || "Failed to generate description");
      }
    } catch (e) {
      toast.error("Error generating description");
    } finally {
      setGeneratingDesc(false);
    }
  }

  useEffect(() => {
    async function verifyMenuAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profileRow || !["owner", "manager"].includes(profileRow.role)) {
        toast.error("Only owner and manager can manage the menu");
        router.push("/admin/orders");
        return;
      }

      setIsOwner(profileRow.role === "owner");
      setChecking(false);
      loadMenuData();
    }

    verifyMenuAccess();
  }, [router]);

  async function loadMenuData() {
    setLoading(true);
    try {
      const [{ data: cats }, { data: items }] = await Promise.all([
        supabase.from("categories").select("*").order("display_order"),
        supabase.from("menu_items").select("*").order("name"),
      ]);

      setCategories((cats as Category[]) || []);
      setMenuItems((items as MenuItem[]) || []);

      if (cats && cats.length > 0) {
        setNewItemCatId(cats[0].id);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load menu data");
    } finally {
      setLoading(false);
    }
  }

  // Toggle item availability quick switch
  async function toggleAvailability(item: MenuItem) {
    const nextVal = !item.is_available;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_available: nextVal } : i))
    );

    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: nextVal })
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to update availability");
      loadMenuData();
    } else {
      toast.success(
        `${item.name} is now ${nextVal ? "Available" : "Sold Out"}`
      );
    }
  }

  // Add Item Submit
  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCatId) {
      toast.error("Item name and category are required");
      return;
    }

    setSubmittingItem(true);
    try {
      const { data: created, error } = await supabase
        .from("menu_items")
        .insert({
          category_id: newItemCatId,
          name: newItemName.trim(),
          description: newItemDesc.trim() || null,
          price: newItemPrice,
          image_url: newItemImage.trim() || null,
          is_veg: newItemIsVeg,
          is_available: newItemIsAvailable,
        })
        .select()
        .single();

      if (error || !created) {
        console.error(error);
        toast.error("Failed to create menu item");
      } else {
        toast.success(`Added ${created.name} to menu!`);
        setMenuItems((prev) => [...prev, created as MenuItem]);
        setAddItemModalOpen(false);
        resetNewItemForm();
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setSubmittingItem(false);
    }
  }

  function resetNewItemForm() {
    setNewItemName("");
    setNewItemDesc("");
    setNewItemPrice(199);
    setNewItemImage("");
    setNewItemIsVeg(true);
    setNewItemIsAvailable(true);
  }

  // Update Item Submit
  async function handleUpdateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: editingItem.name,
          category_id: editingItem.category_id,
          description: editingItem.description,
          price: editingItem.price,
          image_url: editingItem.image_url,
          is_veg: editingItem.is_veg,
          is_available: editingItem.is_available,
        })
        .eq("id", editingItem.id);

      if (error) {
        toast.error("Failed to update item");
      } else {
        toast.success("Dish updated successfully!");
        setMenuItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? editingItem : i))
        );
        setEditingItem(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Delete Item
  async function confirmDeleteItem() {
    if (!deletingItemId) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", deletingItemId);

      if (error) {
        toast.error("Failed to delete item");
      } else {
        toast.success("Item deleted from menu");
        setMenuItems((prev) => prev.filter((i) => i.id !== deletingItemId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingItemId(null);
    }
  }

  // Add Category Submit
  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSubmittingCat(true);
    try {
      const nextOrder = categories.length + 1;
      const { data: createdCat, error } = await supabase
        .from("categories")
        .insert({
          name: newCatName.trim(),
          display_order: nextOrder,
        })
        .select()
        .single();

      if (error || !createdCat) {
        toast.error("Failed to add category");
      } else {
        toast.success(`Category "${createdCat.name}" added!`);
        setCategories((prev) => [...prev, createdCat as Category]);
        setNewCatName("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingCat(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs font-bold text-pine">
        Verifying Owner Access…
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-pine/10 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-bold text-pine flex items-center gap-2">
            <Utensils className="w-6 h-6 text-marigold" /> Menu Management
          </h1>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Add, update, or pause dishes and manage cafe categories (Owner Only)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-stone border border-pine/10 text-pine hover:bg-pine/5 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-marigold" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={() => setAddItemModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-marigold text-pineDark hover:bg-marigoldLight text-xs font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-16 text-xs text-charcoal/60">
          Loading menu items…
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center space-y-3 border border-pine/10">
          <Layers className="w-10 h-10 text-pine/30 mx-auto" />
          <h3 className="font-heading text-lg font-bold text-pine">No categories defined yet</h3>
          <p className="text-xs text-charcoal/60">
            Create your first menu category (e.g. Wood-Fired Pizza, Drinks) to get started.
          </p>
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="mt-2 bg-pine text-stone px-5 py-2.5 rounded-2xl text-xs font-bold"
          >
            Add Category
          </button>
        </div>
      ) : (
        /* Dishes Grouped by Category */
        <div className="space-y-8">
          {categories.map((cat) => {
            const catDishes = menuItems.filter((i) => i.category_id === cat.id);

            return (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center justify-between border-b border-pine/15 pb-2">
                  <h2 className="font-heading text-lg font-bold text-pine flex items-center gap-2">
                    <span>{cat.name}</span>
                    <span className="bg-pine/10 text-pine text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                      {catDishes.length} items
                    </span>
                  </h2>
                </div>

                {catDishes.length === 0 ? (
                  <p className="text-xs text-charcoal/50 italic py-2">
                    No items in this category yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catDishes.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-white rounded-2xl border ${
                          item.is_available ? "border-pine/15" : "border-red-300 bg-red-50/30"
                        } p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3`}
                      >
                        <div className="flex gap-3">
                          <div className="w-20 h-20 rounded-xl bg-stone overflow-hidden shrink-0 relative border border-pine/10">
                            <ImageWithFallback
                              src={item.image_url || "/images/placeholders/food.jpg"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-3 h-3 rounded-xs border-2 flex items-center justify-center ${
                                  item.is_veg ? "border-green-600" : "border-red-600"
                                }`}
                              >
                                <div
                                  className={`w-1 h-1 rounded-full ${
                                    item.is_veg ? "bg-green-600" : "bg-red-600"
                                  }`}
                                />
                              </div>
                              <h3 className="font-heading text-sm font-bold text-pine truncate">
                                {item.name}
                              </h3>
                            </div>

                            {item.description && (
                              <p className="text-[11px] text-charcoal/60 line-clamp-2 leading-tight">
                                {item.description}
                              </p>
                            )}

                            <p className="text-xs font-extrabold text-pine pt-0.5">
                              ₹{item.price}
                            </p>
                          </div>
                        </div>

                        {/* Card Controls */}
                        <div className="pt-2 border-t border-pine/10 flex items-center justify-between gap-2">
                          {/* Availability Toggle */}
                          <button
                            onClick={() => toggleAvailability(item)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition cursor-pointer ${
                              item.is_available
                                ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30"
                                : "bg-red-500/15 text-red-700 border border-red-500/30"
                            }`}
                          >
                            {item.is_available ? "In Stock ✓" : "Sold Out ✕"}
                          </button>

                          <div className="flex items-center gap-1">
                            <Link
                              href="/admin/customizations"
                              className="p-1.5 rounded-lg bg-marigold/20 hover:bg-marigold/30 text-pineDark transition cursor-pointer"
                              title="Manage Customizations (Sizes, Add-ons)"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 rounded-lg bg-stone hover:bg-pine/10 text-pine transition cursor-pointer"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingItemId(item.id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Add New Item ── */}
      <AnimatePresence>
        {addItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setAddItemModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-white border border-pine/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-pine/10 pb-3">
                <h2 className="font-heading text-lg font-bold text-pine">Add New Menu Dish</h2>
                <button onClick={() => setAddItemModalOpen(false)}>
                  <X className="w-5 h-5 text-charcoal/60" />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-pine mb-1">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Artisan Tandoori Paneer Pizza"
                    className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-pine mb-1">Category *</label>
                    <select
                      value={newItemCatId}
                      onChange={(e) => setNewItemCatId(e.target.value)}
                      className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-pine mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
                      className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-pine">Description</label>
                    <button
                      type="button"
                      onClick={() => handleGenerateDesc(newItemName, newItemIsVeg, setNewItemDesc)}
                      disabled={generatingDesc}
                      className="text-[10px] font-extrabold text-marigold hover:underline flex items-center gap-1 cursor-pointer transition"
                    >
                      <Sparkles className={`w-3 h-3 text-marigold ${generatingDesc ? "animate-spin" : ""}`} />
                      <span>{generatingDesc ? "Generating…" : "✨ Auto-Generate AI Description"}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Ingredients and taste description…"
                    className="w-full border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-xs"
                  />
                </div>

                <MenuImagePicker
                  dishName={newItemName}
                  value={newItemImage}
                  onChange={(url) => setNewItemImage(url)}
                />

                <div className="flex items-center justify-between bg-stone/60 p-3 rounded-xl border border-pine/10">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isVegCheck"
                      checked={newItemIsVeg}
                      onChange={(e) => setNewItemIsVeg(e.target.checked)}
                      className="w-4 h-4 accent-green-600 rounded cursor-pointer"
                    />
                    <label htmlFor="isVegCheck" className="font-bold text-pine cursor-pointer">
                      Pure Vegetarian Dish
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isAvailCheck"
                      checked={newItemIsAvailable}
                      onChange={(e) => setNewItemIsAvailable(e.target.checked)}
                      className="w-4 h-4 accent-pine rounded cursor-pointer"
                    />
                    <label htmlFor="isAvailCheck" className="font-bold text-pine cursor-pointer">
                      In Stock
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddItemModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-pine/20 text-charcoal font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingItem}
                    className="px-6 py-2.5 rounded-xl bg-marigold text-pineDark font-extrabold shadow-md hover:bg-marigoldLight transition cursor-pointer"
                  >
                    {submittingItem ? "Adding…" : "Save Dish"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Edit Item ── */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingItem(null)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-white border border-pine/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-pine/10 pb-3">
                <h2 className="font-heading text-lg font-bold text-pine">Edit Dish</h2>
                <button onClick={() => setEditingItem(null)}>
                  <X className="w-5 h-5 text-charcoal/60" />
                </button>
              </div>

              <form onSubmit={handleUpdateItem} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-pine mb-1">Dish Name</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    className="w-full border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-pine mb-1">Category</label>
                    <select
                      value={editingItem.category_id}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, category_id: e.target.value })
                      }
                      className="w-full border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-pine mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingItem.price}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, price: Number(e.target.value) })
                      }
                      className="w-full border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-pine">Description</label>
                    <button
                      type="button"
                      onClick={() =>
                        handleGenerateDesc(
                          editingItem.name,
                          editingItem.is_veg,
                          (desc) => setEditingItem({ ...editingItem, description: desc })
                        )
                      }
                      disabled={generatingDesc}
                      className="text-[10px] font-extrabold text-marigold hover:underline flex items-center gap-1 cursor-pointer transition"
                    >
                      <Sparkles className={`w-3 h-3 text-marigold ${generatingDesc ? "animate-spin" : ""}`} />
                      <span>{generatingDesc ? "Generating…" : "✨ Auto-Generate AI Description"}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={editingItem.description || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, description: e.target.value })
                    }
                    className="w-full border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-xs"
                  />
                </div>

                <MenuImagePicker
                  dishName={editingItem.name}
                  value={editingItem.image_url || ""}
                  onChange={(url) => setEditingItem({ ...editingItem, image_url: url })}
                />

                <div className="flex items-center justify-between bg-stone/60 p-3 rounded-xl border border-pine/10">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editIsVeg"
                      checked={editingItem.is_veg}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, is_veg: e.target.checked })
                      }
                      className="w-4 h-4 accent-green-600 rounded cursor-pointer"
                    />
                    <label htmlFor="editIsVeg" className="font-bold text-pine cursor-pointer">
                      Pure Vegetarian
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editIsAvail"
                      checked={editingItem.is_available}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, is_available: e.target.checked })
                      }
                      className="w-4 h-4 accent-pine rounded cursor-pointer"
                    />
                    <label htmlFor="editIsAvail" className="font-bold text-pine cursor-pointer">
                      In Stock
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-xl border border-pine/20 text-charcoal font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-pine text-stone font-bold hover:bg-pineDark transition cursor-pointer"
                  >
                    Update Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Delete Confirmation ── */}
      <AnimatePresence>
        {deletingItemId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeletingItemId(null)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-white border border-red-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-pine">Delete Menu Item?</h3>
              <p className="text-xs text-charcoal/60">
                Are you sure you want to permanently remove this dish from the menu?
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeletingItemId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-pine/20 text-xs font-bold text-charcoal"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteItem}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 transition cursor-pointer"
                >
                  Delete Dish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Category Management ── */}
      <AnimatePresence>
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setCategoryModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-white border border-pine/20 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-pine/10 pb-3">
                <h2 className="font-heading text-lg font-bold text-pine">Categories Management</h2>
                <button onClick={() => setCategoryModalOpen(false)}>
                  <X className="w-5 h-5 text-charcoal/60" />
                </button>
              </div>

              {/* Add New Category Form */}
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="New Category Name…"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 border border-pine/20 rounded-xl px-3.5 py-2 bg-stone text-xs font-bold"
                />
                <button
                  type="submit"
                  disabled={submittingCat}
                  className="bg-pine text-stone px-4 py-2 rounded-xl text-xs font-bold hover:bg-pineDark transition cursor-pointer"
                >
                  Add
                </button>
              </form>

              {/* List of Existing Categories */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone border border-pine/10 text-xs font-bold text-pine"
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] text-charcoal/50">Order: {c.display_order}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setCategoryModalOpen(false)}
                  className="bg-stone border border-pine/20 text-pine font-bold px-5 py-2 rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
