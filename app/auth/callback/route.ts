import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const mode = requestUrl.searchParams.get("mode") || "signin";
  let next = requestUrl.searchParams.get("next") || "/";
  const origin = requestUrl.origin;

  // Prevent redirecting back to /login
  if (next === "/login" || next.includes("/login")) {
    next = "/";
  }

  const targetRedirectUrl = next.startsWith("/") ? `${origin}${next}` : `${origin}/`;
  const cookieStore = await cookies();
  const response = NextResponse.redirect(targetRedirectUrl);

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

  // Exchange code for session if present
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.warn("OAuth exchange warning:", exchangeError.message);
    }
  }

  // Get current authenticated customer
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.id) {
    // Check if customer exists in customers table
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingCustomer) {
      // If user is trying to SIGN IN (not register) and account doesn't exist -> Reject!
      if (mode === "signin") {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=not_registered_google`);
      }

      // If mode is REGISTER -> Create new customer row
      const customerName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Customer";

      await supabaseAdmin.from("customers").insert({
        id: user.id,
        name: customerName,
        email: user.email,
        phone: user.phone || null,
      });
    }
  }

  return response;
}
