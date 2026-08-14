import type { CombatData } from "./data";
import type { CombatStepCommand } from "./engine";
import type { CombatPresenterEvent } from "./events";
import { hashCanonical } from "./hash";
import {
  createCombatSimulation,
  stepCombatSimulation,
  type CombatSwingFrame,
} from "./simulation";

export const COMBAT_REPLAY_FORMAT_VERSION = 1 as const;

export interface CombatReplayStep {
  readonly commands: readonly CombatStepCommand[];
  readonly swings: readonly CombatSwingFrame[];
  readonly tick: number;
}

export interface CombatReplayScript {
  readonly durationTicks: number;
  readonly formatVersion: number;
  readonly rulesFingerprint: string;
  readonly steps: readonly CombatReplayStep[];
}

export interface CombatGoldenFixture {
  readonly formatVersion: number;
  readonly hashSequence: readonly string[];
  readonly rulesFingerprint: string;
}

export interface CombatReplayResult {
  readonly events: readonly CombatPresenterEvent[];
  readonly finalStateHash: string;
  readonly hashSequence: readonly string[];
}

const collisionSweep = (
  attackerId: string,
  targetId: string,
): CombatSwingFrame => ({
    attackerId,
    currentWeapon: {
      a: { x: 2, y: 0.5, z: 0 },
      b: { x: 2, y: 1.5, z: 0 },
      radius: 0.05,
    },
    previousWeapon: {
      a: { x: -2, y: 0.5, z: 0 },
      b: { x: -2, y: 1.5, z: 0 },
      radius: 0.05,
    },
    targets: [
      {
        hurtboxes: [
          {
            a: { x: 0, y: 0.5, z: 0 },
            b: { x: 0, y: 1.5, z: 0 },
            radius: 0.35,
          },
        ],
        id: targetId,
      },
    ],
  });

export const createGoldenCombatScenario = (data: CombatData): CombatReplayScript => ({
  durationTicks: 75,
  formatVersion: COMBAT_REPLAY_FORMAT_VERSION,
  rulesFingerprint: data.fingerprint,
  steps: [
    {
      commands: [
        {
          actorId: "kalev",
          edge: { action: "attack", pressed: true, sequence: 0, tick: 0 },
        },
      ],
      swings: [],
      tick: 0,
    },
    {
      commands: [
        {
          actorId: "attacker",
          edge: { action: "attack", pressed: true, sequence: 1, tick: 5 },
          moveId: "lunge",
        },
      ],
      swings: [],
      tick: 5,
    },
    {
      commands: [],
      swings: [collisionSweep("kalev", "dummy")],
      tick: 11,
    },
    {
      commands: [
        {
          actorId: "kalev",
          edge: { action: "roll", pressed: true, sequence: 2, tick: 32 },
        },
      ],
      swings: [],
      tick: 32,
    },
    {
      commands: [],
      swings: [collisionSweep("attacker", "kalev")],
      tick: 35,
    },
    {
      commands: [
        {
          actorId: "kalev",
          edge: { action: "attack", pressed: true, sequence: 3, tick: 54 },
        },
      ],
      swings: [],
      tick: 54,
    },
    {
      commands: [],
      swings: [collisionSweep("kalev", "dummy")],
      tick: 65,
    },
  ],
});

export const playCombatReplay = (
  data: CombatData,
  script: CombatReplayScript,
): CombatReplayResult => {
  if (script.formatVersion !== COMBAT_REPLAY_FORMAT_VERSION) {
    throw new Error(`Unsupported combat replay format: ${String(script.formatVersion)}`);
  }
  if (script.rulesFingerprint !== data.fingerprint) {
    throw new Error("Combat replay rules fingerprint does not match loaded data.");
  }
  if (!Number.isSafeInteger(script.durationTicks) || script.durationTicks < 0) {
    throw new Error("Combat replay duration must be a non-negative safe integer.");
  }
  for (const step of script.steps) {
    if (
      !Number.isSafeInteger(step.tick) ||
      step.tick < 0 ||
      step.tick >= script.durationTicks
    ) {
      throw new Error("Combat replay step ticks must fall inside the replay duration.");
    }
  }
  const byTick = new Map(script.steps.map((step) => [step.tick, step]));
  if (byTick.size !== script.steps.length) throw new Error("Combat replay steps must have unique ticks.");
  const roster = [
    {
      actorClass: "wolf",
      facingRadians: Math.PI,
      id: "attacker",
      position: { x: 0, y: 0, z: 3 },
      pulse: 100,
      steadyClass: "wolf",
    },
    {
      actorClass: "wolf",
      facingRadians: Math.PI,
      id: "dummy",
      position: { x: 0, y: 0, z: 2 },
      pulse: 50,
      steadyClass: "wolf",
    },
    {
      actorClass: "kalev",
      facingRadians: 0,
      id: "kalev",
      position: { x: 0, y: 0, z: 0 },
      pulse: 100,
      steadyClass: "kalev",
    },
  ] as const;
  let state = createCombatSimulation(data, roster);
  const events: CombatPresenterEvent[] = [];
  const hashSequence: string[] = [];

  for (let tick = 0; tick < script.durationTicks; tick += 1) {
    const scripted = byTick.get(tick) ?? { commands: [], swings: [], tick };
    const stepped = stepCombatSimulation(data, state, scripted);
    state = stepped.state;
    events.push(...stepped.events);
    hashSequence.push(stepped.stateHash);
  }

  return {
    events,
    finalStateHash: hashSequence.at(-1) ?? hashCanonical(state),
    hashSequence,
  };
};
