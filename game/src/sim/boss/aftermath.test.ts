/**
 * Aftermath handoff (contract deliverable 5): defeat hands the tag payload to
 * the real s25 aftermath trigger, and the no-title-card invariant is enforced
 * as a source-level scan — the boss module carries no display name at all.
 */

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  applyVerb,
  createSceneState,
  createWardenAftermathTrigger,
  createWardenCeremonyTrigger,
  presentScene,
  stepScene,
} from "../scenes";
import type { SceneEvent, SceneResult, SceneState } from "../scenes";
import { SCENE_CATALOG } from "../scenes/catalog.test";
import { WARDEN_PARAMS, WARDEN_RING } from "./fixtures.test";
import type { WardenAftermathPayload, WardenState } from "./types";
import { createWardenState, stepWarden } from "./warden";

const MAX_PULSE = 900;

const seedState = (overrides: Partial<WardenState> = {}): WardenState => ({
  ...createWardenState({
    x: WARDEN_RING.centerX,
    z: WARDEN_RING.centerZ,
    pulse: MAX_PULSE,
    maxPulse: MAX_PULSE,
  }),
  ...overrides,
});

interface Handoff {
  readonly payloads: readonly WardenAftermathPayload[];
  readonly sceneState: SceneState;
  readonly sceneEvents: readonly SceneEvent[];
  readonly ceremonyBegins: number;
}

/** Defeat the Warden and route the handoff through the real s25 triggers. */
const runHandoff = (choice: "WriteName" | "WalkAway"): Handoff => {
  const ceremonyTrigger = createWardenCeremonyTrigger(SCENE_CATALOG);
  const aftermathTrigger = createWardenAftermathTrigger(SCENE_CATALOG);
  let sceneState = createSceneState(SCENE_CATALOG);
  const sceneEvents: SceneEvent[] = [];
  const payloads: WardenAftermathPayload[] = [];
  let ceremonyBegins = 0;
  const record = (result: SceneResult): void => {
    sceneState = result.state;
    sceneEvents.push(...result.events);
  };

  const ports = {
    ceremony: {
      pulsePercent: ceremonyTrigger.pulsePercent,
      holdTicks: ceremonyTrigger.holdTicks,
      shouldBegin: (pulse: number, max: number): boolean =>
        ceremonyTrigger.shouldBegin(pulse, max),
      begin: (): void => {
        ceremonyBegins += 1;
        record(ceremonyTrigger.begin(sceneState, { engaged: false }));
        for (let tick = 0; tick < ceremonyTrigger.holdTicks; tick += 1) {
          record(stepScene(sceneState, SCENE_CATALOG));
        }
      },
    },
    aftermath: {
      begin: (payload: WardenAftermathPayload): void => {
        payloads.push(payload);
        record(aftermathTrigger.begin(sceneState, { engaged: false }));
        record(applyVerb(sceneState, "DiscoverTag", SCENE_CATALOG));
        record(applyVerb(sceneState, choice, SCENE_CATALOG));
      },
    },
  };

  let state = seedState();
  const target = { targetX: WARDEN_RING.centerX + 2, targetZ: WARDEN_RING.centerZ };
  for (let tick = 0; tick < 600; tick += 1) {
    state = stepWarden(
      WARDEN_PARAMS,
      WARDEN_RING,
      state,
      { ...target, pulseDamage: tick % 10 === 0 ? 40 : 0 },
      ports,
    ).state;
  }
  expect(state.fsm).toBe("defeated");
  return { payloads, sceneState, sceneEvents, ceremonyBegins };
};

describe("aftermath handoff", () => {
  it("hands the tag payload to s25 exactly once, as text-bible key refs", () => {
    const handoff = runHandoff("WriteName");
    expect(handoff.ceremonyBegins).toBe(1);
    expect(handoff.payloads).toHaveLength(1);
    expect(handoff.payloads[0]).toEqual({
      tagItemId: "wardens_tag",
      tagTextKeys: [
        "boss.aftermath.tag_read",
        "item.key.wardens_tag.name",
        "item.key.wardens_tag.desc",
        "notebook.warden_tag",
      ],
      titleCard: false,
    });
    for (const key of handoff.payloads[0]?.tagTextKeys ?? []) {
      expect(key).toMatch(/^[a-z][a-z0-9_.]*$/);
    }
  });

  it("writing the name grants Recollection, cleanses Turn, and lights the arena Hearth", () => {
    const handoff = runHandoff("WriteName");
    expect(handoff.sceneState.flags["warden.written"]).toBe(1);
    expect(handoff.sceneState.flags["hud.unwrittenMark"]).toBe(0);
    expect(handoff.sceneEvents).toContainEqual(
      expect.objectContaining({ type: "names-witness", kind: "notebook", sourceId: "warden_tag" }),
    );
    expect(handoff.sceneEvents).toContainEqual(
      expect.objectContaining({ type: "turn-cleanse-request" }),
    );
    expect(handoff.sceneEvents).toContainEqual(
      expect.objectContaining({ type: "arena-hearth-light", hearthId: "arena" }),
    );
  });

  it("walking away leaves the unwritten mark and no Recollection", () => {
    const handoff = runHandoff("WalkAway");
    expect(handoff.sceneState.flags["warden.written"]).toBe(0);
    expect(handoff.sceneState.flags["hud.unwrittenMark"]).toBe(1);
    expect(handoff.sceneEvents.some((event) => event.type === "names-witness")).toBe(false);
  });
});

describe("no title card", () => {
  const bossDir = fileURLToPath(new URL(".", import.meta.url));
  // Everything in the module except this scanner, which necessarily spells the
  // forbidden pattern in its own assertions.
  const sources = readdirSync(bossDir)
    .filter((name) => name.endsWith(".ts") && name !== "aftermath.test.ts")
    .map((name) => ({ name, text: readFileSync(`${bossDir}${name}`, "utf8") }));
  const dataText = readFileSync(
    new URL("../../data/warden_params.json", import.meta.url),
    "utf8",
  );

  it("never spells the name anywhere in the module or its data", () => {
    expect(sources.length).toBeGreaterThan(5);
    for (const source of sources) {
      expect(source.text, source.name).not.toMatch(/arvo/i);
      expect(source.text, source.name).not.toMatch(/lampi/i);
    }
    expect(dataText).not.toMatch(/arvo/i);
    expect(dataText).not.toMatch(/lampi/i);
  });

  it("exposes no display-name field in the boss data", () => {
    const raw = JSON.parse(dataText) as unknown;
    const walk = (value: unknown, path: string): void => {
      if (Array.isArray(value)) {
        for (const [index, entry] of value.entries()) walk(entry, `${path}[${String(index)}]`);
        return;
      }
      if (typeof value !== "object" || value === null) return;
      for (const [key, entry] of Object.entries(value)) {
        expect(key, path).not.toMatch(/^(displayName|title|bossName|name)$/);
        walk(entry, `${path}.${key}`);
      }
    };
    walk(raw, "$");
  });

  it("emits no event carrying a human-readable name", () => {
    const handoff = runHandoff("WriteName");
    expect(handoff.payloads[0]?.titleCard).toBe(false);
    expect(WARDEN_PARAMS.aftermath.titleCard).toBe(false);
    for (const event of handoff.sceneEvents) {
      if (event.type === "title-card") {
        expect(event.shown).toBe(false);
      }
    }
    expect(presentScene(handoff.sceneState, SCENE_CATALOG).titleCard).toBe(false);
    expect(handoff.sceneState.flags["ui.titleCard"]).toBe(0);
  });
});
