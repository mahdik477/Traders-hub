import {
  accountLine,
  depositLine,
  platformLine,
  regulatorLine,
  spreadLine,
} from "@/lib/broker-facts";
import { leverageLabel } from "@/lib/broker-filters";
import { type BrokerView } from "@/lib/broker-types";

export default function BrokerCompare({ brokers }: { brokers: BrokerView[] }) {
  const rows: { label: string; values: string[] }[] = [
    { label: "Min. deposit", values: brokers.map(depositLine) },
    { label: "Leverage", values: brokers.map(leverageLabel) },
    { label: "Regulation", values: brokers.map(regulatorLine) },
    { label: "Platforms", values: brokers.map((broker) => platformLine(broker, 4)) },
    { label: "Accounts", values: brokers.map(accountLine) },
    { label: "Published spread", values: brokers.map(spreadLine) },
  ];

  return (
    <section aria-labelledby="broker-compare-heading">
      <h2 id="broker-compare-heading" className="broker-heading text-xl font-semibold tracking-tight">
        Side by side
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        Side by side from each listing. This is not a ranking.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <caption className="sr-only">{brokers.map((broker) => broker.name).join(" and ")} compared from their listings</caption>
          <thead>
            <tr className="border-b border-border">
                <th scope="col" className="sticky left-0 z-10 bg-background py-4 pr-4 font-medium text-subtle">
                <span className="sr-only">Field</span>
              </th>
              {brokers.map((broker) => (
                <th key={broker.id} scope="col" className="broker-heading min-w-52 py-4 pr-6 text-base font-semibold text-foreground">
                  {broker.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border">
                <th scope="row" className="sticky left-0 z-10 bg-background py-4 pr-4 align-top text-[13px] font-medium text-subtle">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td key={`${row.label}-${brokers[index]?.id ?? index}`} className="py-4 pr-6 align-top leading-6 text-foreground">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 max-w-xl text-[13px] leading-5 text-subtle">
        Treat every figure here as a starting point and confirm it on the broker&apos;s own site. A published
        spread belongs to the account named beside it, not to every account.
      </p>
    </section>
  );
}
