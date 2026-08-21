import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// GET: List active reusable T&C templates
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip, "tnc-templates-list", { limit: 120, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json({ templates: [] }, { status: 429 });
    }

    const { data: templates, error } = await supabaseAdmin
      .from("tnc_templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching tnc_templates:", error);
      return NextResponse.json({ templates: [] }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (err: any) {
    console.error("GET tnc_templates Error:", err);
    return NextResponse.json({ templates: [] }, { status: 500 });
  }
}

// POST: Owner creates new reusable T&C template
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Owner or Manager role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["owner", "manager"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: Owner or Manager only" }, { status: 403 });
    }

    const body = await req.json();
    const { label, param_type, param_label } = body;

    if (!label || !label.trim()) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }

    // Get max sort_order
    const { data: maxSort } = await supabaseAdmin
      .from("tnc_templates")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextSort = (maxSort && maxSort[0]?.sort_order ? maxSort[0].sort_order : 0) + 1;

    const { data: newTemplate, error } = await supabaseAdmin
      .from("tnc_templates")
      .insert({
        label: label.trim(),
        param_type: param_type || null,
        param_label: param_label ? param_label.trim() : null,
        is_active: true,
        sort_order: nextSort,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tnc_template:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: newTemplate });
  } catch (err: any) {
    console.error("POST tnc_templates Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create template" }, { status: 500 });
  }
}

// PATCH: Owner deactivates or updates a template
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["owner", "manager"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: Owner or Manager only" }, { status: 403 });
    }

    const body = await req.json();
    const { id, is_active, label } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (typeof is_active === "boolean") updates.is_active = is_active;
    if (label && label.trim()) updates.label = label.trim();

    const { data: updated, error } = await supabaseAdmin
      .from("tnc_templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update template" }, { status: 500 });
  }
}
