/**
 * Register slice tuning data — every renderer/gate constant lives here, never
 * as a magic number in code (W1-SHARED rule 5). Each value cites its law.
 *
 * This module is pure data (no three.js) so the gate harness, the materials,
 * and the tests all read the same numbers.
 */

export interface DepthBandConfig {
  /**
   * Camera-space view distances (m) at which bands step, near → far
   * (L5: 3–4 quantized bands; EN10). Count must equal
   * palette.depthBandBlueShift.length - 1.
   */
  readonly viewZBoundaries: readonly number[];
}

export interface OutlineConfig {
  /** Ink line weight in screen texels (L3/A6; data-driven). */
  readonly weightTexels: number;
  /** Depth-gradient threshold (view-space meters) that reads as a crease. */
  readonly depthThreshold: number;
  /** Normal-from-depth discontinuity threshold (radians of surface bend). */
  readonly normalThreshold: number;
}

export interface PaletteClampConfig {
  /**
   * Soft-clamp strength toward the nearest declared color, 0–1 (A1). The
   * clamp only *pulls* pixels toward the covenant; declared colors are
   * already exact, so this binds AA edge pixels and emblem gradients.
   */
  readonly strength: number;
  /** ΔE beyond which the clamp pull saturates (soft knee). */
  readonly knee: number;
}

export interface EmblemConfig {
  /** Hard cap on registered emblem lights (L4 registry discipline). */
  readonly cap: number;
  /** Point-light ranges (m) per verb; the emitter sprite scales with it. */
  readonly lightRange: number;
  /** Ambient floor of the ramp shader (no unregistered fill light, L4). */
  readonly ambient: number;
}

export interface ShotConfig {
  readonly name: string;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  /** True on character-silhouette shots (gate A6 measures these). */
  readonly silhouette: boolean;
}

export interface GateThresholds {
  /** A1: ≥92% of sampled pixels within ΔE 6 of tokens + declared ramps. */
  readonly a1Coverage: number;
  /** A3: oxblood hue-mask coverage ceiling outside red-field states (L8). */
  readonly a3OxbloodCoverage: number;
  /** A4: grayscale conversion must keep ≥ this many populated value bands. */
  readonly a4MinBands: number;
  /** A4: a populated band holds at least this fraction of frame pixels. */
  readonly a4MinBandPopulation: number;
  /** A4: minimum grayscale standard deviation (contrast readability). */
  readonly a4MinStdDev: number;
  /** A6: ink-outline edge density band on silhouette shots [min, max]. */
  readonly a6EdgeDensity: readonly [number, number];
}

export interface RegisterConfig {
  readonly captureWidth: number;
  readonly captureHeight: number;
  readonly depthBands: DepthBandConfig;
  readonly outline: OutlineConfig;
  readonly clamp: PaletteClampConfig;
  readonly emblems: EmblemConfig;
  readonly cameraFov: number;
  readonly shots: readonly ShotConfig[];
  readonly gates: GateThresholds;
}

export const REGISTER_CONFIG: RegisterConfig = {
  // Gate capture resolution: fixed so machine rows are deterministic across
  // machines (devicePixelRatio is pinned to 1 by the harness as well).
  captureWidth: 960,
  captureHeight: 540,
  depthBands: {
    // 4 bands (L5): near field, mid, far, painted backdrop plane.
    viewZBoundaries: [14, 24, 36],
  },
  outline: {
    weightTexels: 1.5,
    depthThreshold: 0.35,
    normalThreshold: 0.6,
  },
  clamp: {
    strength: 0.65,
    knee: 18,
  },
  emblems: {
    // The sample scene registers 2; the cap leaves headroom for the slice's
    // candle/moon verbs without allowing light sprawl (L4).
    cap: 8,
    lightRange: 14,
    ambient: 0.32,
  },
  // D2: compressed vertical FOV 38–48°.
  cameraFov: 44,
  shots: [
    {
      // Shot 1 — wide frontal plate: colonnade, wolf, hearth, backdrop.
      name: "plate",
      position: [0, 2.6, 10.5],
      target: [0, 1.2, -12],
      silhouette: false,
    },
    {
      // Shot 2 — wolf silhouette against the parchment field (A6 subject).
      name: "wolf-silhouette",
      position: [2.2, 1.1, -2.2],
      target: [-0.6, 0.7, -7.5],
      silhouette: true,
    },
    {
      // Shot 3 — hearth + lantern emblems close (L4/L9 gold carriers).
      name: "emblems",
      position: [5.4, 1.6, 1.5],
      target: [3.2, 0.9, -5.5],
      silhouette: false,
    },
    {
      // Shot 4 — deep field: all four depth-band markers + backdrop (L5).
      name: "depth-bands",
      position: [-3.5, 3.2, 8],
      target: [1, 1.5, -40],
      silhouette: false,
    },
  ],
  gates: {
    a1Coverage: 0.92, // GATES.md A1
    a3OxbloodCoverage: 0.05, // GATES.md A3 / L8
    a4MinBands: 4, // contrast-band readability in value-only conversion
    a4MinBandPopulation: 0.02,
    a4MinStdDev: 24,
    a6EdgeDensity: [0.004, 0.2],
  },
};
