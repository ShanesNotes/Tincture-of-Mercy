/**
 * The impact layer (slice s27) — the hit-feedback half of the manuscript
 * border apparatus. It lives beside the s16 border (never inside it: the
 * border's files are another slice's property) and renders four things:
 *
 * 1. The oxblood ink-bloom at the frame margin (8-way anchors, hard-edged
 *    bleeds — no glow gradient, AD9/L3).
 * 2. The 1-frame parchment inversion on critical/death (canon impact spec),
 *    rendered as a difference-blend parchment flash so the whole page turns.
 * 3. The Wither margin desaturation band (EN14: stepped, never green).
 * 4. The death "page" hook — the lower page dims for a beat (D6/F11).
 *
 * The layer is a dumb renderer of {@link ImpactFrame}; all geometry, timing,
 * and budget discipline live in the pure modules (controller.ts, bloom.ts).
 */

import "./impact.css";

import type { LaidOutBloom } from "./bloom";

export interface ImpactFrame {
  readonly blooms: readonly LaidOutBloom[];
  readonly inversion: boolean;
  /** Stepped Wither band strength (0, or one of the declared stops). */
  readonly witherBand: number;
  readonly deathPage: boolean;
}

export interface ImpactLayerHandle {
  readonly root: HTMLElement;
  readonly apply: (frame: ImpactFrame) => void;
  /** Remove the layer this boot mounted. Idempotent (K8). */
  readonly dispose: () => void;
}

export const buildImpactLayer = (mount: HTMLElement): ImpactLayerHandle => {
  const root = document.createElement("div");
  root.className = "vfx-impact";
  root.dataset.testid = "vfx-impact";
  root.setAttribute("aria-hidden", "true");

  for (const side of ["n", "e", "s", "w"] as const) {
    const band = document.createElement("div");
    band.className = `vfx-wither-band vfx-wither-band-${side}`;
    root.append(band);
  }

  const blooms = document.createElement("div");
  blooms.className = "vfx-blooms";
  root.append(blooms);

  const inversion = document.createElement("div");
  inversion.className = "vfx-inversion";
  inversion.dataset.testid = "vfx-inversion";
  root.append(inversion);

  const deathPage = document.createElement("div");
  deathPage.className = "vfx-death-page";
  deathPage.dataset.testid = "vfx-death-page";
  root.append(deathPage);

  mount.append(root);

  const apply = (frame: ImpactFrame): void => {
    blooms.replaceChildren();
    for (const bloom of frame.blooms) {
      const node = document.createElement("div");
      node.className = "vfx-bloom";
      node.dataset.testid = "vfx-bloom";
      node.dataset.anchor = bloom.anchor;
      node.dataset.hitstopClass = bloom.hitstopClass;
      node.dataset.eventTick = String(bloom.eventTick);
      node.dataset.startTick = String(bloom.startTick);
      const diameter = bloom.radiusPx * 2;
      node.style.left = `${bloom.x}px`;
      node.style.top = `${bloom.y}px`;
      node.style.width = `${diameter}px`;
      node.style.height = `${diameter}px`;
      blooms.append(node);
    }
    root.dataset.inversion = frame.inversion ? "1" : "0";
    root.style.setProperty("--vfx-wither", String(frame.witherBand));
    root.dataset.wither = frame.witherBand > 0 ? "1" : "0";
    root.dataset.deathPage = frame.deathPage ? "1" : "0";
  };

  apply({ blooms: [], inversion: false, witherBand: 0, deathPage: false });
  return { root, apply, dispose: () => root.remove() };
};
