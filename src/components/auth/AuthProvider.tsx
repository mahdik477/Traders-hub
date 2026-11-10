"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import AgeConfirmModal from "@/components/auth/AgeConfirmModal";

// The one place the site learns who's signed in. Wraps the whole app (see
// layout.tsx) but does nothing at all when Supabase isn't configured —
// status stays "disabled" and every account UI hides itself.
//
// We keep the minimum about a person: their Supabase user id and email.
// Google's display name and photo are available in the auth response but
// are never copied into our tables or shown anywhere.

export type AuthUser = { id: string; email: string | null };

export type AuthStatus = "disabled" | "loading" | "signed-out" | "signed-in";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  /** The client, for the sync helpers. Null unless configured. */
  supabase: SupabaseClient | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  status: "disabled",
  user: null,
  supabase: null,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function toAuthUser(u: User | null | undefined): AuthUser | null {
  return u ? { id: u.id, email: u.email ?? null } : null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [status, setStatus] = useState<AuthStatus>("disabled");
  const [user, setUser] = useState<AuthUser | null>(null);
  // null = not checked yet, false = profile says confirmed, true = ask.
  const [needsAge, setNeedsAge] = useState<boolean | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!client) return; // stays "disabled"
    // Browser-only setup — the client can't exist during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupabase(client);
    setStatus("loading");

    let cancelled = false;
    client.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUser(toAuthUser(data.session?.user));
      setStatus(data.session ? "signed-in" : "signed-out");
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user));
      setStatus(session ? "signed-in" : "signed-out");
      if (!session) setNeedsAge(null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // First sign-in: has this person confirmed they're 18 or over?
  useEffect(() => {
    if (!supabase || status !== "signed-in" || !user || needsAge !== null) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("age_confirmed_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        // A read error (e.g. the table isn't created yet) shouldn't lock
        // someone out of the site — ask the question rather than guess.
        setNeedsAge(error ? true : !data?.age_confirmed_at);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, status, user, needsAge]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setNeedsAge(null);
  }, [supabase]);

  const confirmAge = useCallback(async () => {
    if (!supabase || !user) return;
    const { error } = await supabase.from("profiles").upsert(
      { user_id: user.id, email: user.email, age_confirmed_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    setNeedsAge(false);
  }, [supabase, user]);

  const value = useMemo<AuthContextValue>(() => ({ status, user, supabase, signOut }), [status, user, supabase, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {status === "signed-in" && needsAge === true && <AgeConfirmModal onConfirm={confirmAge} onDecline={signOut} />}
    </AuthContext.Provider>
  );
}
