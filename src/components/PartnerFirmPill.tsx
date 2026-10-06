import Link from "next/link";
import { getPropFirm } from "@/lib/propfirms";

// A partner prop firm pill. When we actually have that firm listed
// ourselves, hovering (or tapping/focusing) shows a purple popover with a
// link straight to our own page for it. Firms we don't list just render as
// a plain pill — including ones that only sound similar to a firm we list
// (see provider-types.ts's PartnerFirm for why that distinction matters).
export default function PartnerFirmPill({
  name,
  internalId,
}: {
  name: string;
  internalId: string | null;
}) {
  const firm = internalId ? getPropFirm(internalId) : undefined;

  if (!firm) {
    return <span className="pill">{name}</span>;
  }

  return (
    <span className="group relative inline-block">
      <button type="button" className="pill cursor-help">
        {name}
      </button>
      <span
        role="tooltip"
        className="invisible absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 rounded-lg border border-gold-deep/40 bg-gold-fill p-3 text-xs text-gold-ink opacity-0 shadow-glow transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <span className="block font-semibold">{firm.name}</span>
        <span className="mt-1 block text-gold-ink/80">
          We have {firm.name} listed with full pricing and rules.
        </span>
        <Link
          href={`/funded-accounts/${firm.id}`}
          className="mt-2 inline-block font-semibold underline underline-offset-2"
        >
          View {firm.name} on Tradox
        </Link>
      </span>
    </span>
  );
}
