import type { ReactNode } from "react";
import { InfoIcon } from "@/components/icons";

// A worked scenario, pulled visually out of the surrounding prose — "here's
// what that actually looks like with numbers" rather than another abstract
// paragraph. Always says plainly that the numbers are made up.
export default function ExampleBox({ title = "Example", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-warning">
        <InfoIcon className="size-4" />
        {title}
      </p>
      <div className="mt-2.5 space-y-2 text-base leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}
