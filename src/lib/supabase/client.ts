"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

// One browser client for the whole visit, loaded on demand. The Supabase
// library is ~70 KB of JavaScript, so it is imported dynamically: when
// accounts are switched off nothing is downloaded at all, and when they're
// on the download happens after the page is interactive instead of before.
// Resolves to null when Supabase isn't configured, so callers write
// `(await loadSupabaseBrowser())?.from(...)` and do nothing otherwise.

let pending: Promise<SupabaseClient | null> | null = null;

export function loadSupabaseBrowser(): Promise<SupabaseClient | null> {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return Promise.resolve(null);
  if (!pending) {
    pending = import("@supabase/ssr")
      .then(({ createBrowserClient }) => createBrowserClient(SUPABASE_URL, SUPABASE_KEY))
      .catch((err) => {
        pending = null;
        console.warn("[supabase] client failed to load", err);
        return null;
      });
  }
  return pending;
}
