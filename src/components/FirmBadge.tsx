// Circle with a firm's initials, e.g. "AF" for Alpha Funded, "FT" for FTMO.
export function firmInitials(name: string) {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

export default function FirmBadge({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-2 font-bold tracking-tight text-foreground ${
        size === "lg" ? "size-14 text-lg" : "size-11 text-sm"
      }`}
    >
      {firmInitials(name)}
    </span>
  );
}
