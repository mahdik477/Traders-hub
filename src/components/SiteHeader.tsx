import Link from "next/link";
import { SITE_NAME, sections } from "@/lib/sections";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-page flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {SITE_NAME}
        </Link>
        <nav aria-label="Main" className="-mx-1 overflow-x-auto sm:mx-0">
          <ul className="flex gap-x-1 whitespace-nowrap text-sm text-muted">
            {sections.map((section) => (
              <li key={section.slug}>
                <Link
                  href={`/${section.slug}`}
                  className="block rounded-md px-2 py-1 transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
