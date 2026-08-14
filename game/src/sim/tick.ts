import type { InputEdge } from "./input";
import { SeededRng } from "./rng";
import type { SimState } from "./state";

export const TICK_HZ = 60 as const;
export const TICK_MS = 1000 / TICK_HZ;

const ACTION_CODES = {
  attack: 1,
  flask: 2,
  roll: 3,
  heavy: 4,
  sprint: 5,
  jump: 6,
  attend: 7,
  switchTarget: 8,
  interact: 9,
} as const;

export const stepTick = (state: SimState, inputs: readonly InputEdge[]): SimState => {
  const rng = SeededRng.fromState(state.rng);
  let deterministicDigest = (state.deterministicDigest ^ rng.nextUint32()) >>> 0;

  for (const input of inputs) {
    deterministicDigest =
      Math.imul(deterministicDigest ^ ACTION_CODES[input.action], 0x45d9_f3b) >>> 0;
    deterministicDigest =
      (deterministicDigest ^ input.sequence ^ (input.pressed ? 1 : 0)) >>> 0;
  }

  return {
    deterministicDigest,
    inputCount: state.inputCount + inputs.length,
    rng: rng.serialize(),
    tick: state.tick + 1,
    version: state.version,
  };
};
