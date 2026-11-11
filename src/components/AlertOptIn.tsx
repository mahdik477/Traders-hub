"use client";

import Link from "next/link";
import { useId } from "react";
import { Bell } from "lucide-react";
import { setAlertPref, useAlertPref } from "@/lib/local-store";
import { useAuth } from "@/components/auth/AuthProvider";

// Per-firm "tell me when the price or promo changes" preference. Unticked
// by default (opt-in only). Nothing sends email yet — this records the
// choice in the browser and, when signed in, on the person's own row in
// alert_preferences, so a future email tool has a consented list to work
// from. Says all of that in plain words next to the box.
export default function AlertOptIn({ firmId, firmName }: { firmId: string; firmName: string }) {
  const optedIn = useAlertPref(firmId);
  const { status } = useAuth();
  const inputId = useId();
  const descId = useId();

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className={`mt-8 max-w-3xl rounded-xl border p-4 transition-colors ${optedIn ? "border-accent/40 bg-accent/5" : "border-border bg-surface"}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
          <Bell className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`${inputId}-heading`} className="text-sm font-semibold text-foreground">
            Price &amp; promo alerts
          </h2>
          <label htmlFor={inputId} className="mt-2 flex cursor-pointer items-start gap-3 text-sm text-foreground">
            <input
              id={inputId}
              type="checkbox"
              checked={optedIn}
              aria-describedby={descId}
              onChange={(e) => setAlertPref(firmId, e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-gold-fill)]"
            />
            <span>Email me when {firmName}&apos;s prices or promo codes change.</span>
          </label>
          <p id={descId} className="meta mt-2">
            {optedIn ? "Preference saved. " : ""}
            No emails are sent yet — we&apos;re only recording your choice so there&apos;s a consented list when
            alerts launch. Untick any time.{" "}
            {status === "signed-out" && (
              <>
                To actually reach you we&apos;ll need your email, so{" "}
                <Link href={`/sign-in?next=/funded-accounts/${firmId}`} className="text-accent underline">
                  sign in
                </Link>{" "}
                to attach this preference to an account.{" "}
              </>
            )}
            {status === "disabled" && "Accounts aren't switched on yet, so this stays in your browser for now. "}
            See the{" "}
            <Link href="/privacy" className="text-accent underline">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
