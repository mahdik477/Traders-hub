import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export default function SignalGroupRiskDisclaimer({ className = "" }: { className?: string }) {
  return (
    <section
      aria-labelledby="signal-risk-heading"
      className={`rounded-lg border border-border bg-surface p-4 sm:p-6 ${className}`}
    >
      <div className="flex gap-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        <div>
          <h2 id="signal-risk-heading" className="text-sm font-semibold text-foreground">
            Risk disclaimer
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Signal groups are third-party chats. Tradox lists them so you can find and compare them. We do not
            verify calls, accuracy or results, and a member count is not a measure of quality. Trading involves a
            high level of risk and you can lose money. Joining a group is not financial advice. Some Join links are
            affiliate links, which means we may earn a commission if you sign up.{" "}
            <Link
              href="/disclaimer"
              className="font-medium text-foreground underline decoration-border-strong underline-offset-2 hover:text-accent"
            >
              Read the full disclaimer
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
