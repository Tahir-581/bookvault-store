import { NextResponse } from "next/server";
import { mapOAuthErrorParam } from "@/lib/auth-oauth-errors";
import { createClient } from "@/lib/supabase/server";

/** Only allow same-origin relative paths (blocks open redirects). */
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/account";
  }
  return next;
}

function loginErrorRedirect(origin: string, error: string) {
  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent(error)}`
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const oauthError = searchParams.get("error");
  const oauthErrorCode = searchParams.get("error_code");

  if (oauthError || oauthErrorCode) {
    return loginErrorRedirect(
      origin,
      mapOAuthErrorParam({
        error: oauthError,
        errorCode: oauthErrorCode,
        errorDescription: searchParams.get("error_description"),
      })
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  }

  return loginErrorRedirect(origin, "auth");
}
