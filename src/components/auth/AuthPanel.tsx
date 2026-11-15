"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Bookmark, Briefcase, Columns3, GraduationCap, LogOut, Mail } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PasswordInput, PasswordStrengthHint } from "@/components/auth/PasswordInput";
import { passwordProblem } from "@/lib/password-rules";
import { loadSupabaseBrowser } from "@/lib/supabase/client";
import { PW_OWNER_COOKIE, safeNextPath } from "@/lib/supabase/config";
import { SITE_NAME } from "@/lib/sections";

// The card on /sign-in and /sign-up. Both pages offer the same three ways
// in — Google, a one-time link sent by email, or an email + password —
// because people don't remember which one they used. What differs:
//
//   /sign-up  creates accounts. The email link may create one, and
//             "Create a password" makes one that must be confirmed by email.
//   /sign-in  never creates an account from a typed address (so a typo
//             can't silently make one). Google is the exception: Google
//             itself decides, and the first "Continue with Google" always
//             creates the account.
//
// DON'T "FIX" THIS — the screens must not reveal who has an account.
// If a page answered "that email isn't registered" or "that email already
// has an account", anyone could test a list of addresses against our users.
// So, on purpose:
//   * /sign-in + an address with no account → the same "check your inbox"
//     screen as everyone else (Supabase simply sends nothing);
//   * /sign-up + an address that already has an account → the same "check
//     your inbox" screen; the email they get is a normal sign-in link, and
//     the password they typed is NOT applied to the existing account;
//   * a wrong password and an unknown email give one shared message;
//   * "Forgot password?" always says "if there's an account…".
// Only problems that have nothing to do with the address are shown as
// errors (no connection, too many requests from this device, weak password).
// When Supabase isn't configured the panel says so plainly instead of
// showing buttons that can't work.

export type AuthIntent = "sign-in" | "sign-up";

const ERRORS: Record<string, string> = {
  expired: "That link has expired or was already used. Request a new one below.",
  link: "That link didn't work. Request a new one below.",
  "not-configured": "Accounts aren't switched on for this site yet.",
};

const RESEND_SECONDS = 60;
const DEFAULT_NEXT = "/my-hub";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NETWORK_PROBLEM = "We couldn't reach the account service. Check your connection and try again.";
const BUSY_PROBLEM = "Too many requests — wait a minute and try again.";

type AuthFailure = { name?: string; status?: number; code?: string; message: string };

/**
 * What to tell the person when asking for an email failed — or null to carry
 * on to the "check your inbox" screen. See the note at the top: on /sign-in
 * every failure that could depend on whether the address has an account
 * (including "no such account") must look like success.
 */
function emailProblem(error: AuthFailure, intent: AuthIntent): string | null {
  if (error.name === "AuthRetryableFetchError") return NETWORK_PROBLEM;
  // Counted per device/network, before the address is even looked at.
  if (error.code === "over_request_rate_limit") return BUSY_PROBLEM;
  // "You can only request this after N seconds": an email went to this
  // address under a minute ago, so "check your inbox" is simply true.
  if (/after \d+ seconds/i.test(error.message)) return null;
  if (intent === "sign-in") return null;
  if (error.code === "over_email_send_rate_limit" || error.status === 429) return BUSY_PROBLEM;
  return "We couldn't send the email. Check the address and try again.";
}

/** /sign-in ⇄ /sign-up, keeping the page the person was heading for. */
function authHref(path: "/sign-in" | "/sign-up", next: string): string {
  return next === DEFAULT_NEXT ? path : `${path}?next=${encodeURIComponent(next)}`;
}

export default function AuthPanel({ intent }: { intent: AuthIntent }) {
  return (
    <Suspense fallback={<Panel intent={intent} next={DEFAULT_NEXT} errorKey={null} />}>
      <PanelFromAddress intent={intent} />
    </Suspense>
  );
}

function PanelFromAddress({ intent }: { intent: AuthIntent }) {
  const params = useSearchParams();
  return <Panel intent={intent} next={safeNextPath(params.get("next"))} errorKey={params.get("error")} />;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

function Panel({ intent, next, errorKey }: { intent: AuthIntent; next: string; errorKey: string | null }) {
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
    const onward = /^\/sign-(in|up)\b/.test(next) ? DEFAULT_NEXT : next;
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
          <Link href={onward} className="btn btn-primary flex-1">
            {onward === DEFAULT_NEXT ? "Go to My Hub" : "Continue"}
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

  if (intent === "sign-up") {
    return (
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <AuthCard intent={intent} next={next} errorKey={errorKey} loading={status === "loading"} />
        <Benefits />
      </div>
    );
  }

  // /sign-in is for people coming back: the card and nothing else.
  return (
    <div className="mt-6">
      <AuthCard intent={intent} next={next} errorKey={errorKey} loading={status === "loading"} />
      <p className="meta mt-4 text-center">
        Free. An account keeps your saved listings and progress on any device. New here? Continuing with Google
        creates an account. We use your email only to sign you in and send account emails. See the{" "}
        <Link href="/privacy" className="text-accent underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}

function AuthCard({ intent, next, errorKey, loading }: { intent: AuthIntent; next: string; errorKey: string | null; loading: boolean }) {
  const router = useRouter();
  const isSignUp = intent === "sign-up";
  // Returning people most likely know their password, so /sign-in starts
  // there; new people on /sign-up don't have one yet, so it starts on the link.
  const [mode, setMode] = useState<"link" | "password">(isSignUp ? "link" : "password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // "confirm" = the email that finishes a "Create a password" sign-up.
  const [sent, setSent] = useState<null | "link" | "confirm" | "reset">(null);
  const [busy, setBusy] = useState<"google" | "email" | "password" | "reset" | null>(null);
  const [error, setError] = useState<string | null>(errorKey ? ERRORS[errorKey] ?? ERRORS.link : null);
  const [wait, setWait] = useState(0);
  const passwordId = useId();
  const hintId = useId();

  // Keyboard and screen-reader users: when the card swaps between the form
  // and "Check your inbox", move focus to the new content instead of
  // dropping it at the top of the page.
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const cameBack = useRef(false);
  useEffect(() => {
    if (sent) sentHeadingRef.current?.focus();
    else if (cameBack.current) {
      cameBack.current = false;
      emailRef.current?.focus();
    }
  }, [sent]);

  // Resend countdown after an email is sent.
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

  function showSent(kind: "link" | "confirm" | "reset") {
    setSent(kind);
    setWait(RESEND_SECONDS);
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
      setError("Google couldn't start. Try again in a moment.");
      setBusy(null);
    }
  }

  /**
   * Email a one-time link. Only /sign-up may create an account this way
   * (`createAccount`); on /sign-in an address with no account gets nothing,
   * and the screen looks the same either way (see the note at the top).
   */
  async function sendLink(createAccount: boolean, shownAs: "link" | "confirm") {
    if (!checkEmail()) return;
    const supabase = await loadSupabaseBrowser();
    if (!supabase) return;
    setBusy("email");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: callback(next), shouldCreateUser: createAccount },
    });
    setBusy(null);
    const problem = error ? emailProblem(error, createAccount ? "sign-up" : "sign-in") : null;
    if (problem) {
      setError(problem);
      return;
    }
    showSent(shownAs);
  }

  async function signInWithPassword() {
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
      // One message whether the email or the password was wrong — never
      // "that email isn't registered" (see the note at the top).
      setError(
        error.name === "AuthRetryableFetchError"
          ? NETWORK_PROBLEM
          : error.code === "email_not_confirmed"
            ? // Supabase only says this when the password was right, so it gives nothing away.
              "Confirm your email first — open the link we sent you, or use Email link to get a new one."
            : /rate|seconds/i.test(error.message)
            ? "Too many attempts — wait a minute and try again."
            : "Wrong email or password. Try again, use an email link instead, or reset your password.",
      );
      return;
    }
    setPassword("");
    router.push(next);
  }

  /** /sign-up → "Create a password". The account only works once the emailed link is opened. */
  async function createWithPassword() {
    if (!checkEmail()) return;
    const problem = passwordProblem(password, address);
    if (problem) {
      setError(problem);
      return;
    }
    const supabase = await loadSupabaseBrowser();
    if (!supabase) return;
    setBusy("password");
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: address,
      password,
      // has_password: so the sign-in callback doesn't offer /welcome/password again.
      options: { emailRedirectTo: callback(next), data: { has_password: true } },
    });

    // The address already has an account. Supabase reports this quietly (a
    // look-alike user with no identities, and no email), or — only if
    // "Confirm email" were switched off — as an error. Either way we say
    // nothing: the typed password is NOT applied, the owner of the address
    // gets a normal sign-in link, and the screen is the same as for a new
    // account (see the note at the top).
    const alreadyRegistered = error ? error.code === "user_already_exists" : data.user?.identities?.length === 0;
    if (alreadyRegistered) {
      const { error: linkError } = await supabase.auth.signInWithOtp({
        email: address,
        options: { emailRedirectTo: callback(next), shouldCreateUser: false },
      });
      setBusy(null);
      setPassword("");
      // Judged by the /sign-up rules, exactly as a brand-new address would
      // be — otherwise a "too many emails" moment would tell the two apart.
      const linkProblem = linkError ? emailProblem(linkError, "sign-up") : null;
      if (linkProblem) setError(linkProblem);
      else showSent("confirm");
      return;
    }

    setBusy(null);
    if (error) {
      const weak = error.code === "weak_password" || /weak|pwned|leaked|compromised/i.test(error.message);
      const shown = weak
        ? "That password is too easy to guess or has appeared in a data leak. Try a different one."
        : emailProblem(error, "sign-up");
      if (shown) {
        setError(shown);
        return;
      }
      // Nothing to show: an email already went to this address a moment ago.
      setPassword("");
      showSent("confirm");
      return;
    }
    setPassword("");
    // Tell /auth/callback that this account's password was typed in this
    // browser — but only when the account was created by this very request
    // (created and emailed in the same moment). If the address had already
    // been signed up and never confirmed, Supabase keeps the EARLIER
    // password, which may be a stranger's; no cookie then, and the callback
    // cancels that password (see the security note in the callback).
    const created = Date.parse(data.user?.created_at ?? "");
    const emailed = Date.parse(data.user?.confirmation_sent_at ?? "");
    const brandNew = !!data.user && Number.isFinite(created) && Number.isFinite(emailed) && Math.abs(emailed - created) < 30_000;
    document.cookie = brandNew
      ? `${PW_OWNER_COOKIE}=${data.user!.id}; Max-Age=3600; Path=/; SameSite=Lax`
      : `${PW_OWNER_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    if (data.session) {
      // Only happens if "Confirm email" is off in Supabase: already signed in.
      router.push(next);
      return;
    }
    showSent("confirm");
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
    const problem = error ? emailProblem(error, "sign-in") : null;
    if (problem) {
      setError(problem);
      return;
    }
    // Shown whether or not the address has an account (see the note at the top).
    showSent("reset");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "link") void sendLink(isSignUp, "link");
    else if (isSignUp) void createWithPassword();
    else void signInWithPassword();
  }

  function resend() {
    if (sent === "reset") void sendReset();
    // A "Create a password" sign-up is re-sent as a plain link to the same
    // address: it confirms a new account and signs in an existing one, and
    // never creates anything by itself.
    else if (sent === "confirm") void sendLink(false, "confirm");
    else void sendLink(isSignUp, "link");
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
          <div className="text-center">
            <span className="icon-chip mx-auto size-12" aria-hidden="true">
              <Mail className="size-6" />
            </span>
            <h2 ref={sentHeadingRef} tabIndex={-1} className="section-title mt-4 outline-none">
              Check your inbox
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              <SentMessage sent={sent} isSignUp={isSignUp} address={address} />
            </p>
            <button
              type="button"
              disabled={wait > 0 || busy != null}
              onClick={resend}
              className="btn btn-outline mt-5 w-full disabled:opacity-60"
            >
              {busy ? "Sending…" : wait > 0 ? `Resend in ${wait}s` : "Resend the email"}
            </button>
            <p className="meta mt-4">
              Can&apos;t find it? Check spam or promotions. Nothing after a few minutes? Try again later, or use
              another way in. Asked more than once? Use the newest email.{" "}
              <button
                type="button"
                onClick={() => {
                  cameBack.current = true;
                  setSent(null);
                  setWait(0);
                }}
                className="inline-flex min-h-11 items-center text-accent underline"
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
              {busy === "google" ? "Opening Google…" : isSignUp ? "Sign up with Google" : "Continue with Google"}
            </button>

            <div className="my-5 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span className="readout">or with your email</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="seg mb-4 w-full" role="group" aria-label={isSignUp ? "How to sign up with email" : "How to sign in with email"}>
              {(isSignUp ? (["link", "password"] as const) : (["password", "link"] as const)).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => (setMode(m), setError(null))}
                  className="seg-btn flex-1 justify-center"
                >
                  {m === "link" ? "Email link" : "Password"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-3" noValidate>
              <label className="flex flex-col gap-1">
                <span className="eyebrow">Email address</span>
                <input
                  ref={emailRef}
                  type="email"
                  name="email"
                  autoComplete={mode === "password" ? "username" : "email"}
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="field"
                />
              </label>

              {mode === "password" && !isSignUp && (
                <div className="flex flex-col gap-1">
                  <span className="flex items-center justify-between">
                    <label htmlFor={passwordId} className="eyebrow">
                      Password
                    </label>
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
                    id={passwordId}
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword((s) => !s)}
                    autoComplete="current-password"
                  />
                </div>
              )}

              {mode === "password" && isSignUp && (
                <>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={passwordId} className="eyebrow">
                      Create a password
                    </label>
                    <PasswordInput
                      id={passwordId}
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggle={() => setShowPassword((s) => !s)}
                      autoComplete="new-password"
                      describedBy={hintId}
                    />
                  </div>
                  <PasswordStrengthHint id={hintId} password={password} />
                  <p className="flex gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm leading-relaxed text-muted">
                    <Mail className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    <span>
                      You&apos;ll still need to confirm by email: we&apos;ll send a link to this address, and your account is
                      ready once you open it.
                    </span>
                  </p>
                </>
              )}

              <button type="submit" disabled={disabled} style={{ minHeight: "3.25rem" }} className="btn btn-primary w-full text-base disabled:opacity-60">
                {mode === "link"
                  ? busy === "email"
                    ? "Sending…"
                    : isSignUp
                      ? "Email me a sign-up link"
                      : "Email me a sign-in link"
                  : busy === "password"
                    ? isSignUp
                      ? "Creating…"
                      : "Signing in…"
                    : isSignUp
                      ? "Create account"
                      : "Sign in"}
              </button>
              {!(isSignUp && mode === "password") && (
                <p className="text-center text-xs text-subtle">
                  {mode === "password"
                    ? "Only works if you've set a password. Not sure? Use an email link instead."
                    : isSignUp
                      ? "No password needed — the link creates your account and signs you in. You can add a password later."
                      : "No password needed — the link signs you in."}
                </p>
              )}
            </form>
          </>
        )}

        <p className="mt-4 border-t border-border pt-2 text-center text-sm text-muted">
          {isSignUp ? "Already have an account?" : `New to ${SITE_NAME}?`}{" "}
          <Link
            href={authHref(isSignUp ? "/sign-in" : "/sign-up", next)}
            className="inline-flex min-h-11 items-center font-semibold text-accent underline"
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * The line under "Check your inbox". The wording depends only on what the
 * person asked for — never on whether the address has an account.
 */
function SentMessage({ sent, isSignUp, address }: { sent: "link" | "confirm" | "reset"; isSignUp: boolean; address: string }) {
  const who = <span className="break-all font-semibold text-foreground">{address}</span>;
  const how = "Open it on this device, in this browser — it works once and expires in an hour.";
  if (sent === "reset") {
    return (
      <>
        If there&apos;s an account for {who}, we&apos;ve sent a link to choose a new password. {how}
      </>
    );
  }
  if (sent === "confirm") {
    return (
      <>
        We&apos;ve sent a link to {who} to confirm it&apos;s yours and sign you in. {how}
      </>
    );
  }
  if (isSignUp) {
    return (
      <>
        We&apos;ve sent a link to {who}. {how}
      </>
    );
  }
  return (
    <>
      If there&apos;s a {SITE_NAME} account for {who}, a sign-in link is on its way. {how}
    </>
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
        you choose to set one (stored hashed — we never see it). We use your email to sign you in and to send account
        emails (sign-in links, confirming your address, password resets). We don&apos;t use or show your Google name
        or photo. You&apos;ll be asked to confirm you&apos;re 18 or over the first time. See the{" "}
        <Link href="/privacy" className="text-accent underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
