import { describe, expect, it } from "vitest";

import {
  arriveAtHearth,
  awardNames,
  createMercyStats,
  createMetaState,
} from "../meta";
import type { MercyStats, MetaState } from "../meta";
import { SCENE_CATALOG } from "./catalog.test";
import {
  createWardenAftermathTrigger,
  createWardenCeremonyTrigger,
} from "./ceremony";
import { applyVerb, createSceneState, presentScene, stepScene } from "./host";
import type { SceneEvent, SceneResult, SceneState } from "./types";

const runCeremony = (): { state: SceneState; events: SceneEvent[] } => {
  const trigger = createWardenCeremonyTrigger(SCENE_CATALOG);
  let state = createSceneState(SCENE_CATALOG);
  const events: SceneEvent[] = [];
  const record = (result: SceneResult): void => {
    state = result.state;
    events.push(...result.events);
  };
  expect(trigger.shouldBegin(55, 100)).toBe(true);
  expect(trigger.shouldBegin(56, 100)).toBe(false);
  record(trigger.begin(state, { engaged: false }));
  const hold = SCENE_CATALOG.params.ceremonyHoldTicks;
  for (let tick = 0; tick < hold; tick += 1) {
    record(stepScene(state, SCENE_CATALOG));
  }
  return { state, events };
};

const runAftermath = (choice: "WriteName" | "WalkAway"): { state: SceneState; events: SceneEvent[] } => {
  const trigger = createWardenAftermathTrigger(SCENE_CATALOG);
  let state = createSceneState(SCENE_CATALOG);
  const events: SceneEvent[] = [];
  const record = (result: SceneResult): void => {
    state = result.state;
    events.push(...result.events);
  };
  record(trigger.begin(state, { engaged: false }));
  record(applyVerb(state, "DiscoverTag", SCENE_CATALOG));
  record(applyVerb(state, choice, SCENE_CATALOG));
  return { state, events };
};

describe("Warden ceremony trigger", () => {
  it("opens a 90t invulnerable no-damage hold on the lantern-hang plate", () => {
    const trigger = createWardenCeremonyTrigger(SCENE_CATALOG);
    expect(trigger.pulsePercent).toBe(55);
    expect(trigger.holdTicks).toBe(90);
    const { state, events } = runCeremony();
    expect(state.active).toBeNull();
    expect(state.completed).toContain("warden_ceremony");
    expect(events).toContainEqual({ type: "ceremony-started", tick: 0, holdTicks: 90 });
    expect(events).toContainEqual({
      type: "invulnerable-hold",
      tick: 0,
      ticks: 90,
      dealsDamage: false,
    });
    expect(events).toContainEqual({ type: "ceremony-ended", tick: 90 });
    expect(events).toContainEqual({ type: "camera-hold", tick: 0, anchorId: "cam.warden_intro" });
    const mid = createWardenCeremonyTrigger(SCENE_CATALOG).begin(
      createSceneState(SCENE_CATALOG),
      { engaged: false },
    );
    expect(presentScene(mid.state, SCENE_CATALOG).propAnchorId).toBe("lantern.hang");
  });

  it("refuses the ceremony while combat is engaged", () => {
    const trigger = createWardenCeremonyTrigger(SCENE_CATALOG);
    const state = createSceneState(SCENE_CATALOG);
    expect(() => trigger.begin(state, { engaged: true })).toThrow(/engagement/);
  });
});

describe("Warden aftermath", () => {
  it("writes the name: Recollection, Turn cleanse, arena hearth, no unwritten mark", () => {
    const { state, events } = runAftermath("WriteName");
    expect(state.flags["warden.written"]).toBe(1);
    expect(state.flags["hud.unwrittenMark"]).toBe(0);
    expect(events).toContainEqual({
      type: "names-witness",
      tick: 0,
      kind: "notebook",
      sourceId: "warden_tag",
    });
    expect(events).toContainEqual({ type: "turn-cleanse-request", tick: 0 });
    expect(events).toContainEqual({ type: "arena-hearth-light", tick: 0, hearthId: "arena" });
    expect(events).toContainEqual({ type: "unwritten-mark", tick: 0, set: false });

    let meta: MetaState = createMetaState();
    const stats: MercyStats = { ...createMercyStats(meta), turn: 70 };
    const names = awardNames(meta, "notebook", "warden_tag");
    meta = names.state;
    const cleansed: MercyStats = { ...stats, turn: 0 };
    meta = arriveAtHearth(meta, "arena");
    expect(meta.names.carried).toBe(200);
    expect(cleansed.turn).toBe(0);
    expect(meta.atHearth).toBe(true);
    expect(meta.lastHearthId).toBe("arena");
  });

  it("walks away: unwritten mark, tag kept, no Recollection", () => {
    const { state, events } = runAftermath("WalkAway");
    expect(state.flags["warden.written"]).toBe(0);
    expect(state.flags["hud.unwrittenMark"]).toBe(1);
    expect(events).toContainEqual({ type: "unwritten-mark", tick: 0, set: true });
    expect(events.some((event) => event.type === "names-witness")).toBe(false);
    expect(events.some((event) => event.type === "arena-hearth-light")).toBe(false);
  });

  it("never shows a title card", () => {
    const ceremony = runCeremony();
    const written = runAftermath("WriteName");
    const walked = runAftermath("WalkAway");
    for (const pack of [ceremony, written, walked]) {
      expect(pack.state.flags["ui.titleCard"]).toBe(0);
      expect(presentScene(pack.state, SCENE_CATALOG).titleCard).toBe(false);
      const cards = pack.events.filter((event) => event.type === "title-card");
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.every((event) => event.type === "title-card" && event.shown === false)).toBe(true);
    }
  });
});
