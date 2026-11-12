"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Bookmark, Briefcase, Columns3, Eye, EyeOff, GraduationCap, LogOut, Mail } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { loadSupabaseBrowser } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/supabase/config";
import { SITE_NAME } from "@/lib/sections";

// The sign-in page. Three ways in: Google, a one-time link sent by email
// (the default), or an email + password for people who have set one. New
// people always start with Google or the link; the password is offered on a
// screen straight after the link (/welcome/password). When Supabase isn't
// configured the panel says so plainly instead of showing buttons that
// can't work.

const ERRORS: Record<string, string> = {
  expired: "That sign-in link has expired or was already used. Request a new one below.",
  link: "That sign-in link didn't work. Request a new one below.",
  "not-configured": "Accounts aren't switched on for this site yet.",
};

const RESEND_SECONDS = 60;

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
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Panel({ next, errorKey }: { next: string; errorKey: string | null }) {
  const { status, user, signOut } = useAuth();

  if (status === "disabled") {
    return (
      <div className="kit-panel mt-8 max-w-md p-6">
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
    const initial = (user.email ?? "?").charAt(0).toUpperCase();
    return (
      <div className="kit-panel mt-8 max-w-md p-6">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="avatar-gold size-14 text-xl">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="readout">Signed in</p>
            <p className="truncate text-lg font-semibold text-foreground" title={user.email ?? undefined}>
              {user.email}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={next === "/sign-in" ? "/my-hub" : next} className="btn btn-primary flex-1">
            {next === "/my-hub" ? "Go to My Hub" : "Continue"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <button type="button" onClick={() => signOut()} className="btn btn-outline">
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
      <SignInCard next={next} errorKey={errorKey} loading={status === "loading"} />
      <Benefits />
    </div>
  );
}

function SignInCard({ next, errorKey, loading }: { next: string; errorKey: string | null; loading: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"link" | "password">("link");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState<null | "link" | "reset">(null);
  const [busy, setBusy] = useState<"google" | "email" | "password" | "reset" | null>(null);
  const [error, setError] = useState<string | null>(errorKey ? ERRORS[errorKey] ?? ERRORS.link : null);
  const [wait, setWait] = useState(0);

  // Resend countdown after a link is sent.
  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const callback = (to: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(to)}`;
  const address = email.trim();

  function checkEmail(): boolean {
    if (!EMAIL_RE.test(address)) {
      setError("That doesn't look like an email address.");
      return false;
    }
    return true;
  }

  async function google() {
    const supabase = await loadSupabaseBrowser();
    if (!supabase) return;
    setBusy("google");
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback(next), queryParams: { prompt: "select_account" } },
    });
    if (error) {
      setError("Google sign-in couldn't start. Try again in a moment.");
      setBusy(null);
    }
  }

  async function sendLink(e?: React.FormEvent) {
    e?.preventDefault();
    if (!checkEmail()) return;
    const supabase = await loadSupabaseBrowser();
    if (!supabase) return;
    setBusy("email");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: callback(next), shouldCreateUser: true },
    });
    setBusy(null);
    if (error) {
      setError(/rate|seconds/i.test(error.message) ? "Too many requests — wait a minute and try again." : "We couldn't send the link. Check the address and try again.");
      return;
    }
    setSent("link");
    setWait(RESEND_SECONDS);
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!checkEmail()) return;
    if (!password) {
      setError("Enter your password.");
      return;
    }
    const supabase = await loadSupabaseBrowser();
    if (!supabase) return;
    setBusy("password");
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: address, password });
    setBusy(null);
    if (error) {
      // Same message whether the email or the password was wrong, so the
      // form can't be used to find out who has an account.
      setError(
        /rate|seconds/i.test(error.message)
          ? "Too many attempts — wait a minute and try again."
          : "That email and password don't match. Try again, use an email link instead, or reset your password.",
      );
      return;
    }
    setPassword("");
    router.push(next);
  }

  async function sendReset() {
    if (!checkEmail()) return;
    const supabase = await loadSupabaseBrowser();
    if (!supabase) return;
    setBusy("reset");
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: callback(`/welcome/password?reset=1&next=${encodeURIComponent(next)}`),
    });
    setBusy(null);
    if (error && /rate|seconds/i.test(error.message)) {
      setError("Too many requests — wait a minute and try again.");
      return;
    }
    // Shown whether or not the address has an account (no account fishing).
    setSent("reset");
    setWait(RESEND_SECONDS);
  }

  const disabled = busy != null || loading;

  return (
    <div className="min-w-0">
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}

      <div className="kit-panel p-5 sm:p-6">
        {sent ? (
          <div role="status" className="text-center">
            <span className="icon-chip mx-auto size-12" aria-hidden="true">
              <Mail className="size-6" />
            </span>
            <p className="section-title mt-4">Check your inbox</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {sent === "link" ? "We sent a sign-in link to" : "If there's an account for"}{" "}
              <span className="break-all font-semibold text-foreground">{address}</span>
              {sent === "link"
                ? ". Open it on this device — it works once and expires in an hour."
                : ", we've sent a link to choose a new password. It works once and expires in an hour."}
            </p>
            <button
              type="button"
              disabled={wait > 0 || busy != null}
              onClick={() => (sent === "link" ? sendLink() : sendReset())}
              className="btn btn-outline mt-5 w-full disabled:opacity-60"
            >
              {busy ? "Sending…" : wait > 0 ? `Resend in ${wait}s` : "Resend the email"}
            </button>
            <p className="meta mt-4">
              Can&apos;t find it? Check spam or promotions.{" "}
              <button
                type="button"
                onClick={() => {
                  setSent(null);
                  setWait(0);
                }}
                className="text-accent underline"
              >
                Wrong address? Change it
              </button>
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={google}
              disabled={disabled}
              style={{ minHeight: "3.25rem" }}
              className="btn btn-outline w-full text-base disabled:opacity-60"
            >
              <GoogleMark />
              {busy === "google" ? "Opening Google…" : "Continue with Google"}
            </button>

            <div className="my-5 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span className="readout">or with your email</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="seg mb-4 w-full" role="group" aria-label="How to sign in with email">
              <button
                type="button"
                aria-pressed={mode === "link"}
                onClick={() => (setMode("link"), setError(null))}
                className="seg-btn flex-1 justify-center"
              >
                Email link
              </button>
              <button
                type="button"
                aria-pressed={mode === "password"}
                onClick={() => (setMode("password"), setError(null))}
                className="seg-btn flex-1 justify-center"
              >
                Password
              </button>
            </div>

            <form onSubmit={mode === "link" ? sendLink : signInWithPassword} className="space-y-3" noValidate>
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

              {mode === "password" && (
                <label className="flex flex-col gap-1">
                  <span className="flex items-center justify-between">
                    <span className="eyebrow">Password</span>
                    <button
                      type="button"
                      onClick={sendReset}
                      disabled={disabled}
                      className="inline-flex min-h-11 items-center text-xs text-accent underline disabled:opacity-60"
                    >
                      {busy === "reset" ? "Sending…" : "Forgot password?"}
                    </button>
                  </span>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword((s) => !s)}
                    autoComplete="current-password"
                  />
                </label>
              )}

              <button type="submit" disabled={disabled} style={{ minHeight: "3.25rem" }} className="btn btn-primary w-full text-base disabled:opacity-60">
                {mode === "link"
                  ? busy === "email"
                    ? "Sending…"
                    : "Email me a sign-in link"
                  : busy === "password"
                    ? "Signing in…"
                    : "Sign in"}
              </button>
              <p className="text-center text-xs text-subtle">
                {mode === "link"
                  ? "No password needed — the link signs you in. New here? The same link creates your account."
                  : "Only works once you've set a password. New here? Use an email link first."}
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/** Password field with a show/hide toggle. Shared with /welcome/password. */
export function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  id,
  describedBy,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: "current-password" | "new-password";
  id?: string;
  describedBy?: string;
}) {
  return (
    <span className="relative block">
      <input
        id={id}
        type={show ? "text" : "password"}
        name={autoComplete === "new-password" ? "new-password" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={describedBy}
        className="field pr-12"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </span>
  );
}

function Benefits() {
  const rows: { icon: (p: { className?: string }) => ReactNode; title: string; text: string }[] = [
    { icon: Bookmark, title: "Your saved listings, everywhere", text: "Firms, courses, brokers and tools you bookmark follow you to your phone." },
    { icon: GraduationCap, title: "Your learning progress", text: "Where you are in the 9-part Learn course and which strategy quizzes you've done." },
    { icon: Briefcase, title: "What you're using", text: "Tick the firms, brokers, courses and tools you use, and see them all in My Hub." },
    { icon: Columns3, title: "Saved comparisons", text: "Come back to a side-by-side without rebuilding it." },
  ];
  return (
    <div className="min-w-0">
      <p className="readout">What an account gives you</p>
      <ul className="mt-4 space-y-4">
        {rows.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span className="icon-chip mt-0.5" aria-hidden="true">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-foreground">{title}</span>
              <span className="block text-sm leading-relaxed text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="meta mt-6 border-t border-border pt-4">
        Free, and everything on the site still works without an account. An account stores only your user id, email
        address and the time you confirmed you&apos;re 18+, plus what you save or tick on {SITE_NAME} and a password if
        you choose to set one (stored hashed — we never see it). We don&apos;t use or show your Google name or photo.
        You&apos;ll be asked to confirm you&apos;re 18 or over the first time. See the{" "}
        <Link href="/privacy" className="text-accent underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
