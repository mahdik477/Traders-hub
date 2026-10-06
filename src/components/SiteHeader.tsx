"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { SITE_NAME, sections } from "@/lib/sections";

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-1 py-2 sm:flex-nowrap sm:py-2.5">
        <Link href="/" className="mr-auto flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg sm:order-1 sm:mr-0">
          <Image
            src="/brand/tradox-td.png"
            alt=""
            width={44}
            height={44}
            priority
            className="size-10 rounded-xl sm:size-11"
          />
          <span className="text-sm font-semibold tracking-[0.16em] uppercase">{SITE_NAME}</span>
        </Link>
        <div className="sm:order-3">
          <ThemeToggle />
        </div>
        <nav aria-label="Main" className="relative order-last w-full min-w-0 sm:order-2 sm:w-auto sm:flex-1">
          <ul className="nav-scroll -mx-1 flex gap-1 overflow-x-auto px-1 py-0.5 pr-8">
            {sections.map((section) => {
              const href = `/${section.slug}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={section.slug} className="shrink-0">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                      active
                        ? "bg-gold-fill/15 text-accent"
                        : "text-muted hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    {section.title}
                  </Link>
                </li>
              );
            })}
          </ul>
          <span className="nav-fade" aria-hidden="true" />
        </nav>
      </div>
    </header>
  );
}
