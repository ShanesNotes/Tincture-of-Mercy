import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { compileCombatData, type CombatData } from "../combat";
import { parseWardenParams } from "./params";
import { parseSnareRing } from "./ring";
import type { WardenParams, WardenRingGeometry } from "./types";

const read = (relative: string): unknown =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8")) as unknown;

export const RAW_FRAME_DATA = read("../../data/frame_data.json");
export const RAW_COMBAT_PARAMS = read("../../data/combat_params.json");
export const RAW_WARDEN_PARAMS = read("../../data/warden_params.json");
export const RAW_PLACEMENTS = read("../../data/levels/ironwood_placements.json");

export const WARDEN_PARAMS: WardenParams = parseWardenParams(RAW_WARDEN_PARAMS, RAW_FRAME_DATA);
export const WARDEN_RING: WardenRingGeometry = parseSnareRing(RAW_PLACEMENTS, WARDEN_PARAMS);
export const COMBAT_DATA: CombatData = compileCombatData(RAW_FRAME_DATA, RAW_COMBAT_PARAMS);

describe("boss fixtures", () => {
  it("compiles the shipping Warden data once for the suite", () => {
    expect(WARDEN_PARAMS.version).toBe(1);
    expect(WARDEN_RING.postCount).toBeGreaterThanOrEqual(3);
    expect(COMBAT_DATA.frameData.moves.warden_p1_overhead_fell?.startupTicks).toBe(32);
  });
});
