import Link from "next/link";
import type { Section } from "@/lib/sections";

export default function ComingSoon({ section }: { section: Section }) {
  return (
    <div className="max-w-3xl py-6 sm:py-10">
      <span className="pill">
        {section.status === "next-up" ? "Next up" : "Coming soon"}
      </span>
      <h1 className="title-rule page-title mt-4">{section.title}</h1>
      <p className="mt-4 text-lg text-muted">{section.summary}</p>
      <p className="mt-8 text-muted">
        We&apos;re still building this section.
      </p>
      <Link href="/" className="btn btn-outline mt-6">
        ← Back to home
      </Link>
    </div>
  );
}
