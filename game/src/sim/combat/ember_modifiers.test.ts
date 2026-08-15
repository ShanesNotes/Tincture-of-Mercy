/**
 * O-F2 — metaModifiers reach the sim.
 * Finder repro: Ember surge, Cedar-Wool Steady, Phrine instability, Numbness Turn %.
 */

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { applyMetaPercent, applySteadyDeltaToBands } from "./damage";
import { compileCombatData } from "./data";
import {
  createCombatSimulation,
  stepCombatSimulation,
  type CombatSwingFrame,
} from "./simulation";

const json = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

const data = compileCombatData(
  json("../../data/frame_data.json"),
  json("../../data/combat_params.json"),
);

const sweep = (attackerId: string, targetId: string): CombatSwingFrame => ({
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
      hurtboxes: [{ a: { x: 0, y: 0.5, z: 0 }, b: { x: 0, y: 1.5, z: 0 }, radius: 0.35 }],
      id: targetId,
    },
  ],
});

const armed = () => {
  let state = createCombatSimulation(data, [
    {
      actorClass: "kalev",
      facingRadians: 0,
      id: "kalev",
      position: { x: 0, y: 0, z: 0 },
      pulse: 300,
      steadyClass: "kalev",
    },
    {
      actorClass: "wolf",
      facingRadians: Math.PI,
      id: "dummy",
      position: { x: 0, y: 0, z: 2 },
      pulse: 200,
      steadyClass: "wolf",
    },
  ]);
  state = stepCombatSimulation(data, state, {
    commands: [{ actorId: "kalev", edge: { action: "attack", pressed: true, sequence: 0, tick: 0 } }],
    swings: [],
  }).state;
  for (let tick = 1; tick < 11; tick += 1) {
    state = stepCombatSimulation(data, state, { commands: [], swings: [] }).state;
  }
  return state;
};

describe("ember_dead_modifiers (O-F2)", () => {
  it("applyMetaPercent is the exact percent scale", () => {
    expect(applyMetaPercent(28, 125)).toBe(35);
    expect(applyMetaPercent(25, 150)).toBe(37.5);
    expect(applyMetaPercent(12, 100)).toBe(12);
  });

  it("Ember surge damagePercent 125 lands 1.25× outgoing Pulse", () => {
    const base = stepCombatSimulation(data, armed(), {
      commands: [],
      swings: [sweep("kalev", "dummy")],
    });
    const surged = stepCombatSimulation(data, armed(), {
      commands: [],
      swings: [sweep("kalev", "dummy")],
      metaCombat: {
        playerId: "kalev",
        damagePercent: 125,
        turnBuildupPercent: 100,
        breathRegenPercent: 135,
        steadyDelta: 15,
      },
    });
    const baseLost = 200 - (base.state.damageActors.dummy?.pulse ?? 0);
    const surgedLost = 200 - (surged.state.damageActors.dummy?.pulse ?? 0);
    expect(baseLost).toBe(28);
    expect(surgedLost).toBe(35);
  });

  it("Numbness turnBuildupPercent scales incoming Wither", () => {
    expect(applyMetaPercent(25, 125)).toBe(31.25);
    expect(applyMetaPercent(25, 150)).toBe(37.5);
  });

  it("Cedar-Wool steadyDelta +12 lifts the poise bands", () => {
    const bands = { flinch: 10, stagger: 20, knockdown: 30 };
    expect(applySteadyDeltaToBands(bands, 12)).toEqual({
      flinch: 22,
      stagger: 32,
      knockdown: 42,
    });
  });

  it("Bitter Phrine Steady malus −8 drops the bands", () => {
    const bands = { flinch: 10, stagger: 20, knockdown: 30 };
    expect(applySteadyDeltaToBands(bands, -8)).toEqual({
      flinch: 2,
      stagger: 12,
      knockdown: 22,
    });
  });

  it("Ember breathRegenPercent 135 scales a regen delta", () => {
    expect(applyMetaPercent(0.75, 135)).toBe(1.0125);
    expect(applyMetaPercent(0.75, 60)).toBe(0.45);
  });
});
