"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Users,
  Utensils,
  Store,
  Truck,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { supabase, type Order } from "@/lib/supabase";

export default function AdminAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7days" | "30days">("7days");

  // Metrics
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [todayAvgOrderValue, setTodayAvgOrderValue] = useState(0);
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);

  // Mode Breakdown
  const [modeBreakdown, setModeBreakdown] = useState<{
    dineIn: { count: number; revenue: number };
    pickup: { count: number; revenue: number };
    delivery: { count: number; revenue: number };
  }>({
    dineIn: { count: 0, revenue: 0 },
    pickup: { count: 0, revenue: 0 },
    delivery: { count: 0, revenue: 0 },
  });

  // Daily revenue bars
  const [dailyData, setDailyData] = useState<{ dateStr: string; label: string; revenue: number; orders: number }[]>([]);

  // Top Items
  const [topItems, setTopItems] = useState<{ name: string; quantity: number; revenue: number }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // 1. Fetch Orders
      const days = timeRange === "7days" ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [{ data: orders }, { data: items }, { count: customerCount }] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: true }),
        supabase
          .from("order_items")
          .select("item_name, quantity, price_at_order, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "customer"),
      ]);

      const allOrders = (orders as Order[]) || [];

      // Calculate Today's Stats
      const todayStr = new Date().toDateString();
      const todayOrders = allOrders.filter(
        (o) => new Date(o.created_at).toDateString() === todayStr && o.status !== "cancelled"
      );

      const tRev = todayOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      const tCount = todayOrders.length;
      const tAvg = tCount > 0 ? tRev / tCount : 0;

      setTodayRevenue(tRev);
      setTodayOrdersCount(tCount);
      setTodayAvgOrderValue(Math.round(tAvg));
      setTotalCustomersCount(customerCount || 0);

      // Order Mode Breakdown
      const modes = {
        dineIn: { count: 0, revenue: 0 },
        pickup: { count: 0, revenue: 0 },
        delivery: { count: 0, revenue: 0 },
      };

      allOrders.forEach((o) => {
        if (o.status === "cancelled") return;
        const amt = Number(o.total_amount || 0);
        if (o.order_type === "dine-in") {
          modes.dineIn.count++;
          modes.dineIn.revenue += amt;
        } else if (o.order_type === "pickup") {
          modes.pickup.count++;
          modes.pickup.revenue += amt;
        } else if (o.order_type === "delivery") {
          modes.delivery.count++;
          modes.delivery.revenue += amt;
        }
      });
      setModeBreakdown(modes);

      // Daily Revenue Bars
      const dailyMap: Record<string, { dateStr: string; label: string; revenue: number; orders: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
        dailyMap[key] = { dateStr: key, label, revenue: 0, orders: 0 };
      }

      allOrders.forEach((o) => {
        if (o.status === "cancelled") return;
        const key = new Date(o.created_at).toISOString().split("T")[0];
        if (dailyMap[key]) {
          dailyMap[key].revenue += Number(o.total_amount || 0);
          dailyMap[key].orders += 1;
        }
      });

      setDailyData(Object.values(dailyMap));

      // Top Items Calculation
      if (items) {
        const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
        items.forEach((it: any) => {
          const name = it.item_name || "Unknown Item";
          if (!itemMap[name]) {
            itemMap[name] = { name, quantity: 0, revenue: 0 };
          }
          itemMap[name].quantity += Number(it.quantity || 1);
          itemMap[name].revenue += Number(it.price_at_order || 0) * Number(it.quantity || 1);
        });

        const sorted = Object.values(itemMap)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
        setTopItems(sorted);
      }
    } catch (e) {
      console.error("Failed to load analytics dashboard:", e);
    } finally {
      setLoading(false);
    }
  }

  const maxDailyRevenue = Math.max(...dailyData.map((d) => d.revenue), 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-pine/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-pine">Business Analytics</h1>
            <span className="bg-marigold/20 text-pineDark text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-marigold/40">
              <Sparkles className="w-3 h-3 text-marigold" /> Realtime Overview
            </span>
          </div>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Key revenue metrics, ordering patterns, and top-performing items for Celebration Food Cafe
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="bg-stone p-1 rounded-2xl border border-pine/15 flex items-center text-xs">
            <button
              onClick={() => setTimeRange("7days")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                timeRange === "7days"
                  ? "bg-pine text-stone shadow-xs"
                  : "text-charcoal/70 hover:text-pine"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange("30days")}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                timeRange === "30days"
                  ? "bg-pine text-stone shadow-xs"
                  : "text-charcoal/70 hover:text-pine"
              }`}
            >
              Last 30 Days
            </button>
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-2xl bg-pine/10 text-pine hover:bg-pine/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-pine/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal/60 uppercase tracking-wider">
              Today's Revenue
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="font-heading text-3xl font-extrabold text-pine">₹{todayRevenue}</p>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Calculated live from completed & active orders
          </p>
        </div>

        {/* Today's Orders */}
        <div className="bg-white p-5 rounded-3xl border border-pine/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal/60 uppercase tracking-wider">
              Orders Today
            </span>
            <div className="w-9 h-9 rounded-2xl bg-marigold/20 text-pineDark flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-extrabold text-pine">{todayOrdersCount}</p>
          <p className="text-[11px] text-charcoal/60 font-medium">
            Active dine-in, takeaway & delivery
          </p>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white p-5 rounded-3xl border border-pine/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal/60 uppercase tracking-wider">
              Avg Order Value
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-extrabold text-pine">₹{todayAvgOrderValue}</p>
          <p className="text-[11px] text-charcoal/60 font-medium">Per completed transaction</p>
        </div>

        {/* Registered Customers */}
        <div className="bg-white p-5 rounded-3xl border border-pine/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal/60 uppercase tracking-wider">
              Registered Customers
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/15 text-blue-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-extrabold text-pine">{totalCustomersCount}</p>
          <p className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            Verified accounts in database
          </p>
        </div>
      </div>

      {/* ── Main Dashboard Content: Revenue Bar Chart & Mode Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Revenue Bar Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-pine/10 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-pine/10 pb-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-pine flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-marigold" /> Revenue Trend
              </h2>
              <p className="text-xs text-charcoal/60">
                Daily sales totals for the selected period
              </p>
            </div>
            <span className="text-xs font-bold bg-stone px-3 py-1 rounded-full text-pine">
              {timeRange === "7days" ? "Past 7 Days" : "Past 30 Days"}
            </span>
          </div>

          {/* Pure Tailwind CSS Custom Bar Chart */}
          <div className="pt-4 pb-2">
            <div className="h-56 flex items-end justify-between gap-2 border-b border-pine/10 px-2 pb-2">
              {dailyData.map((d, i) => {
                const heightPercent = maxDailyRevenue > 0 ? (d.revenue / maxDailyRevenue) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1.5 group relative h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-pine text-stone text-[10px] font-bold py-1 px-2 rounded-xl shadow-md pointer-events-none whitespace-nowrap z-10">
                      ₹{d.revenue} ({d.orders} orders)
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      className="w-full max-w-[40px] bg-gradient-to-t from-pine to-marigold rounded-t-xl group-hover:brightness-110 transition-all duration-300 shadow-xs"
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between gap-2 px-2 pt-2 text-[10px] font-bold text-charcoal/60 overflow-x-auto">
              {dailyData.map((d, i) => (
                <div key={i} className="flex-1 text-center truncate">
                  {timeRange === "7days" ? d.label : d.dateStr.slice(8)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Mode Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-pine/10 shadow-xs space-y-4">
          <div className="border-b border-pine/10 pb-3">
            <h2 className="font-heading text-lg font-bold text-pine flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-marigold" /> Order Modes
            </h2>
            <p className="text-xs text-charcoal/60">Revenue split across channels</p>
          </div>

          <div className="space-y-3 pt-1">
            {/* Dine-In */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-pine">
                <span className="flex items-center gap-2 text-emerald-800">
                  <Utensils className="w-4 h-4 text-emerald-600" /> Dine-In
                </span>
                <span className="font-heading text-sm text-emerald-900">
                  ₹{modeBreakdown.dineIn.revenue}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-charcoal/60 font-medium">
                <span>{modeBreakdown.dineIn.count} orders placed</span>
              </div>
            </div>

            {/* Takeaway */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-pine">
                <span className="flex items-center gap-2 text-amber-800">
                  <Store className="w-4 h-4 text-amber-600" /> Takeaway
                </span>
                <span className="font-heading text-sm text-amber-900">
                  ₹{modeBreakdown.pickup.revenue}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-charcoal/60 font-medium">
                <span>{modeBreakdown.pickup.count} orders placed</span>
              </div>
            </div>

            {/* Delivery */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-pine">
                <span className="flex items-center gap-2 text-blue-800">
                  <Truck className="w-4 h-4 text-blue-600" /> Home Delivery
                </span>
                <span className="font-heading text-sm text-blue-900">
                  ₹{modeBreakdown.delivery.revenue}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-charcoal/60 font-medium">
                <span>{modeBreakdown.delivery.count} orders placed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Selling Menu Items List ── */}
      <div className="bg-white p-6 rounded-3xl border border-pine/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-pine/10 pb-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-pine flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-marigold" /> Top Selling Items
            </h2>
            <p className="text-xs text-charcoal/60">Most ordered dishes by quantity</p>
          </div>
        </div>

        {topItems.length === 0 ? (
          <p className="text-xs text-charcoal/50 text-center py-6">
            No order items data recorded yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {topItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-stone border border-pine/10 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-lg bg-pine text-marigold font-extrabold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {item.quantity} sold
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-xs text-pine line-clamp-1">{item.name}</h3>
                  <p className="text-[11px] font-semibold text-charcoal/70">₹{item.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
