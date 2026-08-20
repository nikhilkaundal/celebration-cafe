import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=not_staff`);
  }

  const cookieStore = await cookies();

  // Create response object to accumulate set-cookie headers
  const response = NextResponse.redirect(`${origin}/admin/orders`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange code for session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Auth code exchange error:", exchangeError);
    return NextResponse.redirect(`${origin}/admin/login?error=not_staff`);
  }

  // Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin/login?error=not_staff`);
  }

  // 1. Check if user already exists in staff table
  const { data: existingStaff } = await supabaseAdmin
    .from("staff")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existingStaff) {
    return response;
  }

  // 2. Check if user email was pre-registered in staff_invites table
  const { data: invite } = await supabaseAdmin
    .from("staff_invites")
    .select("*")
    .eq("email", user.email)
    .single();

  if (invite) {
    // Automatically create staff row from the pre-invited email & name
    const { error: staffInsertErr } = await supabaseAdmin.from("staff").insert({
      id: user.id,
      name: invite.name || user.user_metadata?.full_name || user.email.split("@")[0],
      email: user.email,
      role: invite.role || "employee",
    });

    if (!staffInsertErr) {
      // Remove invite record after successful conversion
      await supabaseAdmin.from("staff_invites").delete().eq("id", invite.id);
      return response;
    }
    console.error("Error converting invite to staff:", staffInsertErr);
  }

  // 3. User is not registered as staff and has no active invite -> Sign out & redirect with error
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/admin/login?error=not_staff`);
}
