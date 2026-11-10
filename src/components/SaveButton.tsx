"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { toggleSaved, useIsSaved, type SavedKind } from "@/lib/local-store";

// The Save control on every listing card and page. Works with no account —
// saved items live in this browser — and syncs to the account once someone
// signs in (see AccountSync). aria-pressed carries the state for screen
// readers; the little "pop" on save is motion-safe only.
export default function SaveButton({
  kind,
  id,
  name,
  variant = "icon",
  className = "",
}: {
  kind: SavedKind;
  id: string;
  /** Used only for the accessible label, e.g. "Save FTMO". */
  name: string;
  /** "icon" = compact square for cards; "label" = full button for pages. */
  variant?: "icon" | "label";
  className?: string;
}) {
  const saved = useIsSaved(kind, id);
  const [pop, setPop] = useState(false);

  function onClick(e: React.MouseEvent) {
    // Cards are fully clickable; the save button must not open the page.
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = toggleSaved(kind, id);
    if (nowSaved) {
      setPop(true);
      window.setTimeout(() => setPop(false), 420);
    }
  }

  const label = saved ? `Remove ${name} from saved` : `Save ${name}`;

  if (variant === "label") {
    return (
      <button
        type="button"
        aria-pressed={saved}
        aria-label={label}
        onClick={onClick}
        className={`btn save-button ${saved ? "btn-primary" : "btn-outline"} ${pop ? "is-pop" : ""} ${className}`}
      >
        <Bookmark className="size-4" aria-hidden="true" fill={saved ? "currentColor" : "none"} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      title={saved ? "Saved — click to remove" : "Save for later"}
      onClick={onClick}
      className={`save-button relative z-10 flex size-9 items-center justify-center rounded-lg border transition-colors ${
        saved ? "border-accent bg-accent/15 text-accent" : "border-border-strong text-muted hover:border-accent hover:text-accent"
      } ${pop ? "is-pop" : ""} ${className}`}
    >
      <Bookmark className="size-4" aria-hidden="true" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
