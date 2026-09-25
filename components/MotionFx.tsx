"use client";

import { useEffect } from "react";

/**
 * Effets qui suivent la souris (le rendu est dans app/globals.css, bloc
 * « Animations & micro-interactions ») :
 *  - cartes : inclinaison 3D (--rx / --ry) et halo lumineux (--mx / --my) ;
 *  - boutons : effet « aimant », le bouton glisse vers le curseur (--tx / --ty).
 *
 * Un seul écouteur délégué sur le document, calculs limités à une frame.
 * Inactif sur écran tactile et quand l'utilisateur demande moins d'animations.
 */

const TILT = ".card, .plan-card:not(.plan-card--locked), .docs-card";
const MAGNET = ".btn:not(.btn-block):not(.btn-sm)";
const MAX_TILT_DEG = 6;
const MAX_PULL_PX = 6;

const TILT_VARS = ["--rx", "--ry", "--mx", "--my"];
const MAGNET_VARS = ["--tx", "--ty"];

function clear(el: HTMLElement | null, vars: string[]) {
  if (el) vars.forEach((v) => el.style.removeProperty(v));
}

export default function MotionFx() {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reduced.matches) return;

    // Les rectangles sont mesurés une seule fois à l'entrée dans l'élément
    // (puis après un scroll / redimensionnement), jamais à chaque frame :
    // mesurer après avoir écrit des styles forçait un recalcul de mise en page,
    // et mesurer une carte déjà inclinée faisait trembler l'effet.
    let tiltEl: HTMLElement | null = null;
    let tiltRect: DOMRect | null = null;
    let magnetEl: HTMLElement | null = null;
    let magnetRect: DOMRect | null = null;
    let last: PointerEvent | null = null;
    let frame = 0;

    const apply = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      const target = e.target instanceof Element ? e.target : null;

      // Lectures d'abord…
      const tilt = target?.closest<HTMLElement>(TILT) ?? null;
      if (tilt !== tiltEl) {
        clear(tiltEl, TILT_VARS);
        tiltEl = tilt;
        tiltRect = null;
      }
      if (tilt && !tiltRect) tiltRect = tilt.getBoundingClientRect();

      let magnet = target?.closest<HTMLElement>(MAGNET) ?? null;
      if (magnet?.matches(":disabled")) magnet = null;
      if (magnet !== magnetEl) {
        clear(magnetEl, MAGNET_VARS);
        magnetEl = magnet;
        magnetRect = null;
      }
      if (magnet && !magnetRect) magnetRect = magnet.getBoundingClientRect();

      // …puis écritures.
      if (tilt && tiltRect) {
        const x = Math.min(Math.max((e.clientX - tiltRect.left) / tiltRect.width, 0), 1);
        const y = Math.min(Math.max((e.clientY - tiltRect.top) / tiltRect.height, 0), 1);
        tilt.style.setProperty("--ry", `${((x - 0.5) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
        tilt.style.setProperty("--rx", `${((0.5 - y) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
        tilt.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
        tilt.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      }
      if (magnet && magnetRect) {
        const cx = magnetRect.left + magnetRect.width / 2;
        const cy = magnetRect.top + magnetRect.height / 2;
        const dx = Math.min(Math.max((e.clientX - cx) / (magnetRect.width / 2), -1), 1);
        const dy = Math.min(Math.max((e.clientY - cy) / (magnetRect.height / 2), -1), 1);
        magnet.style.setProperty("--tx", `${(dx * MAX_PULL_PX).toFixed(1)}px`);
        magnet.style.setProperty("--ty", `${(dy * MAX_PULL_PX * 0.6).toFixed(1)}px`);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const invalidate = () => {
      tiltRect = magnetRect = null;
    };
    const onLeave = () => {
      clear(tiltEl, TILT_VARS);
      clear(magnetEl, MAGNET_VARS);
      tiltEl = magnetEl = null;
      invalidate();
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
      if (frame) cancelAnimationFrame(frame);
      onLeave();
    };
  }, []);

  return null;
}
