import { describe, expect, it } from "vitest";

import { SCENE_CATALOG } from "./catalog.test";
import { SceneEngagementError } from "./combat";
import { applyVerb, createSceneState, presentScene, tryEnterScene } from "./host";
import type { SceneEvent, SceneResult, SceneState } from "./types";

const playBirdie = (): { state: SceneState; events: SceneEvent[] } => {
  let state = createSceneState(SCENE_CATALOG);
  const events: SceneEvent[] = [];
  const record = (result: SceneResult): void => {
    state = result.state;
    events.push(...result.events);
  };
  record(tryEnterScene(state, "birdie_coda", SCENE_CATALOG, { engaged: false }));
  for (const verb of ["MeetBirdie", "OfferApple", "HearMisname", "TakeRoad"]) {
    record(applyVerb(state, verb, SCENE_CATALOG));
  }
  return { state, events };
};

describe("Birdie coda", () => {
  it("is register-locked and refuses engagement", () => {
    const idle = createSceneState(SCENE_CATALOG);
    expect(() => tryEnterScene(idle, "birdie_coda", SCENE_CATALOG, { engaged: true })).toThrow(
      SceneEngagementError,
    );
    const entered = tryEnterScene(idle, "birdie_coda", SCENE_CATALOG, { engaged: false });
    expect(presentScene(entered.state, SCENE_CATALOG).registerLocked).toBe(true);
    expect(presentScene(entered.state, SCENE_CATALOG).stagedAnchorId).toBe("cam.birdie_coda");
  });

  it("plays apple refusal, Caleb misnaming, and the slice-exit flag", () => {
    const { state, events } = playBirdie();
    expect(state.flags["birdie.refused"]).toBe(1);
    expect(state.flags["slice.exit"]).toBe(1);
    expect(state.completed).toContain("birdie_coda");
    expect(events).toContainEqual({
      type: "caleb-misname",
      tick: 0,
      textKey: "npc.birdie.caleb_misname",
    });
    expect(events).toContainEqual({ type: "slice-exit", tick: 0 });
    expect(events).toContainEqual({
      type: "names-witness",
      tick: 0,
      kind: "witness",
      sourceId: "birdie_threshold",
    });
  });

  it("cannot skip the refusal threshold", () => {
    let state = createSceneState(SCENE_CATALOG);
    state = tryEnterScene(state, "birdie_coda", SCENE_CATALOG, { engaged: false }).state;
    const skipped = applyVerb(state, "TakeRoad", SCENE_CATALOG);
    expect(skipped.events[0]?.type).toBe("verb-rejected");
    expect(skipped.state.flags["slice.exit"]).toBe(0);
  });
});
