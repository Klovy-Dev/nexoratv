"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Ajoute la classe `visible` aux éléments `.reveal` quand ils entrent
 * dans le viewport (animation d'apparition). Se ré-exécute à chaque
 * changement de page.
 *
 * Les cartes situées sous la ligne de flottaison au chargement reçoivent
 * aussi `.reveal` automatiquement (celles déjà à l'écran ont leur animation
 * d'entrée CSS). Les éléments qui apparaissent ensemble sont échelonnés.
 */

const AUTO_REVEAL =
  ".card, .plan-card, .docs-card, .review, .sub-card, .order-track-card, .stat, .compat-card";
const STAGGER_MS = 80;

export default function RevealInit() {
  const pathname = usePathname();

  useEffect(() => {
    const below = window.innerHeight;
    document.querySelectorAll<HTMLElement>(AUTO_REVEAL).forEach((el) => {
      if (!el.classList.contains("reveal") && el.getBoundingClientRect().top > below) {
        el.classList.add("reveal");
      }
    });

    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.visible)"));
    if (els.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("visible"));
      return;
    }

    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        let i = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const delay = Math.min(i++, 5) * STAGGER_MS;
          if (delay) {
            el.style.transitionDelay = `${delay}ms`;
            // Le délai ne doit pas ralentir les effets de survol ensuite.
            timers.push(window.setTimeout(() => el.style.removeProperty("transition-delay"), delay + 700));
          }
          el.classList.add("visible");
          io.unobserve(el);
        });
      },
      { threshold: 0.12 },
    );

    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      timers.forEach((t) => clearTimeout(t));
    };
  }, [pathname]);

  return null;
}
