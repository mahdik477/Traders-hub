"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

// Copies a string to the clipboard and confirms with a short "Copied" state.
// Used for promo codes on the Deals page and the share link on compare
// pages. Falls back to selecting nothing and showing "Couldn't copy" when
// the clipboard API is blocked (insecure context, permissions) rather than
// failing silently.
export default function CopyButton({
  value,
  label,
  copiedLabel = "Copied",
  className = "",
  variant = "outline",
  children,
}: {
  value: string;
  /** Accessible description of what gets copied, e.g. "Copy code SAVE20". */
  label: string;
  copiedLabel?: string;
  className?: string;
  variant?: "primary" | "outline";
  children?: React.ReactNode;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`btn ${variant === "primary" ? "btn-primary" : "btn-outline"} copy-button ${state === "copied" ? "is-copied" : ""} ${className}`}
    >
      {state === "copied" ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      <span>{state === "copied" ? copiedLabel : state === "failed" ? "Couldn't copy" : children ?? "Copy"}</span>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied" ? `${value} copied to clipboard` : ""}
      </span>
    </button>
  );
}
