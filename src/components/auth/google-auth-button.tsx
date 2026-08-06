"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GIS_SRC = "https://accounts.google.com/gsi/client";

type CredentialResponse = {
  credential: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    nonce?: string;
    use_fedcm_for_prompt?: boolean;
    context?: "signin" | "signup" | "use";
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
    }
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

async function generateNonce(): Promise<[string, string]> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...bytes));
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(nonce)
  );
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return [nonce, hashedNonce];
}

type GoogleAuthButtonProps = {
  next?: string;
};

export function GoogleAuthButton({ next = "/account" }: GoogleAuthButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef<string>("");
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const missingClientId = !GOOGLE_CLIENT_ID;

  const handleCredential = useCallback(
    async (response: CredentialResponse) => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
          nonce: nonceRef.current,
        });

        if (error) {
          throw error;
        }

        router.push(next);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Google sign-in failed.";
        toast.error(message);
        setLoading(false);
      }
    },
    [next, router]
  );

  useEffect(() => {
    if (!scriptReady || !GOOGLE_CLIENT_ID || !buttonRef.current) return;
    if (!window.google?.accounts?.id) return;

    let cancelled = false;

    void (async () => {
      const [nonce, hashedNonce] = await generateNonce();
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;

      nonceRef.current = nonce;
      buttonRef.current.innerHTML = "";

      const width = Math.max(
        280,
        Math.floor(buttonRef.current.getBoundingClientRect().width)
      );

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
        context: "signin",
        use_fedcm_for_prompt: true,
        callback: (response) => {
          void handleCredential(response);
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width,
      });
    })();

    return () => {
      cancelled = true;
      if (buttonRef.current) {
        buttonRef.current.innerHTML = "";
      }
    };
  }, [scriptReady, handleCredential]);

  async function handleLegacyOAuth() {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    setLoading(false);
    toast.error("Could not start Google sign-in. Try again.");
  }

  if (missingClientId) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={handleLegacyOAuth}
      >
        <GoogleIcon className="size-4 shrink-0" />
        {loading ? "Redirecting..." : "Continue with Google"}
      </Button>
    );
  }

  return (
    <>
      <Script
        src={GIS_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div className="relative w-full">
        <div
          ref={buttonRef}
          className="flex min-h-10 w-full justify-center overflow-hidden"
          aria-busy={loading}
        />
        {loading ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-background/70 text-sm text-muted-foreground">
            Signing in…
          </div>
        ) : null}
      </div>
    </>
  );
}
