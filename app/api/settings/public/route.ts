import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from("restaurant_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("Public settings fetch warning:", error.message);
    }

    return NextResponse.json({
      settings: settings || {
        payment_qr_url: null,
        upi_id: "celebrationcafe@upi",
        restaurant_name: "Celebration Food Cafe",
        phone: "9876543210",
        address: "Hamirpur, HP",
      },
    });
  } catch (err: any) {
    console.error("Public settings error:", err);
    return NextResponse.json(
      {
        settings: {
          payment_qr_url: null,
          upi_id: "celebrationcafe@upi",
          restaurant_name: "Celebration Food Cafe",
          phone: "9876543210",
          address: "Hamirpur, HP",
        },
      },
      { status: 200 }
    );
  }
}
