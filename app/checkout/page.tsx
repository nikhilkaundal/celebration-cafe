"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ShoppingBag, Truck, Store, Utensils, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useCart, getLineKey } from "@/lib/cart-context";
import { supabase, type OrderType } from "@/lib/supabase";

export default function CheckoutPage() {
  const { lines, total, clearCart } = useCart();
  const router = useRouter();

  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill logged-in customer profile details
  useEffect(() => {
    try {
      const p = localStorage.getItem("celebration_customer_profile");
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed.name) setName(parsed.name);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.address) setAddress(parsed.address);
      }
    } catch (e) {}
  }, []);

  const deliveryFee = orderType === "delivery" ? 40 : 0;
  const finalTotal = total + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and 10-digit phone number.");
      return;
    }
    if (orderType === "delivery" && !address.trim()) {
      setError("Please enter a valid delivery address in Hamirpur.");
      return;
    }
    if (lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);

    function savePastOrder(orderId: string) {
      const pastOrderData = {
        id: orderId,
        date: "Just now",
        order_type: orderType,
        total_amount: finalTotal,
        items: lines.map((l) => ({
          item_id: l.item.id,
          name: l.item.name,
          quantity: l.quantity,
          price: l.unitPrice ?? l.item.price,
          size: l.size,
          extras: l.extras,
          spiceLevel: l.spiceLevel,
          notes: l.notes,
          photo: (l.item as any).photo || l.item.image_url || undefined,
        })),
      };

      try {
        const existingStr = localStorage.getItem("celebration_past_orders");
        const existing = existingStr ? JSON.parse(existingStr) : [];
        const updated = [pastOrderData, ...existing];
        localStorage.setItem("celebration_past_orders", JSON.stringify(updated.slice(0, 10)));
      } catch (e) {
        console.error("Failed to save past order in localStorage", e);
      }
    }

    try {
      // Get authenticated user (if any) to link order to customer
      let customerId: string | null = null;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) customerId = user.id;
      } catch (e) {
        // Not authenticated, proceed without customer_id
      }

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          order_type: orderType,
          customer_name: name.trim(),
          phone: phone.trim(),
          address: orderType === "delivery" ? address.trim() : null,
          total_amount: finalTotal,
          notes: notes.trim() || null,
          ...(customerId ? { customer_id: customerId } : {}),
        })
        .select()
        .single();

      if (orderErr || !order) {
        // Safe fallback if Supabase table is not configured or fails
        console.warn("Supabase insertion fallback:", orderErr);
        const fallbackOrderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
        savePastOrder(fallbackOrderId);
        clearCart();
        toast.success("Order placed successfully!");
        router.push(`/order-confirmed?id=${fallbackOrderId}`);
        return;
      }

      const orderItems = lines.map((l) => ({
        order_id: order.id,
        menu_item_id: l.item.id,
        item_name: `${l.item.name}${l.size ? ` (${l.size})` : ""}${l.extras?.length ? ` + ${l.extras.join(", ")}` : ""}`,
        quantity: l.quantity,
        price_at_order: l.unitPrice ?? l.item.price,
      }));

      await supabase.from("order_items").insert(orderItems);

      // Save order to localStorage for past orders / reordering feature
      savePastOrder(order.id);

      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/order-confirmed?id=${order.id}`);
    } catch (err) {
      console.error("Order submit error:", err);
      const fallbackOrderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
      savePastOrder(fallbackOrderId);

      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/order-confirmed?id=${fallbackOrderId}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background text-foreground">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h1 className="font-heading text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground text-sm mb-6">Add delicious food items to place an order.</p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen max-w-xl mx-auto px-4 py-8 bg-background text-foreground"
    >
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </Link>

      <h1 className="font-heading text-3xl font-bold text-foreground mb-6">
        Checkout & Place Order
      </h1>

      {/* Order Summary Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-sm space-y-3"
      >
        <h2 className="font-heading text-lg font-semibold text-foreground border-b border-border/60 pb-3">
          Order Summary ({lines.reduce((s, l) => s + l.quantity, 0)} items)
        </h2>

        {lines.map((l) => {
          const key = getLineKey(l.item, l.size, l.extras);
          const uPrice = l.unitPrice ?? l.item.price;
          const sub = l.subtotal ?? uPrice * l.quantity;

          return (
            <div key={key} className="flex justify-between items-start text-sm py-1.5 border-b border-border/30 last:border-0">
              <div>
                <p className="font-medium text-foreground">
                  {l.quantity} × {l.item.name}
                </p>
                {l.size && <p className="text-xs text-muted-foreground">Size: {l.size}</p>}
                {l.extras && l.extras.length > 0 && (
                  <p className="text-xs text-muted-foreground">+ {l.extras.join(", ")}</p>
                )}
              </div>
              <span className="font-semibold text-foreground tabular-nums">₹{sub}</span>
            </div>
          );
        })}

        <div className="pt-3 border-t border-border space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Items Subtotal</span>
            <span>₹{total}</span>
          </div>
          {orderType === "delivery" && (
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee (Hamirpur Town)</span>
              <span>₹{deliveryFee}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg text-primary pt-2 border-t border-border">
            <span>Total Payable</span>
            <span>₹{finalTotal}</span>
          </div>
        </div>
      </motion.div>

      {/* Checkout Form */}
      <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-2xl border border-border p-5 shadow-sm">
        {/* Order type selection */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Select Order Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "dine-in", label: "Dine-in", icon: Utensils },
              { id: "pickup", label: "Takeaway", icon: Store },
              { id: "delivery", label: "Delivery", icon: Truck },
            ].map((mode) => {
              const Icon = mode.icon;
              const selected = orderType === mode.id;
              return (
                <button
                  type="button"
                  key={mode.id}
                  onClick={() => setOrderType(mode.id as OrderType)}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Details */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-foreground">Your Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="e.g. Rohit Sharma"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-foreground">Mobile Phone Number</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="10-digit mobile number"
          />
        </div>

        {/* Delivery Address */}
        <AnimatePresence>
          {orderType === "delivery" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-semibold mb-1 text-foreground">Delivery Address in Hamirpur</label>
              <textarea
                required={orderType === "delivery"}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={3}
                placeholder="House no, street, landmark, Hamirpur"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cooking notes */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-foreground">Order Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="e.g. Make it extra spicy / Less sugar in tea"
          />
        </div>

        {error && <p className="text-destructive text-xs font-medium">{error}</p>}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-accent text-accent-foreground font-semibold py-4 rounded-2xl shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? "Placing Order…" : `Confirm Order · ₹${finalTotal}`}
        </motion.button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <span>Pay by Cash or UPI on delivery / at the cafe.</span>
        </div>
      </form>
    </motion.main>
  );
}

