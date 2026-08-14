export interface ActorClocks {
  readonly actionTick: number;
  readonly combatClock: number;
  readonly hitstopRemaining: number;
  readonly inputClock: number;
}

const assertClock = (value: number): void => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("Combat clocks must be non-negative safe integers.");
  }
};

export const advanceActorClocks = (
  clocks: ActorClocks,
): { readonly clocks: ActorClocks; readonly frozen: boolean } => {
  assertClock(clocks.actionTick);
  assertClock(clocks.combatClock);
  assertClock(clocks.hitstopRemaining);
  assertClock(clocks.inputClock);

  if (clocks.hitstopRemaining > 0) {
    return {
      clocks: { ...clocks, hitstopRemaining: clocks.hitstopRemaining - 1 },
      frozen: true,
    };
  }
  return {
    clocks: {
      actionTick: clocks.actionTick + 1,
      combatClock: clocks.combatClock + 1,
      hitstopRemaining: 0,
      inputClock: clocks.inputClock + 1,
    },
    frozen: false,
  };
};

export const mergeHitstop = (current: number, awarded: number): number => {
  assertClock(current);
  assertClock(awarded);
  return Math.max(current, awarded);
};
