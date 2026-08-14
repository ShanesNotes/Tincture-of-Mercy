import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { createMetaState, textStep } from "../meta";
import { SCENE_CATALOG } from "./catalog.test";
import { applyVerb, createSceneState, sceneTextKeys, tryEnterScene } from "./host";
import {
  isRegisterLockedScript,
  keyHasNumbVariants,
  REGISTER_LOCKED_SCRIPTS,
  renderSceneKey,
  type TextBible,
} from "./text";

const bible = JSON.parse(
  readFileSync(
    new URL(
      "../../../../design_system/v1_0_threejs_soulslike/text_bible_v0.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as TextBible;

const lockedKeysFor = (scriptId: string): readonly string[] => {
  let state = createSceneState(SCENE_CATALOG);
  const keys: string[] = [];
  const enter = tryEnterScene(state, scriptId, SCENE_CATALOG, { engaged: false });
  state = enter.state;
  keys.push(...sceneTextKeys(enter.events));
  let guard = 0;
  while (state.active !== null && guard < 32) {
    const presented = state.active;
    const script = SCENE_CATALOG.scripts[scriptId];
    const step = script?.steps[presented.stepIndex];
    const nextVerb = (step?.verbs ?? []).find((verb) => !presented.appliedVerbs.includes(verb));
    if (nextVerb === undefined) {
      break;
    }
    const applied = applyVerb(state, nextVerb, SCENE_CATALOG);
    state = applied.state;
    keys.push(...sceneTextKeys(applied.events));
    guard += 1;
  }
  return [...new Set(keys)];
};

describe("register lock (L-T4)", () => {
  it("locks Anna and Birdie only", () => {
    expect(REGISTER_LOCKED_SCRIPTS).toEqual(["anna_gravity", "birdie_coda"]);
    expect(SCENE_CATALOG.scripts.anna_gravity?.registerLocked).toBe(true);
    expect(SCENE_CATALOG.scripts.birdie_coda?.registerLocked).toBe(true);
    expect(SCENE_CATALOG.scripts.cabin_prologue?.registerLocked).toBe(false);
    expect(isRegisterLockedScript("hearth_vigil")).toBe(false);
  });

  it("Anna and Birdie keys have no numb variants and render at step 0 via textStep", () => {
    const numb = createMetaState();
    const stacked = { ...numb, numbnessStacks: 2 };
    expect(textStep(stacked)).toBe(2);

    for (const scriptId of REGISTER_LOCKED_SCRIPTS) {
      const keys = lockedKeysFor(scriptId);
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) {
        const entry = bible[key];
        expect(entry, key).toBeDefined();
        if (key.startsWith("npc.") || key.startsWith("notebook.")) {
          expect(keyHasNumbVariants(entry), key).toBe(false);
        }
        expect(renderSceneKey(bible, key, scriptId, textStep(stacked))).toBe(entry?.folk ?? null);
        expect(renderSceneKey(bible, key, scriptId, 0)).toBe(
          renderSceneKey(bible, key, scriptId, textStep(stacked)),
        );
      }
    }
  });

  it("does not apply Numbness to the Anna death line or Caleb misname", () => {
    const stacked = { ...createMetaState(), numbnessStacks: 2 };
    expect(
      renderSceneKey(bible, "npc.anna.presence.witness_death", "anna_gravity", textStep(stacked)),
    ).toBe(bible["npc.anna.presence.witness_death"]?.folk);
    expect(
      renderSceneKey(bible, "npc.birdie.caleb_misname", "birdie_coda", textStep(stacked)),
    ).toBe(bible["npc.birdie.caleb_misname"]?.folk);
  });
});
