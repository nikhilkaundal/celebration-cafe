import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "public-get-coupons", { limit: 120, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ coupons: [] }, { status: 429 });
    }

    const now = new Date().toISOString();

    // Query active coupons that are currently valid
    const { data: coupons, error } = await supabaseAdmin
      .from("coupons")
      .select("id, code, discount_type, value, min_order_value, max_discount, per_user_limit, valid_to")
      .eq("is_active", true)
      .or(`valid_to.is.null,valid_to.gte.${now}`)
      .order("value", { ascending: false });

    if (error) {
      console.error("Public active coupons query error:", error);
      return NextResponse.json({ coupons: [] });
    }

    return NextResponse.json(
      { coupons: coupons || [] },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    console.error("Public active coupons error:", err);
    return NextResponse.json({ coupons: [] });
  }
}
