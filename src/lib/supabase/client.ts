"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

// One browser client for the whole visit. Null when Supabase isn't set up,
// so callers write `getSupabaseBrowser()?.from(...)` and simply do nothing
// without an account backend. Sessions live in cookies (the @supabase/ssr
// default) so the /auth/callback route can finish a sign-in.

let client: SupabaseClient | null | undefined;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (typeof window === "undefined" || !isSupabaseConfigured()) {
    client = null;
    return client;
  }
  client = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
