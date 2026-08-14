import { describe, expect, it } from "vitest";

import { SCENE_CATALOG } from "./catalog.test";
import { SceneEngagementError } from "./combat";
import {
  applyVerb,
  createSceneState,
  presentScene,
  sceneTextKeys,
  tryEnterScene,
} from "./host";
import type { SceneEvent, SceneResult, SceneState } from "./types";

const BEDSIDE = [
  "ObserveBreath",
  "SitNear",
  "HoldHand",
  "SpeakName",
  "Pray",
  "KeepWatch",
] as const;

const permute = <T>(items: readonly T[]): T[][] => {
  if (items.length <= 1) {
    return [[...items]];
  }
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += 1) {
    const head = items[index];
    if (head === undefined) {
      continue;
    }
    for (const tail of permute(items.filter((_, inner) => inner !== index))) {
      out.push([head, ...tail]);
    }
  }
  return out;
};

const play = (verbs: readonly string[]): { state: SceneState; events: SceneEvent[] } => {
  let state = createSceneState(SCENE_CATALOG);
  const events: SceneEvent[] = [];
  const record = (result: SceneResult): void => {
    state = result.state;
    events.push(...result.events);
  };
  record(tryEnterScene(state, "anna_gravity", SCENE_CATALOG, { engaged: false }));
  for (const verb of verbs) {
    record(applyVerb(state, verb, SCENE_CATALOG));
  }
  return { state, events };
};

const outcomeOf = (events: readonly SceneEvent[]): readonly string[] => {
  const lines: string[] = [];
  for (const event of events) {
    switch (event.type) {
      case "notebook-line":
        lines.push(`${event.type}:${event.textKey}`);
        break;
      case "names-witness":
        lines.push(`${event.type}:${event.kind}.${event.sourceId}`);
        break;
      case "vial-inherited":
        lines.push(`${event.type}:${event.doses}`);
        break;
      case "hearth-dim":
        lines.push(`${event.type}:${event.rampSteps}:${event.percent}`);
        break;
      case "item-reveal-request":
        lines.push(`${event.type}:${event.itemId}`);
        break;
      default:
        break;
    }
  }
  return lines;
};

describe("Anna gravity encounter", () => {
  it("cannot enter during combat engagement", () => {
    const state = createSceneState(SCENE_CATALOG);
    expect(() => tryEnterScene(state, "anna_gravity", SCENE_CATALOG, { engaged: true })).toThrow(
      SceneEngagementError,
    );
  });

  it("cannot skip WitnessDeath or WriteName", () => {
    const early = play(["WitnessDeath", "WriteName"]);
    expect(early.events.some((event) => event.type === "verb-rejected")).toBe(true);
    expect(early.events.some((event) => event.type === "hearth-dim")).toBe(false);
    expect(early.state.active?.scriptId).toBe("anna_gravity");
    expect(presentScene(early.state, SCENE_CATALOG).stepId).toBe("bedside");
  });

  it("cannot jump to WriteName before the bedside verbs", () => {
    const jumped = play(["WriteName"]);
    expect(jumped.events).toContainEqual({
      type: "verb-rejected",
      tick: 0,
      scriptId: "anna_gravity",
      verb: "WriteName",
      reason: "unknown",
    });
  });

  it("plays the eight presence verbs to a fixed outcome", () => {
    const { state, events } = play([...BEDSIDE, "WitnessDeath", "WriteName"]);
    expect(state.active).toBeNull();
    expect(state.completed).toContain("anna_gravity");
    expect(state.flags["anna.dead"]).toBe(1);
    expect(state.flags["anna.written"]).toBe(1);
    expect(events).toContainEqual({
      type: "hearth-dim",
      tick: 0,
      rampSteps: 1,
      percent: 18,
    });
    expect(events).toContainEqual({ type: "vial-inherited", tick: 0, doses: 3 });
    expect(events).toContainEqual({
      type: "names-witness",
      tick: 0,
      kind: "witness",
      sourceId: "anna_death",
    });
    expect(sceneTextKeys(events)).toContain("npc.anna.presence.witness_death");
    expect(sceneTextKeys(events)).toContain("notebook.borrowed_mercy");
  });

  it("keeps the same outcome for every bedside verb order", () => {
    const reference = outcomeOf(play([...BEDSIDE, "WitnessDeath", "WriteName"]).events);
    for (const order of permute(BEDSIDE)) {
      expect(outcomeOf(play([...order, "WitnessDeath", "WriteName"]).events)).toEqual(reference);
    }
  });

  it("holds the s20 Anna camera anchor and releases on exit", () => {
    const { events } = play([...BEDSIDE, "WitnessDeath", "WriteName"]);
    expect(events).toContainEqual({
      type: "camera-hold",
      tick: 0,
      anchorId: "cam.anna_death",
    });
    expect(events.some((event) => event.type === "camera-release" && event.anchorId === "cam.anna_death")).toBe(
      true,
    );
  });
});
