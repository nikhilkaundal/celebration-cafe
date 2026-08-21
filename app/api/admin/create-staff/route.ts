import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validatePasswordPolicy, sanitizeText } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(ip, "create-staff", { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rateCheck.success) {
    return NextResponse.json({ error: "Too many staff creation attempts. Please try again later." }, { status: 429 });
  }

  const { name, email, password, role = "worker", authMethod = "email" } = await req.json();

  const sanitizedName = sanitizeText(name);
  const sanitizedEmail = sanitizeText(email).toLowerCase();

  if (!sanitizedName || !sanitizedEmail) {
    return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
  }

  const validRole = role === "manager" ? "manager" : "worker";

  if (authMethod === "email") {
    if (!password) {
      return NextResponse.json({ error: "Password is required for Email/Password login" }, { status: 400 });
    }

    const passCheck = validatePasswordPolicy(password);
    if (!passCheck.valid) {
      return NextResponse.json({ error: passCheck.errors.join(". ") }, { status: 400 });
    }
  }

  // 1. Verify the CALLER is logged in and has 'owner' role in profiles table
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
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "owner") {
    return NextResponse.json(
      { error: "Only the cafe owner can add staff members" },
      { status: 403 }
    );
  }

  // 2. Google Sign-In Flow: Pre-register email in staff_invites table
  if (authMethod === "google") {
    // Check if email is already in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: "This email is already registered as a user/staff member" },
        { status: 400 }
      );
    }

    // Insert or update staff_invites
    const { error: inviteError } = await supabaseAdmin.from("staff_invites").upsert(
      {
        email,
        name,
        role: validRole,
      },
      { onConflict: "email" }
    );

    if (inviteError) {
      console.error("Invite error:", inviteError);
      return NextResponse.json(
        { error: inviteError.message ?? "Failed to create Google staff invite" },
        { status: 500 }
      );
    }

    // Log audit action
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: user.id,
      action: "staff.invite_google",
      entity: "staff_invites",
      details: { name, email, role: validRole },
    });

    return NextResponse.json({
      success: true,
      method: "google",
      message: `Google invite created for ${email}. They can now sign in with Google.`,
    });
  }

  // 3. Email + Password Flow: Create Auth user immediately using Admin API
  const { data: newUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Failed to create account" },
      { status: 500 }
    );
  }

  const { error: profileInsertError } = await supabaseAdmin.from("profiles").insert({
    id: newUser.user.id,
    role: validRole,
    full_name: name,
    email,
    status: "active",
  });

  if (profileInsertError) {
    // Roll back auth user
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: profileInsertError.message }, { status: 500 });
  }

  // Log audit action
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "staff.create",
    entity: "profiles",
    entity_id: newUser.user.id,
    details: { name, email, role: validRole },
  });

  return NextResponse.json({
    success: true,
    method: "email",
    id: newUser.user.id,
    message: `Staff account (${validRole}) created for ${name}.`,
  });
}
