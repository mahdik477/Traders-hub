"use client";

import { useEffect } from "react";

// Registers the (no-cache) service worker in production only, so the site
// counts as installable. In development it does nothing — a worker would
// only get in the way of hot reloading.
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Not fatal — the site works the same without it.
    });
  }, []);
  return null;
}
