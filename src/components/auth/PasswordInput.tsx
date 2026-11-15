"use client";

import { Eye, EyeOff } from "lucide-react";
import { MIN_PASSWORD, passwordStrength } from "@/lib/password-rules";

// The password field (with its show/hide toggle) and the strength hint that
// sits under it. Shared by /sign-in, /sign-up, /welcome/password and My Hub.

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

/** Three bars plus a line of advice. Point the field's `describedBy` at `id`. */
export function PasswordStrengthHint({ id, password }: { id: string; password: string }) {
  const strength = passwordStrength(password);
  return (
    <div id={id} aria-live="polite">
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
      <p className="mt-1 text-xs text-muted">
        {password ? strength.label : `At least ${MIN_PASSWORD} characters. A short sentence works well.`}
      </p>
    </div>
  );
}
