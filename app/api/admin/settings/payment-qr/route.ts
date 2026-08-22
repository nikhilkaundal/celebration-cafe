import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
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

    // Verify session
    let user = null;
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;

    if (!user) {
      // Fallback check bearer token in header
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        user = userData?.user || null;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user role in profiles table
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "owner" || profile.status !== "active") {
      return NextResponse.json(
        { error: "Forbidden: Only active Cafe Owners can update payment settings" },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const upiId = formData.get("upi_id") as string | null;

      let qrPublicUrl: string | null = null;

      if (file) {
        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: "Invalid file type. Please upload a JPEG, PNG, or WebP image." },
            { status: 400 }
          );
        }

        // Validate size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Image file size exceeds 5MB limit." },
            { status: 400 }
          );
        }

        const fileExt = file.name.split(".").pop() || "png";
        const fileName = `payment_qr_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
          .from("payment-qr")
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          return NextResponse.json(
            { error: `Upload failed: ${uploadError.message}` },
            { status: 500 }
          );
        }

        const { data: urlData } = supabaseAdmin.storage
          .from("payment-qr")
          .getPublicUrl(fileName);

        qrPublicUrl = urlData.publicUrl;
      }

      // Prepare updates
      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      if (qrPublicUrl) updateData.payment_qr_url = qrPublicUrl;
      if (upiId !== null && upiId !== undefined) updateData.upi_id = upiId.trim();

      // Upsert into restaurant_settings
      const { error: updateErr } = await supabaseAdmin
        .from("restaurant_settings")
        .upsert({
          id: "default",
          ...updateData,
        });

      if (updateErr) {
        console.error("Settings update error:", updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Log audit entry
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: user.id,
        action: "settings.payment_qr_update",
        entity: "restaurant_settings",
        details: {
          qr_uploaded: !!qrPublicUrl,
          upi_updated: upiId !== null,
          new_qr_url: qrPublicUrl,
          new_upi_id: upiId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment settings updated successfully!",
        payment_qr_url: qrPublicUrl,
        upi_id: upiId,
      });
    } else {
      // JSON payload update
      const { upi_id, payment_qr_url } = await req.json();

      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      if (upi_id !== undefined) updateData.upi_id = upi_id.trim();
      if (payment_qr_url !== undefined) updateData.payment_qr_url = payment_qr_url;

      const { error: updateErr } = await supabaseAdmin
        .from("restaurant_settings")
        .upsert({
          id: "default",
          ...updateData,
        });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Log audit entry
      await supabaseAdmin.from("audit_logs").insert({
        actor_id: user.id,
        action: "settings.payment_qr_update",
        entity: "restaurant_settings",
        details: {
          upi_id,
          payment_qr_url,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment settings updated successfully!",
      });
    }
  } catch (err: any) {
    console.error("Payment QR Admin API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update payment settings" },
      { status: 500 }
    );
  }
}
