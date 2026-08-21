"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { supabase, type Profile, type Order } from "@/lib/supabase";

type CustomerWithStats = Profile & {
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string | null;
  orders: Order[];
};

export default function CustomerCRMPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomersAndStats();
  }, []);

  async function fetchCustomersAndStats() {
    setLoading(true);
    try {
      // 1. Fetch customer profiles
      const { data: profiles, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "customer")
        .order("created_at", { ascending: false });

      if (profileErr) throw profileErr;

      // 2. Fetch all customer orders
      const { data: orders, error: ordersErr } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersErr) throw ordersErr;

      const customerProfiles = (profiles as Profile[]) || [];
      const allOrders = (orders as Order[]) || [];

      // Map orders to customers
      const combined: CustomerWithStats[] = customerProfiles.map((c) => {
        // match orders by customer_id or by phone
        const cOrders = allOrders.filter(
          (o) => o.customer_id === c.id || (c.phone && o.phone === c.phone)
        );

        const totalOrders = cOrders.length;
        const totalSpend = cOrders
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

        const lastOrderDate = cOrders.length > 0 ? cOrders[0].created_at : null;

        return {
          ...c,
          totalOrders,
          totalSpend,
          lastOrderDate,
          orders: cOrders,
        };
      });

      setCustomers(combined);
    } catch (e) {
      console.error("Error fetching CRM data:", e);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      c.full_name.toLowerCase().includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(query))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-pine/10 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-bold text-pine flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-marigold" /> Customer Management (CRM)
          </h1>
          <p className="text-xs text-charcoal/60 mt-0.5">
            View registered customer profiles, lifetime order history, and spend analytics (Owner Only)
          </p>
        </div>

        <button
          onClick={fetchCustomersAndStats}
          className="p-2.5 rounded-2xl bg-pine/10 text-pine hover:bg-pine/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-pine/10 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-pine/50 shrink-0" />
        <input
          type="text"
          placeholder="Search customer by name, email or phone number…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-xs focus:outline-none font-medium text-pine placeholder:text-charcoal/40"
        />
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-3xl border border-pine/10 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-pine/10 bg-stone/30 flex items-center justify-between">
          <span className="text-xs font-bold text-pine uppercase tracking-wider">
            Customers Directory ({filteredCustomers.length})
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-pine font-bold">
            Loading Customer Directory…
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal/50">
            No customers found matching "{searchQuery}".
          </div>
        ) : (
          <div className="divide-y divide-pine/10">
            {filteredCustomers.map((customer) => {
              const isExpanded = expandedCustomerId === customer.id;

              return (
                <div key={customer.id} className="transition hover:bg-stone/20">
                  {/* Summary Row */}
                  <div
                    onClick={() =>
                      setExpandedCustomerId(isExpanded ? null : customer.id)
                    }
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  >
                    {/* Basic Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-pine text-marigold font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                        {customer.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-sm text-pine truncate">
                          {customer.full_name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-charcoal/60 mt-0.5">
                          {customer.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-pine/50" /> {customer.email}
                            </span>
                          )}
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-marigold" /> {customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats & Expand */}
                    <div className="flex items-center justify-between md:justify-end gap-6 text-xs shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-charcoal/50 uppercase block font-semibold">
                          Total Spend
                        </span>
                        <span className="font-heading font-extrabold text-pine text-sm">
                          ₹{customer.totalSpend}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-charcoal/50 uppercase block font-semibold">
                          Orders
                        </span>
                        <span className="font-bold text-pine bg-pine/10 px-2.5 py-0.5 rounded-full text-xs">
                          {customer.totalOrders}
                        </span>
                      </div>

                      <div className="p-1 rounded-xl bg-stone text-pine">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Order History Drawer */}
                  {isExpanded && (
                    <div className="p-5 bg-stone/40 border-t border-pine/10 space-y-3">
                      <h3 className="font-heading text-xs font-bold text-pine uppercase tracking-wider flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-marigold" />
                        Order History ({customer.orders.length})
                      </h3>

                      {customer.orders.length === 0 ? (
                        <p className="text-xs text-charcoal/50 italic">
                          No orders placed by this customer yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {customer.orders.map((o) => (
                            <div
                              key={o.id}
                              className="p-3 bg-white rounded-2xl border border-pine/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-pine">
                                    #{o.id.slice(0, 8).toUpperCase()}
                                  </span>
                                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-pine/10 text-pine">
                                    {o.order_type}
                                  </span>
                                  <span className="text-[10px] font-bold text-charcoal/60">
                                    {new Date(o.created_at).toLocaleString()}
                                  </span>
                                </div>
                                {o.address && (
                                  <p className="text-[11px] text-charcoal/70 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-red-500" /> {o.address}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-auto">
                                <span className="font-heading font-bold text-pine text-sm">
                                  ₹{o.total_amount}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                                    o.status === "completed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : o.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {o.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
