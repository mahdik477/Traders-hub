// Reads the two public Supabase settings. NEXT_PUBLIC_ variables are baked
// in at build time, so this works the same in the browser and on the
// server. When either is missing, isSupabaseConfigured() is false and every
// account feature on the site hides itself — the site must work exactly as
// before accounts existed. Browser-safe.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\b/i.test(SUPABASE_URL) && SUPABASE_KEY.length > 20;
}

/** Only ever send people back to a path on this site after sign-in. */
export function safeNextPath(next: string | null | undefined, fallback = "/my-hub"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\") || /^\/auth\b/.test(next)) return fallback;
  // Browsers silently drop tabs/newlines from addresses, so "/<tab>/evil.com"
  // would become "//evil.com". Reject control characters outright, then make
  // sure the address still resolves to this site.
  if (/[\u0000-\u001F\u007F]/.test(next)) return fallback;
  try {
    if (new URL(next, "https://x.invalid").origin !== "https://x.invalid") return fallback;
  } catch {
    return fallback;
  }
  return next;
}
