import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "check-coupon-code", { limit: 60, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many checks. Please wait." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase() || "";

    if (!code || code.length < 3) {
      return NextResponse.json({ available: true, code });
    }

    // Check if code exists in coupons table
    const { data: existing } = await supabaseAdmin
      .from("coupons")
      .select("id")
      .ilike("code", code)
      .limit(1);

    const isTaken = existing && existing.length > 0;

    return NextResponse.json({
      available: !isTaken,
      code,
      message: isTaken ? "Coupon code already exists" : "Coupon code is available",
    });
  } catch (err: any) {
    console.error("Check coupon code error:", err);
    return NextResponse.json({ available: true, code: "" });
  }
}
