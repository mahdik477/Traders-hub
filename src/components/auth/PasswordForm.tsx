"use client";

import { useId, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PasswordInput, PasswordStrengthHint } from "@/components/auth/PasswordInput";
import { passwordProblem } from "@/lib/password-rules";

// Choose / change a password for the signed-in person. Used on the
// /welcome/password screen (straight after the email link) and in My Hub.
// The password goes to Supabase Auth, which stores it hashed — we never
// keep, log or show it. Marks the account with has_password so we know not
// to ask again. The rules themselves live in src/lib/password-rules.ts.

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    const problem = passwordProblem(pw, user.email);
    if (problem) {
      setError(problem);
      return;
    }
    if (pw !== confirm) {
      setError("The two passwords don't match.");
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
      <PasswordStrengthHint id={hintId} password={pw} />
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
