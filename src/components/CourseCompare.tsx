"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { CourseView } from "@/lib/course-types";
import type { ProviderView } from "@/lib/provider-types";
import { MARKET_LABELS } from "@/lib/course-types";
import { resolveComparableEntries, type ComparableEntry } from "@/lib/course-compare";
import TrustpilotStars from "@/components/TrustpilotStars";
import OurChoiceBadge from "@/components/OurChoiceBadge";
import PlatformPill from "@/components/PlatformPill";
import { CheckIcon } from "@/components/icons";

// The side-by-side view: up to 3 courses/providers, picked on /courses and
// carried here as ?ids=a,b,c. Reads the selection from the address (same
// pattern as CourseDirectory's filters) so the comparison is a real,
// shareable link, not just in-memory state.

export default function CourseCompare({
  courses,
  providers,
}: {
  courses: CourseView[];
  providers: ProviderView[];
}) {
  return (
    <Suspense fallback={null}>
      <CompareFromAddress courses={courses} providers={providers} />
    </Suspense>
  );
}

function CompareFromAddress({
  courses,
  providers,
}: {
  courses: CourseView[];
  providers: ProviderView[];
}) {
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const entries = resolveComparableEntries(ids, courses, providers);

  if (entries.length < 2) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-border-strong p-10 text-center">
        <p className="text-muted">
          Pick at least 2 courses on the directory to compare them side by side.
        </p>
        <Link href="/courses" className="btn btn-primary mt-4">
          Browse courses
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 z-10 w-28 min-w-28 bg-surface p-3 sm:w-40 sm:min-w-40" />
            {entries.map((e) => (
              <th key={e.id} scope="col" className="min-w-[220px] border-l border-border bg-surface p-4 text-left align-top sm:min-w-[260px]">
                <HeaderCell entry={e} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row label="Starting price" entries={entries} render={(e) => (e.pricing[0] ? <PricingCell entry={e} /> : <Dash />)} />
          <Row label="Free tier" entries={entries} render={(e) => <YesNo yes={e.hasFreeTier} />} />
          <Row
            label="Trustpilot"
            entries={entries}
            render={(e) => (e.trustpilot ? <TrustpilotStars rating={e.trustpilot} size="sm" /> : <Dash />)}
          />
          <Row
            label="Whop rating"
            entries={entries}
            render={(e) => (e.whop ? <TrustpilotStars rating={e.whop} size="sm" platform="Whop" /> : <Dash />)}
          />
          <Row
            label="Markets"
            entries={entries}
            render={(e) =>
              e.markets.length ? (
                <div className="flex flex-wrap gap-1">
                  {e.markets.map((m) => (
                    <span key={m} className="pill text-xs">
                      {MARKET_LABELS[m]}
                    </span>
                  ))}
                </div>
              ) : (
                <Dash />
              )
            }
          />
          <Row label="Live sessions" entries={entries} render={(e) => <YesNo yes={e.hasLiveSessions} />} />
          <Row
            label="Instructor(s)"
            entries={entries}
            render={(e) => (e.instructors.length ? <span>{e.instructors.join(", ")}</span> : <Dash />)}
          />
          <Row
            label="What's included"
            entries={entries}
            render={(e) =>
              e.formats.length ? (
                <ul className="space-y-1">
                  {e.formats.map((f) => (
                    <li key={f.label}>{f.label}</li>
                  ))}
                </ul>
              ) : (
                <Dash />
              )
            }
          />
          <Row
            label="Platforms"
            entries={entries}
            render={(e) =>
              e.platforms.length ? (
                <div className="flex flex-wrap gap-1">
                  {e.platforms.slice(0, 5).map((p) => (
                    <PlatformPill key={p} name={p} />
                  ))}
                  {e.platforms.length > 5 && <span className="meta">+{e.platforms.length - 5} more</span>}
                </div>
              ) : (
                <Dash />
              )
            }
          />
          <Row
            label="Curriculum"
            entries={entries}
            render={(e) => (e.curriculumModuleCount != null ? <span>{e.curriculumModuleCount} modules</span> : <Dash />)}
          />
          <Row
            label="Broker partnership"
            entries={entries}
            render={(e) => (e.brokerPartnershipName ? <span>{e.brokerPartnershipName}</span> : <Dash />)}
          />
          <Row
            label="Refund policy"
            entries={entries}
            render={(e) => (e.refundPolicy ? <span className="line-clamp-4">{e.refundPolicy}</span> : <Dash label="Not stated" />)}
          />
          <tr className="border-t border-border">
            <th scope="row" className="sticky left-0 z-10 bg-surface p-3" />
            {entries.map((e) => (
              <td key={e.id} className="border-l border-border bg-surface p-4 align-bottom">
                <Link href={e.href} className="btn btn-primary w-full">
                  {e.aggregatedAcrossCourses ? "View courses" : "View full details"}
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function HeaderCell({ entry: e }: { entry: ComparableEntry }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        {e.logo ? (
          <div className={`flex size-12 shrink-0 items-center justify-center rounded-lg p-1.5 ${e.logoBg === "dark" ? "bg-black" : "bg-white"}`}>
            <Image src={e.logo} alt={`${e.name} logo`} width={48} height={48} className="h-auto max-h-8 w-full object-contain" />
          </div>
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-base font-bold text-accent">
            {e.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="font-semibold text-foreground">{e.name}</span>
            {e.affiliateLink && <OurChoiceBadge />}
          </div>
        </div>
      </div>
      {e.tagline && <p className="mt-2 text-xs text-muted">{e.tagline}</p>}
      {e.aggregatedAcrossCourses && (
        <p className="meta mt-2">Aggregated across its {e.aggregatedAcrossCourses} courses.</p>
      )}
    </div>
  );
}

function PricingCell({ entry: e }: { entry: ComparableEntry }) {
  return (
    <div>
      <span className="figure text-accent">{e.pricing[0].price}</span>
      {e.pricing[0].billingNote && <span className="meta block">{e.pricing[0].billingNote}</span>}
    </div>
  );
}

function Row({
  label,
  entries,
  render,
}: {
  label: string;
  entries: ComparableEntry[];
  render: (entry: ComparableEntry) => ReactNode;
}) {
  return (
    <tr className="border-t border-border">
      <th scope="row" className="sticky left-0 z-10 bg-surface p-3 text-left align-top text-xs font-semibold text-foreground sm:p-4 sm:text-sm">
        {label}
      </th>
      {entries.map((e) => (
        <td key={e.id} className="border-l border-border p-3 align-top text-foreground/90 sm:p-4">
          {render(e)}
        </td>
      ))}
    </tr>
  );
}

function YesNo({ yes }: { yes: boolean }) {
  if (!yes) return <Dash />;
  return (
    <span className="inline-flex items-center gap-1 text-success">
      <CheckIcon className="size-4" />
      Yes
    </span>
  );
}

function Dash({ label }: { label?: string }) {
  return <span className="text-subtle">{label ?? "—"}</span>;
}
