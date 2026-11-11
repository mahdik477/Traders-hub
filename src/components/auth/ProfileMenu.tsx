"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

// Header account control. Renders nothing when accounts are switched off,
// a "Sign in" link when signed out, and a small initial-letter button with
// a menu when signed in. The initial comes from the email — we never show a
// Google name or photo.
export default function ProfileMenu() {
  const { status, user, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close the menu after navigating.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  if (status === "disabled") return null;

  if (status === "loading") {
    return <span aria-hidden="true" className="skeleton hidden h-11 w-20 rounded-full sm:block" />;
  }

  if (status === "signed-out" || !user) {
    const next = pathname && pathname !== "/sign-in" ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <Link href={`/sign-in${next}`} className="btn btn-outline h-11 min-h-0 px-3.5 text-sm">
        Sign in
      </Link>
    );
  }

  const initial = (user.email ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${user.email ?? "your account"}`}
        onClick={() => setOpen((o) => !o)}
        className="flex size-11 items-center justify-center rounded-full border border-accent/50 bg-accent/12 text-sm font-bold text-accent transition-colors hover:border-accent"
      >
        {initial}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="profile-menu absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border-strong bg-surface p-1.5 shadow-glow"
        >
          <p className="truncate px-3 py-2 text-xs text-muted" title={user.email ?? undefined}>
            {user.email}
          </p>
          <Link role="menuitem" href="/my-hub" className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-foreground hover:bg-surface-2">
            My Hub
          </Link>
          <Link role="menuitem" href="/privacy" className="flex min-h-11 items-center rounded-lg px-3 text-sm text-muted hover:bg-surface-2 hover:text-foreground">
            Privacy &amp; your data
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-muted hover:bg-surface-2 hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
