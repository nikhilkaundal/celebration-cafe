import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["owner", "manager"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { coupon_id, offer_id, terms } = body;

    if (!coupon_id && !offer_id) {
      return NextResponse.json({ error: "coupon_id or offer_id is required" }, { status: 400 });
    }

    if (!Array.isArray(terms)) {
      return NextResponse.json({ error: "terms must be an array" }, { status: 400 });
    }

    // 1. Delete previous terms for this entity
    if (coupon_id) {
      await supabaseAdmin.from("offer_terms").delete().eq("coupon_id", coupon_id);
    } else if (offer_id) {
      await supabaseAdmin.from("offer_terms").delete().eq("offer_id", offer_id);
    }

    if (terms.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Sanitize and map new terms
    const formattedRows = terms.map((t: any, idx: number) => {
      // Basic XSS sanitization for custom free text
      let customText = t.custom_text ? String(t.custom_text).replace(/<[^>]*>?/gm, "").trim() : null;

      return {
        coupon_id: coupon_id || null,
        offer_id: offer_id || null,
        tnc_template_id: t.tnc_template_id || null,
        custom_text: t.tnc_template_id ? null : customText,
        param_value: t.param_value ? String(t.param_value).trim() : null,
        sort_order: idx + 1,
        created_by: user.id,
      };
    });

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("offer_terms")
      .insert(formattedRows)
      .select();

    if (insertErr) {
      console.error("Error inserting offer_terms:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: inserted?.length || 0, terms: inserted });
  } catch (err: any) {
    console.error("POST offer-terms/save error:", err);
    return NextResponse.json({ error: err.message || "Failed to save terms" }, { status: 500 });
  }
}
