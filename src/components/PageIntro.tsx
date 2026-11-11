import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

// The shared top of every page in the Aurora Terminal direction (DESIGN.md
// → "Shared chrome"): optional back link, eyebrow, page title, a short
// lede, and an optional right-hand slot (a TerminalStatPanel, an action).
// Sits on a static gold wash (`page-glow`) — one calm layer, no animation,
// so the homepage hero stays the only moving backdrop on the site.
//
// Server component. Directory pages pass `size="lg"`; detail-style pages
// and tools use the default.
export default function PageIntro({
  eyebrow,
  title,
  lede,
  back,
  aside,
  size = "md",
  children,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Back link, e.g. { href: "/funded-accounts", label: "All firms" }. */
  back?: { href: string; label: string };
  /** Right-hand column on large screens (stat panel, CTA group). */
  aside?: ReactNode;
  size?: "md" | "lg";
  /** Extra content under the lede (tool rows, action buttons). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`page-intro relative ${className}`}>
      <span aria-hidden="true" className="page-glow pointer-events-none absolute inset-x-0 -top-10 h-64 sm:-top-14" />
      <div className={`relative ${aside ? "grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center" : ""}`}>
        <div className="min-w-0">
          {back && (
            <Link href={back.href} className="back-link">
              <ChevronLeftIcon className="size-4" />
              {back.label}
            </Link>
          )}
          {eyebrow && <p className={`eyebrow ${back ? "mt-5" : ""}`}>{eyebrow}</p>}
          <h1
            className={`title-rule page-title ${eyebrow ? "mt-2" : back ? "mt-5" : ""} ${
              size === "lg" ? "text-[clamp(2rem,5vw,3rem)] leading-[1.05]" : ""
            }`}
          >
            {title}
          </h1>
          {lede && <div className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{lede}</div>}
          {children && <div className="mt-6">{children}</div>}
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </header>
  );
}
