import { describe, expect, it } from "vitest";

import { createMercyStats, createMetaState } from "../meta";
import type { MetaState } from "../meta";
import { SCENE_CATALOG } from "./catalog.test";
import {
  applyVerb,
  createSceneState,
  presentScene,
  tryEnterScene,
} from "./host";
import type { SceneEvent, SceneResult, SceneState } from "./types";

const playCabin = (): { state: SceneState; events: SceneEvent[] } => {
  let state = createSceneState(SCENE_CATALOG);
  const events: SceneEvent[] = [];
  const record = (result: SceneResult): void => {
    state = result.state;
    events.push(...result.events);
  };
  record(tryEnterScene(state, "cabin_prologue", SCENE_CATALOG, { engaged: false }));
  for (const verb of ["DrawWater", "CarryWater", "BreakBread", "ShareBread", "DoseAnna"]) {
    record(applyVerb(state, verb, SCENE_CATALOG));
  }
  return { state, events };
};

describe("cabin prologue", () => {
  it("teaches water, bread, and the flask through three care steps", () => {
    const { state, events } = playCabin();
    expect(state.completed).toContain("cabin_prologue");
    expect(state.flags["taught.water"]).toBe(1);
    expect(state.flags["taught.bread"]).toBe(1);
    expect(state.flags["taught.flask"]).toBe(1);
    expect(state.flags["taught.interact"]).toBe(1);
    expect(state.flags["taught.attend"]).toBe(1);
    expect(state.flags["hud.woken"]).toBe(1);
    expect(state.flags["anna.dosesAdministered"]).toBe(1);
    expect(state.flags["anna.dosesRemaining"]).toBe(2);
    expect(events).toContainEqual({ type: "hud-border-wake", tick: 0 });
    expect(events).toContainEqual({ type: "dose-prepared", tick: 0, remaining: 2 });
    expect(events.some((event) => event.type === "notebook-line" && event.textKey === "notebook.bread")).toBe(
      true,
    );
  });

  it("holds the item-revelation frame only on the flask tutorial", () => {
    let state = createSceneState(SCENE_CATALOG);
    state = tryEnterScene(state, "cabin_prologue", SCENE_CATALOG, { engaged: false }).state;
    expect(presentScene(state, SCENE_CATALOG).stagedAnchorId).toBeNull();
    state = applyVerb(state, "DrawWater", SCENE_CATALOG).state;
    state = applyVerb(state, "CarryWater", SCENE_CATALOG).state;
    state = applyVerb(state, "BreakBread", SCENE_CATALOG).state;
    state = applyVerb(state, "ShareBread", SCENE_CATALOG).state;
    expect(presentScene(state, SCENE_CATALOG).stepId).toBe("dose");
    expect(presentScene(state, SCENE_CATALOG).stagedAnchorId).toBe("cam.item_revelation");
  });

  it("prepares Anna's dose against the s15 vial stock", () => {
    const { state } = playCabin();
    const meta: MetaState = createMetaState();
    expect(meta.vial.doses).toBe(0);
    expect(meta.annaSupply.doses).toBe(SCENE_CATALOG.params.annaStartingDoses);
    const remaining = state.flags["anna.dosesRemaining"] ?? 0;
    expect(remaining).toBe(2);
    expect(createMercyStats(meta).maxPulse).toBeGreaterThan(0);
  });

  it("hands the remaining prepared doses to Anna's inheritance event", () => {
    const cabin = playCabin();
    let state = cabin.state;
    const events = [...cabin.events];
    const record = (result: SceneResult): void => {
      state = result.state;
      events.push(...result.events);
    };
    record(tryEnterScene(state, "anna_gravity", SCENE_CATALOG, { engaged: false }));
    for (const verb of [
      "ObserveBreath",
      "SitNear",
      "HoldHand",
      "SpeakName",
      "Pray",
      "KeepWatch",
      "WitnessDeath",
      "WriteName",
    ]) {
      record(applyVerb(state, verb, SCENE_CATALOG));
    }
    expect(events).toContainEqual({ type: "vial-inherited", tick: 0, doses: 2 });
  });

  it("refuses a skipped bread share", () => {
    let state = createSceneState(SCENE_CATALOG);
    state = tryEnterScene(state, "cabin_prologue", SCENE_CATALOG, { engaged: false }).state;
    const skipped = applyVerb(state, "ShareBread", SCENE_CATALOG);
    expect(skipped.events[0]?.type).toBe("verb-rejected");
  });
});
