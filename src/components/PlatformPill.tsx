import { PLATFORMS } from "@/lib/platforms";

// A platform pill that shows a purple info box on hover/focus with a short
// description and a link to the platform's own site. Pure CSS (no JS) via
// group-hover/group-focus-within, so it works with keyboard focus too.
// Platforms we don't have reference info for just render as a plain pill.
export default function PlatformPill({ name }: { name: string }) {
  const info = PLATFORMS[name];

  if (!info) {
    return <span className="pill">{name}</span>;
  }

  return (
    <span className="group relative inline-block">
      <button type="button" className="pill cursor-help">
        {name}
      </button>
      <span
        role="tooltip"
        className="invisible absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg border border-gold-deep/40 bg-gold-fill p-3 text-xs text-gold-ink opacity-0 shadow-glow transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <span className="block font-semibold">{name}</span>
        <span className="mt-1 block text-gold-ink/80">{info.description}</span>
        <a
          href={info.url}
          target="_blank"
          rel="noopener"
          className="mt-2 inline-block font-semibold underline underline-offset-2"
        >
          Visit {name} website
        </a>
      </span>
    </span>
  );
}
