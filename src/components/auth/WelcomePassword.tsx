"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { KeyRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import PasswordForm from "@/components/auth/PasswordForm";
import { safeNextPath } from "@/lib/supabase/config";

// The "choose a password" step. Two ways in:
//   * first sign-in from an email link → optional, with "Skip for now";
//   * a "Forgot password?" link (?reset=1) → choosing one is the point, so
//     no skip.
// Skipping sets a cookie the sign-in callback reads, so we don't ask again
// on every sign-in; My Hub keeps an "Add a password" card for later.

export const PW_SKIP_COOKIE = "tradox_pw_skip";

export default function WelcomePassword() {
  return (
    <Suspense fallback={<Shell><div className="skeleton h-64 rounded-xl" /></Shell>}>
      <Inner />
    </Suspense>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-md py-4 sm:py-10">{children}</div>;
}

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const { status, user } = useAuth();
  const isReset = params.get("reset") === "1";
  const next = safeNextPath(params.get("next"));
  const go = () => router.push(next.startsWith("/welcome/") ? "/my-hub" : next);

  function skip() {
    // One year; read by /auth/callback on the server. Not personal data —
    // just "don't show the password screen again in this browser".
    document.cookie = `${PW_SKIP_COOKIE}=1; Max-Age=31536000; Path=/; SameSite=Lax`;
    go();
  }

  if (status === "loading") {
    return (
      <Shell>
        <div className="skeleton h-64 rounded-xl" />
      </Shell>
    );
  }

  if (status !== "signed-in" || !user) {
    return (
      <Shell>
        <div className="kit-panel p-6 text-center">
          <p className="section-title">{isReset ? "That reset link has expired" : "You're not signed in"}</p>
          <p className="meta mt-2">
            {isReset ? "Reset links work once and expire after an hour. Ask for a new one from the sign-in page." : "Sign in first, then you can choose a password."}
          </p>
          <Link href={isReset ? "/sign-in" : "/sign-in?next=/my-hub"} className="btn btn-primary mt-5">
            Go to sign in
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="kit-panel p-6 sm:p-8">
        <span className="icon-chip size-12" aria-hidden="true">
          <KeyRound className="size-6" />
        </span>
        <p className="readout mt-5">{isReset ? "Reset password" : user.hasPassword ? "Password" : "One more step"}</p>
        <h1 className="page-title mt-1 text-[1.75rem] sm:text-[2rem]">
          {isReset ? "Choose a new password" : "Choose a password"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {isReset ? (
            <>
              For <span className="break-all font-semibold text-foreground">{user.email}</span>.
            </>
          ) : (
            <>
              You&apos;re signed in as <span className="break-all font-semibold text-foreground">{user.email}</span>. Add a
              password so you can sign in without waiting for an email next time. It&apos;s optional — email links keep
              working either way.
            </>
          )}
        </p>
        <div className="mt-6">
          <PasswordForm submitLabel={isReset ? "Save new password" : "Save password and continue"} onDone={go} />
        </div>
        {!isReset && (
          <button type="button" onClick={skip} className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-sm text-muted underline hover:text-foreground">
            Skip for now
          </button>
        )}
      </div>
      <p className="meta mt-4 text-center">
        Your password is stored securely (hashed) by our account provider. We never see it.
      </p>
    </Shell>
  );
}
