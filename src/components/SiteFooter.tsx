import Link from "next/link";
import { SITE_NAME } from "@/lib/sections";

// Shown on every page. The disclaimer line is required on every page
// (see "Non-negotiable constraints" in CLAUDE.md) — do not remove it.
export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted">
        <p>
          <strong className="text-foreground">Disclaimer:</strong> {SITE_NAME}{" "}
          is a discovery and comparison platform for informational purposes
          only. We do not verify trading performance, accuracy or results, and
          nothing on this site is financial advice. Some links are affiliate
          links, which means we may earn a commission if you sign up.
        </p>
        <p>
          <Link href="/disclaimer" className="underline hover:text-foreground">
            Read the full disclaimer
          </Link>
        </p>
        <p>
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
