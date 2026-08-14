export interface ActionFrameData {
  readonly startup: number;
  readonly active: number;
  readonly recovery: number;
}

export type ActionPhase = "startup" | "active" | "recovery" | "complete";

export interface TickWindow {
  readonly startTick: number;
  readonly endTickExclusive: number;
}

export interface ActionCancelRule {
  readonly into: string;
  readonly fromTick: number;
}

const assertNonNegativeSafeInteger = (value: number, label: string): void => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
};

const assertFrameData = (frameData: ActionFrameData): void => {
  assertNonNegativeSafeInteger(frameData.startup, "Action startup");
  assertNonNegativeSafeInteger(frameData.active, "Action active duration");
  assertNonNegativeSafeInteger(frameData.recovery, "Action recovery");
  assertNonNegativeSafeInteger(
    frameData.startup + frameData.active + frameData.recovery,
    "Action total duration",
  );
};

const assertWindow = (window: TickWindow): void => {
  assertNonNegativeSafeInteger(window.startTick, "Window start tick");
  assertNonNegativeSafeInteger(window.endTickExclusive, "Window end tick");
  if (window.endTickExclusive < window.startTick) {
    throw new Error("Window end tick must not precede its start tick.");
  }
};

export const getActionTotalTicks = (frameData: ActionFrameData): number => {
  assertFrameData(frameData);
  return frameData.startup + frameData.active + frameData.recovery;
};

export const getActionPhase = (
  frameData: ActionFrameData,
  actionTick: number,
): ActionPhase => {
  assertNonNegativeSafeInteger(actionTick, "Action tick");
  const total = getActionTotalTicks(frameData);
  if (actionTick < frameData.startup) {
    return "startup";
  }
  if (actionTick < frameData.startup + frameData.active) {
    return "active";
  }
  if (actionTick < total) {
    return "recovery";
  }
  return "complete";
};

export const isActionActive = (
  frameData: ActionFrameData,
  actionTick: number,
): boolean => getActionPhase(frameData, actionTick) === "active";

export const inclusiveTickWindow = (
  startTick: number,
  endTickInclusive: number,
): TickWindow => {
  assertNonNegativeSafeInteger(startTick, "Inclusive window start tick");
  assertNonNegativeSafeInteger(endTickInclusive, "Inclusive window end tick");
  if (endTickInclusive < startTick) {
    throw new Error("Inclusive window end tick must not precede its start tick.");
  }
  const endTickExclusive = endTickInclusive + 1;
  assertNonNegativeSafeInteger(endTickExclusive, "Exclusive window end tick");
  return { startTick, endTickExclusive };
};

export const isTickInWindow = (
  tick: number,
  window: TickWindow,
): boolean => {
  assertNonNegativeSafeInteger(tick, "Queried tick");
  assertWindow(window);
  return tick >= window.startTick && tick < window.endTickExclusive;
};

export const firstActionableTick = (
  frameData: ActionFrameData,
  nextAction: string,
  cancelRules: readonly ActionCancelRule[],
  recoveryCancelTailTicks: number,
): number => {
  const total = getActionTotalTicks(frameData);
  assertNonNegativeSafeInteger(
    recoveryCancelTailTicks,
    "Recovery cancel-tail duration",
  );
  if (recoveryCancelTailTicks > frameData.recovery) {
    throw new Error("Recovery cancel-tail duration cannot exceed recovery.");
  }

  let firstTick = total - recoveryCancelTailTicks;
  for (const rule of cancelRules) {
    assertNonNegativeSafeInteger(rule.fromTick, "Authored cancel tick");
    if (rule.fromTick > total) {
      throw new Error("Authored cancel tick cannot exceed action duration.");
    }
    if (rule.into === nextAction) {
      firstTick = Math.min(firstTick, rule.fromTick);
    }
  }
  return firstTick;
};

export const canCancelAction = (
  frameData: ActionFrameData,
  actionTick: number,
  nextAction: string,
  cancelRules: readonly ActionCancelRule[],
  recoveryCancelTailTicks: number,
): boolean => {
  assertNonNegativeSafeInteger(actionTick, "Action tick");
  return (
    actionTick >=
    firstActionableTick(
      frameData,
      nextAction,
      cancelRules,
      recoveryCancelTailTicks,
    )
  );
};

export const advanceActionTick = (
  actionTick: number,
  frozen: boolean,
): number => {
  assertNonNegativeSafeInteger(actionTick, "Action tick");
  if (frozen) {
    return actionTick;
  }
  const advanced = actionTick + 1;
  assertNonNegativeSafeInteger(advanced, "Advanced action tick");
  return advanced;
};

export const isCriticalIframe = (
  actionTick: number,
  iframeWindow: TickWindow,
): boolean => isTickInWindow(actionTick, iframeWindow);
