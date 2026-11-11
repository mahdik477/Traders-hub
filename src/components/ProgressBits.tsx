"use client";

import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { useProgress, type ProgressKind } from "@/lib/progress-store";
import { useAuth } from "@/components/auth/AuthProvider";

// Small progress widgets for the Learn and Strategies hubs. All read the
// browser-side progress store, so they render "nothing done" on the server
// and fill in on the client — never a layout jump, just numbers appearing.

/** A green "Done" badge, or nothing. For list cards. */
export function DoneTick({ kind, id, className = "" }: { kind: ProgressKind; id: string; className?: string }) {
  const done = useProgress().some((e) => e.kind === kind && e.id === id);
  if (!done) return null;
  return (
    <span className={`badge badge-success inline-flex items-center gap-1 ${className}`}>
      <CheckIcon className="size-3" />
      Done
    </span>
  );
}

/** "x of N done" with a bar — one per hub page. `ids` limits the count to
 *  the items that actually exist on the page. */
export function ProgressSummary({
  kind,
  ids,
  noun,
  className = "",
}: {
  kind: ProgressKind;
  ids: string[];
  /** e.g. "parts" or "quizzes" */
  noun: string;
  className?: string;
}) {
  const progress = useProgress();
  const { status } = useAuth();
  const done = ids.filter((id) => progress.some((e) => e.kind === kind && e.id === id)).length;
  const total = ids.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className={`rounded-xl border border-border bg-surface p-4 ${className}`} aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {done === 0 ? `No ${noun} marked done yet` : done === total ? `All ${total} ${noun} done` : `${done} of ${total} ${noun} done`}
        </p>
        <p className="meta">
          {status === "signed-in" ? (
            "Synced to your account"
          ) : status === "disabled" ? (
            "Saved in this browser"
          ) : (
            <>
              Saved in this browser ·{" "}
              <Link href="/sign-in" className="text-accent underline">
                sign in to keep it everywhere
              </Link>
            </>
          )}
        </p>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={`${noun} done`}
      >
        <div className="path-progress h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
