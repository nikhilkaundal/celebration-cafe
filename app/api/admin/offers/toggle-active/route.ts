import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "toggle-offer-active", { limit: 30, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id, is_active } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Offer ID is required" }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("offers")
      .update({ is_active: Boolean(is_active), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: error?.message || "Failed to update status" }, { status: 500 });
    }

    // Audit logging
    await supabaseAdmin.from("audit_logs").insert({
      action: "offer.toggle_active",
      entity: "offers",
      entity_id: id,
      details: { title: updated.title, is_active: updated.is_active },
    });

    return NextResponse.json({
      success: true,
      offer: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
