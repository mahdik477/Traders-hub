"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { loadSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import AgeConfirmModal from "@/components/auth/AgeConfirmModal";
import AccountSync from "@/components/auth/AccountSync";

// The one place the site learns who's signed in. Wraps the whole app (see
// layout.tsx) but does nothing at all when Supabase isn't configured —
// status stays "disabled" and every account UI hides itself.
//
// We keep the minimum about a person: their Supabase user id and email.
// Google's display name and photo are available in the auth response but
// are never copied into our tables or shown anywhere.

export type AuthUser = {
  id: string;
  email: string | null;
  /** When the account was created (ISO), for "Member since". */
  createdAt: string | null;
  /** How they first signed up: "google" or "email" (link or password). */
  provider: "google" | "email";
  /** True once they've chosen a password (set by /welcome/password or My Hub). */
  hasPassword: boolean;
};

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
  if (!u) return null;
  const provider = u.app_metadata?.provider === "google" ? "google" : "email";
  return {
    id: u.id,
    email: u.email ?? null,
    createdAt: u.created_at ?? null,
    provider,
    hasPassword: u.user_metadata?.has_password === true,
  };
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [status, setStatus] = useState<AuthStatus>("disabled");
  const [user, setUser] = useState<AuthUser | null>(null);
  // null = not checked yet, false = profile says confirmed, true = ask.
  const [needsAge, setNeedsAge] = useState<boolean | null>(null);

  useEffect(() => {
    // Nothing configured → stay "disabled" and never download the Supabase
    // library. Otherwise load it after the page is interactive.
    if (!isSupabaseConfigured()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");

    let cancelled = false;
    let subscription: { unsubscribe(): void } | null = null;
    loadSupabaseBrowser().then((client) => {
      if (cancelled) return;
      if (!client) {
        setStatus("disabled");
        return;
      }
      setSupabase(client);
      client.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        setUser(toAuthUser(data.session?.user));
        setStatus(data.session ? "signed-in" : "signed-out");
      });
      subscription = client.auth.onAuthStateChange((_event, session) => {
        // Token refreshes fire this too; keep the same object unless the
        // person actually changed, so dependents (AccountSync) don't restart.
        const next = toAuthUser(session?.user);
        setUser((prev) =>
          prev && next && prev.id === next.id && prev.email === next.email && prev.hasPassword === next.hasPassword ? prev : next,
        );
        setStatus(session ? "signed-in" : "signed-out");
        if (!session) setNeedsAge(null);
      }).data.subscription;
    });
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
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

  // "I'm under 18": the account that was created a moment ago is deleted
  // outright (auth row included — it cascades through every table), not
  // just signed out, so we never keep a child's email address.
  const declineAge = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.rpc("delete_my_account");
      if (error) throw error;
    }
    await signOut();
  }, [supabase, signOut]);

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
      <AccountSync />
      {status === "signed-in" && needsAge === true && <AgeConfirmModal onConfirm={confirmAge} onDecline={declineAge} />}
    </AuthContext.Provider>
  );
}
