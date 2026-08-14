import { describe, expect, it } from "vitest";

import { SCENE_CATALOG } from "./catalog.test";
import { beginItemRevelation } from "./ceremony";
import { applyVerb, createSceneState, presentScene } from "./host";
import type { SceneEvent, SceneResult, SceneState } from "./types";

const reveal = (itemId: string): { state: SceneState; events: SceneEvent[] } => {
  let state = createSceneState(SCENE_CATALOG);
  const events: SceneEvent[] = [];
  const record = (result: SceneResult): void => {
    state = result.state;
    events.push(...result.events);
  };
  record(beginItemRevelation(state, SCENE_CATALOG, { engaged: false }, itemId));
  record(applyVerb(state, "Behold", SCENE_CATALOG));
  record(applyVerb(state, "Take", SCENE_CATALOG));
  return { state, events };
};

describe("item revelation", () => {
  it("holds the CM27–33 frame for vial inheritance", () => {
    const { state, events } = reveal("vial");
    expect(state.active).toBeNull();
    expect(events).toContainEqual({ type: "camera-hold", tick: 0, anchorId: "cam.item_revelation" });
    expect(events).toContainEqual({
      type: "item-revealed",
      tick: 0,
      itemId: "vial",
      textKeys: SCENE_CATALOG.params.items.vial?.textKeys,
    });
    const mid = beginItemRevelation(
      createSceneState(SCENE_CATALOG),
      SCENE_CATALOG,
      { engaged: false },
      "vial",
    );
    expect(presentScene(mid.state, SCENE_CATALOG).stagedAnchorId).toBe("cam.item_revelation");
  });

  it("holds the same frame for the hearth-iron pickup", () => {
    const { events } = reveal("hearth_iron");
    expect(events).toContainEqual({
      type: "item-revealed",
      tick: 0,
      itemId: "hearth_iron",
      textKeys: SCENE_CATALOG.params.items.hearth_iron?.textKeys,
    });
    const names = SCENE_CATALOG.params.items.hearth_iron?.textKeys ?? [];
    expect(names).toContain("item.weapon.hearth_iron.desc");
    expect(names).toContain("item.weapon.hearth_iron.lore");
  });
});
