import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "menu-item-customizations", { limit: 100, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ groups: [] }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const menuItemId = searchParams.get("menu_item_id");

    if (!menuItemId) {
      return NextResponse.json({ error: "menu_item_id is required" }, { status: 400 });
    }

    // Fetch customization groups for this menu item
    const { data: groups, error: groupsErr } = await supabaseAdmin
      .from("item_customizations")
      .select("id, group_name, is_required, max_select, sort_order")
      .eq("menu_item_id", menuItemId)
      .order("sort_order", { ascending: true });

    if (groupsErr) {
      console.error("Fetch item_customizations error:", groupsErr);
      return NextResponse.json({ groups: [] });
    }

    if (!groups || groups.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    const groupIds = groups.map((g: any) => g.id);

    // Fetch options for these groups
    const { data: options, error: optsErr } = await supabaseAdmin
      .from("customization_options")
      .select("id, customization_id, label, extra_price, is_available, sort_order")
      .in("customization_id", groupIds)
      .eq("is_available", true)
      .order("sort_order", { ascending: true });

    if (optsErr) {
      console.error("Fetch customization_options error:", optsErr);
    }

    // Map options to their respective groups
    const optionsMap: Record<string, any[]> = {};
    (options || []).forEach((opt: any) => {
      if (!optionsMap[opt.customization_id]) {
        optionsMap[opt.customization_id] = [];
      }
      optionsMap[opt.customization_id].push({
        id: opt.id,
        name: opt.label,
        extraPrice: Number(opt.extra_price || 0),
        price: Number(opt.extra_price || 0),
      });
    });

    const formattedGroups = groups.map((g: any) => ({
      id: g.id,
      group_name: g.group_name,
      is_required: g.is_required,
      max_select: g.max_select,
      options: optionsMap[g.id] || [],
    }));

    return NextResponse.json(
      { groups: formattedGroups },
      {
        headers: {
          "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err: any) {
    console.error("Menu Item Customizations Error:", err);
    return NextResponse.json({ groups: [] }, { status: 500 });
  }
}
