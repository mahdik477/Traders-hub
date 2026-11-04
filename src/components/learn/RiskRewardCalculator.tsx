"use client";

import { useId, useMemo, useState } from "react";
import { CalculatorIcon } from "@/components/icons";

// A real, live risk:reward + position-size calculator — type in three
// prices and an account size, see the ratio and the suggested position
// size update instantly. Pure arithmetic, nothing sent anywhere, no
// account needed. Deliberately doesn't suggest a "good" ratio — just does
// the maths honestly and lets the trader judge it.
export default function RiskRewardCalculator() {
  const [entry, setEntry] = useState("100");
  const [stop, setStop] = useState("98");
  const [target, setTarget] = useState("106");
  const [accountSize, setAccountSize] = useState("10000");
  const [riskPercent, setRiskPercent] = useState("1");
  const idBase = useId();

  const result = useMemo(() => {
    const e = parseFloat(entry);
    const s = parseFloat(stop);
    const t = parseFloat(target);
    const acct = parseFloat(accountSize);
    const riskPct = parseFloat(riskPercent);
    if ([e, s, t, acct, riskPct].some((n) => Number.isNaN(n)) || e === s) return null;

    const riskPerUnit = Math.abs(e - s);
    const rewardPerUnit = Math.abs(t - e);
    const ratio = rewardPerUnit / riskPerUnit;
    const dollarRisk = (acct * riskPct) / 100;
    const positionSize = dollarRisk / riskPerUnit;

    return { riskPerUnit, rewardPerUnit, ratio, dollarRisk, positionSize };
  }, [entry, stop, target, accountSize, riskPercent]);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex items-center gap-2.5 border-b border-border bg-surface-2 px-5 py-3.5">
        <CalculatorIcon className="size-5 text-accent" />
        <p className="text-lg font-bold text-foreground">Risk : reward calculator</p>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <div className="space-y-4">
          <Field id={`${idBase}-entry`} label="Entry price" value={entry} onChange={setEntry} />
          <Field id={`${idBase}-stop`} label="Stop-loss price" value={stop} onChange={setStop} />
          <Field id={`${idBase}-target`} label="Take-profit price" value={target} onChange={setTarget} />
          <div className="grid grid-cols-2 gap-3">
            <Field id={`${idBase}-account`} label="Account size ($)" value={accountSize} onChange={setAccountSize} />
            <Field id={`${idBase}-risk`} label="Risk per trade (%)" value={riskPercent} onChange={setRiskPercent} />
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-xl border border-border bg-background p-5">
          {result ? (
            <>
              <div className="eyebrow">Risk : reward ratio</div>
              <div className="figure-lg mt-1 text-4xl text-accent">
                1 : {result.ratio.toFixed(2)}
              </div>
              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <Row label="Risking per unit" value={result.riskPerUnit.toFixed(2)} />
                <Row label="Potential reward per unit" value={result.rewardPerUnit.toFixed(2)} />
                <Row label={`${riskPercent || 0}% of account`} value={`$${result.dollarRisk.toFixed(2)}`} />
                <Row label="Suggested position size" value={`${result.positionSize.toFixed(2)} units`} />
              </dl>
            </>
          ) : (
            <p className="text-muted">Enter an entry, stop and target that aren&apos;t equal to see the numbers.</p>
          )}
        </div>
      </div>
      <p className="meta border-t border-border px-5 py-3.5 sm:px-6">
        Position size here means &ldquo;entry minus stop, multiplied by this many units, equals
        your dollar risk&rdquo; — it ignores pip value, lot size and contract specs, which differ
        by market.
        It&apos;s the maths, not a recommendation.
      </p>
    </div>
  );
}

function Field({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field mt-1.5"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="figure text-foreground">{value}</dd>
    </div>
  );
}
