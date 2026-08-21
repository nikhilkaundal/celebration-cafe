import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "public-get-offers", { limit: 120, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ offers: [] }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location") || "home_top";

    // Call server-side scheduling RPC function get_active_public_offers
    const { data: offers, error } = await supabaseAdmin.rpc("get_active_public_offers", {
      p_location: location,
    });

    if (error) {
      console.error("RPC get_active_public_offers Error:", error);
      // Fallback query
      const { data: fallbackOffers } = await supabaseAdmin
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .eq("display_location", location)
        .order("sort_order", { ascending: true });

      return NextResponse.json({ offers: fallbackOffers || [] });
    }

    return NextResponse.json(
      { offers: offers || [] },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    console.error("Public active offers error:", err);
    return NextResponse.json({ offers: [] });
  }
}
