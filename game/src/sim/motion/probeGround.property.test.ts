/**
 * D8 ground-probe property: the sim reference (`withDerivedGroundProbe`)
 * rests at one skin of vertical clearance and still reports support at exact
 * skin. The production MeshBVH adapter is proven against the same contract in
 * `view/world/probeGround.property.test.ts` (it cannot live here — sim purity
 * forbids importing view/).
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { spawnMotionState, stepMotion } from "./motion";
import { BruteForceQueries, createNastyLevel } from "./nasty_level";
import { parseMotionParams, type MotionParams } from "./params";
import { withDerivedGroundProbe } from "./queries";
import { capsuleAtFoot } from "./resolve";
import type { MotionInput } from "./types";

const params: MotionParams = parseMotionParams(
  JSON.parse(readFileSync(new URL("../../data/motion_params.json", import.meta.url), "utf8")),
);

const idle: MotionInput = { moveX: 0, moveZ: 0, sprint: false, jump: false };
const level = createNastyLevel();
const brute = new BruteForceQueries(level);
const queries = withDerivedGroundProbe(brute);

describe("sim probeGround reference (D8)", () => {
  it("idles on the 44° ramp at exactly one skin of vertical clearance", () => {
    let state = spawnMotionState(queries, params, { x: -4.5, y: 3, z: -3.5 }, 0, 100, 6);
    for (let tick = 0; tick < 30; tick += 1) {
      state = stepMotion(state, idle, queries, params).state;
    }
    expect(state.grounded).toBe(true);
    const hit = queries.probeGround({
      capsule: capsuleAtFoot(state.position, params),
      maxDistance: params.collision.groundSnapMeters + params.capsule.skin,
    });
    expect(hit).not.toBeNull();
    expect(hit?.distance).toBeCloseTo(params.capsule.skin, 5);

    const exactSkin = queries.probeGround({
      capsule: capsuleAtFoot(state.position, params),
      maxDistance: params.capsule.skin,
    });
    expect(exactSkin).not.toBeNull();
    expect(exactSkin?.distance).toBeCloseTo(params.capsule.skin, 5);
  });
});
