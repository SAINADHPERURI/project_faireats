"use client";

import { useState, type ReactNode } from "react";
import { Apple, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M21.35 12.2c0-.73-.07-1.43-.19-2.11H12v3.99h5.24a4.48 4.48 0 0 1-1.94 2.94v2.59h3.14c1.84-1.69 2.91-4.18 2.91-7.41"
      />
      <path
        fill="#34A853"
        d="M12 21.7c2.62 0 4.82-.87 6.43-2.36l-3.14-2.59c-.87.58-1.98.93-3.29.93-2.53 0-4.67-1.71-5.44-4.01H3.32v2.67A9.7 9.7 0 0 0 12 21.7"
      />
      <path
        fill="#FBBC05"
        d="M6.56 13.67A5.83 5.83 0 0 1 6.25 12c0-.58.11-1.14.31-1.67V7.66H3.32A9.7 9.7 0 0 0 2.3 12c0 1.56.37 3.04 1.02 4.34z"
      />
      <path
        fill="#EA4335"
        d="M12 6.32c1.42 0 2.69.49 3.7 1.44l2.78-2.78A9.31 9.31 0 0 0 12 2.3a9.7 9.7 0 0 0-8.68 5.36l3.24 2.67c.77-2.3 2.91-4.01 5.44-4.01"
      />
    </svg>
  );
}

function OAuthSignInButton({
  provider,
  label,
  icon
}: {
  provider: "google" | "apple";
  label: string;
  icon: ReactNode;
}) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function signIn() {
    setIsPending(true);
    setErrorMessage(null);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/api/auth/callback?redirect=role`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo
      }
    });

    if (error) {
      setErrorMessage(error.message);
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" onClick={signIn} disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="mr-2">{icon}</span>}
        {label}
      </Button>
      {errorMessage ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export function SocialSignInButtons() {
  return (
    <div className="space-y-2">
      <OAuthSignInButton provider="google" label="Continue with Google" icon={<GoogleIcon />} />
      <OAuthSignInButton provider="apple" label="Continue with Apple" icon={<Apple className="h-4 w-4 fill-current" />} />
    </div>
  );
}
