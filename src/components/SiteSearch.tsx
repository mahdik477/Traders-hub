"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { OPEN_SEARCH_EVENT } from "@/components/BottomNav";

// Site-wide search: a button in the header plus Ctrl/⌘+K anywhere (and the
// phone bottom bar's Search tab). The dialog itself lives in
// SearchDialog.tsx and is loaded on demand, so pages only pay for this
// small button until someone actually searches. Hovering or focusing the
// button starts the download early, so the dialog still feels instant.

const SearchDialog = dynamic(() => import("@/components/SearchDialog"), { ssr: false });
const preload = () => import("@/components/SearchDialog");

function isMac() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
}

export default function SiteSearch() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mac, setMac] = useState(false);

  useEffect(() => {
    // Platform sniff for the shortcut hint only — has to wait for the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMac(isMac());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    // The mobile bottom nav's Search tab opens the same dialog.
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to where the visitor was.
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={preload}
        onFocus={preload}
        aria-label="Search the site"
        aria-keyshortcuts="Control+K Meta+K"
        className="search-trigger flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm text-muted transition-colors hover:border-accent hover:text-foreground sm:pr-2"
      >
        <SearchIcon className="size-4.5" />
        <span className="hidden md:inline">Search</span>
        <kbd
          aria-hidden="true"
          className="hidden rounded-md border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[0.65rem] text-subtle md:inline"
        >
          {mac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>
      {open && <SearchDialog onClose={close} />}
    </>
  );
}

