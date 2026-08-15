import { describe, expect, it } from "vitest";

import {
  arriveAtHearth,
  awardNames,
  bankNames,
  craftVariant,
  createMercyStats,
  createMetaState,
  hearthRest,
  leaveHearth,
  refillVial,
  respawnAtHearth,
  spendNames,
} from "../meta";
import type { MercyStats, MetaEvent, MetaState } from "../meta";
import { SCENE_CATALOG } from "./catalog.test";
import { applyVerb, createSceneState, tryEnterScene } from "./host";
import type { SceneEvent, SceneResult, SceneState } from "./types";

const playHearth = (): { state: SceneState; events: SceneEvent[] } => {
  let state = createSceneState(SCENE_CATALOG);
  const events: SceneEvent[] = [];
  const record = (result: SceneResult): void => {
    state = result.state;
    events.push(...result.events);
  };
  record(
    tryEnterScene(state, "hearth_vigil", SCENE_CATALOG, { engaged: false }, { hearthId: "cabin" }),
  );
  for (const verb of ["Approach", "Light", "Wait", "Remember", "Leave"]) {
    record(applyVerb(state, verb, SCENE_CATALOG));
  }
  return { state, events };
};

const applyHearthEvents = (
  events: readonly SceneEvent[],
  start: MetaState,
  startStats: MercyStats,
): { state: MetaState; stats: MercyStats; events: MetaEvent[] } => {
  let state = start;
  let stats = startStats;
  const metaEvents: MetaEvent[] = [];
  for (const event of events) {
    switch (event.type) {
      case "hearth-arrive":
        state = arriveAtHearth(state, event.hearthId);
        break;
      case "hearth-rest-request": {
        const rested = hearthRest(state, stats, event.hearthId);
        state = rested.state;
        stats = rested.stats;
        metaEvents.push(...rested.events);
        break;
      }
      case "hearth-refill-request":
        state = refillVial(state);
        break;
      case "hearth-respawn-request": {
        const back = respawnAtHearth(state, stats, event.hearthId);
        state = back.state;
        stats = back.stats;
        metaEvents.push(...back.events);
        break;
      }
      case "hearth-bank-request": {
        const banked = bankNames(state);
        state = banked.state;
        metaEvents.push(...banked.events);
        break;
      }
      case "hearth-level-request": {
        const spent = spendNames(state, "pulse");
        state = spent.state;
        metaEvents.push(...spent.events);
        break;
      }
      case "hearth-craft-request":
        state = craftVariant(state, "salt_wash");
        break;
      case "hearth-leave":
        state = leaveHearth(state);
        break;
      default:
        break;
    }
  }
  return { state, stats, events: metaEvents };
};

describe("Hearth keeping-vigil", () => {
  it("walks approach / light / wait / remember / leave", () => {
    const { state, events } = playHearth();
    expect(state.active).toBeNull();
    expect(state.flags["hearth.lit"]).toBe(1);
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "hearth-arrive",
        "hud-border-state",
        "hearth-rest-request",
        "hearth-refill-request",
        "hearth-respawn-request",
        "hearth-bank-request",
        "hearth-level-request",
        "hearth-craft-request",
        "hearth-leave",
        "camera-hold",
        "camera-release",
      ]),
    );
  });

  it("round-trips s15 rest, refill, bank, level, craft, and leave", () => {
    const { events } = playHearth();
    let meta = createMetaState();
    meta = { ...meta, inherited: true, vial: { ...meta.vial, doses: 0 }, numbnessStacks: 2 };
    meta = awardNames(meta, "witness", "anna_death").state;
    const drained = createMercyStats(meta);
    const wounded: MercyStats = { ...drained, pulse: 20, turn: 40 };
    const applied = applyHearthEvents(events, meta, wounded);
    expect(applied.state.vial.doses).toBe(3);
    expect(applied.state.names.carried).toBe(0);
    expect(applied.state.names.banked).toBeGreaterThan(0);
    expect(applied.state.atHearth).toBe(false);
    expect(applied.state.lastHearthId).toBe("cabin");
    expect(applied.stats.pulse).toBe(applied.stats.maxPulse);
    expect(applied.stats.turn).toBe(0);
    expect(applied.state.vigilRestore).toBe(1);
    expect(applied.events.some((event) => event.type === "hearth-rested")).toBe(true);
  });

  it("is repeatable after leaving", () => {
    const first = playHearth();
    const again = tryEnterScene(first.state, "hearth_vigil", SCENE_CATALOG, { engaged: false });
    expect(again.state.active?.scriptId).toBe("hearth_vigil");
  });
});
