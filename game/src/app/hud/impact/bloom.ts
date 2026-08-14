/**
 * Frame-margin ink-bloom layout — the pure geometry behind the border
 * apparatus's hit feedback (slice s27 deliverable 1). Blooms are oxblood ink
 * bleeds at the margin nearest the impact direction; their intensity,
 * duration, and radius pair with the sim-owned hitstop class (TUNING_V0),
 * and the whole layer obeys the L8/A3 oxblood budget: bloom pixels are
 * counted here and clamped under the ≤5% frame ceiling before they render.
 *
 * Pure module: no DOM, no three.js — the DOM layer (impact.ts), the demo
 * scene, and the tests all share it.
 */

import { envelope01 } from "../../../view/vfx/controller";
import type { VfxParams } from "../../../view/vfx/params";
import type { BloomInstance, Direction8, HitstopClassName } from "../../../view/vfx/types";

export interface Viewport {
  readonly width: number;
  readonly height: number;
}

export interface LaidOutBloom {
  readonly anchor: Direction8;
  readonly hitstopClass: HitstopClassName;
  /** Center of the bleed in viewport px (on the margin inset line). */
  readonly x: number;
  readonly y: number;
  /** Current radius in px — decays with the envelope to exactly 0. */
  readonly radiusPx: number;
  readonly intensity: number;
  readonly eventTick: number;
  readonly startTick: number;
}

/** The margin anchor point in viewport px, on the border's inset line. */
export const anchorPoint = (
  anchor: Direction8,
  viewport: Viewport,
  insetPx: number,
): { readonly x: number; readonly y: number } => {
  const { width, height } = viewport;
  const cx = width / 2;
  const cy = height / 2;
  switch (anchor) {
    case "n":
      return { x: cx, y: insetPx };
    case "ne":
      return { x: width - insetPx, y: insetPx };
    case "e":
      return { x: width - insetPx, y: cy };
    case "se":
      return { x: width - insetPx, y: height - insetPx };
    case "s":
      return { x: cx, y: height - insetPx };
    case "sw":
      return { x: insetPx, y: height - insetPx };
    case "w":
      return { x: insetPx, y: cy };
    case "nw":
      return { x: insetPx, y: insetPx };
  }
};

/** Counted bloom pixels for a laid-out set (full-circle conservative count). */
export const bloomAreaPx = (laidOut: readonly LaidOutBloom[]): number =>
  laidOut.reduce((sum, bloom) => sum + Math.PI * bloom.radiusPx * bloom.radiusPx, 0);

/**
 * Lay the active blooms out on the margin. Radius scales with the decayed
 * intensity (peak × envelope), so every bloom visibly bleeds out to nothing.
 * The L8 budget guard: if the simultaneous blooms would exceed the oxblood
 * coverage ceiling, every radius scales down proportionally (√area law) —
 * the budget is never breached no matter how many hits land on one tick.
 */
export const layoutBlooms = (
  blooms: readonly BloomInstance[],
  tick: number,
  viewport: Viewport,
  params: VfxParams,
): readonly LaidOutBloom[] => {
  const laidOut: LaidOutBloom[] = blooms.map((bloom) => {
    const intensity =
      bloom.peakIntensity * envelope01(tick - bloom.startTick, bloom.durationTicks);
    const point = anchorPoint(bloom.anchor, viewport, params.margin.insetPx);
    return {
      anchor: bloom.anchor,
      hitstopClass: bloom.hitstopClass,
      x: point.x,
      y: point.y,
      radiusPx: params.hitstopClasses[bloom.hitstopClass].radiusPx * intensity,
      intensity,
      eventTick: bloom.eventTick,
      startTick: bloom.startTick,
    };
  });
  const viewportArea = viewport.width * viewport.height;
  const maxArea = params.budget.maxOxbloodCoverage * viewportArea;
  const area = bloomAreaPx(laidOut);
  if (area > maxArea && area > 0) {
    const scale = Math.sqrt(maxArea / area);
    return laidOut.map((bloom) => ({ ...bloom, radiusPx: bloom.radiusPx * scale }));
  }
  return laidOut;
};

/** Measured oxblood coverage of a laid-out set against the viewport (L8/A3). */
export const bloomOxbloodCoverage = (
  laidOut: readonly LaidOutBloom[],
  viewport: Viewport,
): number => {
  const viewportArea = viewport.width * viewport.height;
  return viewportArea === 0 ? 0 : bloomAreaPx(laidOut) / viewportArea;
};
