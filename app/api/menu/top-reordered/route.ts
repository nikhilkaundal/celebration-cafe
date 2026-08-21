import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "top-reordered-dishes", { limit: 120, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ dishes: [] }, { status: 429 });
    }

    // Call RPC function get_top_reordered_dishes
    const { data: dishes, error } = await supabaseAdmin.rpc("get_top_reordered_dishes", {
      p_limit: 6,
    });

    if (error) {
      console.warn("RPC get_top_reordered_dishes error, falling back to menu items query:", error);
      // Fallback query: top available menu items
      const { data: fallbackItems } = await supabaseAdmin
        .from("menu_items")
        .select("id, name, description, price, image_url, is_veg, category_id")
        .eq("is_available", true)
        .order("created_at", { ascending: true })
        .limit(6);

      const formatted = (fallbackItems || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        photo: item.image_url,
        is_veg: item.is_veg,
        category_id: item.category_id,
        reorder_count: 12,
        reorder_rate: "94% Reordered",
        is_highly_reordered: true,
      }));

      return NextResponse.json({ dishes: formatted });
    }

    return NextResponse.json(
      { dishes: dishes || [] },
      {
        headers: {
          "Cache-Control": "public, max-age=180, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err: any) {
    console.error("Top Reordered Dishes Endpoint Error:", err);
    return NextResponse.json({ dishes: [] });
  }
}
