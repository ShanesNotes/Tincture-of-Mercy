import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SCENE_CATALOG } from "./catalog.test";
import { COMPOSITION_SLOT_NAMES, parseSceneScripts, REQUIRED_SCRIPT_IDS } from "./schema";

const placements = JSON.parse(
  readFileSync(new URL("../../data/levels/ironwood_placements.json", import.meta.url), "utf8"),
) as { cameras: readonly { id: string }[]; all: readonly { id: string }[] };

const bible = JSON.parse(
  readFileSync(
    new URL(
      "../../../../design_system/v1_0_threejs_soulslike/text_bible_v0.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Record<string, unknown>;

const placementIds = new Set(placements.all.map((entry) => entry.id));

const collectTextKeys = (catalog: typeof SCENE_CATALOG): readonly string[] => {
  const keys = new Set<string>();
  for (const script of Object.values(catalog.scripts)) {
    for (const step of script.steps) {
      for (const effect of Object.values(step.verbEffects)) {
        for (const key of effect.textKeys ?? []) {
          keys.add(key);
        }
      }
      for (const key of step.onEnter?.textKeys ?? []) {
        keys.add(key);
      }
    }
  }
  for (const item of Object.values(catalog.params.items)) {
    for (const key of item.textKeys) {
      keys.add(key);
    }
  }
  return [...keys];
};

describe("scene script schema", () => {
  it("validates every shipping script", () => {
    for (const id of REQUIRED_SCRIPT_IDS) {
      expect(SCENE_CATALOG.scripts[id]).toBeDefined();
    }
    expect(Object.keys(SCENE_CATALOG.scripts).sort()).toEqual([...REQUIRED_SCRIPT_IDS].sort());
  });

  it("rejects a script missing seven-slot composition when it holds a frame", () => {
    const raw = {
      params: SCENE_CATALOG.params,
      scripts: {
        broken: {
          id: "broken",
          beat: 1,
          registerLocked: false,
          repeatable: false,
          interrupt: "none",
          composition: null,
          steps: [
            {
              id: "only",
              stagedAnchorId: "cam.anna_death",
              verbs: ["SitNear"],
              verbOrder: "fixed",
              interrupt: "none",
              exit: { allVerbsApplied: true },
              verbEffects: { SitNear: { textKeys: ["npc.anna.presence.sit_near"] } },
            },
          ],
        },
      },
    };
    expect(() => parseSceneScripts(raw)).toThrow(/CM1/);
  });

  it("pins ceremony hold ticks to TUNING_V0", () => {
    expect(SCENE_CATALOG.params.ceremonyHoldTicks).toBe(90);
    expect(SCENE_CATALOG.params.ceremonyPulsePercent).toBe(55);
    expect(SCENE_CATALOG.params.hearthDimRampSteps).toBe(1);
    expect(SCENE_CATALOG.params.hearthDimPercent).toBe(18);
    expect(SCENE_CATALOG.params.annaStartingDoses).toBe(3);
  });

  it("names every CM1 slot on staged scripts", () => {
    for (const script of Object.values(SCENE_CATALOG.scripts)) {
      if (script.steps.every((step) => step.stagedAnchorId === null)) {
        continue;
      }
      expect(script.composition).not.toBeNull();
      for (const slot of COMPOSITION_SLOT_NAMES) {
        expect(script.composition?.[slot].length).toBeGreaterThan(0);
      }
    }
  });

  it("references only s20 placement ids for staged anchors", () => {
    for (const script of Object.values(SCENE_CATALOG.scripts)) {
      for (const step of script.steps) {
        if (step.stagedAnchorId !== null) {
          expect(placementIds.has(step.stagedAnchorId)).toBe(true);
        }
        if (step.propAnchorId !== undefined) {
          expect(placementIds.has(step.propAnchorId)).toBe(true);
        }
      }
    }
    expect(placementIds.has("cam.anna_death")).toBe(true);
    expect(placementIds.has("lantern.hang")).toBe(true);
  });

  it("uses only text_bible_v0 keys", () => {
    for (const key of collectTextKeys(SCENE_CATALOG)) {
      expect(bible[key], key).toBeDefined();
    }
  });
});
