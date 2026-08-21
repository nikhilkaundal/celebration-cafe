"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  ChefHat,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  Utensils,
  Store,
  Sparkles,
  ShoppingBag,
  Info,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type OrderStatus, type OrderType } from "@/lib/supabase";

interface OrderItemInfo {
  id: string;
  item_name: string;
  quantity: number;
  price_at_order: number;
}

export interface LiveOrderTrackerProps {
  orderId: string;
  initialOrder?: {
    id: string;
    status: OrderStatus;
    order_type: OrderType;
    customer_name: string;
    phone?: string;
    address?: string | null;
    total_amount: number;
    notes?: string | null;
    created_at: string;
    order_items?: OrderItemInfo[];
  };
  onStatusChange?: (newStatus: OrderStatus) => void;
  compact?: boolean;
}

// ── Status Stepper Config ─────────────────────────────────────────────────────

interface StepConfig {
  id: OrderStatus;
  stepIndex: number;
  label: string;
  sublabel: string;
  dineInSublabel: string;
  pickupSublabel: string;
  icon: React.ElementType;
  color: string;
  glowBg: string;
  eta: string;
}

const STEPS: StepConfig[] = [
  {
    id: "pending",
    stepIndex: 1,
    label: "Order Placed",
    sublabel: "Order received, sending to kitchen...",
    dineInSublabel: "Order received by restaurant table service",
    pickupSublabel: "Order received, takeaway queue confirmed",
    icon: Clock,
    color: "text-amber-400 border-amber-500/50 bg-amber-500/10",
    glowBg: "bg-amber-500/20",
    eta: "Est. 25-35 mins",
  },
  {
    id: "confirmed",
    stepIndex: 2,
    label: "Order Confirmed",
    sublabel: "Restaurant accepted your order ☕",
    dineInSublabel: "Table order confirmed by manager",
    pickupSublabel: "Takeaway order accepted",
    icon: PackageCheck,
    color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
    glowBg: "bg-emerald-500/20",
    eta: "Est. 20-30 mins",
  },
  {
    id: "preparing",
    stepIndex: 3,
    label: "Preparing Meal",
    sublabel: "Chef is preparing your fresh order in kitchen 🍳",
    dineInSublabel: "Chef is cooking your hot meal 🍳",
    pickupSublabel: "Cooking & packing your takeaway meal 🍳",
    icon: ChefHat,
    color: "text-blue-400 border-blue-500/50 bg-blue-500/10",
    glowBg: "bg-blue-500/20",
    eta: "Est. 15-20 mins",
  },
  {
    id: "ready",
    stepIndex: 4,
    label: "Food Ready",
    sublabel: "Order packed hot & fresh, ready for dispatch 📦",
    dineInSublabel: "Food ready! Serving to your table shortly 🍽️",
    pickupSublabel: "Ready at takeaway counter! Please collect 🛍️",
    icon: PackageCheck,
    color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
    glowBg: "bg-emerald-500/20",
    eta: "Est. 5-10 mins",
  },
  {
    id: "out-for-delivery",
    stepIndex: 5,
    label: "Out for Delivery",
    sublabel: "Delivery partner is on the way to your address 🛵",
    dineInSublabel: "Serving hot & fresh at your table 🍽️",
    pickupSublabel: "Waiting at pickup counter for collection 🛍️",
    icon: Truck,
    color: "text-purple-400 border-purple-500/50 bg-purple-500/10",
    glowBg: "bg-purple-500/20",
    eta: "Est. 5-10 mins",
  },
  {
    id: "completed",
    stepIndex: 6,
    label: "Delivered",
    sublabel: "Order delivered! Enjoy your meal 🎉",
    dineInSublabel: "Served & completed! Enjoy your meal 🎉",
    pickupSublabel: "Order collected! Enjoy your meal 🎉",
    icon: CheckCircle2,
    color: "text-green-400 border-green-500/50 bg-green-500/10",
    glowBg: "bg-green-500/20",
    eta: "Completed",
  },
];

const STEP_INDEX_MAP: Record<string, number> = {
  pending: 1,
  confirmed: 2,
  preparing: 3,
  ready: 4,
  "out-for-delivery": 5,
  completed: 6,
  cancelled: 0,
};

export default function LiveOrderTracker({
  orderId,
  initialOrder,
  onStatusChange,
  compact = false,
}: LiveOrderTrackerProps) {
  const [order, setOrder] = useState(initialOrder || null);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(
    initialOrder?.status || "pending"
  );
  const [loading, setLoading] = useState(!initialOrder);
  const [audioMuted, setAudioMuted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Sound chime on status change
  function playStatusChime() {
    if (audioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Audio chime failed", e);
    }
  }

  // Fetch latest order details
  useEffect(() => {
    async function fetchOrderDetails() {
      if (!orderId) return;
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("id", orderId)
          .single();

        if (error) {
          console.warn("Error fetching order:", error);
        } else if (data) {
          setOrder(data as any);
          setCurrentStatus(data.status as OrderStatus);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetails();

    // ── Supabase Realtime Listener ──────────────────────────────────────────
    const channelName = `tracker-${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updatedStatus = payload.new.status as OrderStatus;
          setCurrentStatus(updatedStatus);
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : null));

          if (onStatusChange) onStatusChange(updatedStatus);
          playStatusChime();

          const stepInfo = STEPS.find((s) => s.id === updatedStatus);
          toast.success(`🔔 Order Status Update: ${stepInfo?.label || updatedStatus}`, {
            description: stepInfo?.sublabel || "Your order details have updated.",
            duration: 5000,
          });

          if (updatedStatus === "completed") {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const currentStepIndex = STEP_INDEX_MAP[currentStatus] || 1;
  const isCancelled = currentStatus === "cancelled";
  const isCompleted = currentStatus === "completed";

  const activeStep = STEPS.find((s) => s.id === currentStatus) || STEPS[0];
  const orderType = order?.order_type || "dine-in";

  function getStepSublabel(step: StepConfig) {
    if (orderType === "dine-in") return step.dineInSublabel;
    if (orderType === "pickup") return step.pickupSublabel;
    return step.sublabel;
  }

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-marigold/15 text-marigold flex items-center justify-center mx-auto animate-pulse">
          <Clock className="w-5 h-5 animate-spin" />
        </div>
        <p className="text-xs font-bold text-stone/60">Connecting live order tracker...</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1E1C1A] to-[#141312] border border-white/15 p-5 sm:p-7 shadow-2xl text-stone space-y-6">
      {/* Background Pulse Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-marigold/10 rounded-full blur-3xl pointer-events-none" />

      {/* Confetti Particles Animation overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * 400 - 200 + "px",
                y: "-20px",
                scale: Math.random() * 0.8 + 0.4,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: "500px",
                rotate: Math.random() * 720,
                opacity: 0,
              }}
              transition={{
                duration: 2.5 + Math.random() * 1.5,
                ease: "easeOut",
              }}
              className="absolute left-1/2 w-3 h-3 rounded-sm"
              style={{
                backgroundColor: [
                  "#E8A93B",
                  "#F2C572",
                  "#4ADE80",
                  "#60A5FA",
                  "#F472B6",
                  "#A78BFA",
                ][i % 6],
              }}
            />
          ))}
        </div>
      )}

      {/* ── Top Bar: Order ID, Type Badge, Sound Toggle ── */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-extrabold text-marigold bg-marigold/15 px-3 py-1 rounded-xl border border-marigold/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-marigold" />
            #{orderId.slice(0, 8).toUpperCase()}
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-stone/80 bg-white/8 border border-white/15 px-3 py-1 rounded-xl">
            {orderType === "dine-in" ? (
              <>
                <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Dine-In Table
              </>
            ) : orderType === "pickup" ? (
              <>
                <Store className="w-3.5 h-3.5 text-amber-400" /> Takeaway Pickup
              </>
            ) : (
              <>
                <Truck className="w-3.5 h-3.5 text-blue-400" /> Home Delivery
              </>
            )}
          </span>
        </div>

        <button
          onClick={() => setAudioMuted(!audioMuted)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone/60 hover:text-stone transition cursor-pointer text-xs flex items-center gap-1.5 border border-white/10"
          title={audioMuted ? "Unmute updates" : "Mute updates"}
        >
          {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span className="hidden sm:inline text-[11px] font-bold">
            {audioMuted ? "Muted" : "Live Chime"}
          </span>
        </button>
      </div>

      {/* ── Main Hero Status Banner ── */}
      {isCancelled ? (
        <div className="bg-red-500/15 border border-red-500/30 rounded-2xl p-5 text-center space-y-2">
          <XCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="font-heading text-lg font-bold text-red-300">Order Cancelled</h3>
          <p className="text-xs text-red-200/70 max-w-sm mx-auto">
            This order was cancelled by restaurant staff. Please contact cafe support for assistance.
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-white/8 to-white/3 border border-white/15 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${activeStep.color} flex items-center justify-center shrink-0 shadow-lg relative`}>
              {!isCompleted && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping" />
              )}
              <activeStep.icon className="w-7 h-7" />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="font-heading text-lg font-bold text-stone">
                  {activeStep.label}
                </h3>
                {!isCompleted && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-stone/70 max-w-md">
                {getStepSublabel(activeStep)}
              </p>
            </div>
          </div>

          {!isCompleted && (
            <div className="bg-marigold/15 border border-marigold/30 px-4 py-2.5 rounded-2xl text-center shrink-0">
              <span className="text-[10px] uppercase tracking-wider font-bold text-marigold block">
                Estimated Time
              </span>
              <span className="font-heading text-sm font-extrabold text-stone">
                {activeStep.eta}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Progress Stepper Timeline ── */}
      {!isCancelled && (
        <div className="space-y-4">
          {/* Progress Bar Track */}
          <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{
                width: `${((currentStepIndex - 1) / (STEPS.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-marigold to-emerald-400 rounded-full shadow-lg"
            />
          </div>

          {/* Stepper Nodes */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            {STEPS.map((step) => {
              const isDone = currentStepIndex > step.stepIndex;
              const isCurrent = currentStepIndex === step.stepIndex;
              const StepIcon = step.icon;

              return (
                <div key={step.id} className="flex flex-col items-center text-center space-y-1.5 group">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isDone
                        ? "bg-emerald-500 text-pineDark font-bold shadow-md shadow-emerald-500/20"
                        : isCurrent
                        ? "bg-marigold text-pineDark font-extrabold shadow-lg shadow-marigold/30 ring-2 ring-marigold/50 scale-110"
                        : "bg-white/5 text-stone/30 border border-white/10"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>

                  <p
                    className={`text-[10px] font-bold leading-tight transition-colors hidden sm:block ${
                      isCurrent
                        ? "text-marigold"
                        : isDone
                        ? "text-stone"
                        : "text-stone/40"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Order Items & Address Summary ── */}
      {order && (
        <div className="border-t border-white/10 pt-4 space-y-3 text-xs">
          <div className="flex items-center justify-between text-stone/70">
            <span className="font-bold text-stone flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-marigold" />
              Order Items ({order.order_items?.length || 0})
            </span>
            <span className="font-extrabold text-marigold">
              ₹{Number(order.total_amount).toFixed(0)}
            </span>
          </div>

          {order.order_items && order.order_items.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-3 space-y-1.5 border border-white/8 max-h-36 overflow-y-auto">
              {order.order_items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="text-stone/80 truncate">
                    <span className="text-marigold font-bold mr-1.5">{item.quantity}×</span>
                    {item.item_name}
                  </span>
                  <span className="text-stone/60 font-bold shrink-0">
                    ₹{item.price_at_order * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Address or Special Instructions */}
          {order.address && (
            <div className="flex items-start gap-2 bg-white/5 rounded-xl p-2.5 text-[11px] text-stone/70 border border-white/8">
              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{order.address}</span>
            </div>
          )}

          {/* Contact Cafe Button */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <a
              href="tel:+919876543210"
              className="flex-1 flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 text-stone font-bold py-2.5 rounded-xl transition text-xs"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call Cafe Helpline</span>
            </a>

            <div className="text-[10px] text-stone/50 text-right shrink-0">
              <span className="block">Celebration Cafe</span>
              <span className="text-marigold">Hamirpur, HP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
