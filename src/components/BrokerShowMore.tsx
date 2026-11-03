"use client";

import { useState } from "react";

export default function BrokerShowMore({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 280;

  return (
    <div>
      <p className={`text-base leading-7 text-muted ${!open && long ? "line-clamp-4" : ""}`}>{text}</p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-foreground"
        >
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
