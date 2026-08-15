/**
 * Gauntlet round-1 finding G3 — backstab/riposte were unreachable from the
 * world input map: `playerCommands` mapped every attack press to `light1`, so
 * the authored 90-tick critical rows and `requestBackstab`/`requestRiposte`
 * could never fire in a real session. These are the reachability repros for
 * both the Attend-locked and the unlocked-aim paths.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { compileWalkGraph, parseWolfAiParams } from "../ai";
import { parseAttendParams } from "../attend";
import { parseWardenParams } from "../boss";
import { acceptSidecar, compileCombatData } from "../combat";
import { parseMotionParams } from "../motion";
import { parseSceneScripts } from "../scenes";
import {
  EMPTY_WORLD_INPUT,
  createWorldDefinition,
  createWorldState,
  stepWorld,
  type WorldQueries,
  type WorldState,
} from "./index";

const json = (url: URL): unknown => JSON.parse(readFileSync(url, "utf8"));
const data = (name: string): unknown => json(new URL(`../../data/${name}`, import.meta.url));
const asset = (name: string): unknown => json(new URL(`../../../assets/build/${name}`, import.meta.url));

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

const combatData = compileCombatData(data("frame_data.json"), data("combat_params.json"));

const definition = createWorldDefinition(data("world_assembly.json"), {
  aiParams: parseWolfAiParams(data("wolf_ai_params.json")),
  attendParams: parseAttendParams(data("attend_params.json")),
  combatData,
  motionParams: parseMotionParams(data("motion_params.json")),
  navGraph: compileWalkGraph(data("levels/ironwood_nav.json") as Parameters<typeof compileWalkGraph>[0]),
  placements: data("levels/ironwood_placements.json"),
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

const WOLF_ID = "spawn.wolf.doorway.lunger.0";
const PLAYER_ID = "kalev";

/** Motion yaw 0 is -Z; combat yaw 0 is +Z. This wolf faces combat +Z. */
const WOLF_MOTION_FACING = -Math.PI;

interface StageOptions {
  readonly attendLocked?: boolean;
  readonly offsetZ: number;
  readonly guardBroken?: boolean;
}

const stage = (options: StageOptions): WorldState => {
  const base = createWorldState(queries);
  const wolf = base.actors[WOLF_ID];
  const player = base.actors[PLAYER_ID];
  const wolfCombat = base.combat.combat.actors[WOLF_ID];
  const wolfDamage = base.combat.damageActors[WOLF_ID];
  if (
    wolf === undefined ||
    player === undefined ||
    wolfCombat === undefined ||
    wolfDamage === undefined
  ) {
    throw new Error("Critical repro fixture is missing its staged actors.");
  }
  const anchor = wolf.motion.position;
  return {
    ...base,
    // The prologue is a staged scene; the repro measures the combat map only.
    scenes: { ...base.scenes, completed: [...base.scenes.completed, "cabin_prologue"] },
    attend: {
      ...base.attend,
      targetId: options.attendLocked === true ? WOLF_ID : null,
      mode: options.attendLocked === true ? ("attending" as const) : base.attend.mode,
    },
    actors: {
      ...base.actors,
      [WOLF_ID]: { ...wolf, motion: { ...wolf.motion, facing: WOLF_MOTION_FACING } },
      [PLAYER_ID]: {
        ...player,
        motion: {
          ...player.motion,
          position: { x: anchor.x, y: anchor.y, z: anchor.z + options.offsetZ },
        },
      },
    },
    combat: {
      ...base.combat,
      damageActors: {
        ...base.combat.damageActors,
        [WOLF_ID]:
          options.guardBroken === true
            ? {
                ...wolfDamage,
                riposteUntilClock:
                  wolfCombat.buffer.inputClock +
                  combatData.params.defense.guardBreakRiposteWindowTicks,
              }
            : wolfDamage,
      },
    },
  };
};

const attackPress = { action: "attack", pressed: true, sequence: 0, tick: 0 } as const;

const startedPlayerAction = (state: WorldState): string | null => {
  const step = stepWorld(state, { ...EMPTY_WORLD_INPUT, edges: [attackPress] }, queries);
  for (const event of step.events) {
    if (event.source !== "combat") continue;
    const payload = event.payload;
    if (
      "actionId" in payload &&
      payload.kind === "action_started" &&
      payload.actorId === PLAYER_ID
    ) {
      return payload.actionId;
    }
  }
  return null;
};

describe("world critical input mapping (G3)", () => {
  it("opens a backstab when an unlocked attack press lands inside the rear cone", () => {
    expect(startedPlayerAction(stage({ offsetZ: -1.2 }))).toBe("backstab");
  });

  it("opens a backstab from the same rear cone while Attend holds the target", () => {
    expect(startedPlayerAction(stage({ attendLocked: true, offsetZ: -1.2 }))).toBe("backstab");
  });

  it("opens a riposte when the target is guard-broken and faced from the front", () => {
    expect(startedPlayerAction(stage({ guardBroken: true, offsetZ: 1.2 }))).toBe("riposte");
  });

  it("still swings a light attack from the front against an unbroken guard", () => {
    expect(startedPlayerAction(stage({ offsetZ: 1.2 }))).toBe("light1");
  });

  it("refuses a critical from outside the authored critical reach", () => {
    const reach = combatData.params.defense.criticalReachMeters;
    expect(startedPlayerAction(stage({ offsetZ: -(reach + 1) }))).toBe("light1");
    expect(startedPlayerAction(stage({ guardBroken: true, offsetZ: reach + 1 }))).toBe("light1");
  });

  it("refuses a critical while the two bodies interpenetrate", () => {
    // Inside two capsule radii the rear-cone direction is degenerate: the world
    // golden's tick-243 step-through sat 0.16 m from a wolf's centre and read as
    // "behind" it. That is a step-through, not a backstab.
    const inside = definition.motionParams.capsule.radius;
    expect(startedPlayerAction(stage({ offsetZ: -inside }))).toBe("light1");
    expect(startedPlayerAction(stage({ offsetZ: -(inside * 2 + 0.01) }))).toBe("backstab");
  });
});
