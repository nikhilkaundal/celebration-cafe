import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "deactivate-staff", { limit: 10, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { staffId, newStatus } = await req.json();

    if (!staffId || !newStatus) {
      return NextResponse.json({ error: "Missing staffId or newStatus" }, { status: 400 });
    }

    // 1. Verify caller is logged in and is Owner
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "owner") {
      return NextResponse.json({ error: "Only the cafe owner can deactivate staff" }, { status: 403 });
    }

    // Protect against owner deactivating themselves
    if (staffId === user.id) {
      return NextResponse.json({ error: "Owner cannot deactivate their own account" }, { status: 400 });
    }

    // 2. Update status in profiles table
    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", staffId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 3. Instant Session Revocation: If deactivating, call admin.signOut to revoke JWT refresh tokens
    if (newStatus === "deactivated") {
      try {
        await supabaseAdmin.auth.admin.signOut(staffId);
      } catch (e) {
        console.warn("Auth token revocation warning:", e);
      }
    }

    // 4. Log audit action
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: user.id,
      action: "staff.status_change",
      entity: "profiles",
      entity_id: staffId,
      details: { target_id: staffId, new_status: newStatus },
    });

    return NextResponse.json({
      success: true,
      message: `Staff access ${newStatus === "active" ? "activated" : "deactivated & tokens revoked"}.`,
    });
  } catch (err: any) {
    console.error("Deactivate staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to update staff status" }, { status: 500 });
  }
}
