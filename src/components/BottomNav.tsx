"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { Bookmark, Compass, Home, Search, Shield } from "lucide-react";

// Phone-only bottom bar (hidden from md up, where the header nav is in
// reach). Five stops: Home, Search (opens the Ctrl+K dialog), Funded
// Accounts, Learn and My Hub. Sits above the iOS home indicator via the
// safe-area inset; .site-footer and the compare trays leave room for it
// through --bottom-nav-height (see globals.css).

export const OPEN_SEARCH_EVENT = "tradox:open-search";

type Item = { href?: string; label: string; icon: ComponentType<{ className?: string }>; match?: (p: string) => boolean; action?: "search" };

const ITEMS: Item[] = [
  { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  { label: "Search", icon: Search, action: "search" },
  { href: "/funded-accounts", label: "Firms", icon: Shield, match: (p) => p.startsWith("/funded-accounts") || p === "/deals" },
  { href: "/learn", label: "Learn", icon: Compass, match: (p) => p.startsWith("/learn") || p.startsWith("/start-here") },
  { href: "/my-hub", label: "My Hub", icon: Bookmark, match: (p) => p.startsWith("/my-hub") },
];

export default function BottomNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="Quick navigation" className="bottom-nav fixed inset-x-0 bottom-0 z-40 md:hidden">
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match ? item.match(pathname) : false;
          const className = `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-semibold transition-colors ${
            active ? "text-accent" : "text-muted hover:text-foreground"
          }`;
          const inner = (
            <>
              <span className={`bottom-nav-icon flex h-7 w-11 items-center justify-center rounded-full ${active ? "bg-accent/15" : ""}`}>
                <Icon className="size-5" />
              </span>
              {item.label}
            </>
          );
          return (
            <li key={item.label}>
              {item.action === "search" ? (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
                  className={`${className} w-full`}
                  aria-label="Search the site"
                >
                  {inner}
                </button>
              ) : (
                <Link href={item.href!} aria-current={active ? "page" : undefined} className={className}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
