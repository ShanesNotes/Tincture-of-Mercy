/**
 * Golden boss replay (contract deliverable 6): one scripted run that walks
 * P1 → ceremony → P2 → defeat and commits the per-tick state-hash sequence.
 *
 * Regenerate after an intentional Warden retune:  npm run replay:regen:boss
 */

import { hashWardenState } from "./hash";
import type {
  WardenAftermathPayload,
  WardenEvent,
  WardenParams,
  WardenRingGeometry,
  WardenState,
} from "./types";
import { createWardenState, stepWarden } from "./warden";

export const WARDEN_REPLAY_FORMAT_VERSION = 1 as const;

/** Scenario knobs — scaffolding for the scripted run, not gameplay tuning. */
export const WARDEN_REPLAY_DURATION_TICKS = 900;
export const WARDEN_REPLAY_MAX_PULSE = 900;
export const WARDEN_REPLAY_HIT_INTERVAL_TICKS = 20;
export const WARDEN_REPLAY_HIT_PULSE = 26;
const TARGET_ANGLE_RADIANS_PER_TICK = 0.006;
const TARGET_RADIUS_BASE_METERS = 5.25;
const TARGET_RADIUS_SWING_METERS = 3.75;
const TARGET_RADIUS_RADIANS_PER_TICK = 0.004;

export interface WardenReplayResult {
  readonly durationTicks: number;
  readonly events: readonly WardenEvent[];
  readonly finalState: WardenState;
  readonly finalStateHash: string;
  readonly formatVersion: typeof WARDEN_REPLAY_FORMAT_VERSION;
  readonly hashSequence: readonly string[];
  readonly ceremonyRequests: number;
  readonly aftermathPayloads: readonly WardenAftermathPayload[];
  readonly paramsFingerprint: string;
}

const targetAt = (
  ring: WardenRingGeometry,
  tick: number,
): { readonly targetX: number; readonly targetZ: number } => {
  const angle = tick * TARGET_ANGLE_RADIANS_PER_TICK;
  const radius =
    TARGET_RADIUS_BASE_METERS +
    TARGET_RADIUS_SWING_METERS * Math.sin(tick * TARGET_RADIUS_RADIANS_PER_TICK);
  return {
    targetX: ring.centerX + radius * Math.cos(angle),
    targetZ: ring.centerZ + radius * Math.sin(angle),
  };
};

/**
 * The fingerprint pins the replay to the data it was generated from, so a
 * tuning change cannot silently reuse stale hashes (mirrors s11's rule).
 */
export const wardenParamsFingerprint = (params: WardenParams): string =>
  hashWardenState(params);

export const runWardenGoldenScenario = (
  params: WardenParams,
  ring: WardenRingGeometry,
): WardenReplayResult => {
  let state = createWardenState({
    x: ring.centerX,
    z: ring.centerZ,
    yaw: 0,
    pulse: WARDEN_REPLAY_MAX_PULSE,
    maxPulse: WARDEN_REPLAY_MAX_PULSE,
  });
  const events: WardenEvent[] = [];
  const hashSequence: string[] = [];
  const aftermathPayloads: WardenAftermathPayload[] = [];
  let ceremonyRequests = 0;

  const ports = {
    ceremony: {
      pulsePercent: params.ceremony.pulsePercent,
      holdTicks: params.ceremony.holdTicks,
      shouldBegin: (bossPulse: number, bossMaxPulse: number): boolean =>
        bossMaxPulse > 0 && bossPulse * 100 <= bossMaxPulse * params.ceremony.pulsePercent,
      begin: (): void => {
        ceremonyRequests += 1;
      },
    },
    aftermath: {
      begin: (payload: WardenAftermathPayload): void => {
        aftermathPayloads.push(payload);
      },
    },
  };

  for (let tick = 0; tick < WARDEN_REPLAY_DURATION_TICKS; tick += 1) {
    const target = targetAt(ring, tick);
    const stepped = stepWarden(
      params,
      ring,
      state,
      {
        ...target,
        pulseDamage:
          tick > 0 && tick % WARDEN_REPLAY_HIT_INTERVAL_TICKS === 0
            ? WARDEN_REPLAY_HIT_PULSE
            : 0,
      },
      ports,
    );
    state = stepped.state;
    events.push(...stepped.events);
    hashSequence.push(hashWardenState(state));
  }

  return {
    durationTicks: WARDEN_REPLAY_DURATION_TICKS,
    events,
    finalState: state,
    finalStateHash: hashSequence.at(-1) ?? hashWardenState(state),
    formatVersion: WARDEN_REPLAY_FORMAT_VERSION,
    hashSequence,
    ceremonyRequests,
    aftermathPayloads,
    paramsFingerprint: wardenParamsFingerprint(params),
  };
};
