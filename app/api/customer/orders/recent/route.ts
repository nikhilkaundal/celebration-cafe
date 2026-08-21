import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "customer-recent-orders", { limit: 60, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ orders: [] }, { status: 429 });
    }

    let user: any = null;

    // 1. Check Bearer Auth header
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (userData?.user) {
        user = userData.user;
      }
    }

    // 2. Check SSR Cookies if Bearer token not provided
    if (!user) {
      try {
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
        const { data: userData } = await supabase.auth.getUser();
        user = userData?.user || null;
      } catch (e) {
        console.warn("SSR cookie auth warning for recent orders:", e);
      }
    }

    // If unauthenticated guest -> return empty array (never leak order data)
    if (!user) {
      return NextResponse.json({ orders: [], authenticated: false });
    }

    // Call RPC function get_customer_recent_orders with authenticated user ID
    const { data: orders, error } = await supabaseAdmin.rpc("get_customer_recent_orders", {
      p_customer_id: user.id,
      p_limit: 3,
    });

    if (error) {
      console.warn("RPC get_customer_recent_orders error, falling back to direct table query:", error);
      // Fallback direct table query if RPC not updated yet
      const { data: directOrders } = await supabaseAdmin
        .from("orders")
        .select("id, order_type, status, total_amount, subtotal, discount, delivery_fee, created_at, order_items(id, menu_item_id, item_name, quantity, price_at_order, selected_customizations, menu_items(image_url, is_available, price))")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      const formatted = (directOrders || []).map((o: any) => ({
        id: o.id,
        order_type: o.order_type,
        status: o.status,
        total_amount: Number(o.total_amount),
        subtotal: Number(o.subtotal || 0),
        discount: Number(o.discount || 0),
        delivery_fee: Number(o.delivery_fee || 0),
        created_at: o.created_at,
        relative_time: getRelativeTimeString(o.created_at),
        items: (o.order_items || []).map((oi: any) => ({
          id: oi.id,
          item_id: oi.menu_item_id,
          name: oi.item_name,
          quantity: oi.quantity,
          price: Number(oi.price_at_order),
          photo: oi.menu_items?.image_url || "",
          is_available: oi.menu_items?.is_available ?? true,
          current_price: Number(oi.menu_items?.price || oi.price_at_order),
          customizations: oi.selected_customizations || [],
        })),
      }));

      return NextResponse.json({ orders: formatted, authenticated: true });
    }

    return NextResponse.json({ orders: orders || [], authenticated: true });
  } catch (err: any) {
    console.error("Customer Recent Orders Error:", err);
    return NextResponse.json({ orders: [], authenticated: false });
  }
}

function getRelativeTimeString(dateStr: string): string {
  try {
    const past = new Date(dateStr).getTime();
    const now = Date.now();
    const diffHours = Math.floor((now - past) / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffHours < 48) return "Yesterday";
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  } catch {
    return "Recently";
  }
}
