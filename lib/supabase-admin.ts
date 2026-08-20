import { createClient } from "@supabase/supabase-js";

// ⚠️ SERVER-SIDE ONLY. Never import this file in a "use client" component —
// the service role key bypasses RLS entirely and must never reach the browser.
// Note: NO "NEXT_PUBLIC_" prefix on this env var — that's what keeps it server-only.

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
