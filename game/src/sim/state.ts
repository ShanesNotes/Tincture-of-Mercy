import { SeededRng, type RngState } from "./rng";

export const SIM_STATE_VERSION = 1 as const;

export interface SimState {
  readonly deterministicDigest: number;
  readonly inputCount: number;
  readonly rng: RngState;
  readonly tick: number;
  readonly version: typeof SIM_STATE_VERSION;
}

export const createSimState = (seed: number): SimState => {
  const rng = new SeededRng(seed);
  return {
    deterministicDigest: seed >>> 0,
    inputCount: 0,
    rng: rng.serialize(),
    tick: 0,
    version: SIM_STATE_VERSION,
  };
};

const stableStateJson = (state: SimState): string =>
  JSON.stringify([
    state.version,
    state.tick,
    state.rng.version,
    state.rng.state,
    state.inputCount,
    state.deterministicDigest,
  ]);

export const hashSimState = (state: SimState): string => {
  let hash = 0x811c_9dc5;
  for (const character of stableStateJson(state)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x0100_0193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
