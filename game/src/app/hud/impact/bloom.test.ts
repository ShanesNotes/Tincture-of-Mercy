import { describe, expect, it } from "vitest";

import { applyVfxEvents, createVfxState } from "../../../view/vfx/controller";
import { VFX_PARAMS } from "../../../view/vfx/params";
import type { BloomInstance, Direction8 } from "../../../view/vfx/types";
import { anchorPoint, bloomOxbloodCoverage, layoutBlooms } from "./bloom";

const params = VFX_PARAMS;
const viewport = { width: 1280, height: 720 } as const;

const makeBloom = (anchor: Direction8, radiusClass: keyof typeof params.hitstopClasses): BloomInstance => ({
  anchor,
  hitstopClass: radiusClass,
  eventTick: 0,
  startTick: 0,
  durationTicks: params.hitstopClasses[radiusClass].bloomTicks,
  peakIntensity: params.hitstopClasses[radiusClass].peakIntensity,
});

describe("anchorPoint", () => {
  it("places all 8 anchors on the margin inset line", () => {
    const inset = params.margin.insetPx;
    expect(anchorPoint("n", viewport, inset)).toEqual({ x: 640, y: inset });
    expect(anchorPoint("s", viewport, inset)).toEqual({ x: 640, y: 720 - inset });
    expect(anchorPoint("e", viewport, inset)).toEqual({ x: 1280 - inset, y: 360 });
    expect(anchorPoint("w", viewport, inset)).toEqual({ x: inset, y: 360 });
    expect(anchorPoint("ne", viewport, inset)).toEqual({ x: 1280 - inset, y: inset });
    expect(anchorPoint("sw", viewport, inset)).toEqual({ x: inset, y: 720 - inset });
  });
});

describe("layoutBlooms", () => {
  it("radius pairs with the hitstop class at spawn and decays to exactly zero", () => {
    const bloom = makeBloom("e", "critical");
    const atSpawn = layoutBlooms([bloom], 0, viewport, params)[0];
    expect(atSpawn?.radiusPx).toBeCloseTo(params.hitstopClasses.critical.radiusPx);
    const mid = layoutBlooms([bloom], 10, viewport, params)[0];
    expect(mid?.radiusPx ?? 0).toBeLessThan(atSpawn?.radiusPx ?? 0);
    // At duration the controller has already expired the bloom; one tick
    // before, the envelope is near zero and still shrinking.
    const late = layoutBlooms([bloom], 19, viewport, params)[0];
    expect(late?.radiusPx ?? 1).toBeLessThan((atSpawn?.radiusPx ?? 0) * 0.1);
  });

  it("L8 budget: a single worst-case bloom stays under the 5% ceiling", () => {
    const laidOut = layoutBlooms([makeBloom("n", "critical")], 0, viewport, params);
    expect(bloomOxbloodCoverage(laidOut, viewport)).toBeLessThanOrEqual(
      params.budget.maxOxbloodCoverage,
    );
  });

  it("L8 budget guard: stacked simultaneous blooms are clamped under the ceiling", () => {
    const anchors: Direction8[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
    const pile = anchors.map((anchor) => makeBloom(anchor, "critical"));
    const unclamped = bloomOxbloodCoverage(
      pile.map((bloom) => {
        const laid = layoutBlooms([bloom], 0, viewport, params)[0];
        if (laid === undefined) throw new Error("layout failed");
        return laid;
      }),
      viewport,
    );
    expect(unclamped).toBeGreaterThan(params.budget.maxOxbloodCoverage);
    const laidOut = layoutBlooms(pile, 0, viewport, params);
    expect(bloomOxbloodCoverage(laidOut, viewport)).toBeLessThanOrEqual(
      params.budget.maxOxbloodCoverage + 1e-9,
    );
    expect(bloomOxbloodCoverage(laidOut, viewport)).toBeGreaterThan(0);
  });

  it("never invents a bloom for an empty state", () => {
    expect(layoutBlooms([], 0, viewport, params)).toEqual([]);
  });
});

describe("end-to-end controller → layout", () => {
  it("a scripted hit lands a laid-out bloom at the directional margin", () => {
    const state = applyVfxEvents(
      createVfxState(),
      [
        {
          kind: "hit",
          tick: 40,
          targetId: "dummy",
          hitstopTicks: 6,
          direction: [-0.7, 0.7],
          contact: [0, 1.2, -4],
        },
      ],
      40,
      params,
    );
    const laidOut = layoutBlooms(state.blooms, state.tick, viewport, params);
    expect(laidOut).toHaveLength(1);
    expect(laidOut[0]?.anchor).toBe("nw");
    expect(laidOut[0]?.hitstopClass).toBe("heavy");
    expect(laidOut[0]?.x ?? 0).toBeLessThan(viewport.width / 2);
    expect(laidOut[0]?.y ?? 999).toBeLessThan(viewport.height / 2);
  });
});
