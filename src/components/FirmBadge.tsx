import Image from "next/image";

// Circle with a firm's initials, e.g. "AF" for Alpha Funded, "FT" for FTMO —
// used as a fallback when a firm has no logo yet.
export function firmInitials(name: string) {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

export default function FirmBadge({
  name,
  logo = null,
  logoBg = "white",
  size = "md",
}: {
  name: string;
  logo?: string | null;
  logoBg?: "white" | "dark";
  size?: "md" | "lg";
}) {
  const dimensions = size === "lg" ? "size-14" : "size-11";

  if (logo) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full border border-border-strong p-2 ${dimensions} ${
          logoBg === "dark" ? "bg-black" : "bg-white"
        }`}
      >
        <Image
          src={logo}
          alt={`${name} logo`}
          width={56}
          height={56}
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-2 font-bold tracking-tight text-foreground ${dimensions} ${
        size === "lg" ? "text-lg" : "text-sm"
      }`}
    >
      {firmInitials(name)}
    </span>
  );
}
