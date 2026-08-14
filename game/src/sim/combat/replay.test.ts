import { readFileSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { compileCombatData } from "./data";
import {
  COMBAT_REPLAY_FORMAT_VERSION,
  createGoldenCombatScenario,
  playCombatReplay,
  type CombatGoldenFixture,
} from "./replay";

const json = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

let fixture = json("./golden-combat-replay.json") as CombatGoldenFixture;
const data = compileCombatData(
  json("../../data/frame_data.json"),
  json("../../data/combat_params.json"),
);

describe("golden combat replay", () => {
  it("matches the committed per-tick hash sequence for both runs", () => {
    const script = createGoldenCombatScenario(data);
    const first = playCombatReplay(data, script);
    const second = playCombatReplay(data, script);
    if (process.env.UPDATE_COMBAT_REPLAY === "1") {
      fixture = {
        formatVersion: COMBAT_REPLAY_FORMAT_VERSION,
        hashSequence: first.hashSequence,
        rulesFingerprint: data.fingerprint,
      };
      writeFileSync(
        new URL("./golden-combat-replay.json", import.meta.url),
        `${JSON.stringify(fixture, null, 2)}\n`,
      );
    }

    expect(first.hashSequence).toEqual(fixture.hashSequence);
    expect(second).toEqual(first);
    expect(fixture).toMatchObject({
      formatVersion: COMBAT_REPLAY_FORMAT_VERSION,
      rulesFingerprint: data.fingerprint,
    });
    expect(first.events.some((event) => event.kind === "damage")).toBe(true);
    expect(first.events.some((event) => event.kind === "death")).toBe(true);
  });

  it("rejects replay data from another format or rules fingerprint", () => {
    const script = createGoldenCombatScenario(data);
    expect(() =>
      playCombatReplay(data, { ...script, formatVersion: 99 }),
    ).toThrow(/format/i);
    expect(() =>
      playCombatReplay(data, { ...script, rulesFingerprint: "stale" }),
    ).toThrow(/fingerprint/i);
    expect(() =>
      playCombatReplay(data, { ...script, durationTicks: -1 }),
    ).toThrow(/duration/i);
    expect(() =>
      playCombatReplay(data, {
        ...script,
        steps: [{ commands: [], swings: [], tick: -7 }],
      }),
    ).toThrow(/tick/i);
  });
});
