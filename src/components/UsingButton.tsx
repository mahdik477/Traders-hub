"use client";

import { Check, Plus } from "lucide-react";
import { toggleStack, useIsInStack, type StackKind } from "@/lib/local-store";

// "I use this" — a person's own note of which firms, brokers, courses and
// tools they use, shown in My Hub. Self-reported only: we never check it,
// never count it across people and never show it to anyone else. Works with
// no account (this browser) and syncs to the person's own rows when signed
// in (see AccountSync). Sits next to the Save button on detail pages.

const LABELS: Record<StackKind, { off: string; on: string }> = {
  firm: { off: "I have an account here", on: "You have an account here" },
  broker: { off: "I trade with this broker", on: "You trade with this broker" },
  course: { off: "I'm taking this course", on: "You're taking this course" },
  tool: { off: "I use this tool", on: "You use this tool" },
};

export default function UsingButton({
  kind,
  id,
  name,
  className = "",
}: {
  kind: StackKind;
  id: string;
  /** For the accessible label, e.g. "FTMO". */
  name: string;
  className?: string;
}) {
  const on = useIsInStack(kind, id);
  const text = on ? LABELS[kind].on : LABELS[kind].off;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${LABELS[kind].off} — ${name}${on ? " (in My Hub; press to remove)" : " (adds it to My Hub)"}`}
      title={on ? "In your My Hub — press to remove. Only you see this." : "Adds it to My Hub. Only you see this; we don't check it."}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleStack(kind, id);
      }}
      className={`btn ${on ? "border-accent bg-accent/12 text-foreground" : "btn-outline"} ${className}`}
    >
      {on ? <Check className="size-4 text-accent" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
      {text}
    </button>
  );
}
