/**
 * Map Supabase Auth OAuth error query params to a short app error code
 * used on /auth/login for user-facing toasts.
 */
export function mapOAuthErrorParam(params: {
  error?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
}): "oauth_expired" | "oauth_denied" | "auth" {
  const code = (params.errorCode || "").toLowerCase();
  const error = (params.error || "").toLowerCase();
  const description = (params.errorDescription || "").toLowerCase();

  if (
    code === "bad_oauth_state" ||
    code === "flow_state_expired" ||
    code === "flow_state_not_found" ||
    description.includes("state has expired") ||
    description.includes("oauth state has expired")
  ) {
    return "oauth_expired";
  }

  if (
    error === "access_denied" ||
    code === "access_denied" ||
    description.includes("access_denied")
  ) {
    return "oauth_denied";
  }

  return "auth";
}

export function oauthLoginErrorMessage(
  error: string | null
): string | null {
  switch (error) {
    case "oauth_expired":
      return "Google sign-in timed out. Please try again.";
    case "oauth_denied":
      return "Google sign-in was cancelled. Please try again.";
    case "auth":
      return "Google sign-in failed. Please try again.";
    default:
      return null;
  }
}
