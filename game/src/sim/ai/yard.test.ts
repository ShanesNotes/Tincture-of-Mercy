import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { hashWolfAiState } from "./hash";
import { parseWolfAiParams } from "./params";
import { runYardScenario, YARD_DURATION_TICKS, YARD_HOWL_TICK } from "./yard";

const here = dirname(fileURLToPath(import.meta.url));
const goldenPath = join(here, "yard_golden.json");

const params = parseWolfAiParams(
  JSON.parse(readFileSync(join(here, "../../data/wolf_ai_params.json"), "utf8")) as unknown,
);

interface YardGolden {
  readonly durationTicks: number;
  readonly howlTick: number;
  readonly roleActionCount: number;
  readonly stateHash: string;
  readonly tokenGrantCount: number;
}

describe("yard 3-wolf scenario", () => {
  it("engages a scripted dummy and logs token grants plus role actions", () => {
    const run = runYardScenario(params);
    expect(run.durationTicks).toBe(YARD_DURATION_TICKS);
    expect(run.tokenGrants.length).toBeGreaterThan(0);
    expect(run.roleActions.length).toBeGreaterThan(0);
    expect(run.events.some((entry) => entry.kind === "howl" && entry.tick === YARD_HOWL_TICK)).toBe(true);
    expect(run.state.wolves).toHaveLength(3);
    expect(new Set(run.state.wolves.map((wolf) => wolf.role))).toEqual(
      new Set(["baiter", "lunger", "harrier"]),
    );
  });

  it("is byte-stable across two independent runs", () => {
    const first = runYardScenario(params);
    const second = runYardScenario(params);
    expect(second.stateHash).toBe(first.stateHash);
    expect(hashWolfAiState(second.state)).toBe(first.stateHash);
    expect(second.events).toEqual(first.events);
  });

  it("matches the committed golden hash (regen: npm run replay:regen:ai)", () => {
    const run = runYardScenario(params);
    const snapshot: YardGolden = {
      durationTicks: run.durationTicks,
      howlTick: YARD_HOWL_TICK,
      roleActionCount: run.roleActions.length,
      stateHash: run.stateHash,
      tokenGrantCount: run.tokenGrants.length,
    };

    if (process.env.REGEN_AI_GOLDEN === "1") {
      writeFileSync(goldenPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    }

    const golden = JSON.parse(readFileSync(goldenPath, "utf8")) as YardGolden;
    expect(run.stateHash).toBe(golden.stateHash);
    expect(run.durationTicks).toBe(golden.durationTicks);
    expect(run.tokenGrants.length).toBe(golden.tokenGrantCount);
    expect(run.roleActions.length).toBe(golden.roleActionCount);
  });
});
