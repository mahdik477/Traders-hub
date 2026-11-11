"use client";

import { useEffect } from "react";
import { recordView, type RecentKind } from "@/lib/local-store";

// Drop onto a detail page to add it to "Recently viewed" (browser-first,
// synced to the account when signed in). Renders nothing.
export default function TrackView({ kind, id }: { kind: RecentKind; id: string }) {
  useEffect(() => {
    recordView(kind, id);
  }, [kind, id]);
  return null;
}
