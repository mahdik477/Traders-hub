"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import type { FirmView } from "@/lib/propfirm-types";
import { defaultPlanFor, resolvePlan, type PlanKey } from "@/lib/propfirm-compare";
import { money, sizeLabel } from "@/lib/format-money";
import { MARKET_LABELS } from "@/components/PropFirmPricing";
import FirmBadge from "@/components/FirmBadge";
import Picker from "@/components/Picker";

// Adds up what a funded-account challenge can actually cost before any
// trading happens: the challenge fee (times attempts, or times months for a
// subscription), resets, an activation fee and any monthly extras. The
// challenge fee comes from the firm's data; the rest are typed in, because
// firms publish activation and reset fees in prose we don't structure yet.
//
// Costs only. Nothing here estimates profit, payouts or how likely anyone
// is to pass — see CLAUDE.md.

type Inputs = {
  attempts: string;
  months: string;
  resets: string;
  resetFee: string;
  activationFee: string;
  monthlyExtras: string;
  feeOverride: string;
};

const DEFAULT_INPUTS: Inputs = {
  attempts: "1",
  months: "2",
  resets: "0",
  resetFee: "",
  activationFee: "",
  monthlyExtras: "",
  feeOverride: "",
};

export default function ChallengeCostCalculator({ firms }: { firms: FirmView[] }) {
  return (
    <Suspense fallback={<Calculator firms={firms} initialFirm={null} />}>
      <CalculatorFromAddress firms={firms} />
    </Suspense>
  );
}

function CalculatorFromAddress({ firms }: { firms: FirmView[] }) {
  const params = useSearchParams();
  return <Calculator firms={firms} initialFirm={params.get("firm")} />;
}

function num(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function Calculator({ firms, initialFirm }: { firms: FirmView[]; initialFirm: string | null }) {
  const [key, setKey] = useState<PlanKey | null>(() => {
    const firm = firms.find((f) => f.id === initialFirm) ?? firms[0];
    return firm ? defaultPlanFor(firm) : null;
  });
  const [inputs, setInputs] = useState<Inputs>(() => {
    const first = key ? resolvePlan(key, firms) : null;
    return { ...DEFAULT_INPUTS, feeOverride: first?.account.lowestPrice != null ? String(first.account.lowestPrice) : "" };
  });

  const plan = useMemo(() => (key ? resolvePlan(key, firms) : null), [key, firms]);

  function change(patch: Partial<PlanKey>) {
    if (!key) return;
    const merged = { ...key, ...patch };
    const firm = firms.find((f) => f.id === merged.firm);
    const fixed = firm ? defaultPlanFor(firm, merged) : null;
    if (!fixed) return;
    setKey(fixed);
    // A new plan means the typed-in fee no longer applies: refill the box
    // with that plan's price. The box then owns the value until the next
    // plan change, so it can be cleared and retyped freely.
    const next = resolvePlan(fixed, firms);
    setInputs((i) => ({ ...i, feeOverride: next?.account.lowestPrice != null ? String(next.account.lowestPrice) : "" }));
  }

  function set(field: keyof Inputs, value: string) {
    setInputs((i) => ({ ...i, [field]: value }));
  }

  if (!plan) return null;

  const cur = plan.firm.currency;
  const monthly = plan.tier.billing === "monthly";
  const fee = num(inputs.feeOverride);
  const attempts = Math.max(1, Math.round(num(inputs.attempts)));
  const months = Math.max(1, Math.round(num(inputs.months)));
  const challengeTotal = monthly ? fee * months : fee * attempts;
  const resetsTotal = num(inputs.resets) * num(inputs.resetFee);
  const activation = num(inputs.activationFee);
  const extras = num(inputs.monthlyExtras) * months;
  const total = challengeTotal + resetsTotal + activation + extras;

  const parts = [
    { label: monthly ? `Subscription · ${months} month${months === 1 ? "" : "s"}` : `Challenge fee · ${attempts} attempt${attempts === 1 ? "" : "s"}`, value: challengeTotal, tone: "bg-accent" },
    { label: "Resets", value: resetsTotal, tone: "bg-warning" },
    { label: "Activation fee", value: activation, tone: "bg-success" },
    { label: "Monthly extras", value: extras, tone: "bg-subtle" },
  ].filter((p) => p.value > 0);

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Left: pick a plan, type the extras */}
      <div className="space-y-5">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="section-title">1. Pick a plan</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Picker
              label="Firm"
              value={plan.firm.id}
              onChange={(v) => change({ firm: v, market: undefined, challenge: undefined, tier: undefined, size: null })}
              options={firms.map((f) => ({ value: f.id, label: f.name, badge: { logo: f.logo, logoBg: f.logoBg } }))}
            />
            {plan.firm.markets.length > 1 && (
              <Picker
                label="Market"
                value={plan.market.market}
                onChange={(v) => change({ market: v, challenge: undefined, tier: undefined, size: null })}
                options={plan.firm.markets.map((m) => ({ value: m.market, label: MARKET_LABELS[m.market] }))}
              />
            )}
            <Picker
              label="Plan"
              value={plan.challenge.key}
              onChange={(v) => change({ challenge: v, tier: undefined, size: null })}
              options={plan.market.challenges.map((c) => ({ value: c.key, label: c.label }))}
            />
            {plan.challenge.tiers.length > 1 && (
              <Picker
                label="Tier"
                value={plan.tier.name}
                onChange={(v) => change({ tier: v, size: null })}
                options={plan.challenge.tiers.map((t) => ({ value: t.name, label: t.name }))}
              />
            )}
            <Picker
              label="Account size"
              value={String(plan.account.size)}
              onChange={(v) => change({ size: Number(v) })}
              options={plan.tier.accounts.map((a) => ({ value: String(a.size), label: sizeLabel(a.size, cur) }))}
            />
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-background p-3">
            <FirmBadge name={plan.firm.name} logo={plan.firm.logo} logoBg={plan.firm.logoBg} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {plan.firm.name} · {plan.challenge.label}
                {plan.challenge.tiers.length > 1 && ` · ${plan.tier.name}`} · {sizeLabel(plan.account.size, cur)}
              </p>
              <p className="meta">
                {plan.account.lowestPrice == null
                  ? "Price not confirmed from the firm's page — type it below."
                  : `${money(plan.account.lowestPrice, cur)}${monthly ? "/month" : ""} on the firm's page${
                      plan.account.promoPrice != null ? ` (discounted from ${money(plan.account.standardPrice!, cur)})` : ""
                    }${plan.firm.lastVerified ? `, checked ${plan.firm.lastVerified}` : ""}.`}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="section-title">2. Add what the firm&apos;s page doesn&apos;t list as a headline price</h2>
          <p className="meta mt-1">
            Activation and reset fees live in each firm&apos;s FAQ or checkout, not its price table, so we don&apos;t
            prefill them. Check the firm&apos;s site and type what you find; leave anything that doesn&apos;t apply blank.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={monthly ? "Monthly fee (edit if different)" : "Challenge fee (edit if different)"} hint={cur}>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                className="field"
                value={inputs.feeOverride}
                placeholder="0"
                onChange={(e) => set("feeOverride", e.target.value)}
              />
            </Field>
            {monthly ? (
              <Field label="Months until you pass or stop" hint="Subscriptions rebill until then">
                <input type="number" inputMode="numeric" min={1} className="field" value={inputs.months} onChange={(e) => set("months", e.target.value)} />
              </Field>
            ) : (
              <Field label="Attempts (full re-buys)" hint="Each new attempt pays the fee again">
                <input type="number" inputMode="numeric" min={1} className="field" value={inputs.attempts} onChange={(e) => set("attempts", e.target.value)} />
              </Field>
            )}
            <Field label="Resets" hint="Number of paid resets">
              <input type="number" inputMode="numeric" min={0} className="field" value={inputs.resets} onChange={(e) => set("resets", e.target.value)} />
            </Field>
            <Field label="Reset fee" hint={`${cur} each`}>
              <input type="number" inputMode="decimal" min={0} className="field" placeholder="0" value={inputs.resetFee} onChange={(e) => set("resetFee", e.target.value)} />
            </Field>
            <Field label="Activation fee" hint="One-time, after passing (some firms)">
              <input type="number" inputMode="decimal" min={0} className="field" placeholder="0" value={inputs.activationFee} onChange={(e) => set("activationFee", e.target.value)} />
            </Field>
            <Field label="Monthly extras" hint={`Data feeds, platform · ${cur}/month`}>
              <input type="number" inputMode="decimal" min={0} className="field" placeholder="0" value={inputs.monthlyExtras} onChange={(e) => set("monthlyExtras", e.target.value)} />
            </Field>
            {!monthly && (
              <Field label="Months of extras" hint="How long you'd pay them">
                <input type="number" inputMode="numeric" min={1} className="field" value={inputs.months} onChange={(e) => set("months", e.target.value)} />
              </Field>
            )}
          </div>
        </section>
      </div>

      {/* Right: the total */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="terminal-panel rounded-2xl border border-border-strong bg-surface p-5 shadow-glow sm:p-6" aria-live="polite">
          <p className="eyebrow">Total cost before any trading</p>
          <p className="figure-lg cost-total mt-2 font-mono text-4xl text-accent sm:text-5xl">{money(total, cur)}</p>
          <p className="meta mt-1">
            {sizeLabel(plan.account.size, cur)} {MARKET_LABELS[plan.market.market].toLowerCase()} account · {plan.firm.name}
          </p>

          {total > 0 && (
            <>
              <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                {parts.map((p) => (
                  <span
                    key={p.label}
                    className={`cost-bar h-full ${p.tone}`}
                    style={{ width: `${(p.value / total) * 100}%` }}
                    title={`${p.label}: ${money(p.value, cur)}`}
                  />
                ))}
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                {parts.map((p) => (
                  <div key={p.label} className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-muted">
                      <span className={`inline-block size-2.5 rounded-full ${p.tone}`} aria-hidden="true" />
                      {p.label}
                    </dt>
                    <dd className="font-mono font-semibold tabular-nums">{money(p.value, cur)}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          <div className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-subtle">
            <p>
              This adds up fees only. It says nothing about whether you&apos;d pass, get funded or be paid — we
              don&apos;t estimate any of that. Fees change; confirm every number on the firm&apos;s own site.
            </p>
            <p className="mt-2">
              <Link href={`/funded-accounts/${plan.firm.id}?market=${plan.market.market}`} className="text-accent underline">
                See {plan.firm.name}&apos;s full rules
              </Link>
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      {children}
      {hint && <span className="text-xs text-subtle">{hint}</span>}
    </label>
  );
}
