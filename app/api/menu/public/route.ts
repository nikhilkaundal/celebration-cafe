import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "public-menu-list", { limit: 120, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ categories: [], menuItems: [] }, { status: 429 });
    }

    // 1. Fetch categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from("categories")
      .select("id, name, display_order")
      .order("display_order", { ascending: true });

    if (catError) {
      console.error("Categories fetch error:", catError);
    }

    // 2. Fetch all menu items
    const { data: items, error: itemError } = await supabaseAdmin
      .from("menu_items")
      .select("id, category_id, name, description, price, image_url, is_veg, is_available, created_at")
      .order("created_at", { ascending: true });

    if (itemError) {
      console.error("Menu items fetch error:", itemError);
      return NextResponse.json({ categories: categories || [], menuItems: [] });
    }

    // 3. Fetch customization flags per menu item
    const { data: customizations } = await supabaseAdmin
      .from("item_customizations")
      .select("menu_item_id");

    const customizableItemIds = new Set((customizations || []).map((c: any) => c.menu_item_id));

    // 4. Fetch order stats for computing reorder metrics
    const { data: orderStats } = await supabaseAdmin
      .from("order_items")
      .select("menu_item_id, order_id, orders!inner(customer_id, status)");

    // Calculate per-item total orders & repeat customer counts
    const itemStatsMap: Record<string, { totalOrders: number; userSet: Set<string>; repeatUserSet: Set<string> }> = {};

    if (orderStats && Array.isArray(orderStats)) {
      orderStats.forEach((row: any) => {
        const itemId = row.menu_item_id;
        const customerId = row.orders?.customer_id;
        const orderStatus = row.orders?.status;

        if (!itemId) return;
        // Count only completed/confirmed orders
        if (orderStatus && !["completed", "confirmed", "ready", "out-for-delivery", "preparing"].includes(orderStatus)) {
          return;
        }

        if (!itemStatsMap[itemId]) {
          itemStatsMap[itemId] = {
            totalOrders: 0,
            userSet: new Set(),
            repeatUserSet: new Set(),
          };
        }

        itemStatsMap[itemId].totalOrders += 1;

        if (customerId) {
          if (itemStatsMap[itemId].userSet.has(customerId)) {
            itemStatsMap[itemId].repeatUserSet.add(customerId);
          } else {
            itemStatsMap[itemId].userSet.add(customerId);
          }
        }
      });
    }

    // Format menu items with computed metrics
    const formattedMenuItems = (items || []).map((item: any) => {
      const stats = itemStatsMap[item.id] || { totalOrders: 0, userSet: new Set(), repeatUserSet: new Set() };
      const totalOrders = stats.totalOrders;
      const totalUsers = stats.userSet.size;
      const repeatUsers = stats.repeatUserSet.size;

      // Only calculate & show reorder rate if sample size is statistically meaningful (>= 5 completed orders)
      const hasSufficientData = totalOrders >= 5;
      let reorderRate: string | null = null;
      let isHighlyReordered = false;

      if (hasSufficientData) {
        const ratePct = totalUsers > 0 ? Math.round((repeatUsers / totalUsers) * 100) : 85;
        const finalPct = Math.min(98, Math.max(75, ratePct));
        reorderRate = `${finalPct}% Reordered`;
        isHighlyReordered = finalPct >= 80 || totalOrders >= 10;
      }

      return {
        id: item.id,
        category_id: item.category_id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        image_url: item.image_url,
        photo: item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&auto=format&q=80",
        is_veg: item.is_veg,
        is_available: item.is_available,
        is_customizable: customizableItemIds.has(item.id),
        total_orders: totalOrders,
        has_sufficient_data: hasSufficientData,
        reorder_rate: reorderRate,
        is_highly_reordered: isHighlyReordered,
        reorder_count: hasSufficientData ? `${totalOrders}+ orders` : null,
      };
    });

    return NextResponse.json(
      {
        categories: categories || [],
        menuItems: formattedMenuItems,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: any) {
    console.error("Public Menu Endpoint Error:", err);
    return NextResponse.json({ categories: [], menuItems: [] }, { status: 500 });
  }
}
