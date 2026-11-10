"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { FirmView } from "@/lib/propfirm-types";
import {
  DRAWDOWN_LABELS,
  EMPTY_ANSWERS,
  answeredCount,
  answersFromQuery,
  answersToQuery,
  matchFirms,
  sizeOptions,
  type MatcherAnswers,
} from "@/lib/propfirm-matcher";
import { countryOptions } from "@/lib/countries";
import { money, sizeLabel } from "@/lib/format-money";
import { planToString } from "@/lib/propfirm-compare";
import FirmBadge from "@/components/FirmBadge";
import VisitSiteLink from "@/components/VisitSiteLink";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

// A five-step question flow. Answers live in the address so a result list
// can be shared or revisited; every step can be skipped. Results are facts
// from each firm's data file — never a ranking, never a performance claim.

const STEPS = ["market", "size", "budget", "drawdown", "country"] as const;
type Step = (typeof STEPS)[number];

const STEP_TITLES: Record<Step, string> = {
  market: "What do you want to trade?",
  size: "What account size are you after?",
  budget: "What's your budget per attempt?",
  drawdown: "Which drawdown rule would you rather have?",
  country: "Where do you live?",
};

const BUDGETS = [100, 200, 300, 500, 1000];

export default function FirmMatcher({ firms }: { firms: FirmView[] }) {
  return (
    <Suspense fallback={<Matcher firms={firms} initial={EMPTY_ANSWERS} />}>
      <MatcherFromAddress firms={firms} />
    </Suspense>
  );
}

function MatcherFromAddress({ firms }: { firms: FirmView[] }) {
  const params = useSearchParams();
  return <Matcher firms={firms} initial={answersFromQuery(params)} />;
}

function Matcher({ firms, initial }: { firms: FirmView[]; initial: MatcherAnswers }) {
  const [answers, setAnswers] = useState<MatcherAnswers>(initial);
  // Jump straight to results when the address already holds answers.
  const [step, setStep] = useState<number>(answeredCount(initial) > 0 ? STEPS.length : 0);
  const [sort, setSort] = useState<"name" | "price">("name");
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    // Country names come from the browser's Intl tables.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCountries(countryOptions());
  }, []);

  const sizes = useMemo(() => sizeOptions(firms, answers.market), [firms, answers.market]);
  const showingResults = step >= STEPS.length;
  const results = useMemo(() => (showingResults ? matchFirms(firms, answers, sort) : []), [firms, answers, sort, showingResults]);

  function update(patch: Partial<MatcherAnswers>) {
    const next = { ...answers, ...patch };
    if (patch.market !== undefined && next.size && !sizeOptions(firms, next.market).includes(Number(next.size))) next.size = "";
    setAnswers(next);
    window.history.replaceState(null, "", window.location.pathname + answersToQuery(next));
  }

  function go(n: number) {
    setStep(Math.max(0, Math.min(STEPS.length, n)));
  }

  function restart() {
    setAnswers(EMPTY_ANSWERS);
    setStep(0);
    window.history.replaceState(null, "", window.location.pathname);
  }

  const current: Step | null = showingResults ? null : STEPS[step];

  return (
    <div className="mt-8">
      {/* Progress */}
      <ol className="flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => {
          const done = i < step || showingResults;
          const active = i === step;
          return (
            <li key={s} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${i + 1}: ${STEP_TITLES[s]}${done ? " (answered)" : ""}`}
                className={`matcher-dot flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                  active
                    ? "border-accent bg-accent text-gold-ink"
                    : done
                      ? "border-accent/60 bg-accent/12 text-accent"
                      : "border-border-strong bg-surface text-muted"
                }`}
              >
                {done && !active ? <CheckIcon className="size-4" /> : i + 1}
              </button>
              <span className={`matcher-bar h-0.5 flex-1 rounded-full ${done ? "bg-accent/60" : "bg-border"}`} aria-hidden="true" />
            </li>
          );
        })}
      </ol>

      {current ? (
        <section key={current} className="matcher-step mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-7" aria-live="polite">
          <p className="eyebrow">
            Question {step + 1} of {STEPS.length}
          </p>
          <h2 className="section-title mt-2 text-2xl">{STEP_TITLES[current]}</h2>

          {current === "market" && (
            <>
              <p className="meta mt-2">Forex firms quote rules as a percentage of the account; futures firms use fixed dollar amounts.</p>
              <Choices
                value={answers.market}
                onChange={(v) => update({ market: v as MatcherAnswers["market"] })}
                options={[
                  ["forex", "Forex & CFDs", "Currency pairs, gold, indices on MT5/cTrader-style platforms"],
                  ["futures", "Futures", "Index and commodity futures on platforms like Tradovate, NinjaTrader, Rithmic"],
                  ["", "Either — show me both", "Don't filter by market"],
                ]}
              />
            </>
          )}

          {current === "size" && (
            <>
              <p className="meta mt-2">Only sizes that at least one listed firm actually offers are shown.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip selected={answers.size === ""} onClick={() => update({ size: "" })}>
                  Any size
                </Chip>
                {sizes.map((s) => (
                  <Chip key={s} selected={answers.size === String(s)} onClick={() => update({ size: String(s) })}>
                    {sizeLabel(s)}
                  </Chip>
                ))}
              </div>
            </>
          )}

          {current === "budget" && (
            <>
              <p className="meta mt-2">
                The most you&apos;d pay for one attempt (for monthly subscriptions, one month). Compared against the
                discounted price where the firm has a promo, in the firm&apos;s own currency.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip selected={answers.budget === ""} onClick={() => update({ budget: "" })}>
                  No limit
                </Chip>
                {BUDGETS.map((b) => (
                  <Chip key={b} selected={answers.budget === String(b)} onClick={() => update({ budget: String(b) })}>
                    Up to {money(b)}
                  </Chip>
                ))}
              </div>
              <label className="mt-4 flex max-w-xs flex-col gap-1">
                <span className="eyebrow">Or type an amount</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className="field"
                  placeholder="e.g. 250"
                  value={answers.budget}
                  onChange={(e) => update({ budget: e.target.value })}
                />
              </label>
            </>
          )}

          {current === "drawdown" && (
            <>
              <p className="meta mt-2">
                Not sure what these mean?{" "}
                <Link href="/funded-accounts/drawdown-explained" className="text-accent underline">
                  See them side by side on a live chart
                </Link>
                .
              </p>
              <Choices
                value={answers.drawdown}
                onChange={(v) => update({ drawdown: v as MatcherAnswers["drawdown"] })}
                options={[
                  ["static", DRAWDOWN_LABELS.static, "The loss limit never moves up — the simplest to track"],
                  ["eod-trailing", DRAWDOWN_LABELS["eod-trailing"], "The limit follows your balance up once a day, at the close"],
                  ["intraday-trailing", DRAWDOWN_LABELS["intraday-trailing"], "The limit follows your highest balance during the day"],
                  ["", "No preference", "Show every type"],
                ]}
              />
            </>
          )}

          {current === "country" && (
            <>
              <p className="meta mt-2">
                We check your country against the restricted-country list each firm publishes. Firms that haven&apos;t
                published one are still shown, with a note. Lists change — always confirm with the firm.
              </p>
              <label className="mt-4 flex max-w-sm flex-col gap-1">
                <span className="eyebrow">Country</span>
                <select className="field" value={answers.country} onChange={(e) => update({ country: e.target.value })}>
                  <option value="">Skip this question</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="btn btn-outline disabled:opacity-40">
              <ChevronLeftIcon className="size-4" />
              Back
            </button>
            <button type="button" onClick={() => go(step + 1)} className="btn btn-primary">
              {step === STEPS.length - 1 ? "Show matching firms" : "Next"}
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        </section>
      ) : (
        <section className="matcher-step mt-6" aria-live="polite">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-title text-2xl">
                {results.length === 0
                  ? "No listed firm fits every answer"
                  : `${results.length} firm${results.length === 1 ? "" : "s"} with a plan that fits`}
              </h2>
              <p className="meta mt-1">
                Listed {sort === "name" ? "alphabetically" : "by price, lowest first"} — this is not a ranking, and we
                don&apos;t verify trading results or payouts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs">
                <span className="eyebrow">Order</span>
                <select className="field min-h-10 py-1 text-xs sm:text-xs" value={sort} onChange={(e) => setSort(e.target.value as "name" | "price")}>
                  <option value="name">A to Z</option>
                  <option value="price">Price, low to high</option>
                </select>
              </label>
              <button type="button" onClick={() => go(0)} className="btn btn-outline min-h-10">
                Change answers
              </button>
              <button type="button" onClick={restart} className="text-sm text-muted underline hover:text-foreground">
                Start over
              </button>
            </div>
          </div>

          <AnswerChips answers={answers} countries={countries} onEdit={(i) => go(i)} />

          {results.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border-strong p-10 text-center">
              <p className="text-muted">Try loosening one answer — budget and account size are usually the tight ones.</p>
              <button type="button" onClick={() => go(0)} className="btn btn-primary mt-4">
                Change answers
              </button>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {results.map((r, i) => (
                <li
                  key={r.firm.id}
                  className="match-card lift-card relative flex flex-col rounded-xl border border-border bg-surface p-5"
                  style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <FirmBadge name={r.firm.name} logo={r.firm.logo} logoBg={r.firm.logoBg} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold">
                        <Link href={`/funded-accounts/${r.firm.id}?market=${r.plan.market.market}`} className="hover:text-accent">
                          {r.firm.name}
                        </Link>
                      </h3>
                      <p className="meta">
                        {r.fittingPlans} plan{r.fittingPlans === 1 ? "" : "s"} fit your answers
                      </p>
                      {r.firm.reviewAlert && (
                        <span className="badge badge-warning mt-2 whitespace-normal">Payout complaints in recent reviews</span>
                      )}
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5 text-sm text-foreground/90">
                    {r.reasons.map((reason) => (
                      <li key={reason} className="flex gap-2">
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-accent" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  {r.firm.reviewAlert && (
                    <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
                      <strong className="font-semibold text-warning">Recent reviews: </strong>
                      {r.firm.reviewAlert.summary} Public reviews we haven&apos;t verified — read them yourself before buying.
                    </p>
                  )}
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/funded-accounts/${r.firm.id}?market=${r.plan.market.market}&challenge=${encodeURIComponent(r.plan.challenge.label)}&size=${r.plan.account.size}`}
                      className="btn btn-primary flex-1"
                    >
                      See this plan
                    </Link>
                    <Link
                      href={`/funded-accounts/compare?p=${encodeURIComponent(planToString(r.plan.key))}`}
                      className="btn btn-outline flex-1"
                    >
                      Add to compare
                    </Link>
                    {r.firm.affiliateLink && (
                      <VisitSiteLink href={r.firm.affiliateLink} firmName={r.firm.name} variant="outline" className="flex-1" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Choices({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string, string][];
}) {
  return (
    <div role="radiogroup" className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {options.map(([v, label, hint]) => {
        const selected = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(v)}
            className={`flex min-h-16 items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
              selected ? "border-accent bg-accent/10" : "border-border-strong bg-background hover:border-accent/50"
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                selected ? "border-accent bg-accent text-gold-ink" : "border-border-strong"
              }`}
            >
              {selected && <CheckIcon className="size-3" />}
            </span>
            <span>
              <span className="block font-semibold text-foreground">{label}</span>
              <span className="block text-xs text-muted">{hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
        selected ? "border-accent bg-accent/12 text-foreground" : "border-border-strong bg-surface text-muted hover:border-subtle hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function AnswerChips({
  answers,
  countries,
  onEdit,
}: {
  answers: MatcherAnswers;
  countries: { code: string; name: string }[];
  onEdit: (step: number) => void;
}) {
  const chips: { step: number; label: string }[] = [];
  chips.push({ step: 0, label: answers.market ? (answers.market === "forex" ? "Forex" : "Futures") : "Any market" });
  chips.push({ step: 1, label: answers.size ? `${sizeLabel(Number(answers.size))} account` : "Any size" });
  chips.push({ step: 2, label: answers.budget ? `Up to ${money(Number(answers.budget))}` : "Any budget" });
  chips.push({ step: 3, label: answers.drawdown ? DRAWDOWN_LABELS[answers.drawdown as keyof typeof DRAWDOWN_LABELS] : "Any drawdown type" });
  chips.push({
    step: 4,
    label: answers.country ? countries.find((c) => c.code === answers.country)?.name ?? answers.country : "Country not set",
  });
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {chips.map((c) => (
        <button
          key={c.step}
          type="button"
          onClick={() => onEdit(c.step)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border-strong bg-surface-2 px-3 text-xs font-medium text-foreground transition-colors hover:border-accent"
        >
          {c.label}
          <span className="sr-only"> (change)</span>
        </button>
      ))}
    </div>
  );
}
