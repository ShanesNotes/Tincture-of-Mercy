import type { InputEdge } from "./input";
import { SeededRng } from "./rng";
import type { SimState } from "./state";

export const TICK_HZ = 60 as const;
export const TICK_MS = 1000 / TICK_HZ;

const ACTION_CODES = {
  attack: 1,
  flask: 2,
  roll: 3,
} as const;

export const stepTick = (state: SimState, inputs: readonly InputEdge[]): SimState => {
  const rng = SeededRng.fromState(state.rng);
  let entropy = (state.entropy ^ rng.nextUint32()) >>> 0;

  for (const input of inputs) {
    entropy = Math.imul(entropy ^ ACTION_CODES[input.action], 0x45d9_f3b) >>> 0;
    entropy = (entropy ^ input.sequence ^ (input.pressed ? 1 : 0)) >>> 0;
  }

  return {
    entropy,
    inputCount: state.inputCount + inputs.length,
    rng: rng.serialize(),
    tick: state.tick + 1,
    version: state.version,
  };
};
