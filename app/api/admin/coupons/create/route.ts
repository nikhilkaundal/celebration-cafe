import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "create-coupon", { limit: 20, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many coupon creation attempts. Please wait." }, { status: 429 });
    }

    // 1. Verify caller authentication & staff role
    let user: any = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (userData?.user) {
        user = userData.user;
      }
    }

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
        console.warn("SSR cookie auth check warning:", e);
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: profileRow } = await supabaseAdmin
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (!profileRow || !["owner", "manager"].includes(profileRow.role) || profileRow.status !== "active") {
      return NextResponse.json({ error: "Forbidden. Owner or Manager role required." }, { status: 403 });
    }

    // 2. Validate Input Payload
    const body = await req.json();
    const rawCode = sanitizeText(body.code).toUpperCase().trim();
    const discountType = body.discount_type === "percent" ? "percent" : "flat";
    const discountValue = Number(body.value);
    const minOrderValue = Math.max(0, Number(body.min_order_value || 0));
    const maxDiscount = body.max_discount ? Number(body.max_discount) : null;
    const usageLimit = body.usage_limit ? Math.max(1, parseInt(body.usage_limit)) : null;
    const perUserLimit = body.per_user_limit ? Math.max(1, parseInt(body.per_user_limit)) : 1;
    const validTo = body.valid_to ? new Date(body.valid_to).toISOString() : null;
    const isActive = body.is_active ?? true;
    const isTemplate = Boolean(body.is_template);

    // Security Checks
    if (!rawCode || rawCode.length < 3 || rawCode.length > 20) {
      return NextResponse.json({ error: "Coupon code must be 3–20 alphanumeric characters" }, { status: 400 });
    }

    if (!/^[A-Z0-9_-]+$/.test(rawCode)) {
      return NextResponse.json({ error: "Coupon code can only contain letters, numbers, hyphens, and underscores" }, { status: 400 });
    }

    if (isNaN(discountValue) || discountValue <= 0) {
      return NextResponse.json({ error: "Discount value must be greater than 0" }, { status: 400 });
    }

    if (discountType === "percent") {
      if (discountValue > 100) {
        return NextResponse.json({ error: "Percentage discount cannot exceed 100%" }, { status: 400 });
      }

      // STRICT MARGIN GUARD: Require max_discount cap if percent > 25%
      if (discountValue > 25 && (!maxDiscount || maxDiscount <= 0)) {
        return NextResponse.json(
          { error: "Security Policy: Percentage discounts above 25% require a 'Max Discount Cap' (₹) to prevent margin loss." },
          { status: 400 }
        );
      }
    }

    // 3. Unique Code Verification
    const { data: existingCode } = await supabaseAdmin
      .from("coupons")
      .select("id")
      .ilike("code", rawCode)
      .limit(1);

    if (existingCode && existingCode.length > 0) {
      return NextResponse.json({ error: `Coupon code '${rawCode}' already exists!` }, { status: 400 });
    }

    // 4. Insert Coupon Record
    const newCouponPayload = {
      code: rawCode,
      discount_type: discountType,
      value: discountValue,
      min_order_value: minOrderValue,
      max_discount: maxDiscount,
      usage_limit: usageLimit,
      per_user_limit: perUserLimit,
      valid_to: validTo,
      is_active: isActive,
      is_template: isTemplate,
      created_by: user.id,
    };

    const { data: created, error: insertErr } = await supabaseAdmin
      .from("coupons")
      .insert(newCouponPayload)
      .select()
      .single();

    if (insertErr || !created) {
      console.error("Coupon Insert Error:", insertErr);
      return NextResponse.json({ error: insertErr?.message || "Failed to create coupon" }, { status: 500 });
    }

    // 5. Audit Logging
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: user.id,
      action: isTemplate ? "coupon.enable_template" : "coupon.create",
      entity: "coupons",
      entity_id: created.id,
      details: newCouponPayload,
    });

    return NextResponse.json({
      success: true,
      coupon: created,
      message: `Coupon ${created.code} successfully created!`,
    });
  } catch (err: any) {
    console.error("Create Coupon Endpoint Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create coupon" }, { status: 500 });
  }
}
