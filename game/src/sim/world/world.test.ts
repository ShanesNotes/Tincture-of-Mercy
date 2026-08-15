import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { compileWalkGraph, parseWolfAiParams } from "../ai";
import { parseAttendParams } from "../attend";
import { parseWardenParams } from "../boss";
import { acceptSidecar, compileCombatData, hashCanonical } from "../combat";
import { parseMotionParams } from "../motion";
import { parseSceneScripts } from "../scenes";
import {
  EMPTY_WORLD_INPUT,
  WORLD_BROWSER_GOLDEN_EXPECTED,
  WORLD_BROWSER_GOLDEN_REPLAY,
  WORLD_GOLDEN_EXPECTED,
  WORLD_GOLDEN_REPLAY,
  createWorldDebugSnapshot,
  createWorldDefinition,
  createWorldState,
  hashWorldState,
  playWorldReplay,
  stepWorld,
  type WorldQueries,
} from "./index";

const json = (url: URL): unknown => JSON.parse(readFileSync(url, "utf8"));
const data = (name: string): unknown => json(new URL(`../../data/${name}`, import.meta.url));
const asset = (name: string): unknown => json(new URL(`../../../assets/build/${name}`, import.meta.url));

const assembly = data("world_assembly.json");
const placements = data("levels/ironwood_placements.json");
const sidecarNames = [
  "kalev_blocking_guard.json",
  "kalev_blocking_heavy.json",
  "kalev_blocking_light1.json",
  "kalev_blocking_roll.json",
  "wolf_circle.json",
  "wolf_death_crumple_back.json",
  "wolf_death_crumple_fwd.json",
  "wolf_flinch.json",
  "wolf_idle.json",
  "wolf_lunge.json",
  "wolf_stalk.json",
] as const;

const definition = createWorldDefinition(assembly, {
  aiParams: parseWolfAiParams(data("wolf_ai_params.json")),
  attendParams: parseAttendParams(data("attend_params.json")),
  combatData: compileCombatData(data("frame_data.json"), data("combat_params.json")),
  motionParams: parseMotionParams(data("motion_params.json")),
  navGraph: compileWalkGraph(data("levels/ironwood_nav.json") as Parameters<typeof compileWalkGraph>[0]),
  placements,
  sceneCatalog: parseSceneScripts(data("scene_scripts.json")),
  sidecars: Object.fromEntries(sidecarNames.map((name) => [name, acceptSidecar(asset(name))])),
  wardenParams: parseWardenParams(data("warden_params.json"), data("frame_data.json")),
  zones: (data("levels/ironwood_manifest.json") as { readonly zones: unknown }).zones,
});

const queries: WorldQueries = {
  definition,
  probeGround: ({ capsule }) => ({
    distance: definition.motionParams.capsule.skin,
    normal: { x: 0, y: 1, z: 0 },
    point: { x: capsule.start.x, y: 0, z: capsule.start.z },
    triangleIndex: 0,
  }),
  raycast: () => null,
  sweepCapsule: () => null,
};

describe("world assembly", () => {
  it("validates the seam config and builds every sorted Ironwood pack", () => {
    expect(definition.fingerprint).toBe("99e1a118");
    expect(definition.player.id).toBe("kalev");
    expect(Object.keys(definition.packs)).toEqual(["den", "doorway", "road", "yard"]);
    expect(definition.packs.yard?.actors).toHaveLength(3);
    expect(definition.hearths.arena?.position).toEqual({ x: 0, y: 0, z: -126 });
    expect(() => createWorldDefinition({}, {
      aiParams: definition.aiParams,
      attendParams: definition.attendParams,
      combatData: definition.combatData,
      motionParams: definition.motionParams,
      navGraph: definition.navGraph,
      placements,
      sceneCatalog: definition.sceneCatalog,
      sidecars: definition.sidecars,
    })).toThrow(/world_assembly/u);
  });

  it("compiles deterministic leash-local nav graphs while retaining the full graph", () => {
    const yard = definition.packNavGraphs.yard;
    expect(yard).toBeDefined();
    expect(yard?.nodes.size).toBeGreaterThan(0);
    expect(yard?.nodes.size).toBeLessThan(definition.navGraph.nodes.size);
    for (const [nodeId, neighbors] of yard?.adj ?? []) {
      expect(yard?.nodes.has(nodeId)).toBe(true);
      expect(neighbors.every((neighbor) => yard?.nodes.has(neighbor.id))).toBe(true);
    }

    const again = createWorldDefinition(assembly, {
      aiParams: definition.aiParams,
      attendParams: definition.attendParams,
      combatData: definition.combatData,
      motionParams: definition.motionParams,
      navGraph: definition.navGraph,
      placements,
      sceneCatalog: definition.sceneCatalog,
      sidecars: definition.sidecars,
    });
    const againYard = again.packNavGraphs.yard;
    expect(againYard).toBeDefined();
    if (againYard === undefined || yard === undefined) return;
    expect([...againYard.nodes.keys()]).toEqual([...yard.nodes.keys()]);
  });

  it("fingerprints immutable nav and subsystem parameters, not Map shells", () => {
    const firstNode = [...definition.navGraph.nodes.entries()][0];
    expect(firstNode).toBeDefined();
    if (firstNode === undefined) return;
    const [nodeId, node] = firstNode;
    const changedNodes = new Map(definition.navGraph.nodes);
    changedNodes.set(nodeId, { ...node, x: node.x + 0.001 });
    const changedNav = createWorldDefinition(assembly, {
      aiParams: definition.aiParams,
      attendParams: definition.attendParams,
      combatData: definition.combatData,
      motionParams: definition.motionParams,
      navGraph: { nodes: changedNodes, adj: definition.navGraph.adj },
      placements,
      sceneCatalog: definition.sceneCatalog,
      sidecars: definition.sidecars,
    });
    const changedAi = createWorldDefinition(assembly, {
      aiParams: {
        ...definition.aiParams,
        perception: {
          ...definition.aiParams.perception,
          sightRangeM: definition.aiParams.perception.sightRangeM + 0.001,
        },
      },
      attendParams: definition.attendParams,
      combatData: definition.combatData,
      motionParams: definition.motionParams,
      navGraph: definition.navGraph,
      placements,
      sceneCatalog: definition.sceneCatalog,
      sidecars: definition.sidecars,
    });

    expect(changedNav.fingerprint).not.toBe(definition.fingerprint);
    expect(changedAi.fingerprint).not.toBe(definition.fingerprint);
  });

  it("wakes inside the cabin prologue and plays it with the interact key", () => {
    let state = createWorldState(queries);
    // s19 replaced s18's auto-complete: the prologue is played, not skipped.
    expect(state.scenes.completed).not.toContain("cabin_prologue");

    state = stepWorld(state, EMPTY_WORLD_INPUT, queries).state;
    expect(state.scenes.active?.scriptId).toBe("cabin_prologue");

    const applied: string[] = [];
    for (let press = 0; press < 5; press += 1) {
      const step = stepWorld(state, {
        ...EMPTY_WORLD_INPUT,
        edges: [{ action: "interact", pressed: true, sequence: 0, tick: state.tick }],
      }, queries);
      state = step.state;
      for (const event of step.events) {
        if (event.source === "scenes" && "type" in event.payload && event.payload.type === "verb-applied") {
          applied.push(event.payload.verb);
        }
      }
      state = stepWorld(state, EMPTY_WORLD_INPUT, queries).state;
    }

    expect(applied).toEqual(["DrawWater", "CarryWater", "BreakBread", "ShareBread", "DoseAnna"]);
    expect(state.scenes.completed).toContain("cabin_prologue");
    expect(state.scenes.active).toBeNull();
    expect(state.scenes.flags).toMatchObject({
      "anna.dosesAdministered": 1,
      "taught.attend": 1,
      "taught.bread": 1,
      "taught.flask": 1,
      "taught.interact": 1,
      "taught.water": 1,
    });
  });

  it("preserves authored placement roles for every spawned pack", () => {
    const state = createWorldState(queries);

    for (const [packId, pack] of Object.entries(state.aiPacks)) {
      for (const wolf of pack.wolves) {
        const authoredRole = definition.actors[wolf.id]?.authoredRole;
        expect(wolf.role, wolf.id).toBe(authoredRole);
        expect(pack.events).toContainEqual({
          tick: 0,
          kind: "role_assign",
          wolfId: wolf.id,
          detail: authoredRole,
        });
      }

      const player = state.actors.kalev;
      expect(player).toBeDefined();
      if (player === undefined) continue;
      const activated = stepWorld({
        ...state,
        actors: {
          ...state.actors,
          kalev: {
            ...player,
            motion: { ...player.motion, position: definition.packs[packId]?.home ?? player.motion.position },
          },
        },
      }, EMPTY_WORLD_INPUT, queries).state.aiPacks[packId];
      expect(activated).toBeDefined();
      for (const wolf of activated?.wolves ?? []) {
        expect(wolf.role, `${wolf.id} after active membership`).toBe(
          definition.actors[wolf.id]?.authoredRole,
        );
      }
    }
  });

  it("latches combat-authored tracking into hosted attack displacement", () => {
    const wolfId = "spawn.wolf.yard.lunger.0";
    const initial = createWorldState(queries);
    const combatActor = initial.combat.combat.actors[wolfId];
    expect(combatActor).toBeDefined();
    if (combatActor === undefined) return;
    const combatFacing = Math.PI / 2;
    const staged = {
      ...initial,
      combat: {
        ...initial.combat,
        combat: {
          ...initial.combat.combat,
          actors: {
            ...initial.combat.combat.actors,
            [wolfId]: {
              ...combatActor,
              facingRadians: combatFacing,
              action: {
                chargeHoldTicks: 0,
                charging: false,
                id: "lunge",
                instanceId: 999,
                tick: 0,
              },
            },
          },
        },
      },
    };

    const stepped = stepWorld(staged, EMPTY_WORLD_INPUT, queries).state;
    const motion = stepped.actors[wolfId]?.motion;
    expect(motion?.facing).toBeCloseTo(-Math.PI / 2, 12);
    expect(motion?.displacement?.facing).toBeCloseTo(-Math.PI / 2, 12);
  });

  it("steps every module in a repeatable order and keeps one token per pack", () => {
    let left = createWorldState(queries);
    let right = createWorldState(queries);
    for (let tick = 0; tick < 180; tick += 1) {
      const input = tick < 90 ? { ...EMPTY_WORLD_INPUT, moveZ: -1 } : EMPTY_WORLD_INPUT;
      left = stepWorld(left, input, queries).state;
      right = stepWorld(right, input, queries).state;
    }

    expect(hashWorldState(left)).toBe(hashWorldState(right));
    expect(createWorldDebugSnapshot(left, definition).tokenInvariant).toBe(true);
    expect(left.tick).toBe(180);
    expect(left.scenes.tick).toBe(180);
    expect(left.meta.tick).toBe(180);
  });

  it("does not reserve a Tincture when combat rejects the flask action start", () => {
    const state = createWorldState(queries);
    const stepped = stepWorld(state, {
      ...EMPTY_WORLD_INPUT,
      edges: [
        { action: "attack", pressed: true, sequence: 0, tick: 0 },
        { action: "flask", pressed: true, sequence: 1, tick: 0 },
      ],
    }, queries);

    expect(stepped.state.combat.combat.actors.kalev?.action?.id).toBe("light1");
    expect(stepped.state.meta.pending).toBeNull();
    expect(stepped.state.meta.vial.doses).toBe(3);
  });

  it("advances dormant pack clocks without moving distant unaware wolves", () => {
    const before = createWorldState(queries);
    const farWolfId = definition.packs.road?.actors[0]?.id;
    const yardWolfId = definition.packs.yard?.actors[0]?.id;
    expect(farWolfId).toBeDefined();
    expect(yardWolfId).toBeDefined();
    if (farWolfId === undefined || yardWolfId === undefined) return;

    const after = stepWorld(before, EMPTY_WORLD_INPUT, queries).state;
    const debug = createWorldDebugSnapshot(after, definition);

    expect(after.aiPacks.road?.tick).toBe(1);
    expect(after.actors[farWolfId]?.motion.tick).toBe(1);
    expect(after.actors[farWolfId]?.motion.position).toEqual(before.actors[farWolfId]?.motion.position);
    expect(after.aiPacks.yard?.tick).toBe(1);
    expect(after.actors[yardWolfId]?.motion.tick).toBe(1);
    expect(debug.actors.find((actor) => actor.kind === "player")?.active).toBe(true);
    expect(debug.actors.find((actor) => actor.id === farWolfId)?.active).toBe(false);
    expect(debug.actors.find((actor) => actor.id === yardWolfId)?.active).toBe(true);
  });

  it("cancels AI root displacement before its next authored sample leaves baked support", () => {
    const harrierId = "spawn.wolf.yard.harrier.0";
    const initial = createWorldState(queries);
    const harrier = initial.actors[harrierId];
    expect(harrier).toBeDefined();
    if (harrier === undefined) return;
    const atSupportEdge = {
      ...initial,
      actors: {
        ...initial.actors,
        [harrierId]: {
          ...harrier,
          motion: {
            ...harrier.motion,
            position: { x: harrier.motion.position.x, y: 0.02, z: 0 },
            grounded: true,
            displacement: {
              clip: {
                clipId: "test-bite",
                ticks: 2,
                rootXZ: [[0, 0] as const, [0, -0.2] as const],
              },
              tick: 0,
              facing: 0,
            },
          },
        },
      },
    };
    const edgeQueries: WorldQueries = {
      ...queries,
      probeGround: ({ capsule }) => capsule.start.z < -0.1
        ? null
        : {
            distance: definition.motionParams.capsule.skin,
            normal: { x: 0, y: 1, z: 0 },
            point: { x: capsule.start.x, y: 0, z: capsule.start.z },
            triangleIndex: 0,
          },
    };

    const after = stepWorld(atSupportEdge, EMPTY_WORLD_INPUT, edgeQueries).state.actors[harrierId]?.motion;

    expect(after?.position.z).toBe(0);
    expect(after?.grounded).toBe(true);
    expect(after?.displacement).toBeNull();
  });

  it("resolves a Hearth reset onto the first walkable collision surface above its marker", () => {
    const initial = createWorldState(queries);
    const player = initial.actors.kalev;
    const hearth = definition.hearths.cabin;
    expect(player).toBeDefined();
    expect(hearth).toBeDefined();
    if (player === undefined || hearth === undefined) return;
    const atHearth = {
      ...initial,
      actors: {
        ...initial.actors,
        kalev: {
          ...player,
          motion: { ...player.motion, position: hearth.position },
        },
      },
    };
    const raisedSurfaceY = hearth.position.y + 0.9;
    const raisedQueries: WorldQueries = {
      ...queries,
      raycast: ({ origin, direction, maxDistance }) => {
        if (direction.y >= 0) return null;
        const distance = origin.y - raisedSurfaceY;
        return distance < 0 || distance > maxDistance
          ? null
          : {
              distance,
              point: { x: origin.x, y: raisedSurfaceY, z: origin.z },
              normal: { x: 0, y: 1, z: 0 },
              triangleIndex: 7,
            };
      },
    };

    const rested = stepWorld(atHearth, {
      ...EMPTY_WORLD_INPUT,
      edges: [{ action: "interact", pressed: true, sequence: 0, tick: 0 }],
    }, raisedQueries).state;

    expect(rested.actors.kalev?.motion.position.y).toBeCloseTo(
      raisedSurfaceY + definition.motionParams.capsule.skin,
      12,
    );
  });

  it("locks the real-collision golden and replays its headless seam prefix", () => {
    expect(WORLD_GOLDEN_EXPECTED).toEqual({
      definitionFingerprint: "46ebb5b1",
      inputHash: "02ebb1ac",
      stateHash: "af250cb2",
    });
    expect(hashCanonical(WORLD_GOLDEN_REPLAY)).toBe(WORLD_GOLDEN_EXPECTED.inputHash);
    expect(WORLD_GOLDEN_REPLAY.durationTicks).toBe(23_776);
    expect(WORLD_GOLDEN_REPLAY.checkpointTicks).toEqual([
      1, 1327, 1370, 1977, 6753, 22140, 22348, 23776,
    ]);
    expect(WORLD_BROWSER_GOLDEN_EXPECTED).toEqual({
      definitionFingerprint: "46ebb5b1",
      inputHash: "473705f7",
      stateHash: "0e0810f9",
    });
    expect(hashCanonical(WORLD_BROWSER_GOLDEN_REPLAY)).toBe(
      WORLD_BROWSER_GOLDEN_EXPECTED.inputHash,
    );
    expect(WORLD_BROWSER_GOLDEN_REPLAY.durationTicks).toBe(41_413);

    // The full collision-backed loop is asserted twice in world.spec.ts. This
    // flat-query prefix keeps Vitest fast while still exercising the same DTO,
    // action/flask edges, clocks, and checkpoint hashes. Real collision owns the
    // exact 38-point damage assertion, so the flat adapter deliberately sees none.
    const durationTicks = 1_370;
    const prefix = playWorldReplay(queries, {
      ...WORLD_GOLDEN_REPLAY,
      durationTicks,
      frames: WORLD_GOLDEN_REPLAY.frames.filter(({ tick }) => tick < durationTicks),
      checkpointTicks: [1, 1327, durationTicks],
    });
    expect(prefix.stateHash).toBe("2f9a1b87");
    expect(prefix.checkpoints.map(({ tick, stateHash }) => ({ tick, stateHash }))).toEqual([
      { tick: 1, stateHash: "dfd68af5" },
      { tick: 1327, stateHash: "118fdfa1" },
      { tick: 1370, stateHash: "2f9a1b87" },
    ]);
    expect(prefix.checkpoints.every((entry) => entry.moduleClocksAligned)).toBe(true);
    expect(prefix.summary).toMatchObject({
      firstPlayerDamage: null,
      playerDamageTaken: 0,
      maxConcurrentAttackTokens: 1,
      flaskCommitted: true,
    });
  }, 30_000);
});
