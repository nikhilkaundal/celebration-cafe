import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { name, email, password, authMethod = "email" } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
  }

  if (authMethod === "email" && (!password || password.length < 8)) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters for Email/Password login" },
      { status: 400 }
    );
  }

  // 1. Verify the CALLER is logged in and has 'owner' role
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

  const { data: callerStaff } = await supabase
    .from("staff")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerStaff?.role !== "owner") {
    return NextResponse.json(
      { error: "Only the cafe owner can add staff" },
      { status: 403 }
    );
  }

  // 2. Google Sign-In Flow: Pre-register email in staff_invites table
  if (authMethod === "google") {
    // Check if email is already in staff
    const { data: existingStaff } = await supabaseAdmin
      .from("staff")
      .select("id")
      .eq("email", email)
      .single();

    if (existingStaff) {
      return NextResponse.json(
        { error: "This email is already registered as staff" },
        { status: 400 }
      );
    }

    // Insert or update staff_invites
    const { error: inviteError } = await supabaseAdmin.from("staff_invites").upsert(
      {
        email,
        name,
        role: "employee",
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

  const { error: staffInsertError } = await supabaseAdmin.from("staff").insert({
    id: newUser.user.id,
    name,
    email,
    role: "employee",
  });

  if (staffInsertError) {
    // Roll back auth user
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: staffInsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    method: "email",
    id: newUser.user.id,
    message: `Staff account created for ${name}.`,
  });
}
