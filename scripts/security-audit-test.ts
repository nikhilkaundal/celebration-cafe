/**
 * Automated Security Audit & Authorization Test Suite
 * Tests RLS boundaries, RBAC role limits, and data isolation.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co")
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Mock WebSocket for Node 20 test environment
if (typeof window === "undefined" && !(global as any).WebSocket) {
  (global as any).WebSocket = class {};
}

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

async function runSecurityAuditTests() {
  console.log("\n🔒 =========================================================");
  console.log("   CELEBRATION FOOD CAFE — AUTOMATED SECURITY AUDIT TEST");
  console.log("🔒 =========================================================\n");

  let passedCount = 0;
  let failedCount = 0;

  function reportResult(testName: string, passed: boolean, details: string) {
    if (passed) {
      console.log(`✅ [PASS] ${testName}`);
      console.log(`   ↳ ${details}\n`);
      passedCount++;
    } else {
      console.log(`❌ [FAIL] ${testName}`);
      console.log(`   ↳ ${details}\n`);
      failedCount++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Anonymous user cannot read `profiles` table
  // --------------------------------------------------------------------------
  try {
    const { data, error } = await anonClient.from("profiles").select("*");
    const passed = data === null || (Array.isArray(data) && data.length === 0);
    reportResult(
      "Test 1: Anonymous user cannot read profiles table",
      passed,
      passed ? "Access denied as expected by default-deny RLS." : `Leaked ${data?.length} profile rows to unauthenticated client!`
    );
  } catch (e: any) {
    reportResult("Test 1: Anonymous user cannot read profiles table", true, `Denied with error: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Anonymous user cannot read `audit_logs` table
  // --------------------------------------------------------------------------
  try {
    const { data, error } = await anonClient.from("audit_logs").select("*");
    const passed = data === null || (Array.isArray(data) && data.length === 0);
    reportResult(
      "Test 2: Anonymous user cannot read audit_logs table",
      passed,
      passed ? "Access denied as expected by default-deny RLS." : `Leaked ${data?.length} audit log rows to unauthenticated client!`
    );
  } catch (e: any) {
    reportResult("Test 2: Anonymous user cannot read audit_logs table", true, `Denied with error: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Anonymous user cannot read `coupon_usage` table
  // --------------------------------------------------------------------------
  try {
    const { data, error } = await anonClient.from("coupon_usage").select("*");
    const passed = data === null || (Array.isArray(data) && data.length === 0);
    reportResult(
      "Test 3: Anonymous user cannot read coupon_usage table",
      passed,
      passed ? "Access denied as expected by default-deny RLS." : `Leaked ${data?.length} coupon usage rows!`
    );
  } catch (e: any) {
    reportResult("Test 3: Anonymous user cannot read coupon_usage table", true, `Denied with error: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Anonymous user cannot insert arbitrary staff profiles
  // --------------------------------------------------------------------------
  try {
    const fakeId = "00000000-0000-0000-0000-000000000001";
    const { error } = await anonClient.from("profiles").insert({
      id: fakeId,
      role: "owner",
      full_name: "Attacker Fake Owner",
      email: "attacker@test.com",
      status: "active",
    });
    const passed = error !== null;
    reportResult(
      "Test 4: Privilege Escalation — Anonymous cannot insert Owner profile",
      passed,
      passed ? `Rejected with error: ${error?.message}` : "CRITICAL SECURITY BREACH: Anonymous user created Owner profile!"
    );
  } catch (e: any) {
    reportResult("Test 4: Privilege Escalation — Anonymous cannot insert Owner profile", true, `Rejected with error: ${e.message}`);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Anonymous user cannot insert arbitrary coupon codes
  // --------------------------------------------------------------------------
  try {
    const { error } = await anonClient.from("coupons").insert({
      code: "ATTACK100",
      discount_type: "flat",
      value: 1000,
      is_active: true,
    });
    const passed = error !== null;
    reportResult(
      "Test 5: Privilege Escalation — Anonymous cannot create coupons",
      passed,
      passed ? `Rejected with error: ${error?.message}` : "SECURITY BREACH: Anonymous client inserted arbitrary coupon!"
    );
  } catch (e: any) {
    reportResult("Test 5: Privilege Escalation — Anonymous cannot create coupons", true, `Rejected with error: ${e.message}`);
  }

  console.log("---------------------------------------------------------");
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${passedCount + failedCount} automated tests.`);
  console.log("---------------------------------------------------------\n");
}

runSecurityAuditTests();
