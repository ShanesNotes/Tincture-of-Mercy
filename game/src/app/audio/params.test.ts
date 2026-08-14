import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { loadCommittedAudioParams } from "./load_params";
import { parseAudioParams } from "./params";

const params = loadCommittedAudioParams();
const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, "../../../assets/audio");

describe("audio_params", () => {
  it("carries TUNING_V0 hitstop ticks verbatim", () => {
    expect(params.tickHz).toBe(60);
    expect(params.hitstopTicks).toMatchObject({
      light: 3,
      heavy: 6,
      charged: 8,
      blocked: 5,
      guard_break: 9,
      critical: 12,
    });
    expect(params.onsetLeadTicks).toBe(2);
    expect(params.clock.impactWindowMs).toBe(10);
  });

  it("pairs every impact cue with its hitstop row", () => {
    expect(params.cues["impact.light"]?.hitstopTicks).toBe(3);
    expect(params.cues["impact.heavy"]?.hitstopTicks).toBe(6);
    expect(params.cues["impact.charged"]?.hitstopTicks).toBe(8);
    expect(params.cues["impact.blocked"]?.hitstopTicks).toBe(5);
    expect(params.cues["impact.guard_break"]?.hitstopTicks).toBe(9);
    expect(params.cues["impact.critical"]?.hitstopTicks).toBe(12);
    expect(params.cues["sting.death"]?.duckGroup).toBe("sting");
    expect(params.cues["sting.death"]?.priority).toBe(100);
  });

  it("uses tick-seeded jitter on sim-adjacent one-shots and none on beds", () => {
    expect(params.cues["hit.light"]?.seedPolicy).toBe("tick");
    expect(params.cues["ambience.forest_damp"]?.seedPolicy).toBe("none");
    expect(params.cues["sting.death"]?.seedPolicy).toBe("none");
  });

  it("points every cue at a generated placeholder wav", () => {
    for (const [cueId, cue] of Object.entries(params.cues)) {
      expect(cue.file.startsWith("placeholder/"), cueId).toBe(true);
      expect(existsSync(join(assets, cue.file)), cue.file).toBe(true);
    }
  });

  it("rejects a missing cue referenced by a binding", () => {
    const raw = JSON.parse(JSON.stringify(params)) as {
      cues: Record<string, unknown>;
      bindings: Record<string, Record<string, string[]>>;
    };
    raw.bindings["combat.hit"] = { light: ["does.not.exist"] };
    expect(() => parseAudioParams(raw)).toThrow(/missing cue/);
  });

  it("rejects an unsupported version", () => {
    expect(() => parseAudioParams({ version: 99 })).toThrow(/unsupported version/);
  });

  it("never calls Math.random on the sim-adjacent TypeScript path", () => {
    const files = readdirSync(here).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"));
    for (const name of files) {
      expect(readFileSync(join(here, name), "utf8"), name).not.toMatch(/Math\.random\s*\(/);
    }
  });
});
