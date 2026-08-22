import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const {
      items,
      orderType,
      customerName,
      phone,
      address,
      couponCode,
      notes,
    } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart items are required" }, { status: 400 });
    }

    if (!customerName || !phone) {
      return NextResponse.json({ error: "Customer name and phone are required" }, { status: 400 });
    }

    if (orderType === "delivery" && (!address || !address.trim())) {
      return NextResponse.json({ error: "Delivery address is required for home delivery" }, { status: 400 });
    }

    const deliveryFee = orderType === "delivery" ? 40 : 0;

    // Check if authenticated
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to place orders. Please sign in or register." },
        { status: 401 }
      );
    }

    const { data: orderId, error: rpcError } = await supabase.rpc("place_order", {
      p_items: items,
      p_order_type: orderType,
      p_customer_name: customerName.trim(),
      p_phone: phone.trim(),
      p_address: orderType === "delivery" ? address.trim() : null,
      p_coupon_code: couponCode ? couponCode.trim().toUpperCase() : null,
      p_notes: notes ? notes.trim() : null,
      p_delivery_fee: deliveryFee,
    });

    if (rpcError) {
      console.error("Order RPC Error:", rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      orderId,
      message: "Order placed successfully!",
    });
  } catch (err: any) {
    console.error("Order Place Endpoint Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to place order" },
      { status: 500 }
    );
  }
}
