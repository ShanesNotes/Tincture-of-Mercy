/**
 * Procedural placeholder atlas cells (PATTERN_ATLAS_PLAN). The final
 * 4096² atlas is a later slice; here each licensed cell is a procedural
 * grayscale value-field in TSL, derived only from the four licensed
 * pattern families (PA6: hatch, scroll-filigree, mosaic band,
 * stipple-grain). Cells are addressed by the same index constants the
 * final atlas will use (PA12), so materials cannot drift from the plan.
 *
 * Each cell returns two fields:
 * - `line`: 0/1 ink-line mask (R channel per PA4 — line-work density).
 * - `grain`: 0..1 secondary density (G channel per PA4 — stipple/grain).
 */

import type { Node } from "three/webgpu";
import {
  abs,
  atan,
  dot,
  float,
  floor,
  fract,
  hash,
  max,
  oneMinus,
  sin,
  step,
  vec2,
} from "three/tsl";

export type FloatNode = Node<"float">;
export type Vec2Node = Node<"vec2">;
export type Vec3Node = Node<"vec3">;

/** Cell indices — mirror PATTERN_ATLAS_PLAN.md §2 (PA12). */
export const ATLAS = {
  PINE_BARK: 0,
  PINE_CANOPY: 1,
  NEEDLE_FLOOR: 2,
  DAMP_STIPPLE: 3,
  GRANITE: 4,
  WOODGRAIN: 5,
  WOOL_WEAVE: 6,
  LINEN_WEAVE: 7,
  FERN: 8,
  THISTLE: 9,
  WATER: 10,
  SCROLL_FILIGREE: 11,
  MOSAIC_BAND: 12,
  DAMASK: 13,
  SCALLOP_HILL: 14,
  WITHER_MOTE: 15,
} as const;

export type AtlasCell = (typeof ATLAS)[keyof typeof ATLAS];

export interface PatternField {
  readonly line: FloatNode;
  readonly grain: FloatNode;
}

const FLOAT0 = float(0);

/** Hatch family: directional line-work at a given angle and density. */
const hatch = (p: Vec2Node, angle: number, density: number, width: number): FloatNode => {
  const dir = vec2(Math.cos(angle), Math.sin(angle));
  const coord = dot(p, vec2(dir.y.negate(), dir.x)).mul(density);
  return step(abs(fract(coord).sub(0.5)), width * 0.5);
};

/** Stipple family: deterministic hash speckle at a given coverage. */
const stipple = (p: Vec2Node, scale: number, coverage: number): FloatNode => {
  const cellUv = floor(p.mul(scale));
  return step(hash(cellUv), coverage);
};

/**
 * Resolve a placeholder cell by index. `tiledUv` is mesh UV × the texel-
 * density lock (PA13: trunks 1 tile/2m, ground 1 tile/1m, garments 1/0.5m).
 */
export const patternCell = (cell: AtlasCell, tiledUv: Vec2Node): PatternField => {
  const p = tiledUv.toVar();
  switch (cell) {
    case ATLAS.PINE_BARK: {
      // Vertical hatch + spiral grain knots (EN2).
      const lines = hatch(p, Math.PI / 2, 18, 0.42);
      const knotUv = fract(p.mul(vec2(0.5, 0.25))).sub(0.5);
      const knot = step(abs(sin(knotUv.length().mul(24))), 0.18).mul(step(knotUv.length(), 0.4));
      return { line: max(lines, knot.mul(0.8)), grain: stipple(p, 40, 0.06) };
    }
    case ATLAS.PINE_CANOPY: {
      // Repeating needle-scale fill (EN2) — scalloped scale rows.
      const row = floor(p.y.mul(6));
      const shifted = vec2(p.x.add(row.mul(0.5)), p.y);
      const scaleUv = fract(shifted.mul(vec2(6, 6))).sub(0.5);
      const arc = step(scaleUv.length(), 0.42).mul(step(0.28, scaleUv.length()));
      return { line: arc, grain: stipple(p, 30, 0.1) };
    }
    case ATLAS.NEEDLE_FLOOR: {
      // Directional hatch bands + damp stipple (EN3).
      return { line: hatch(p, 0.35, 9, 0.3), grain: stipple(p, 55, 0.08) };
    }
    case ATLAS.DAMP_STIPPLE: {
      // Snow-that-does-not-stay: sparse patches with melting edges (EN4).
      return { line: FLOAT0, grain: stipple(p, 24, 0.18) };
    }
    case ATLAS.GRANITE: {
      // Engraved grain + stone stipple (cell 4).
      return { line: hatch(p, 1.1, 26, 0.2), grain: stipple(p, 60, 0.12) };
    }
    case ATLAS.WOODGRAIN: {
      // Long grain + log-end spiral rings (EN5).
      return { line: hatch(p, Math.PI / 2, 7, 0.16), grain: stipple(p, 34, 0.05) };
    }
    case ATLAS.WOOL_WEAVE:
    case ATLAS.LINEN_WEAVE: {
      // Cross weave reads at arm's length, not close-up noise (PA3 row 6).
      return {
        line: max(hatch(p, 0, 22, 0.12), hatch(p, Math.PI / 2, 22, 0.12)),
        grain: FLOAT0,
      };
    }
    case ATLAS.FERN: {
      // Flat cutout clusters (EN3).
      const frond = step(abs(sin(p.x.mul(14).add(sin(p.y.mul(9))))), 0.3);
      return { line: frond.mul(0.6), grain: stipple(p, 20, 0.14) };
    }
    case ATLAS.THISTLE: {
      // The one licensed scene red accent — a single sparse sprig stamp
      // (EN3, L8): three thin arms off a center stalk, nothing more.
      const c = p.sub(0.5);
      const radius = c.length();
      const arms = step(abs(sin(atan(c.y, c.x).mul(1.5))), 0.22).mul(step(radius, 0.42));
      const stalk = step(abs(c.x), 0.03).mul(step(abs(c.y), 0.45));
      return { line: FLOAT0, grain: max(arms, stalk) };
    }
    case ATLAS.MOSAIC_BAND: {
      // Zigzag / chevron trim (cell 12, EN5/HB2).
      const zig = abs(fract(p.x.mul(6)).sub(0.5)).mul(2);
      const band = step(abs(fract(p.y.mul(3)).sub(0.5).mul(2).sub(zig)), 0.2);
      return { line: band, grain: FLOAT0 };
    }
    case ATLAS.DAMASK: {
      // Far-field swirl fill — flatter + more patterned with distance (EN10).
      const swirl = step(abs(sin(p.x.mul(8).add(sin(p.y.mul(6)).mul(2)))), 0.25);
      return { line: swirl, grain: FLOAT0 };
    }
    case ATLAS.SCALLOP_HILL: {
      // Backdrop far plane: stacked scallop hills (EN11, cell 14).
      const row = floor(p.y.mul(4));
      const hillUv = vec2(fract(p.x.mul(3).add(row.mul(0.37))).sub(0.5), fract(p.y.mul(4)));
      const hill = step(hillUv.x.mul(hillUv.x).mul(4).add(oneMinus(hillUv.y)), 0.9);
      return { line: oneMinus(hill), grain: FLOAT0 };
    }
    case ATLAS.WITHER_MOTE: {
      // Sparse ink motes only, never fog (EN14).
      return { line: FLOAT0, grain: stipple(p, 90, 0.02) };
    }
    default: {
      // WATER / SCROLL_FILIGREE and future cells default to a filigree wave
      // placeholder so every licensed family has a stand-in (PA6).
      return { line: step(abs(sin(p.x.mul(12).add(p.y.mul(4)))), 0.2), grain: FLOAT0 };
    }
  }
};
