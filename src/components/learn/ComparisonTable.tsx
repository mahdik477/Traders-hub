// A side-by-side comparison — a real <table> on wider screens, stacked
// cards on a phone (a table this wide just doesn't work at 375px).
export default function ComparisonTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: { label: string; values: string[] }[];
}) {
  return (
    <>
      {/* Desktop/tablet: real table */}
      <div className="hidden overflow-hidden rounded-xl border border-border sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2">
              <th className="p-3 text-left font-semibold text-muted">&nbsp;</th>
              {columns.map((c) => (
                <th key={c} className="p-3 text-left font-bold text-foreground">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? "bg-surface" : "bg-surface-2/40"}>
                <th scope="row" className="p-3 text-left font-semibold text-foreground">
                  {row.label}
                </th>
                {row.values.map((v, j) => (
                  <td key={j} className="p-3 text-muted">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone: one card per column */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {columns.map((col, colIndex) => (
          <div key={col} className="rounded-xl border border-border bg-surface p-4">
            <h3 className="font-bold text-foreground">{col}</h3>
            <dl className="mt-2 space-y-1.5">
              {rows.map((row) => (
                <div key={row.label} className="flex justify-between gap-3 text-sm">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="text-right font-medium text-foreground">{row.values[colIndex]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
