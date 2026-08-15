/**
 * O-F10 repro + coverage: the scene system emits `hearth-dim` when Anna's
 * death is witnessed, and before this seam existed the event reached nothing.
 * These rows drive the real catalog payload through the adapter into the
 * lighting reducer.
 */

import { describe, expect, it } from "vitest";

import rawSceneScripts from "../../data/scene_scripts.json";
import { parseSceneScripts } from "../../sim/scenes";
import type { WorldEvent } from "../../sim/world/types";
import { adaptWorldEvents } from "./adapter";
import {
  applyHearthDim,
  consumeLightingEvents,
  createWorldLighting,
  HEARTH_LEVEL_FULL,
} from "./lighting";

/** The declared ramp is the catalog's, never this file's (EN9). */
const CATALOG = parseSceneScripts(rawSceneScripts);
const DECLARED = {
  percent: CATALOG.params.hearthDimPercent,
  rampSteps: CATALOG.params.hearthDimRampSteps,
};

const hearthDimEvent = (tick = 12): WorldEvent => ({
  sequence: 0,
  tick,
  source: "scenes",
  actorId: null,
  payload: {
    type: "hearth-dim",
    tick,
    rampSteps: DECLARED.rampSteps,
    percent: DECLARED.percent,
  },
});

describe("hearth dim (EN9 / O-F10)", () => {
  it("starts at a full hearth", () => {
    const state = createWorldLighting();
    expect(state.hearthEmblemLevel).toBe(HEARTH_LEVEL_FULL);
    expect(state.hearthDimSteps).toBe(0);
  });

  it("drops exactly one declared ramp step, matching the ~18% the catalog authors", () => {
    const dimmed = applyHearthDim(createWorldLighting(), DECLARED);
    expect(dimmed.hearthDimSteps).toBe(1);
    expect(dimmed.hearthEmblemLevel).toBeCloseTo(1 - DECLARED.percent / 100, 10);
    // ENCOUNTERS ⚓ says ~18%; ART_BIBLE D-1 makes that the step's target value.
    expect(dimmed.hearthEmblemLevel).toBeCloseTo(0.82, 10);
  });

  it("never fades past the declared ramp, however many times the beat replays", () => {
    const once = applyHearthDim(createWorldLighting(), DECLARED);
    const twice = applyHearthDim(once, DECLARED);
    expect(twice).toBe(once);
    expect(consumeLightingEvents(createWorldLighting(), [DECLARED, DECLARED, DECLARED])).toEqual(
      once,
    );
  });

  it("the adapter carries the scene's hearth-dim row into the lighting port", () => {
    const batch = adaptWorldEvents([hearthDimEvent()]);
    expect(batch.lighting).toStrictEqual([DECLARED]);
  });

  it("a stream with no hearth-dim row leaves the hearth alone", () => {
    const batch = adaptWorldEvents([
      {
        sequence: 1,
        tick: 4,
        source: "scenes",
        actorId: null,
        payload: { type: "camera-release", tick: 4, anchorId: "cam.anna_death" },
      },
    ]);
    expect(batch.lighting).toStrictEqual([]);
    expect(consumeLightingEvents(createWorldLighting(), batch.lighting).hearthEmblemLevel).toBe(
      HEARTH_LEVEL_FULL,
    );
  });

  it("end to end: the witnessed-death stream dims the hearth one step", () => {
    const batch = adaptWorldEvents([hearthDimEvent()]);
    const lit = createWorldLighting();
    const dimmed = consumeLightingEvents(lit, batch.lighting);
    expect(lit.hearthEmblemLevel).toBe(HEARTH_LEVEL_FULL);
    expect(dimmed.hearthEmblemLevel).toBeCloseTo(0.82, 10);
    expect(dimmed.hearthDimSteps).toBe(1);
  });
});
