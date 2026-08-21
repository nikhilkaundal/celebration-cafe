import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
    const rateCheck = checkRateLimit(ip, "upload-menu-image", { limit: 20, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ error: "Upload limit reached. Please wait a minute." }, { status: 429 });
    }

    // 1. Verify caller authentication & staff role
    let user: any = null;

    // 1a. Check Authorization Bearer header
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (userData?.user) {
        user = userData.user;
      }
    }

    // 1b. Fallback: check SSR cookies
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
      return NextResponse.json({ error: "Authentication required. Please login as Owner/Staff." }, { status: 401 });
    }

    // 1c. Verify profile role using admin client
    const { data: profileRow } = await supabaseAdmin
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (!profileRow || !["owner", "manager", "worker"].includes(profileRow.role) || profileRow.status !== "active") {
      return NextResponse.json({ error: "Forbidden. Active staff access required." }, { status: 403 });
    }

    let fileBuffer: Buffer;
    let contentType = "image/jpeg";
    let fileExtension = "jpg";

    const contentTypeHeader = req.headers.get("content-type") || "";

    if (contentTypeHeader.includes("multipart/form-data")) {
      // Mode A: Direct file upload via FormData
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No image file uploaded" }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Image file exceeds maximum allowed size of 5MB" }, { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json({ error: "Invalid image format. Allowed formats: JPG, PNG, WEBP, GIF" }, { status: 400 });
      }

      contentType = file.type;
      fileExtension = contentType.split("/")[1] || "jpg";
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      // Mode B: JSON input { imageUrl } to ingest external suggestion URL
      const body = await req.json();
      const externalUrl = body.imageUrl;

      if (!externalUrl || typeof externalUrl !== "string") {
        return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
      }

      // Download external image server-side
      const downloadRes = await fetch(externalUrl);
      if (!downloadRes.ok) {
        return NextResponse.json({ error: "Failed to download selected image from source" }, { status: 400 });
      }

      const fetchedContentType = downloadRes.headers.get("content-type") || "image/jpeg";
      if (!ALLOWED_MIME_TYPES.has(fetchedContentType)) {
        return NextResponse.json({ error: "Downloaded file is not a valid image" }, { status: 400 });
      }

      contentType = fetchedContentType;
      fileExtension = contentType.split("/")[1] || "jpg";
      const arrayBuffer = await downloadRes.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      if (fileBuffer.length > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Downloaded image exceeds 5MB limit" }, { status: 400 });
      }
    }

    // 2. Generate unique filename in menu-images bucket
    const timestamp = Date.now();
    const randomHash = Math.random().toString(36).substring(2, 8);
    const fileName = `dish-${timestamp}-${randomHash}.${fileExtension}`;
    const filePath = `dishes/${fileName}`;

    // 3. Upload buffer into Supabase Storage menu-images bucket using service role client
    const { error: uploadError } = await supabaseAdmin.storage
      .from("menu-images")
      .upload(filePath, fileBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      return NextResponse.json({ error: `Storage Upload Error: ${uploadError.message}` }, { status: 500 });
    }

    // 4. Retrieve Public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("menu-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    return NextResponse.json({
      success: true,
      publicUrl,
      fileName,
      filePath,
      message: "Image uploaded and stored in Supabase Storage successfully",
    });
  } catch (err: any) {
    console.error("Upload Image Endpoint Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process image upload" }, { status: 500 });
  }
}
