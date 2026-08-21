import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validatePasswordPolicy, sanitizeText } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name = "Cafe Owner", secretKey } = await req.json();

    const sanitizedEmail = sanitizeText(email).toLowerCase();
    const sanitizedName = sanitizeText(name);

    if (!sanitizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Safety Check: Check if an Owner ALREADY exists
    const { count: ownerCount } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner");

    // If an owner already exists, require the secretKey to prevent unauthorized takeover
    const SETUP_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 12) || "celebration-owner-setup";
    if ((ownerCount ?? 0) > 0 && secretKey !== SETUP_SECRET) {
      return NextResponse.json(
        { error: "An owner account already exists. Please login as Owner or ask the existing Owner to add you." },
        { status: 403 }
      );
    }

    // 1. Check if user already exists in auth.users
    const { data: usersList, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = usersList?.users?.find(
      (u) => u.email?.toLowerCase() === sanitizedEmail
    );

    let userId: string;

    if (existingAuthUser) {
      userId = existingAuthUser.id;
    } else {
      // Create new Auth User for Owner
      if (!password) {
        return NextResponse.json(
          { error: "Account does not exist yet. Please provide a password (min 10 chars) to create the Owner account." },
          { status: 400 }
        );
      }

      const passCheck = validatePasswordPolicy(password);
      if (!passCheck.valid) {
        return NextResponse.json({ error: passCheck.errors.join(". ") }, { status: 400 });
      }

      const { data: newAuthUser, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
        email: sanitizedEmail,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: sanitizedName },
      });

      if (createAuthErr || !newAuthUser.user) {
        return NextResponse.json({ error: createAuthErr?.message || "Failed to create Auth user" }, { status: 500 });
      }

      userId = newAuthUser.user.id;
    }

    // 2. Insert or Upsert into profiles table with 'owner' role
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          role: "owner",
          full_name: sanitizedName,
          email: sanitizedEmail,
          status: "active",
        },
        { onConflict: "id" }
      );

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // 3. Log audit event
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: "owner.bootstrap_setup",
      entity: "profiles",
      entity_id: userId,
      details: { email: sanitizedEmail, role: "owner" },
    });

    return NextResponse.json({
      success: true,
      email: sanitizedEmail,
      message: `🎉 Success! ${sanitizedEmail} is now set as the Cafe OWNER. You can now login at /admin/login.`,
    });
  } catch (err: any) {
    console.error("Setup Owner Error:", err);
    return NextResponse.json({ error: err.message || "Failed to setup owner" }, { status: 500 });
  }
}
