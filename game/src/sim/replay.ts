import { TickInputQueue, type InputEdge } from "./input";
import { createSimState, hashSimState, type SimState } from "./state";
import { stepTick } from "./tick";

export const REPLAY_FORMAT_VERSION = 1 as const;

export interface ReplayScript {
  readonly durationTicks: number;
  readonly formatVersion: typeof REPLAY_FORMAT_VERSION;
  readonly inputs: readonly InputEdge[];
  readonly seed: number;
}

export interface ReplayResult {
  readonly state: SimState;
  readonly stateHash: string;
}

export type GoldenReplayComparison =
  | { readonly matches: true }
  | {
      readonly actualHash: string;
      readonly expectedHash: string;
      readonly matches: false;
    };

export const recordReplay = (
  seed: number,
  durationTicks: number,
  inputs: readonly InputEdge[],
): ReplayScript => ({
  durationTicks,
  formatVersion: REPLAY_FORMAT_VERSION,
  inputs: inputs.map((input) => ({ ...input })),
  seed,
});

export const playReplay = (script: ReplayScript): ReplayResult => {
  if (script.formatVersion !== REPLAY_FORMAT_VERSION) {
    throw new Error(`Unsupported replay format: ${String(script.formatVersion)}`);
  }
  if (!Number.isSafeInteger(script.durationTicks) || script.durationTicks < 0) {
    throw new Error("Replay duration must be a non-negative safe integer.");
  }

  const queue = new TickInputQueue();
  for (const input of script.inputs) {
    queue.enqueue(input);
  }

  let state = createSimState(script.seed);
  for (let tick = 0; tick < script.durationTicks; tick += 1) {
    state = stepTick(state, queue.drain(tick));
  }

  return { state, stateHash: hashSimState(state) };
};

export const compareGoldenReplay = (
  script: ReplayScript,
  expected: ReplayResult,
): GoldenReplayComparison => {
  const actualHash = playReplay(script).stateHash;
  return actualHash === expected.stateHash
    ? { matches: true }
    : { actualHash, expectedHash: expected.stateHash, matches: false };
};
