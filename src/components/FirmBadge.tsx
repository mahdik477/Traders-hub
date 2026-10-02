import Image from "next/image";

// A firm's logo in a white tile (same style as course logos), or a circle with
// its initials — e.g. "AF" for Alpha Funded — when we don't have a logo.
export function firmInitials(name: string) {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

export default function FirmBadge({
  name,
  logo = null,
  size = "md",
}: {
  name: string;
  logo?: string | null;
  size?: "md" | "lg";
}) {
  if (logo) {
    const px = size === "lg" ? 56 : 44;
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white ${
          size === "lg" ? "size-14 p-1.5" : "size-11 p-1"
        }`}
      >
        {/* Decorative: the firm's name is always shown right next to it. */}
        <Image src={logo} alt="" width={px} height={px} className="size-full rounded object-contain" />
      </span>
    );
  }

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
