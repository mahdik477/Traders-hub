"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";
import { setDone, useIsDone, type ProgressKind } from "@/lib/progress-store";

// "Mark as done" for a Learn topic or a strategy quiz. Browser-first (the
// progress store), synced to the account when signed in. Toggles, so a
// mis-click is one more click to undo.
export default function MarkDoneButton({
  kind,
  id,
  label,
  doneLabel = "Done",
  className = "",
}: {
  kind: ProgressKind;
  id: string;
  /** e.g. "Mark this part as done" */
  label: string;
  doneLabel?: string;
  className?: string;
}) {
  const done = useIsDone(kind, id);
  const [pop, setPop] = useState(false);

  function toggle() {
    setDone(kind, id, !done);
    if (!done) {
      setPop(true);
      window.setTimeout(() => setPop(false), 420);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={toggle}
      className={`btn save-button ${done ? "border-success/60 bg-success/12 text-success hover:bg-success/18" : "btn-outline"} ${pop ? "is-pop" : ""} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`flex size-5 items-center justify-center rounded-full border ${done ? "border-success bg-success text-white" : "border-current"}`}
      >
        {done && <CheckIcon className="size-3" />}
      </span>
      {done ? doneLabel : label}
    </button>
  );
}
