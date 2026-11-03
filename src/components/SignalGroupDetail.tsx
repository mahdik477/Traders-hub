import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import SignalGroupBackLink from "@/components/SignalGroupBackLink";
import SignalGroupLogo from "@/components/SignalGroupLogo";
import SignalGroupRiskDisclaimer from "@/components/SignalGroupRiskDisclaimer";
import { signalGroupSummary } from "@/lib/signal-group-summary";
import {
  formatSignalDate,
  SIGNAL_EXTRA_LABELS,
  SIGNAL_MARKET_LABELS,
  SIGNAL_MARKET_ORDER,
  SIGNAL_STYLE_LABELS,
  type SignalGroupView,
  type SignalMarket,
} from "@/lib/signal-group-types";

const TAG_LABEL: Record<SignalMarket, string> = {
  gold: "Gold",
  "forex-majors": "Majors",
  "forex-minors": "Minors",
  indices: "Indices",
  crypto: "Crypto",
  oil: "Oil",
  "stocks-options": "Stocks",
};

export default function SignalGroupDetail({ group }: { group: SignalGroupView }) {
  const summary = signalGroupSummary(group);
  const markets = SIGNAL_MARKET_ORDER.filter((id) => group.markets.includes(id));
  const checked = formatSignalDate(group.checkedOn);
  const membersAsOf = formatSignalDate(group.memberCountAsOf);
  const styles = group.styles.map((id) => SIGNAL_STYLE_LABELS[id]);
  const extras = group.extras.map((id) => SIGNAL_EXTRA_LABELS[id]);

  return (
    <>
      <SignalGroupBackLink />

      <header className="mt-4 rounded-lg border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <SignalGroupLogo name={group.name} logo={group.logo} size="lg" />
            <div className="min-w-0">
              <h1 className="break-words text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem] sm:leading-10">
                {group.name}
              </h1>
              <p className="mt-1 text-sm text-muted">Telegram signal group</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                This is the group&apos;s own name. It is not a result we checked.
              </p>
              {markets.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1">
                  {markets.map((id) => (
                    <li key={id}>
                      <span
                        title={SIGNAL_MARKET_LABELS[id]}
                        className="inline-flex items-center rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium leading-4 text-muted"
                      >
                        {TAG_LABEL[id]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <JoinButton group={group} />
        </div>
      </header>

      <section aria-labelledby="signal-about-heading" className="mt-6 max-w-3xl">
        <h2 id="signal-about-heading" className="text-base font-semibold tracking-tight text-foreground">
          About
        </h2>
        <p className="mt-2 break-words text-sm leading-6 text-muted sm:text-[0.9375rem]">{summary.text}</p>
        {summary.generated && (
          <p className="meta mt-3">
            No description was recorded for this group. This summary uses only the fields on the listing. It is
            not a review of calls or results.
          </p>
        )}
      </section>

      <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
        <Fact label="Category">
          {markets.length > 0 ? markets.map((id) => SIGNAL_MARKET_LABELS[id]).join(", ") : <NotStated />}
        </Fact>
        <Fact label="Platform">Telegram</Fact>
        <Fact label="Members">
          {group.memberCount ? (
            <>
              <span className="font-medium tabular-nums">{group.memberCount}</span>
              <span className="mt-0.5 block text-xs font-normal leading-5 text-muted">
                {membersAsOf ? `Approximate count as of ${membersAsOf}. ` : "Approximate count. "}
                Not a ranking.
              </span>
            </>
          ) : (
            <NotStated />
          )}
        </Fact>
        <Fact label="Price">{group.priceLabel || <NotStated />}</Fact>
        <Fact label="Trading style">{styles.length > 0 ? styles.join(", ") : <NotStated />}</Fact>
        <Fact label="Language">{group.language || <NotStated />}</Fact>
        <Fact label="Posting rate">{group.signalsPerDay || <NotStated />}</Fact>
        <Fact label="Also listed">{extras.length > 0 ? extras.join(", ") : <NotStated />}</Fact>
      </dl>

      <p className="meta mt-4 max-w-3xl">
        A price, trading style or posting rate is shown only when a source stated it. Member counts are snapshots
        from the day they were checked.
        {checked && group.checkedOn ? (
          <>
            {" "}
            Listing checked <time dateTime={group.checkedOn}>{checked}</time>.
          </>
        ) : null}
      </p>

      <SignalGroupRiskDisclaimer className="mt-8" />
    </>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3">
      <dt className="text-[11px] font-medium leading-4 text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm leading-6 text-foreground">{children}</dd>
    </div>
  );
}

function NotStated() {
  return (
    <span className="text-subtle">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not stated</span>
    </span>
  );
}

function JoinButton({ group }: { group: SignalGroupView }) {
  if (!group.telegramUrl) {
    return <p className="text-sm text-muted">No Telegram link is listed.</p>;
  }
  return (
    <a
      href={group.telegramUrl}
      target="_blank"
      rel="noopener sponsored"
      aria-label={`Join ${group.name} on Telegram (opens in a new tab)`}
      className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gold-fill px-4 text-sm font-semibold text-gold-ink transition-colors duration-150 hover:bg-[var(--color-gold-fill-hover)] active:brightness-95 sm:w-auto"
    >
      Join
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}
