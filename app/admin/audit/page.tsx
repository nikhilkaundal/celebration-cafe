"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  User,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Code,
} from "lucide-react";
import { supabase, type AuditLog } from "@/lib/supabase";

type AuditWithActor = AuditLog & {
  actor?: { full_name: string; email: string; role: string } | null;
};

export default function AuditLogViewerPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditWithActor[]>([]);
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter]);

  async function fetchAuditLogs() {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*, actor:profiles!audit_logs_actor_id_fkey(full_name, email, role)", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (actionFilter !== "all") {
        query = query.ilike("action", `%${actionFilter}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Audit log fetch error:", error);
      } else {
        setLogs((data as AuditWithActor[]) || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-pine/10 shadow-xs">
        <div>
          <h1 className="font-heading text-2xl font-bold text-pine flex items-center gap-2">
            <FileText className="w-6 h-6 text-marigold" /> System Audit Trail
          </h1>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Immutable log of all staff mutations, status updates, and administrative actions (Owner Only)
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="p-2.5 rounded-2xl bg-pine/10 text-pine hover:bg-pine/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Action Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-pine/10 shadow-xs flex flex-wrap items-center gap-2 text-xs">
        <Filter className="w-4 h-4 text-pine/60 shrink-0" />
        <span className="font-bold text-pine mr-1">Filter Action:</span>

        {[
          { id: "all", label: "All Logs" },
          { id: "order", label: "Order Actions" },
          { id: "staff", label: "Staff Actions" },
          { id: "menu", label: "Menu Edits" },
          { id: "coupon", label: "Coupon Actions" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setActionFilter(f.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              actionFilter === f.id
                ? "bg-pine text-stone shadow-xs"
                : "bg-stone text-charcoal/70 hover:bg-pine/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Audit Log Table / Feed */}
      <div className="bg-white rounded-3xl border border-pine/10 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-pine/10 bg-stone/30 flex items-center justify-between">
          <span className="text-xs font-bold text-pine uppercase tracking-wider">
            Audit Feed Log
          </span>
          <span className="text-[10px] font-bold bg-pine/10 text-pine px-2.5 py-0.5 rounded-full">
            Page {page}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-pine font-bold">
            Loading Audit Feed…
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal/50">
            No audit logs recorded for this filter.
          </div>
        ) : (
          <div className="divide-y divide-pine/10">
            {logs.map((log) => (
              <div key={log.id} className="p-4 space-y-2 hover:bg-stone/20 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-pine/10 text-pine">
                      {log.action}
                    </span>
                    <span className="font-bold text-pine">Entity: {log.entity}</span>
                    {log.entity_id && (
                      <span className="font-mono text-[10px] text-charcoal/50">
                        ({log.entity_id.slice(0, 8)})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-charcoal/60">
                    <span className="flex items-center gap-1 font-medium">
                      <User className="w-3 h-3 text-marigold" />
                      {log.actor?.full_name || "System"} ({log.actor?.role || "auto"})
                    </span>
                    <span className="flex items-center gap-1 font-bold text-pine">
                      <Clock className="w-3 h-3 text-pine/50" />
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payload details preview */}
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="bg-stone/60 p-2.5 rounded-xl text-[11px] font-mono text-charcoal/80 border border-pine/5 overflow-x-auto">
                    {JSON.stringify(log.details)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-pine/10 bg-stone/20 flex items-center justify-between">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl border border-pine/15 text-xs font-bold text-pine hover:bg-white transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs font-bold text-pine">Page {page}</span>

          <button
            disabled={logs.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-xl border border-pine/15 text-xs font-bold text-pine hover:bg-white transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
