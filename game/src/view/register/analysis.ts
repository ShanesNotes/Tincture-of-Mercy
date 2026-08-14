/**
 * Frame analysis — the pure pixel math behind art-gate machine rows
 * A1 (palette covenant), A3 (red precision), A4 (grayscale survival),
 * A6 (ink outline edge density). Runs identically in the browser bundle
 * (driven by the Playwright harness) and in Vitest on synthetic fixtures.
 *
 * Everything here is a pure function of (pixels, palette law, thresholds).
 */

import {
  declaredColors,
  srgbToLab,
  type DeclaredColor,
  type Lab,
  type PaletteLaw,
} from "./palette";
import { deltaE2000 } from "./palette";

export interface FrameStats {
  readonly width: number;
  readonly height: number;
  readonly totalPixels: number;
  /** A1: fraction of pixels within ΔE tolerance of a declared color. */
  readonly covenantCoverage: number;
  /** A1 detail: worst-case sampled ΔE percentiles. */
  readonly meanDeltaE: number;
  readonly p99DeltaE: number;
  /** A3: oxblood hue-mask coverage (L8 red precision). */
  readonly oxbloodCoverage: number;
  /** Instrumentation cross-check: gold hue-mask coverage (L9). */
  readonly goldCoverage: number;
  /** Per-family nearest-declared pixel shares (covenant triad telemetry). */
  readonly familyShares: Readonly<Record<string, number>>;
  /** A4: populated grayscale bands (12-band histogram, ≥minPopulation). */
  readonly grayscaleBands: number;
  readonly grayscaleStdDev: number;
  /** A6: ink-outline edge density (ink edge pixels / total pixels). */
  readonly inkEdgeDensity: number;
}

export interface AnalysisOptions {
  readonly deltaETolerance: number;
  readonly minBandPopulation: number;
}

const LUMA = { r: 0.2126, g: 0.7152, b: 0.0722 } as const;

/** Hue-mask target hues (degrees, CIELAB) derived from the tokens. */
const hueOf = (lab: Lab): number => {
  const h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  return h >= 0 ? h : h + 360;
};

const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b);
  return d > 180 ? 360 - d : d;
};

/**
 * Analyze one captured frame. `rgba` is 8-bit sRGB bytes, row-major, alpha
 * ignored (the register frame is always opaque).
 *
 * Nearest-declared lookups are memoized per 24-bit color: the register's
 * flat fields mean a frame holds a few thousand distinct colors at most,
 * so full CIEDE2000 per *distinct* color stays cheap.
 */
export const analyzeFrame = (
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  law: PaletteLaw,
  options: AnalysisOptions,
): FrameStats => {
  const declared = declaredColors(law);
  const declaredLabs = declared.map((d) => d.lab);
  const oxbloodLab = srgbToLab({ r: 0x7e, g: 0x25, b: 0x31 });
  const goldLab = srgbToLab({ r: 0xa8, g: 0x7a, b: 0x2e });
  const oxbloodHue = hueOf(oxbloodLab);
  const goldHue = hueOf(goldLab);

  interface Cached {
    readonly deltaE: number;
    readonly family: string;
    readonly within: boolean;
    readonly isInk: boolean;
    readonly isOxblood: boolean;
    readonly isGold: boolean;
    readonly luma: number;
  }

  const cache = new Map<number, Cached>();
  const lookup = (r: number, g: number, b: number): Cached => {
    const key = (r << 16) | (g << 8) | b;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const lab = srgbToLab({ r, g, b });
    let best = Number.POSITIVE_INFINITY;
    let bestIndex = 0;
    for (let i = 0; i < declaredLabs.length; i += 1) {
      const d = declaredLabs[i];
      if (d === undefined) continue;
      const distance = deltaE2000(lab, d);
      if (distance < best) {
        best = distance;
        bestIndex = i;
      }
    }
    const nearest: DeclaredColor | undefined = declared[bestIndex];
    const chroma = Math.hypot(lab.a, lab.b);
    const hue = hueOf(lab);
    const value: Cached = {
      deltaE: best,
      family: nearest?.family ?? "unknown",
      within: best <= options.deltaETolerance,
      isInk: nearest?.family === "ink" && best <= options.deltaETolerance,
      // Hue masks (A3/L8, L9 telemetry): hue window + enough chroma that the
      // pixel reads as red/gold rather than as a neutral that happens to
      // lean warm. Oxblood h≈20°, gold h≈77° (see palette.ts telemetry).
      // The red window is deliberately wide (±25°) so an off-token scarlet
      // still counts against the red budget instead of escaping the mask.
      isOxblood: chroma >= 15 && hueDistance(hue, oxbloodHue) <= 25,
      isGold: chroma >= 15 && hueDistance(hue, goldHue) <= 14,
      luma: LUMA.r * r + LUMA.g * g + LUMA.b * b,
    };
    cache.set(key, value);
    return value;
  };

  const total = width * height;
  const GRAY_BANDS = 12;
  const histogram = new Array<number>(GRAY_BANDS).fill(0);
  const familyCounts = new Map<string, number>();
  const inkMask = new Uint8Array(total);
  const deltaEs: number[] = [];
  let within = 0;
  let oxblood = 0;
  let gold = 0;
  let lumaSum = 0;
  let lumaSqSum = 0;
  let deltaESum = 0;

  for (let p = 0; p < total; p += 1) {
    const o = p * 4;
    const info = lookup(rgba[o] ?? 0, rgba[o + 1] ?? 0, rgba[o + 2] ?? 0);
    if (info.within) within += 1;
    if (info.isOxblood) oxblood += 1;
    if (info.isGold) gold += 1;
    if (info.isInk) inkMask[p] = 1;
    familyCounts.set(info.family, (familyCounts.get(info.family) ?? 0) + 1);
    const band = Math.min(GRAY_BANDS - 1, Math.floor((info.luma / 256) * GRAY_BANDS));
    histogram[band] = (histogram[band] ?? 0) + 1;
    lumaSum += info.luma;
    lumaSqSum += info.luma * info.luma;
    deltaESum += info.deltaE;
    deltaEs.push(info.deltaE);
  }

  // A6 ink-edge density: ink pixels with at least one non-ink 4-neighbor.
  // The frame border is excluded — the capture edge is not an outline.
  let inkEdges = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const p = y * width + x;
      if (inkMask[p] !== 1) continue;
      const left = inkMask[p - 1] ?? 0;
      const right = inkMask[p + 1] ?? 0;
      const up = inkMask[p - width] ?? 0;
      const down = inkMask[p + width] ?? 0;
      if (left === 0 || right === 0 || up === 0 || down === 0) inkEdges += 1;
    }
  }

  const populatedBands = histogram.filter((n) => n / total >= options.minBandPopulation).length;
  const lumaMean = lumaSum / total;
  const lumaVariance = Math.max(0, lumaSqSum / total - lumaMean * lumaMean);
  deltaEs.sort((a, b) => a - b);
  const p99 = deltaEs[Math.min(deltaEs.length - 1, Math.floor(deltaEs.length * 0.99))] ?? 0;

  const familyShares: Record<string, number> = {};
  for (const [family, count] of familyCounts) {
    familyShares[family] = count / total;
  }

  return {
    width,
    height,
    totalPixels: total,
    covenantCoverage: within / total,
    meanDeltaE: deltaESum / total,
    p99DeltaE: p99,
    oxbloodCoverage: oxblood / total,
    goldCoverage: gold / total,
    familyShares,
    grayscaleBands: populatedBands,
    grayscaleStdDev: Math.sqrt(lumaVariance),
    inkEdgeDensity: inkEdges / total,
  };
};
