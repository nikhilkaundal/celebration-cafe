"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Coffee,
  ClipboardList,
  ShoppingBag,
  Truck,
  Store,
  Utensils,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  PackageOpen,
  ChefHat,
  Calendar,
  MapPin,
  Hash,
  IndianRupee,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";
import LiveOrderTracker from "@/components/LiveOrderTracker";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItemData {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  price_at_order: number;
  item_notes: string | null;
}

interface OrderData {
  id: string;
  order_type: string;
  customer_name: string;
  phone: string;
  address: string | null;
  status: string;
  total_amount: number;
  payment_status: string;
  notes: string | null;
  created_at: string;
  order_items?: OrderItemData[];
}

type FilterTab = "all" | "active" | "completed";

// ── Status Config ─────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", icon: CheckCircle2 },
  preparing: { label: "Preparing", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30", icon: ChefHat },
  ready: { label: "Ready", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", icon: CheckCircle2 },
  "out-for-delivery": { label: "Out for Delivery", color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30", icon: Truck },
  completed: { label: "Delivered", color: "text-green-400", bg: "bg-green-500/15 border-green-500/30", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30", icon: XCircle },
};

const orderTypeIcons: Record<string, React.ElementType> = {
  "dine-in": Utensils,
  pickup: Store,
  delivery: Truck,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "Recently";
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    let channel: any = null;

    async function loadOrders() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let dbOrders: OrderData[] = [];

        if (user) {
          // Try fetching by customer_id first
          const { data: cidOrders } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50);

          if (cidOrders && cidOrders.length > 0) {
            dbOrders = cidOrders;
          } else {
            // Fallback: match by phone from customers table
            const { data: customerRow } = await supabase
              .from("customers")
              .select("phone, name")
              .eq("id", user.id)
              .single();

            if (customerRow?.phone) {
              const { data: phoneOrders } = await supabase
                .from("orders")
                .select("*, order_items(*)")
                .eq("phone", customerRow.phone)
                .order("created_at", { ascending: false })
                .limit(50);

              if (phoneOrders) dbOrders = phoneOrders;
            }
          }
        }

        // Merge with localStorage past orders
        const localStr = localStorage.getItem("celebration_past_orders");
        if (localStr) {
          try {
            const localOrders = JSON.parse(localStr);
            const existingIds = new Set(dbOrders.map((o) => o.id));

            for (const lo of localOrders) {
              if (!existingIds.has(lo.id)) {
                dbOrders.push({
                  id: lo.id,
                  order_type: lo.order_type || "dine-in",
                  customer_name: lo.customer_name || "You",
                  phone: "",
                  address: null,
                  status: "completed",
                  total_amount: lo.total_amount || 0,
                  payment_status: "paid",
                  notes: null,
                  created_at: lo.date === "Just now" ? new Date().toISOString() : lo.date || new Date().toISOString(),
                  order_items: lo.items?.map((item: any, idx: number) => ({
                    id: `local-${idx}`,
                    order_id: lo.id,
                    menu_item_id: item.item_id || "",
                    item_name: item.name,
                    quantity: item.quantity,
                    price_at_order: item.price,
                    item_notes: null,
                  })),
                });
              }
            }
          } catch (e) {
            console.warn("Error parsing local orders:", e);
          }
        }

        // Sort newest first
        dbOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(dbOrders);

        // Auto-expand first active order
        const firstActive = dbOrders.find((o) =>
          ["pending", "preparing", "ready", "out-for-delivery"].includes(o.status)
        );
        if (firstActive) {
          setExpandedOrder(firstActive.id);
        }

        if (!user && dbOrders.length === 0) {
          router.push("/login?redirect=/orders");
          return;
        }

        // ── Subscribe to Realtime Updates for Customer Orders ────────────────
        const channelName = `cust-orders-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "orders" },
            (payload) => {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === payload.new.id ? { ...o, ...(payload.new as any) } : o
                )
              );
            }
          )
          .subscribe();
      } catch (e) {
        console.error("Failed to load orders:", e);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "active") {
      return orders.filter((o) =>
        ["pending", "preparing", "ready", "out-for-delivery"].includes(o.status)
      );
    }
    return orders.filter((o) => ["completed", "cancelled"].includes(o.status));
  }, [orders, filter]);

  async function handleReorder(order: OrderData) {
    if (!order.order_items || order.order_items.length === 0) {
      toast.error("No items to reorder");
      return;
    }

    const itemIds = order.order_items.map((oi) => oi.menu_item_id).filter(Boolean);
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("*")
      .in("id", itemIds);

    let addedCount = 0;
    for (const orderItem of order.order_items) {
      const menuItem = menuItems?.find((m) => m.id === orderItem.menu_item_id);
      if (menuItem && menuItem.is_available) {
        for (let i = 0; i < orderItem.quantity; i++) {
          addItem(menuItem);
          addedCount++;
        }
      }
    }

    if (addedCount > 0) {
      toast.success(`${addedCount} items added to cart!`, {
        description: "Redirecting to menu…",
      });
      setTimeout(() => router.push("/order"), 500);
    } else {
      toast.error("Some items are no longer available");
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121110] text-stone flex flex-col items-center justify-center p-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-marigold/15 blur-3xl pointer-events-none" />
        <div className="text-center space-y-4 z-10">
          <div className="w-16 h-16 rounded-3xl bg-marigold/20 border border-marigold/40 text-marigold flex items-center justify-center mx-auto shadow-2xl animate-pulse">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2 text-marigold font-bold text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading your live orders…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121110] text-stone relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-marigold/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121110]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone/80 hover:text-marigold transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-marigold" />
            <span className="font-heading font-bold text-stone text-sm">My Orders</span>
          </div>
          <Link
            href="/order"
            className="flex items-center gap-1 text-marigold text-xs font-bold hover:underline"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Menu</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 z-10 relative space-y-5">
        {/* Filter Tabs */}
        <div className="bg-white/8 p-1 rounded-2xl border border-white/12 grid grid-cols-3 text-xs font-bold">
          {(
            [
              { key: "all", label: "All Orders" },
              { key: "active", label: "Active" },
              { key: "completed", label: "Past" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`py-2.5 rounded-xl transition cursor-pointer text-center ${
                filter === tab.key
                  ? "bg-marigold text-pineDark font-extrabold shadow-md"
                  : "text-stone/70 hover:text-stone"
              }`}
            >
              {tab.label}
              {tab.key === "active" && (
                <span className="ml-1">
                  ({orders.filter((o) => ["pending", "preparing", "ready", "out-for-delivery"].includes(o.status)).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 space-y-4"
          >
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
              <PackageOpen className="w-10 h-10 text-stone/30" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-heading text-lg font-bold text-stone/70">
                {filter === "active" ? "No active orders" : filter === "completed" ? "No past orders" : "No orders yet"}
              </h3>
              <p className="text-xs text-stone/50 max-w-xs">
                {filter === "active"
                  ? "You don't have any active orders right now."
                  : "Your order history will appear here once you place your first order."}
              </p>
            </div>
            <Link
              href="/order"
              className="inline-flex items-center gap-2 bg-marigold text-pineDark font-extrabold px-6 py-3 rounded-2xl text-xs shadow-xl hover:bg-marigoldLight transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Menu & Order</span>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, idx) => {
                const config = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const TypeIcon = orderTypeIcons[order.order_type] || Utensils;
                const isExpanded = expandedOrder === order.id;
                const isActive = ["pending", "preparing", "ready", "out-for-delivery"].includes(order.status);
                const shortId = order.id.slice(0, 8).toUpperCase();

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className={`bg-white/5 border rounded-2xl overflow-hidden transition ${
                      isActive ? "border-marigold/40 shadow-xl shadow-marigold/5" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Order Header — clickable to expand */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full p-4 text-left cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Order ID + Time + Live Indicator */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-marigold bg-marigold/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {shortId}
                            </span>
                            <span className="text-[10px] text-stone/50 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(order.created_at)}
                            </span>
                            {isActive && (
                              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                LIVE TRACKING
                              </span>
                            )}
                          </div>

                          {/* Items preview */}
                          <p className="text-xs text-stone/80 truncate">
                            {order.order_items
                              ? order.order_items
                                  .map((oi) => `${oi.quantity}× ${oi.item_name}`)
                                  .join(", ")
                              : "Order items"}
                          </p>

                          {/* Badges row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Status badge */}
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {config.label}
                            </span>

                            {/* Order type badge */}
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone/60 bg-white/8 border border-white/10 px-2 py-0.5 rounded-full">
                              <TypeIcon className="w-3 h-3" />
                              {order.order_type === "dine-in"
                                ? "Dine-In"
                                : order.order_type === "pickup"
                                ? "Pickup"
                                : "Delivery"}
                            </span>
                          </div>
                        </div>

                        {/* Total Amount */}
                        <div className="text-right shrink-0">
                          <p className="text-sm font-extrabold text-stone flex items-center gap-0.5">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {Number(order.total_amount).toFixed(0)}
                          </p>
                          <p className="text-[10px] text-stone/40 mt-0.5">
                            {order.order_items?.length || 0} items
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                            {/* Live Stepper Component for Active or Expanded Order */}
                            <LiveOrderTracker
                              orderId={order.id}
                              initialOrder={order as any}
                              compact
                            />

                            {/* Full date */}
                            <p className="text-[10px] text-stone/50 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-marigold/60" />
                              {formatDateTime(order.created_at)}
                            </p>

                            {/* Reorder button */}
                            {order.order_items && order.order_items.length > 0 && (
                              <button
                                onClick={() => handleReorder(order)}
                                className="w-full flex items-center justify-center gap-2 bg-marigold/15 border border-marigold/30 text-marigold hover:bg-marigold/25 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reorder These Items</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
