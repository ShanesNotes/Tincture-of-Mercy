/**
 * Gauntlet round-1 finding K3 — `wolfTuple` omitted four mutable fields, so two
 * genuinely different pack states hashed identically and a determinism compare
 * could not see the divergence. Every mutable field of `WolfActorState` must
 * move the hash.
 */
import { describe, expect, it } from "vitest";

import { hashWolfAiState } from "./hash";
import type { WolfActorState, WolfAiState } from "./types";

const wolf: WolfActorState = {
  action: null,
  alert: "unaware",
  alertTimer: 0,
  alive: true,
  assignedSlot: null,
  circleSign: 1,
  confirmTimer: 0,
  crowdFailure: "none",
  feintReadyTick: 0,
  fleeReturnTick: null,
  hasToken: false,
  id: "wolf.0",
  lastAttackTick: null,
  lastKnownX: 1,
  lastKnownY: 2,
  lastKnownZ: 3,
  maxPulse: 100,
  mode: "idle",
  path: [],
  pathIndex: 0,
  pulse: 100,
  role: "lunger",
  x: 0,
  y: 0,
  z: 0,
  yaw: 0,
};

const state = (actor: WolfActorState): WolfAiState => ({
  events: [],
  pack: {
    aggressionTier: 0,
    homeX: 0,
    homeY: 0,
    homeZ: 0,
    howlCount: 0,
    tokenHolderId: null,
    tokenReleaseTick: null,
    tokenResolvedTick: null,
  },
  tick: 0,
  version: 1,
  wolves: [actor],
});

describe("wolf AI state hash", () => {
  it("moves when any mutable wolf field moves", () => {
    const baseline = hashWolfAiState(state(wolf));
    const mutations: readonly Partial<WolfActorState>[] = [
      { lastKnownX: 1.5 },
      { lastKnownY: 2.5 },
      { lastKnownZ: 3.5 },
      { maxPulse: 120 },
      { pulse: 90 },
      { alertTimer: 4 },
      { pathIndex: 1 },
    ];
    for (const mutation of mutations) {
      expect(hashWolfAiState(state({ ...wolf, ...mutation })), JSON.stringify(mutation)).not.toBe(
        baseline,
      );
    }
  });
});
