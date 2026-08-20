"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, Shield, Mail, CheckCircle2, Key, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase, type Staff } from "@/lib/supabase";

type StaffInvite = {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
};

export default function StaffManagementPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [inviteList, setInviteList] = useState<StaffInvite[]>([]);

  // Form state
  const [authMethod, setAuthMethod] = useState<"email" | "google">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkOwner() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data: staffRow } = await supabase
        .from("staff")
        .select("role")
        .eq("id", user.id)
        .single();

      if (staffRow?.role !== "owner") {
        toast.error("Only the cafe owner can manage staff members");
        router.push("/admin/orders");
        return;
      }

      setIsOwner(true);
      setChecking(false);
      loadStaffData();
    }

    checkOwner();
  }, [router]);

  async function loadStaffData() {
    try {
      const [{ data: staff }, { data: invites }] = await Promise.all([
        supabase.from("staff").select("*").order("created_at", { ascending: false }),
        supabase.from("staff_invites").select("*").order("created_at", { ascending: false }),
      ]);

      if (staff) setStaffList(staff as Staff[]);
      if (invites) setInviteList(invites as StaffInvite[]);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (authMethod === "email" && !password.trim()) {
      toast.error("Password is required for Email + Password login");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/create-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: authMethod === "email" ? password : undefined,
          authMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to create staff member");
      } else {
        toast.success(
          authMethod === "google"
            ? `Google Sign-In invite created for ${name}!`
            : `Staff account created for ${name}!`
        );
        setName("");
        setEmail("");
        setPassword("");
        loadStaffData();
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-3xl border border-pine/10 shadow-xs">
        <h1 className="font-heading text-2xl font-bold text-pine flex items-center gap-2">
          <Users className="w-6 h-6 text-marigold" /> Staff Members Management
        </h1>
        <p className="text-xs text-charcoal/60 mt-0.5">
          Add new staff accounts or invite Google accounts (Owner Only)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-pine/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-pine/10 pb-3">
            <UserPlus className="w-5 h-5 text-pine" />
            <h2 className="font-heading text-lg font-bold text-pine">Add New Staff</h2>
          </div>

          <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
            {/* Login Method Radio Selector */}
            <div>
              <label className="block font-bold text-pine mb-1.5">Login Method *</label>
              <div className="grid grid-cols-2 gap-2 bg-stone p-1.5 rounded-2xl border border-pine/15">
                <button
                  type="button"
                  onClick={() => setAuthMethod("email")}
                  className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMethod === "email"
                      ? "bg-pine text-stone shadow-xs"
                      : "text-charcoal/70 hover:bg-white"
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Email + Pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMethod("google")}
                  className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMethod === "google"
                      ? "bg-marigold text-pineDark shadow-xs"
                      : "text-charcoal/70 hover:bg-white"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                  </svg>
                  <span>Google Auth</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-pine mb-1">Employee Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone font-medium text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-pine mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder={
                  authMethod === "google" ? "ramesh@gmail.com" : "employee@celebrationcafe.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone font-medium text-xs"
              />
            </div>

            {authMethod === "email" ? (
              <div>
                <label className="block font-bold text-pine mb-1">Temporary Password *</label>
                <input
                  type="text"
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-pine/20 rounded-xl px-3.5 py-2.5 bg-stone font-mono font-bold text-xs"
                />
                <p className="text-[10px] text-charcoal/50 mt-1">
                  Share this password with them directly to log in at{" "}
                  <code className="bg-pine/10 px-1 rounded text-pine font-mono">/admin/login</code>.
                </p>
              </div>
            ) : (
              <div className="bg-marigold/15 border border-marigold/40 p-3 rounded-2xl text-[11px] text-pine space-y-1">
                <p className="font-extrabold flex items-center gap-1 text-pineDark">
                  <Sparkles className="w-3.5 h-3.5 text-marigold" /> Google Sign-In Invite
                </p>
                <p className="text-charcoal/80 leading-relaxed">
                  No password needed! When {name || "this employee"} signs in with Google at{" "}
                  <code className="bg-white/60 px-1 rounded font-mono">/admin/login</code>, their Google account will automatically be activated as staff.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-marigold text-pineDark hover:bg-marigoldLight font-extrabold py-3 rounded-2xl text-xs shadow-md transition cursor-pointer disabled:opacity-60"
            >
              {submitting
                ? "Processing…"
                : authMethod === "google"
                ? "Pre-Register Google Staff Invite"
                : "Add Staff Account"}
            </button>
          </form>
        </div>

        {/* Staff List Column */}
        <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-pine/10 shadow-sm space-y-5">
          {/* Active Staff */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-pine/10 pb-2.5">
              <h2 className="font-heading text-base font-bold text-pine flex items-center gap-2">
                <span>Active Team</span>
                <span className="bg-pine/10 text-pine text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  {staffList.length} members
                </span>
              </h2>
            </div>

            <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
              {staffList.map((member) => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-2xl bg-stone border border-pine/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pine text-marigold font-extrabold text-xs flex items-center justify-center shadow-xs">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-pine text-sm leading-tight">{member.name}</h3>
                      <p className="text-[11px] text-charcoal/60 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-pine/50" />
                        <span>{member.email}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      member.role === "owner"
                        ? "bg-marigold text-pineDark shadow-xs"
                        : "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Google Invites */}
          {inviteList.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-pine/10">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-sm font-bold text-pine flex items-center gap-2">
                  <Clock className="w-4 h-4 text-marigold" />
                  <span>Pending Google Invites</span>
                  <span className="bg-marigold/20 text-pine text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {inviteList.length} pending
                  </span>
                </h2>
              </div>

              <div className="space-y-2 max-h-[25vh] overflow-y-auto pr-1">
                {inviteList.map((invite) => (
                  <div
                    key={invite.id}
                    className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-marigold/30 text-pine font-extrabold text-xs flex items-center justify-center">
                        G
                      </div>
                      <div>
                        <p className="font-bold text-pine text-xs">{invite.name}</p>
                        <p className="text-[10px] text-charcoal/60">{invite.email}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Awaiting Google Login
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
