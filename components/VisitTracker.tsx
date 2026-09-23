"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Signale chaque page vue à /api/track (dashboard admin). */
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const body = JSON.stringify({ path: pathname });
    try {
      if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    } catch {
      /* ignoré */
    }
  }, [pathname]);

  return null;
}
