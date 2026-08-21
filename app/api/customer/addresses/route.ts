import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@supabase/supabase-js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (serviceRoleKey && serviceRoleKey !== "placeholder-service-role-key") {
    return supabaseAdmin;
  }

  return createClient(supabaseUrl, anonKey);
}

async function resolveValidUUID(supabase: any, rawInput: string | null | undefined): Promise<string> {
  if (!rawInput || rawInput === "undefined" || rawInput === "null") {
    return "00000000-0000-0000-0000-000000000000";
  }

  const trimmed = rawInput.trim();

  // 1. If it's already a valid UUID format, return directly
  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }

  // 2. If it's an email or phone number, lookup user in public.profiles table
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .or(`email.eq.${trimmed},phone.eq.${trimmed}`)
      .limit(1)
      .maybeSingle();

    if (profile?.id && UUID_REGEX.test(profile.id)) {
      return profile.id;
    }
  } catch (e) {
    console.warn("Profile UUID lookup warning:", e);
  }

  // 3. Fallback UUID for guest users
  return "00000000-0000-0000-0000-000000000000";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getClient();
    const { searchParams } = new URL(req.url);
    const rawCustomerId = searchParams.get("customer_id");

    const customerId = await resolveValidUUID(supabase, rawCustomerId);

    let query = supabase.from("addresses").select("*");
    if (customerId && customerId !== "00000000-0000-0000-0000-000000000000") {
      query = query.eq("customer_id", customerId);
    }
    query = query.order("is_default", { ascending: false }).order("created_at", { ascending: false });

    const { data: addresses, error } = await query;

    if (error) {
      console.error("Error fetching addresses from Supabase:", error);
      return NextResponse.json({ addresses: [] }, { status: 500 });
    }

    return NextResponse.json({ addresses: addresses || [] });
  } catch (err: any) {
    return NextResponse.json({ addresses: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getClient();
    const body = await req.json();

    const {
      customer_id,
      label,
      receiver_name,
      receiver_phone,
      line1,
      line2,
      landmark,
      city,
      state,
      pincode,
      latitude,
      longitude,
      is_default,
    } = body;

    if (!line1 || !line1.trim()) {
      return NextResponse.json({ error: "Address line 1 is required" }, { status: 400 });
    }

    const cleanedPincode = pincode ? String(pincode).trim().replace(/\D/g, "") : "177001";
    if (cleanedPincode.length !== 6) {
      return NextResponse.json({ error: "Pincode must be a 6-digit number" }, { status: 400 });
    }

    const targetCustomerId = await resolveValidUUID(supabase, customer_id);

    // Check count for max 10 limit
    const { count } = await supabase
      .from("addresses")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", targetCustomerId);

    if (count && count >= 10) {
      return NextResponse.json({ error: "Maximum limit of 10 saved addresses reached." }, { status: 400 });
    }

    const shouldBeDefault = Boolean(is_default) || (count === 0);

    // If setting as default, unset existing default first
    if (shouldBeDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", targetCustomerId);
    }

    const insertData: any = {
      customer_id: targetCustomerId,
      label: label ? label.trim() : "Home",
      line1: line1.trim(),
      city: city ? city.trim() : "Hamirpur",
      pincode: cleanedPincode,
      is_default: shouldBeDefault,
    };

    if (receiver_name) insertData.receiver_name = receiver_name.trim();
    if (receiver_phone) insertData.receiver_phone = receiver_phone.trim();
    if (line2) insertData.line2 = line2.trim();
    if (landmark) insertData.landmark = landmark.trim();
    if (state) insertData.state = state.trim();
    if (latitude) insertData.latitude = parseFloat(latitude);
    if (longitude) insertData.longitude = parseFloat(longitude);

    const { data: newAddr, error } = await supabase
      .from("addresses")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating address in Supabase DB:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ address: newAddr });
  } catch (err: any) {
    console.error("POST address exception:", err);
    return NextResponse.json({ error: err.message || "Failed to create address" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = getClient();
    const body = await req.json();
    const { id, is_default, label, receiver_name, receiver_phone, line1, line2, landmark, city, state, pincode, latitude, longitude } = body;

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    // Get existing address
    const { data: existing } = await supabase
      .from("addresses")
      .select("customer_id")
      .eq("id", id)
      .single();

    if (existing && is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", existing.customer_id);
    }

    const updates: any = {};
    if (typeof is_default === "boolean") updates.is_default = is_default;
    if (label) updates.label = label.trim();
    if (receiver_name !== undefined) updates.receiver_name = receiver_name ? receiver_name.trim() : null;
    if (receiver_phone !== undefined) updates.receiver_phone = receiver_phone ? receiver_phone.trim() : null;
    if (line1) updates.line1 = line1.trim();
    if (line2 !== undefined) updates.line2 = line2 ? line2.trim() : null;
    if (landmark !== undefined) updates.landmark = landmark ? landmark.trim() : null;
    if (city) updates.city = city.trim();
    if (state) updates.state = state.trim();
    if (pincode) updates.pincode = String(pincode).trim();
    if (latitude !== undefined) updates.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updates.longitude = longitude ? parseFloat(longitude) : null;

    const { data: updated, error } = await supabase
      .from("addresses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ address: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete address" }, { status: 500 });
  }
}
