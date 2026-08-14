import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { compileCombatData } from "./data";
import {
  WEAPON_SWEEP_SUBSTEPS,
  UniformCapsuleGrid,
  capsuleBounds,
  capsulesIntersect,
  queryGridCandidates,
  segmentDistanceSquared,
  sweepWeaponCapsule,
  type Capsule,
  type GridActor,
} from "./geometry";

const capsule = (
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  radius: number,
): Capsule => ({
  a: { x: ax, y: ay, z: az },
  b: { x: bx, y: by, z: bz },
  radius,
});

const intersectsActor = (actor: GridActor, query: Capsule): boolean =>
  actor.capsules.some((candidate) => capsulesIntersect(candidate, query));

const json = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const combatData = compileCombatData(
  json("../../data/frame_data.json"),
  json("../../data/combat_params.json"),
);

describe("capsule geometry", () => {
  it("finds the analytic closest distance for crossing and degenerate segments", () => {
    expect(
      segmentDistanceSquared(
        { x: -1, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 1, z: 0 },
      ),
    ).toBe(0);
    expect(
      segmentDistanceSquared(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 3, y: 4, z: 0 },
        { x: 3, y: 4, z: 0 },
      ),
    ).toBe(25);
  });

  it("treats tangent capsule contact as a hit", () => {
    const first = capsule(0, 0, 0, 0, 1, 0, 0.25);
    const tangent = capsule(0.5, 0, 0, 0.5, 1, 0, 0.25);
    const clear = capsule(0.501, 0, 0, 0.501, 1, 0, 0.25);

    expect(capsulesIntersect(first, tangent)).toBe(true);
    expect(capsulesIntersect(first, clear)).toBe(false);
  });

  it("sweeps continuously when both tick-boundary weapon poses are clear", () => {
    const previous = capsule(-2, 1, 0, -1, 1, 0, 0.05);
    const current = capsule(1, 1, 0, 2, 1, 0, 0.05);
    const hurtbox = capsule(0, 0.65, 0, 0, 1.35, 0, 0.35);

    expect(capsulesIntersect(previous, hurtbox)).toBe(false);
    expect(capsulesIntersect(current, hurtbox)).toBe(false);
    expect(sweepWeaponCapsule(previous, current, hurtbox)).not.toBeNull();
    expect(WEAPON_SWEEP_SUBSTEPS).toBe(3);
  });

  it("does not tunnel a long rotating weapon at the fastest plausible authored cap", () => {
    const maxTurnPerTick = combatData.params.collision.maxAngularRadiansPerTick;
    const length =
      combatData.params.collision.maxWeaponTipSpeedMetersPerTick / maxTurnPerTick;
    const previous = capsule(
      0,
      1,
      0,
      Math.sin(-maxTurnPerTick / 2) * length,
      1,
      -Math.cos(-maxTurnPerTick / 2) * length,
      0.04,
    );
    const current = capsule(
      0,
      1,
      0,
      Math.sin(maxTurnPerTick / 2) * length,
      1,
      -Math.cos(maxTurnPerTick / 2) * length,
      0.04,
    );

    // Targets are centered between discrete sub-step poses, where pose-only
    // sampling would be most likely to tunnel.
    for (let sample = 0; sample < 60; sample += 1) {
      const fraction = (sample + 0.5) / 60;
      const angle = -maxTurnPerTick / 2 + maxTurnPerTick * fraction;
      const distance = length - 0.35 + ((sample * 17) % 11) * 0.01;
      const hurtbox = capsule(
        Math.sin(angle) * distance,
        0.65,
        -Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        1.35,
        -Math.cos(angle) * distance,
        0.35,
      );

      expect(sweepWeaponCapsule(previous, current, hurtbox)).not.toBeNull();
    }
  });
});

describe("UniformCapsuleGrid", () => {
  it("handles negative cells and returns sorted, deduplicated actor IDs", () => {
    const actors: readonly GridActor[] = [
      { id: 12, capsules: [capsule(-1.4, 0, -0.1, 1.4, 0, -0.1, 0.2)] },
      { id: 3, capsules: [capsule(-0.9, 0, 0, -0.9, 1, 0, 0.2)] },
      { id: 7, capsules: [capsule(8, 0, 8, 8, 1, 8, 0.2)] },
    ];
    const query = capsule(-1, 0, 0, -1, 1, 0, 0.35);
    const grid = new UniformCapsuleGrid(0.5, actors);

    expect(grid.queryBounds(capsuleBounds(query))).toEqual([3, 12]);
    expect(grid.queryCapsule(query)).toEqual([3, 12]);
    expect(queryGridCandidates(actors, query, 0.5)).toEqual([3, 12]);
  });

  it("matches brute-force collision results across shuffled randomized scenes", () => {
    let randomState = 0x6d2b_79f5;
    const random = (): number => {
      randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
      return randomState / 0x1_0000_0000;
    };

    for (let scene = 0; scene < 80; scene += 1) {
      const actors: GridActor[] = [];
      for (let id = 0; id < 40; id += 1) {
        const x = random() * 24 - 12;
        const y = random() * 3 - 1;
        const z = random() * 24 - 12;
        actors.push({
          id,
          capsules: [
            capsule(
              x,
              y,
              z,
              x + random() - 0.5,
              y + random() * 1.5,
              z + random() - 0.5,
              0.05 + random() * 0.45,
            ),
          ],
        });
      }
      actors.sort(() => random() - 0.5);
      const x = random() * 20 - 10;
      const z = random() * 20 - 10;
      const query = capsule(x, -0.5, z, x, 2, z, 0.35);
      const byId = new Map(actors.map((actor) => [actor.id, actor]));
      const gridHits = queryGridCandidates(actors, query, 0.75).filter((id) => {
        const actor = byId.get(id);
        return actor !== undefined && intersectsActor(actor, query);
      });
      const bruteForceHits = actors
        .filter((actor) => intersectsActor(actor, query))
        .map((actor) => actor.id)
        .sort((left, right) => left - right);

      expect(gridHits).toEqual(bruteForceHits);
    }
  });
});
