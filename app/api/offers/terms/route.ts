import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "public-offer-terms", { limit: 120, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ terms: [] }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const couponId = searchParams.get("coupon_id");
    const offerId = searchParams.get("offer_id");

    if (!couponId && !offerId) {
      return NextResponse.json({ terms: [] });
    }

    let query = supabaseAdmin
      .from("offer_terms")
      .select("id, custom_text, param_value, sort_order, tnc_template_id, tnc_templates(label, param_type, param_label)")
      .order("sort_order", { ascending: true });

    if (couponId) {
      query = query.eq("coupon_id", couponId);
    } else if (offerId) {
      query = query.eq("offer_id", offerId);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Error fetching offer_terms:", error);
      return NextResponse.json({ terms: [] });
    }

    const formattedTerms = (rows || []).map((row: any) => {
      if (row.custom_text) {
        return {
          id: row.id,
          text: row.custom_text,
          sort_order: row.sort_order,
        };
      }

      let text = row.tnc_templates?.label || "";
      if (row.param_value && text.includes("[param]")) {
        text = text.replace("[param]", row.param_value);
      }

      return {
        id: row.id,
        text,
        sort_order: row.sort_order,
      };
    });

    return NextResponse.json(
      { terms: formattedTerms },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: any) {
    console.error("GET public terms error:", err);
    return NextResponse.json({ terms: [] }, { status: 500 });
  }
}
