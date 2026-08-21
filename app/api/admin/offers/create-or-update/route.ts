import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/validation";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "save-offer-banner", { limit: 20, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
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

    // 2. Parse payload
    const body = await req.json();
    const offerId = body.id || null;
    const title = sanitizeText(body.title || "").trim();
    const subtitle = sanitizeText(body.subtitle || "").trim();
    const description = sanitizeText(body.description || "").trim();
    const badgeText = sanitizeText(body.badge_text || "").trim();
    const displayLocation = ["home_top", "menu_top", "category_banner"].includes(body.display_location)
      ? body.display_location
      : "home_top";
    const startsAt = body.starts_at ? new Date(body.starts_at).toISOString() : new Date().toISOString();
    const endsAt = body.ends_at ? new Date(body.ends_at).toISOString() : null;
    const scheduleRules = body.schedule_rules && typeof body.schedule_rules === "object" ? body.schedule_rules : {};
    const linkedCouponId = body.linked_coupon_id || null;
    const isActive = body.is_active ?? true;
    const isTemplate = Boolean(body.is_template);
    const templateKey = body.template_key || null;
    const sortOrder = Number(body.sort_order || 0);

    let bannerImageUrl = body.banner_image_url || "";

    if (!title) {
      return NextResponse.json({ error: "Banner title is required" }, { status: 400 });
    }

    // 3. Handle Banner Image storage ingestion if external URL is provided
    if (bannerImageUrl && !bannerImageUrl.includes("/storage/v1/object/public/banner-images/")) {
      try {
        const downloadRes = await fetch(bannerImageUrl);
        if (downloadRes.ok) {
          const contentType = downloadRes.headers.get("content-type") || "image/jpeg";
          if (ALLOWED_MIME_TYPES.has(contentType)) {
            const arrayBuffer = await downloadRes.arrayBuffer();
            const fileBuffer = Buffer.from(arrayBuffer);

            if (fileBuffer.length <= MAX_FILE_SIZE) {
              const ext = contentType.split("/")[1] || "jpg";
              const timestamp = Date.now();
              const randomHash = Math.random().toString(36).substring(2, 8);
              const fileName = `banner-${timestamp}-${randomHash}.${ext}`;
              const filePath = `banners/${fileName}`;

              const { error: uploadError } = await supabaseAdmin.storage
                .from("banner-images")
                .upload(filePath, fileBuffer, { contentType, upsert: true });

              if (!uploadError) {
                const { data: urlData } = supabaseAdmin.storage
                  .from("banner-images")
                  .getPublicUrl(filePath);
                bannerImageUrl = urlData.publicUrl;
              }
            }
          }
        }
      } catch (imgErr) {
        console.warn("Banner image storage ingestion fallback:", imgErr);
      }
    }

    let linkedCouponCode: string | null = null;
    let linkedDiscountType: string | null = null;
    let linkedDiscountValue: number | null = null;

    // 4. Validate Linked Coupon ID if present
    if (linkedCouponId) {
      const { data: couponRow } = await supabaseAdmin
        .from("coupons")
        .select("id, code, discount_type, value, is_active")
        .eq("id", linkedCouponId)
        .single();

      if (!couponRow) {
        return NextResponse.json({ error: "Linked coupon not found" }, { status: 400 });
      }
      linkedCouponCode = couponRow.code;
      linkedDiscountType = couponRow.discount_type;
      linkedDiscountValue = couponRow.value;
    }

    // 5. Insert or Update Offer (Includes legacy fallback fields for coupon_code NOT NULL constraint)
    const fallbackCode = body.coupon_code || linkedCouponCode || (templateKey ? templateKey.toUpperCase() : `OFFER-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);

    const offerPayload = {
      title,
      subtitle: subtitle || null,
      description: description || null,
      badge_text: badgeText || null,
      banner_image_url: bannerImageUrl || null,
      linked_coupon_id: linkedCouponId,
      coupon_code: fallbackCode,
      discount_type: linkedDiscountType || body.discount_type || "flat",
      discount_value: linkedDiscountValue ?? Number(body.discount_value || 0),
      display_location: displayLocation,
      starts_at: startsAt,
      ends_at: endsAt,
      schedule_rules: scheduleRules,
      is_active: isActive,
      is_template: isTemplate,
      template_key: templateKey,
      sort_order: sortOrder,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    let result: any;
    try {
      if (offerId) {
        const { data: updated, error: updateErr } = await supabaseAdmin
          .from("offers")
          .update(offerPayload)
          .eq("id", offerId)
          .select()
          .single();

        if (updateErr) throw updateErr;
        result = updated;
      } else {
        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from("offers")
          .insert(offerPayload)
          .select()
          .single();

        if (insertErr) throw insertErr;
        result = inserted;
      }
    } catch (dbErr: any) {
      if (dbErr?.code === "PGRST204" || (dbErr?.message && dbErr.message.includes("Could not find"))) {
        console.warn("Offers table schema mismatch, attempting fallback insert:", dbErr);
        // Fallback for legacy offers table schema
        const fallbackPayload = {
          title,
          description: description || subtitle || null,
          coupon_code: fallbackCode,
          discount_type: linkedDiscountType || "flat",
          discount_value: linkedDiscountValue ?? 0,
          is_active: isActive,
        };

        if (offerId) {
          const { data: updated, error: fErr } = await supabaseAdmin
            .from("offers")
            .update(fallbackPayload)
            .eq("id", offerId)
            .select()
            .single();
          if (fErr) throw fErr;
          result = updated;
        } else {
          const { data: inserted, error: fErr } = await supabaseAdmin
            .from("offers")
            .insert(fallbackPayload)
            .select()
            .single();
          if (fErr) throw fErr;
          result = inserted;
        }
      } else {
        throw dbErr;
      }
    }

    // 6. Audit Logging
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: user.id,
      action: offerId ? "offer.update" : isTemplate ? "offer.enable_template" : "offer.create",
      entity: "offers",
      entity_id: result.id,
      details: offerPayload,
    });

    return NextResponse.json({
      success: true,
      offer: result,
      message: `Offer banner '${result.title}' saved successfully!`,
    });
  } catch (err: any) {
    console.error("Save Offer Endpoint Error:", err);
    return NextResponse.json({ error: err.message || "Failed to save offer banner" }, { status: 500 });
  }
}
