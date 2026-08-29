"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Fine barre de progression en haut de l'écran pendant les navigations
 * internes (clic sur un lien). Elle se remplit progressivement puis
 * disparaît quand la nouvelle route est montée.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const first = useRef(true);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // La route a changé → on termine la barre.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    clear();
    setWidth(100);
    const t = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 240);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    const start = () => {
      clear();
      setActive(true);
      setWidth(8);
      timers.current.push(setTimeout(() => setWidth(45), 120));
      timers.current.push(setTimeout(() => setWidth(72), 420));
      timers.current.push(setTimeout(() => setWidth(90), 1000));
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.hostname && anchor.hostname !== window.location.hostname) return;
      if (
        anchor.pathname === window.location.pathname &&
        anchor.search === window.location.search
      ) {
        return;
      }
      start();
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clear();
    };
  }, []);

  return (
    <div
      className={`route-progress${active ? " is-active" : ""}`}
      style={{ width: `${width}%` }}
      aria-hidden="true"
    />
  );
}
