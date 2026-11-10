import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

// Server-side client for Route Handlers only (the sign-in callback). Pages
// on this site are static and never read the session on the server — all
// account data is fetched in the browser — so this is deliberately not used
// in layouts or pages, and there's no session-refresh proxy.

export async function createSupabaseServer() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
      },
    },
  });
}
