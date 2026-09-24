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

    let tiltEl: HTMLElement | null = null;
    let magnetEl: HTMLElement | null = null;
    let last: PointerEvent | null = null;
    let frame = 0;

    const apply = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      const target = e.target instanceof Element ? e.target : null;

      const tilt = target?.closest<HTMLElement>(TILT) ?? null;
      if (tilt !== tiltEl) {
        clear(tiltEl, TILT_VARS);
        tiltEl = tilt;
      }
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        tilt.style.setProperty("--ry", `${((x - 0.5) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
        tilt.style.setProperty("--rx", `${((0.5 - y) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
        tilt.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
        tilt.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      }

      const magnet = target?.closest<HTMLElement>(MAGNET) ?? null;
      if (magnet !== magnetEl) {
        clear(magnetEl, MAGNET_VARS);
        magnetEl = magnet;
      }
      if (magnet && !magnet.matches(":disabled")) {
        const r = magnet.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        magnet.style.setProperty("--tx", `${(dx * MAX_PULL_PX).toFixed(1)}px`);
        magnet.style.setProperty("--ty", `${(dy * MAX_PULL_PX * 0.6).toFixed(1)}px`);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      clear(tiltEl, TILT_VARS);
      clear(magnetEl, MAGNET_VARS);
      tiltEl = magnetEl = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      onLeave();
    };
  }, []);

  return null;
}
