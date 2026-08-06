/**
 * Verifies Google OAuth branding configuration used by the storefront.
 * Run: npx tsx scripts/verify-google-oauth-branding.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

async function main() {
  console.log("=== Google OAuth branding check ===\n");

  if (!googleClientId) {
    console.error("FAIL: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing from .env.local");
    process.exit(1);
  }
  console.log("OK: NEXT_PUBLIC_GOOGLE_CLIENT_ID is set");
  console.log(`    client_id ends with: ...${googleClientId.slice(-24)}`);

  if (!supabaseUrl || !anonKey) {
    console.error("FAIL: Supabase env vars missing");
    process.exit(1);
  }
  console.log(`OK: NEXT_PUBLIC_SUPABASE_URL = ${supabaseUrl}`);

  const usingCustomDomain = !supabaseUrl.includes("supabase.co");
  console.log(
    usingCustomDomain
      ? "OK: Supabase URL uses a custom domain (OAuth redirect host will match)"
      : "NOTE: Supabase URL is still *.supabase.co — GIS button avoids showing this to users"
  );

  const supabase = createClient(supabaseUrl, anonKey);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://www.ilfaaz.com/auth/callback",
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    console.error("FAIL: could not start OAuth authorize URL", error?.message);
    process.exit(1);
  }

  const res = await fetch(data.url, { redirect: "manual" });
  const location = res.headers.get("location");
  if (!location) {
    console.error("FAIL: authorize did not redirect to Google");
    process.exit(1);
  }

  const googleUrl = new URL(location);
  const redirectUri = googleUrl.searchParams.get("redirect_uri");
  const clientId = googleUrl.searchParams.get("client_id");

  console.log(`OK: Google authorize redirect_uri = ${redirectUri}`);
  if (clientId !== googleClientId) {
    console.error(
      "FAIL: NEXT_PUBLIC_GOOGLE_CLIENT_ID does not match Supabase Google provider client_id"
    );
    process.exit(1);
  }
  console.log("OK: Client ID matches Supabase Google provider");

  console.log("\nManual Google Cloud checks (cannot automate):");
  console.log("  1. Branding app name = ilfaaz");
  console.log("  2. Audience published (not Testing-only)");
  console.log("  3. Authorized JS origins include localhost, Vercel, www.ilfaaz.com");
  console.log(
    "  4. Optional custom domain: add https://auth.ilfaaz.com/auth/v1/callback"
  );
  console.log(
    "\nExpected UX: Continue with Google (GIS) shows continue-to store origin / ilfaaz,"
  );
  console.log("not wksvadcdqgbaadokiaji.supabase.co.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
