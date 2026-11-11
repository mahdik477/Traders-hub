import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "./sections";

// Shared pieces for the generated share images (/api/og/...). One visual
// language for every firm, course and strategy page: black card, champagne
// gold rule, the listing's logo (or initials), a title, a factual subtitle
// and the site wordmark. Default system font (bundled with next/og) — no
// font files to ship. Server-only: reads logos from /public.

export const OG_SIZE = { width: 1200, height: 630 };

const GOLD = "#e8c56a";
const GOLD_DEEP = "#b8860b";
const INK = "#f6f3ec";
const MUTED = "#cfc6b8";
const BG = "#070708";
const SURFACE = "#101012";
const BORDER = "#2a261f";

/** A /public image as a data: URL, or null for formats satori can't draw
 *  (svg/webp) or a missing file — the card then shows initials instead. */
export function logoDataUrl(publicPath: string | null): string | null {
  if (!publicPath || !publicPath.startsWith("/")) return null;
  const ext = path.extname(publicPath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : null;
  if (!mime) return null;
  try {
    const buf = readFileSync(path.join(process.cwd(), "public", publicPath));
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

export type OgCardProps = {
  eyebrow: string;
  title: string;
  subtitle: string | null;
  /** Up to 3 short facts shown as pills. */
  facts: string[];
  logo: string | null;
  logoBg?: "white" | "dark";
  name: string;
  footer?: string;
};

export function ogCard(p: OgCardProps) {
  const title = p.title.length > 48 ? `${p.title.slice(0, 46)}…` : p.title;
  const subtitle = p.subtitle && p.subtitle.length > 120 ? `${p.subtitle.slice(0, 118)}…` : p.subtitle;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          color: INK,
          padding: 64,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* soft gold glow top-right */}
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -160,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(232,197,106,0.22) 0%, rgba(232,197,106,0) 70%)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: 24,
              background: p.logo ? (p.logoBg === "dark" ? "#000" : "#fff") : SURFACE,
              border: `2px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 14,
              fontSize: 48,
              fontWeight: 700,
              color: GOLD,
            }}
          >
            {p.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo} alt="" width={100} height={100} style={{ objectFit: "contain", width: 100, height: 100 }} />
            ) : (
              initials(p.name)
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: GOLD, fontWeight: 600 }}>{p.eyebrow}</div>
            <div style={{ fontSize: title.length > 28 ? 56 : 68, fontWeight: 700, lineHeight: 1.05, marginTop: 8, letterSpacing: -1.5 }}>{title}</div>
          </div>
        </div>

        <div style={{ width: 160, height: 4, borderRadius: 999, background: `linear-gradient(90deg, ${GOLD_DEEP}, ${GOLD})`, marginTop: 36 }} />

        {subtitle && <div style={{ fontSize: 30, color: MUTED, marginTop: 28, lineHeight: 1.35, maxWidth: 1000 }}>{subtitle}</div>}

        {p.facts.length > 0 && (
          <div style={{ display: "flex", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
            {p.facts.slice(0, 3).map((f) => (
              <div
                key={f}
                style={{
                  fontSize: 24,
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: `2px solid ${BORDER}`,
                  background: SURFACE,
                  color: INK,
                }}
              >
                {f}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: GOLD }} />
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, textTransform: "uppercase", color: GOLD }}>{SITE_NAME}</div>
          </div>
          <div style={{ fontSize: 22, color: MUTED }}>{p.footer ?? "Discovery, not verification · no performance scores"}</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
