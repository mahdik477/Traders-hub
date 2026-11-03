import Image from "next/image";

const SIZES = {
  sm: { box: "size-8 text-[11px]", img: 32 },
  md: { box: "size-10 text-xs", img: 40 },
  lg: { box: "size-14 text-base sm:size-16", img: 64 },
} as const;

function initials(name: string): string {
  const words = name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? "SG").slice(0, 2).toUpperCase();
}

export default function SignalGroupLogo({
  name,
  logo,
  size = "sm",
}: {
  name: string;
  logo: string | null;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  if (!logo) {
    return (
      <div
        className={`flex ${s.box} shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 font-medium tracking-wide text-muted`}
        aria-hidden="true"
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <div
      className={`flex ${s.box} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-1`}
    >
      <Image
        src={logo}
        alt=""
        width={s.img}
        height={s.img}
        className="h-auto max-h-full w-auto max-w-full object-contain"
      />
    </div>
  );
}
