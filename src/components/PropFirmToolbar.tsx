import Link from "next/link";
import type { JSX } from "react";
import { CalculatorIcon, CompassIcon, GridIcon, TagIcon, WaveStructureIcon } from "@/components/icons";

// The row of beginner tools under the Funded Accounts heading — one place
// that links to everything built around the prop-firm data, so the
// directory itself stays a directory.
const TOOLS: { href: string; label: string; hint: string; icon: (p: { className?: string }) => JSX.Element }[] = [
  { href: "/funded-accounts/find-my-firm", label: "Find my firm", hint: "5 quick questions", icon: CompassIcon },
  { href: "/funded-accounts/compare", label: "Compare plans", hint: "Up to 3 side by side", icon: GridIcon },
  { href: "/deals", label: "Deals & codes", hint: "Every active promo", icon: TagIcon },
  { href: "/funded-accounts/cost-calculator", label: "Cost calculator", hint: "What a challenge really costs", icon: CalculatorIcon },
  { href: "/funded-accounts/drawdown-explained", label: "Drawdown explained", hint: "Static vs trailing, live", icon: WaveStructureIcon },
];

export default function PropFirmToolbar({ current }: { current?: string }) {
  return (
    <nav aria-label="Prop firm tools" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {TOOLS.map(({ href, label, hint, icon: Icon }) => {
        const active = current === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`lift-card flex min-h-12 shrink-0 items-center gap-2.5 rounded-xl border px-3.5 text-sm transition-colors ${
              active
                ? "border-accent bg-accent/12 text-foreground"
                : "border-border bg-surface text-foreground hover:border-accent/50"
            }`}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
              <Icon className="size-4" />
            </span>
            <span className="leading-tight">
              <span className="block font-semibold">{label}</span>
              <span className="block text-xs text-muted">{hint}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
