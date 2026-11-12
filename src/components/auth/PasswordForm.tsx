"use client";

import { useId, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PasswordInput } from "@/components/auth/SignInPanel";

// Choose / change a password for the signed-in person. Used on the
// /welcome/password screen (straight after the email link) and in My Hub.
// The password goes to Supabase Auth, which stores it hashed — we never
// keep, log or show it. Marks the account with has_password so we know not
// to ask again.

export const MIN_PASSWORD = 10;

/** A rough hint, not a rule: length plus a mix of character types. */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (pw.length < MIN_PASSWORD) return { score: 0, label: `At least ${MIN_PASSWORD} characters` };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (pw.length >= 16 || (pw.length >= 12 && kinds >= 3)) return { score: 3, label: "Strong" };
  if (kinds >= 2) return { score: 2, label: "Good — longer is even better" };
  return { score: 1, label: "OK — mix in numbers or symbols, or make it longer" };
}

export default function PasswordForm({
  submitLabel = "Save password",
  onDone,
}: {
  submitLabel?: string;
  /** Called after the password is saved. */
  onDone?: () => void;
}) {
  const { supabase, user } = useAuth();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const hintId = useId();
  const strength = passwordStrength(pw);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    if (pw.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (pw !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    if (user.email && pw.toLowerCase().includes(user.email.split("@")[0].toLowerCase())) {
      setError("Don't use your email name in your password.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: pw, data: { has_password: true } });
    setBusy(false);
    if (error) {
      setError(
        /weak|pwned|leaked|compromised/i.test(error.message)
          ? "That password is too easy to guess or has appeared in a data leak. Try a different one."
          : /same|different from the old/i.test(error.message)
            ? "That's your current password — choose a new one."
            : /reauth|recent/i.test(error.message)
              ? "For safety, sign in again with an email link, then set your password."
              : "We couldn't save that password. Try again in a moment.",
      );
      return;
    }
    setPw("");
    setConfirm("");
    setSaved(true);
    onDone?.();
  }

  if (saved && !onDone) {
    return (
      <p role="status" className="rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-foreground">
        Password saved. You can now sign in with your email and password, or keep using email links.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      {error && (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-foreground">
          {error}
        </p>
      )}
      <label className="flex flex-col gap-1">
        <span className="eyebrow">New password</span>
        <PasswordInput
          value={pw}
          onChange={setPw}
          show={show}
          onToggle={() => setShow((s) => !s)}
          autoComplete="new-password"
          describedBy={hintId}
        />
      </label>
      <div id={hintId} aria-live="polite">
        <div className="flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 flex-1 rounded-full ${
                strength.score >= n ? (strength.score === 1 ? "bg-warning" : "bg-success") : "bg-surface-2"
              }`}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">{pw ? strength.label : `At least ${MIN_PASSWORD} characters. A short sentence works well.`}</p>
      </div>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Type it again</span>
        <PasswordInput value={confirm} onChange={setConfirm} show={show} onToggle={() => setShow((s) => !s)} autoComplete="new-password" />
      </label>
      {/* Lets password managers file the password under the right account. */}
      <input type="email" name="email" autoComplete="username" value={user?.email ?? ""} readOnly hidden />
      <button type="submit" disabled={busy || !supabase} style={{ minHeight: "3.25rem" }} className="btn btn-primary w-full text-base disabled:opacity-60">
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
