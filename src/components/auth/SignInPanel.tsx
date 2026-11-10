"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/supabase/config";
import { SITE_NAME } from "@/lib/sections";

// Two ways in: Google, or a one-time link sent to an email address. No
// passwords on this site. When Supabase isn't configured the panel says so
// plainly instead of showing buttons that can't work.

const ERRORS: Record<string, string> = {
  expired: "That sign-in link has expired or was already used. Request a new one below.",
  link: "That sign-in link didn't work. Request a new one below.",
  "not-configured": "Accounts aren't switched on for this site yet.",
};

export default function SignInPanel() {
  return (
    <Suspense fallback={<Panel next="/my-hub" errorKey={null} />}>
      <PanelFromAddress />
    </Suspense>
  );
}

function PanelFromAddress() {
  const params = useSearchParams();
  return <Panel next={safeNextPath(params.get("next"))} errorKey={params.get("error")} />;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

function Panel({ next, errorKey }: { next: string; errorKey: string | null }) {
  const { status, user } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(errorKey ? ERRORS[errorKey] ?? ERRORS.link : null);

  if (status === "disabled") {
    return (
      <div className="mt-8 max-w-md rounded-2xl border border-dashed border-border-strong p-6">
        <p className="font-semibold text-foreground">Accounts aren&apos;t switched on yet.</p>
        <p className="meta mt-2">
          Everything else on {SITE_NAME} works without one — saved items and progress are kept in this browser.
        </p>
        <Link href="/" className="btn btn-outline mt-4">
          Back to the homepage
        </Link>
      </div>
    );
  }

  if (status === "signed-in" && user) {
    return (
      <div className="mt-8 max-w-md rounded-2xl border border-border bg-surface p-6">
        <p className="font-semibold text-foreground">You&apos;re signed in as {user.email}.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={next} className="btn btn-primary">
            Continue
          </Link>
          <Link href="/my-hub" className="btn btn-outline">
            Go to My Hub
          </Link>
        </div>
      </div>
    );
  }

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function google() {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setBusy("google");
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback(), queryParams: { prompt: "select_account" } },
    });
    if (error) {
      setError("Google sign-in couldn't start. Try again in a moment.");
      setBusy(null);
    }
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("That doesn't look like an email address.");
      return;
    }
    setBusy("email");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: callback(), shouldCreateUser: true },
    });
    setBusy(null);
    if (error) {
      setError(/rate|seconds/i.test(error.message) ? "Too many requests — wait a minute and try again." : "We couldn't send the link. Check the address and try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="mt-8 max-w-md">
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-surface p-6">
        <button
          type="button"
          onClick={google}
          disabled={busy != null || status === "loading"}
          className="btn btn-outline w-full disabled:opacity-60"
        >
          <GoogleMark />
          {busy === "google" ? "Opening Google…" : "Continue with Google"}
        </button>

        <div className="my-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-subtle">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {sent ? (
          <div role="status" className="rounded-xl border border-success/40 bg-success/10 p-4">
            <p className="font-semibold text-foreground">Check your inbox</p>
            <p className="meta mt-1">
              We sent a sign-in link to <span className="font-medium text-foreground">{email.trim()}</span>. It
              works once and expires soon. Nothing arrives? Check spam, then{" "}
              <button type="button" onClick={() => setSent(false)} className="text-accent underline">
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-3">
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Email address</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="field"
              />
            </label>
            <button type="submit" disabled={busy != null || status === "loading"} className="btn btn-primary w-full disabled:opacity-60">
              {busy === "email" ? "Sending…" : "Email me a sign-in link"}
            </button>
            <p className="text-xs text-subtle">No password — the link signs you in on its own.</p>
          </form>
        )}
      </div>

      <p className="meta mt-4">
        An account stores only your user id and email address, plus what you save on {SITE_NAME}. We don&apos;t
        copy your Google name or photo. You&apos;ll be asked to confirm you&apos;re 18 or over the first time. See the{" "}
        <Link href="/privacy" className="text-accent underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
