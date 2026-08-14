import type { SimState } from "./state";

export interface SimPresentation {
  readonly committedTick: number;
  readonly interpolationAlpha: number;
  readonly presentationTick: number;
}

export const presentSim = (
  previous: SimState,
  current: SimState,
  alpha: number,
): SimPresentation => {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha >= 1) {
    throw new Error("Interpolation alpha must be in [0, 1).");
  }

  return {
    committedTick: current.tick,
    interpolationAlpha: alpha,
    presentationTick: previous.tick + (current.tick - previous.tick) * alpha,
  };
};
