"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  User,
  Utensils,
  Store,
  Truck,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Filter,
  Calendar,
  ChevronRight,
  RefreshCw,
  XCircle,
  Sparkles,
  UserCheck,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type Order, type OrderItem, type OrderStatus, type OrderType } from "@/lib/supabase";

type OrderWithItems = Order & {
  order_items?: OrderItem[];
};

const STATUS_COLUMNS: { id: OrderStatus; label: string; icon: any; color: string; bg: string }[] = [
  {
    id: "pending",
    label: "Pending",
    icon: AlertCircle,
    color: "text-amber-600 border-amber-500/40",
    bg: "bg-amber-500/10",
  },
  {
    id: "confirmed",
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-emerald-600 border-emerald-500/40",
    bg: "bg-emerald-500/10",
  },
  {
    id: "preparing",
    label: "Preparing",
    icon: Utensils,
    color: "text-blue-600 border-blue-500/40",
    bg: "bg-blue-500/10",
  },
  {
    id: "ready",
    label: "Ready for Pickup",
    icon: Store,
    color: "text-teal-600 border-teal-500/40",
    bg: "bg-teal-500/10",
  },
  {
    id: "out-for-delivery",
    label: "Out for Delivery",
    icon: Truck,
    color: "text-purple-600 border-purple-500/40",
    bg: "bg-purple-500/10",
  },
  {
    id: "completed",
    label: "Completed",
    icon: CheckCircle2,
    color: "text-slate-600 border-slate-400/40",
    bg: "bg-slate-500/10",
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"today" | "all">("today");
  const [activeMobileTab, setActiveMobileTab] = useState<OrderStatus>("pending");

  // Load orders initially
  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      } else {
        setOrders((data as OrderWithItems[]) || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();

    // Supabase Realtime Subscription
    const channelName = `admin-orders-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          if (audioEnabled) {
            playNotificationChime();
          }

          const { data: newOrder } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("id", payload.new.id)
            .single();

          if (newOrder) {
            setOrders((prev) => [newOrder as OrderWithItems, ...prev]);
            const shortId = newOrder.id.slice(0, 8).toUpperCase();
            toast.success(`🔔 New Order #${shortId} Received!`, {
              description: `${newOrder.customer_name} · ₹${newOrder.total_amount}`,
              duration: 6000,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? { ...o, ...(payload.new as Order) } : o
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [audioEnabled]);

  function playNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio chime failed:", e);
    }
  }

  // Update order status via RPC update_order_status
  async function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, newStatus: nextStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update order status");
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      toast.success(`Order status updated to ${nextStatus.replace("-", " ")}`);
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    }
  }

  function getNextStatus(current: OrderStatus): OrderStatus | null {
    switch (current) {
      case "pending":
        return "confirmed";
      case "confirmed":
        return "preparing";
      case "preparing":
        return "ready";
      case "ready":
        return "out-for-delivery";
      case "out-for-delivery":
        return "completed";
      default:
        return null;
    }
  }

  function getNextStatusLabel(current: OrderStatus): string {
    switch (current) {
      case "pending":
        return "Confirm Order →";
      case "confirmed":
        return "Start Preparing →";
      case "preparing":
        return "Mark Ready →";
      case "ready":
        return "Dispatch / Delivery →";
      case "out-for-delivery":
        return "Mark Completed ✓";
      default:
        return "Completed";
    }
  }

  function getTimeAgo(dateString: string): string {
    const created = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - created.getTime()) / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;
    return created.toLocaleDateString();
  }

  // Filtered list
  const filteredOrders = orders.filter((o) => {
    // Type filter
    if (typeFilter !== "all" && o.order_type !== typeFilter) return false;

    // Date filter
    if (dateFilter === "today") {
      const created = new Date(o.created_at);
      const today = new Date();
      const isSameDate =
        created.getDate() === today.getDate() &&
        created.getMonth() === today.getMonth() &&
        created.getFullYear() === today.getFullYear();
      if (!isSameDate) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* ── Dashboard Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-pine/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-pine">Live Orders Dashboard</h1>
            <span className="bg-emerald-500/15 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
              Realtime Sync
            </span>
          </div>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Manage incoming dine-in, takeaway, and delivery orders live with state-machine security
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              audioEnabled
                ? "bg-marigold/15 text-pine border-marigold/40"
                : "bg-stone text-charcoal/60 border-pine/10"
            }`}
            title={audioEnabled ? "Sound enabled" : "Sound muted"}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-marigold" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{audioEnabled ? "Sound On" : "Muted"}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-2xl bg-pine text-stone hover:bg-pineDark text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-pine/10 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-pine/60 shrink-0" />
          <span className="font-bold text-pine shrink-0">Mode:</span>

          {[
            { id: "all", label: "All Modes" },
            { id: "dine-in", label: "Dine-In", icon: Utensils },
            { id: "pickup", label: "Takeaway", icon: Store },
            { id: "delivery", label: "Delivery", icon: Truck },
          ].map((mode) => {
            const active = typeFilter === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setTypeFilter(mode.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-pine text-stone shadow-xs"
                    : "bg-stone text-charcoal/70 hover:bg-pine/10"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-pine/60 shrink-0" />
          <button
            onClick={() => setDateFilter("today")}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              dateFilter === "today"
                ? "bg-marigold text-pineDark font-extrabold shadow-xs"
                : "bg-stone text-charcoal/70 hover:bg-pine/10"
            }`}
          >
            Today's Orders
          </button>
          <button
            onClick={() => setDateFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              dateFilter === "all"
                ? "bg-marigold text-pineDark font-extrabold shadow-xs"
                : "bg-stone text-charcoal/70 hover:bg-pine/10"
            }`}
          >
            All Dates
          </button>
        </div>
      </div>

      {/* ── Mobile Status Tab Bar ── */}
      <div className="lg:hidden flex gap-1 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar">
        {STATUS_COLUMNS.map((col) => {
          const count = filteredOrders.filter((o) => o.status === col.id).length;
          const active = activeMobileTab === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileTab(col.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition cursor-pointer ${
                active
                  ? "bg-pine text-stone shadow-md"
                  : "bg-white text-charcoal/70 border border-pine/10"
              }`}
            >
              <span>{col.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? "bg-marigold text-pineDark font-extrabold" : "bg-stone text-charcoal/70"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Desktop Kanban Columns (6 Columns) ── */}
      <div className="hidden lg:grid grid-cols-6 gap-3.5 items-start">
        {STATUS_COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-white/60 backdrop-blur-sm border border-pine/10 rounded-3xl p-3 space-y-3 min-h-[600px] flex flex-col shadow-xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-pine/10 pb-2.5 px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`p-1 rounded-lg ${col.bg} border ${col.color}`}>
                    <col.icon className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="font-heading text-xs font-bold text-pine truncate">{col.label}</h3>
                </div>
                <span className="bg-pine text-stone text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  {colOrders.length}
                </span>
              </div>

              {/* Column Orders List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[75vh] pr-0.5">
                {colOrders.length === 0 ? (
                  <div className="text-center py-10 space-y-1 text-charcoal/40">
                    <p className="text-[11px] font-medium">No orders in {col.label.toLowerCase()}</p>
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAdvanceStatus={(next) => updateOrderStatus(order.id, next)}
                      onCancelOrder={() => updateOrderStatus(order.id, "cancelled")}
                      getNextStatus={getNextStatus}
                      getNextStatusLabel={getNextStatusLabel}
                      getTimeAgo={getTimeAgo}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mobile View: Tab Column List ── */}
      <div className="lg:hidden space-y-3">
        {filteredOrders
          .filter((o) => o.status === activeMobileTab)
          .map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAdvanceStatus={(next) => updateOrderStatus(order.id, next)}
              onCancelOrder={() => updateOrderStatus(order.id, "cancelled")}
              getNextStatus={getNextStatus}
              getNextStatusLabel={getNextStatusLabel}
              getTimeAgo={getTimeAgo}
            />
          ))}

        {filteredOrders.filter((o) => o.status === activeMobileTab).length === 0 && (
          <div className="bg-white p-12 rounded-3xl text-center text-charcoal/50 space-y-2 border border-pine/10">
            <ShoppingBag className="w-10 h-10 text-pine/30 mx-auto" />
            <p className="text-sm font-bold text-pine">No orders in this stage</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single Order Card Component ────────────────────────────────────────────────

function OrderCard({
  order,
  onAdvanceStatus,
  onCancelOrder,
  getNextStatus,
  getNextStatusLabel,
  getTimeAgo,
}: {
  order: OrderWithItems;
  onAdvanceStatus: (nextStatus: OrderStatus) => void;
  onCancelOrder: () => void;
  getNextStatus: (curr: OrderStatus) => OrderStatus | null;
  getNextStatusLabel: (curr: OrderStatus) => string;
  getTimeAgo: (dateStr: string) => string;
}) {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const nextStatus = getNextStatus(order.status);

  const orderTypeBadges: Record<OrderType, { label: string; bg: string; text: string; icon: any }> = {
    "dine-in": { label: "Dine-In", bg: "bg-emerald-500/15 border-emerald-500/40", text: "text-emerald-800", icon: Utensils },
    pickup: { label: "Takeaway", bg: "bg-amber-500/15 border-amber-500/40", text: "text-amber-800", icon: Store },
    delivery: { label: "Delivery", bg: "bg-blue-500/15 border-blue-500/40", text: "text-blue-800", icon: Truck },
  };

  const badge = orderTypeBadges[order.order_type] || orderTypeBadges["dine-in"];
  const Icon = badge.icon;
  const canCancel = ["pending", "confirmed", "preparing"].includes(order.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-pine/15 p-3.5 shadow-sm hover:shadow-md transition-all space-y-3"
    >
      {/* Card Header: Type Badge & Order Short ID & Time */}
      <div className="flex items-center justify-between gap-1.5 border-b border-pine/10 pb-2">
        <span
          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border ${badge.bg} ${badge.text}`}
        >
          <Icon className="w-3 h-3" />
          <span>{badge.label}</span>
        </span>

        <div className="text-right">
          <span className="font-mono text-xs font-extrabold text-pine block">#{shortId}</span>
          <span className="text-[9px] text-charcoal/60 flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3 text-marigold" />
            {getTimeAgo(order.created_at)}
          </span>
        </div>
      </div>

      {/* Customer Info & CRM Link */}
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between font-bold text-pine">
          <div className="flex items-center gap-1 truncate">
            <User className="w-3.5 h-3.5 text-pine/60 shrink-0" />
            <span className="truncate">{order.customer_name}</span>
          </div>

          <Link
            href="/admin/customers"
            className="text-[10px] text-marigold hover:underline flex items-center gap-0.5 shrink-0"
            title="Inspect Customer CRM"
          >
            <UserCheck className="w-3 h-3" /> CRM
          </Link>
        </div>

        {order.phone && (
          <a
            href={`tel:${order.phone}`}
            className="flex items-center gap-1.5 text-charcoal/70 hover:text-pine transition text-[11px]"
          >
            <Phone className="w-3 h-3 text-marigold shrink-0" />
            <span>{order.phone}</span>
          </a>
        )}

        {order.address && (
          <div className="flex items-start gap-1 text-charcoal/70 text-[10px] leading-tight pt-0.5">
            <MapPin className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{order.address}</span>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="bg-stone/60 rounded-xl p-2.5 text-xs space-y-1.5 border border-pine/5">
        {order.order_items?.map((it, idx) => (
          <div key={idx} className="flex justify-between items-start text-[11px]">
            <span className="font-semibold text-pine leading-tight">
              {it.quantity}x {it.item_name}
            </span>
            <span className="font-bold text-charcoal/80 tabular-nums">
              ₹{it.price_at_order * it.quantity}
            </span>
          </div>
        ))}

        {order.notes && (
          <p className="text-[10px] text-maroon italic pt-1 border-t border-pine/10">
            Note: "{order.notes}"
          </p>
        )}
      </div>

      {/* Total & Action Buttons */}
      <div className="pt-2 border-t border-pine/10 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] text-charcoal/50 uppercase block font-semibold">Total</span>
            <span className="font-heading text-sm font-bold text-pine">₹{order.total_amount}</span>
          </div>

          {canCancel && (
            <button
              onClick={onCancelOrder}
              className="text-[10px] font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg border border-red-200 transition cursor-pointer flex items-center gap-1"
              title="Cancel order"
            >
              <Ban className="w-3 h-3" /> Cancel
            </button>
          )}
        </div>

        {nextStatus ? (
          <button
            onClick={() => onAdvanceStatus(nextStatus)}
            className="w-full bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <span>{getNextStatusLabel(order.status)}</span>
          </button>
        ) : (
          <div className="text-center py-1 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[10px] font-extrabold text-emerald-800 uppercase">
            {order.status === "cancelled" ? "Cancelled ✕" : "Completed ✓"}
          </div>
        )}
      </div>
    </motion.div>
  );
}
