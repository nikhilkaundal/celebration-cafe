import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { data: completedOrders } = await supabaseAdmin
      .from("orders")
      .select("total_amount")
      .neq("status", "cancelled");

    if (!completedOrders || completedOrders.length === 0) {
      return NextResponse.json({ averageOrderValue: 350, totalOrdersCount: 0 });
    }

    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const avg = Math.round(totalRevenue / completedOrders.length);

    return NextResponse.json({
      averageOrderValue: avg > 0 ? avg : 350,
      totalOrdersCount: completedOrders.length,
    });
  } catch (err: any) {
    console.error("Coupon stats error:", err);
    return NextResponse.json({ averageOrderValue: 350, totalOrdersCount: 0 });
  }
}
