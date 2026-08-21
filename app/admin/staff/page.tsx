"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Key,
  Sparkles,
  Clock,
  UserCheck,
  UserX,
  RefreshCw,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type Profile, type UserRole } from "@/lib/supabase";

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

  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [inviteList, setInviteList] = useState<StaffInvite[]>([]);

  // Form state
  const [authMethod, setAuthMethod] = useState<"email" | "google">("email");
  const [selectedRole, setSelectedRole] = useState<"manager" | "worker">("worker");
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

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileRow?.role !== "owner") {
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
        supabase
          .from("profiles")
          .select("*")
          .in("role", ["owner", "manager", "worker"])
          .order("created_at", { ascending: false }),
        supabase.from("staff_invites").select("*").order("created_at", { ascending: false }),
      ]);

      if (staff) setStaffList(staff as Profile[]);
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
          role: selectedRole,
          authMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to create staff member");
      } else {
        toast.success(
          authMethod === "google"
            ? `Google Sign-In invite created for ${name} (${selectedRole})!`
            : `Staff account (${selectedRole}) created for ${name}!`
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

  async function toggleStatus(member: Profile) {
    const newStatus = member.status === "active" ? "deactivated" : "active";
    try {
      const res = await fetch("/api/admin/deactivate-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: member.id, newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update staff status");
      } else {
        toast.success(
          `${member.full_name} is now ${newStatus === "active" ? "Activated" : "Deactivated & Sessions Revoked"}`
        );
        loadStaffData();
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  }

  async function changeRole(member: Profile, newRole: UserRole) {
    if (member.role === "owner") {
      toast.error("Cannot change the owner's role");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", member.id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`${member.full_name}'s role updated to ${newRole}`);
        // Log audit
        await supabase.from("audit_logs").insert({
          action: "staff.role_change",
          entity: "profiles",
          entity_id: member.id,
          details: { name: member.full_name, old_role: member.role, new_role: newRole },
        });
        loadStaffData();
      }
    } catch (e) {
      toast.error("Failed to update role");
    }
  }

  async function cancelInvite(inviteId: string, email: string) {
    try {
      const { error } = await supabase.from("staff_invites").delete().eq("id", inviteId);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Invite for ${email} cancelled`);
        loadStaffData();
      }
    } catch (e) {
      toast.error("Failed to cancel invite");
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

  const activeStaff = staffList.filter((m) => m.status === "active");
  const deactivatedStaff = staffList.filter((m) => m.status === "deactivated");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-3xl border border-pine/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-pine flex items-center gap-2">
            <Users className="w-6 h-6 text-marigold" /> Staff Members Management
          </h1>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Create staff accounts, assign Manager or Worker roles, and manage active access (Owner Only)
          </p>
        </div>
        <button
          onClick={loadStaffData}
          className="p-2.5 rounded-2xl bg-pine/5 text-pine hover:bg-pine/10 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
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

            {/* Role Selection */}
            <div>
              <label className="block font-bold text-pine mb-1.5">Staff Role *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("worker")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    selectedRole === "worker"
                      ? "border-pine bg-pine/5 text-pine font-bold"
                      : "border-pine/15 text-charcoal/70"
                  }`}
                >
                  <p className="font-extrabold text-xs">Worker</p>
                  <p className="text-[10px] text-charcoal/60 leading-tight">
                    Order processing & status updates
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("manager")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    selectedRole === "manager"
                      ? "border-marigold bg-marigold/10 text-pine font-bold"
                      : "border-pine/15 text-charcoal/70"
                  }`}
                >
                  <p className="font-extrabold text-xs">Manager</p>
                  <p className="text-[10px] text-charcoal/60 leading-tight">
                    Orders + Menu item management
                  </p>
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
                  <code className="bg-white/60 px-1 rounded font-mono">/admin/login</code>, their account will automatically be activated with role{" "}
                  <strong className="uppercase">{selectedRole}</strong>.
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
                ? `Pre-Register Google Invite (${selectedRole.toUpperCase()})`
                : `Add Staff Account (${selectedRole.toUpperCase()})`}
            </button>
          </form>
        </div>

        {/* Staff List Column */}
        <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-pine/10 shadow-sm space-y-5">
          {/* Active Staff */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-pine/10 pb-2.5">
              <h2 className="font-heading text-base font-bold text-pine flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Active Team</span>
                <span className="bg-pine/10 text-pine text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  {activeStaff.length} members
                </span>
              </h2>
            </div>

            <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
              {activeStaff.map((member) => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-2xl bg-stone border border-pine/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pine text-marigold font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
                      {member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-pine text-sm leading-tight truncate">
                        {member.full_name}
                      </h3>
                      <p className="text-[11px] text-charcoal/60 flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="w-3 h-3 text-pine/50 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {/* Role badge / dropdown */}
                    {member.role === "owner" ? (
                      <span className="text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider bg-marigold text-pineDark shadow-xs">
                        Owner
                      </span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) => changeRole(member, e.target.value as UserRole)}
                        className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border border-pine/20 bg-white text-pine cursor-pointer focus:outline-none"
                      >
                        <option value="worker">Worker</option>
                        <option value="manager">Manager</option>
                      </select>
                    )}

                    {/* Deactivate button (if not owner) */}
                    {member.role !== "owner" && (
                      <button
                        onClick={() => toggleStatus(member)}
                        className="text-[10px] font-bold text-red-600 hover:bg-red-50 border border-red-200 px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                        title="Deactivate staff access"
                      >
                        <UserX className="w-3 h-3" /> Deactivate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deactivated Staff */}
          {deactivatedStaff.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-pine/10">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-sm font-bold text-red-700 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-red-600" />
                  <span>Deactivated Accounts</span>
                  <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {deactivatedStaff.length}
                  </span>
                </h2>
              </div>

              <div className="space-y-2 max-h-[20vh] overflow-y-auto pr-1">
                {deactivatedStaff.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-2xl bg-red-50/50 border border-red-200/60 flex items-center justify-between gap-3 text-xs opacity-75"
                  >
                    <div>
                      <p className="font-bold text-pine text-xs line-through">{member.full_name}</p>
                      <p className="text-[10px] text-charcoal/60">{member.email}</p>
                    </div>

                    <button
                      onClick={() => toggleStatus(member)}
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Re-Activate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                      <div className="w-8 h-8 rounded-lg bg-marigold/30 text-pine font-extrabold text-xs flex items-center justify-center shrink-0">
                        G
                      </div>
                      <div>
                        <p className="font-bold text-pine text-xs">
                          {invite.name}{" "}
                          <span className="text-[10px] font-extrabold uppercase text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded">
                            {invite.role === "employee" ? "worker" : invite.role}
                          </span>
                        </p>
                        <p className="text-[10px] text-charcoal/60">{invite.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 hidden sm:inline">
                        Awaiting Login
                      </span>
                      <button
                        onClick={() => cancelInvite(invite.id, invite.email)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Cancel invite"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
