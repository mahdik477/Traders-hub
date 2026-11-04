import { CheckIcon } from "@/components/icons";

// The "if you remember nothing else" box — sits near the top of every
// topic, pulled out visually from the prose around it.
export default function KeyTakeaways({ id, items }: { id?: string; items: string[] }) {
  return (
    <div id={id} className="scroll-mt-24 rounded-2xl border border-accent/30 bg-accent/5 p-5 sm:p-6">
      <p className="eyebrow text-accent">Key takeaways</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-base leading-relaxed text-foreground/90">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <CheckIcon className="size-3" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
