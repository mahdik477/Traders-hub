"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShieldIcon } from "@/components/icons";
import { SITE_NAME } from "@/lib/sections";

// Shown once, right after a person's first sign-in, until they confirm
// they're 18 or over. Declining deletes the just-created account (see
// AuthProvider.declineAge) and signs them out. The confirmation is
// recorded as a timestamp on their profile row — nothing else about them is
// collected here.
export default function AgeConfirmModal({
  onConfirm,
  onDecline,
}: {
  onConfirm: () => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const declineRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // The page behind the dialog is neither clickable nor readable until the
    // question is answered.
    const behind = Array.from(document.body.querySelectorAll<HTMLElement>("header, main, footer, nav"));
    for (const el of behind) el.setAttribute("inert", "");
    return () => {
      document.body.style.overflow = prev;
      for (const el of behind) el.removeAttribute("inert");
    };
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch {
      setError("That didn't save. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="search-overlay fixed inset-0 z-50 flex items-center justify-center bg-background/75 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-heading"
        aria-describedby="age-desc"
        className="search-panel w-full max-w-md rounded-2xl border border-border-strong bg-surface p-6 shadow-glow"
        onKeyDown={(e) => {
          // Esc does nothing (a reflex press must never delete an account);
          // Tab cycles between the two buttons so focus can't leave.
          if (e.key === "Escape") e.preventDefault();
          if (e.key === "Tab") {
            e.preventDefault();
            (document.activeElement === confirmRef.current ? declineRef : confirmRef).current?.focus();
          }
        }}
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <ShieldIcon className="size-5" />
        </span>
        <h2 id="age-heading" className="section-title mt-4 text-2xl">
          One quick check
        </h2>
        <p id="age-desc" className="mt-2 text-muted">
          {SITE_NAME} is for adults. To use an account you need to confirm you&apos;re 18 or over. We store only
          your user id, your email address and the time you confirmed. If you&apos;re under 18, the account
          that was just created is deleted straight away — see the{" "}
          <Link href="/privacy" className="text-accent underline" target="_blank">
            privacy policy
          </Link>
          .
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button ref={confirmRef} type="button" disabled={busy} onClick={() => run(onConfirm)} className="btn btn-primary flex-1 disabled:opacity-60">
            I&apos;m 18 or over
          </button>
          <button ref={declineRef} type="button" disabled={busy} onClick={() => run(onDecline)} className="btn btn-outline flex-1 disabled:opacity-60">
            I&apos;m under 18 — delete this account
          </button>
        </div>
      </div>
    </div>
  );
}
