export const COMBAT_BUFFER_ACTIONS = ["attack", "roll", "flask"] as const;

export type CombatBufferAction = (typeof COMBAT_BUFFER_ACTIONS)[number];

export interface CombatInputEdge {
  readonly action: CombatBufferAction;
  readonly pressed: boolean;
  readonly sequence: number;
  readonly tick: number;
}

export type CombatBufferWindows = Readonly<Record<CombatBufferAction, number>>;

export interface CombatInputBufferState {
  readonly inputClock: number;
  readonly slots: Readonly<Partial<Record<CombatBufferAction, CombatInputEdge>>>;
}

export interface CombatInputConsumption {
  readonly buffer: CombatInputBufferState;
  readonly edge?: CombatInputEdge;
}

const assertNonNegativeSafeInteger = (value: number, label: string): void => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
};

const assertEdge = (edge: CombatInputEdge): void => {
  assertNonNegativeSafeInteger(edge.tick, "Input edge tick");
  assertNonNegativeSafeInteger(edge.sequence, "Input edge sequence");
};

const assertWindows = (windows: CombatBufferWindows): void => {
  for (const action of COMBAT_BUFFER_ACTIONS) {
    assertNonNegativeSafeInteger(windows[action], `${action} buffer window`);
  }
};

const withoutSlot = (
  buffer: CombatInputBufferState,
  action: CombatBufferAction,
): CombatInputBufferState => {
  if (buffer.slots[action] === undefined) {
    return buffer;
  }

  const slots: Partial<Record<CombatBufferAction, CombatInputEdge>> = {};
  for (const retainedAction of COMBAT_BUFFER_ACTIONS) {
    const retainedEdge = buffer.slots[retainedAction];
    if (retainedAction !== action && retainedEdge !== undefined) {
      slots[retainedAction] = retainedEdge;
    }
  }
  return { ...buffer, slots };
};

const isStale = (
  buffer: CombatInputBufferState,
  edge: CombatInputEdge,
  windows: CombatBufferWindows,
): boolean => buffer.inputClock - edge.tick > windows[edge.action];

const pruneStaleSlots = (
  buffer: CombatInputBufferState,
  windows: CombatBufferWindows,
): CombatInputBufferState => {
  let pruned = buffer;
  for (const action of COMBAT_BUFFER_ACTIONS) {
    const edge = pruned.slots[action];
    if (edge !== undefined && isStale(pruned, edge, windows)) {
      pruned = withoutSlot(pruned, action);
    }
  }
  return pruned;
};

export const createCombatInputBuffer = (
  inputClock = 0,
): CombatInputBufferState => {
  assertNonNegativeSafeInteger(inputClock, "Actor input clock");
  return { inputClock, slots: {} };
};

export const advanceCombatInputClock = (
  buffer: CombatInputBufferState,
  frozen: boolean,
  ticks = 1,
): CombatInputBufferState => {
  assertNonNegativeSafeInteger(buffer.inputClock, "Actor input clock");
  assertNonNegativeSafeInteger(ticks, "Input-clock advance");
  if (frozen || ticks === 0) {
    return buffer;
  }

  const inputClock = buffer.inputClock + ticks;
  assertNonNegativeSafeInteger(inputClock, "Advanced actor input clock");
  return { ...buffer, inputClock };
};

export const captureCombatInput = (
  buffer: CombatInputBufferState,
  edge: CombatInputEdge,
): CombatInputBufferState => {
  assertNonNegativeSafeInteger(buffer.inputClock, "Actor input clock");
  assertEdge(edge);
  if (!edge.pressed || buffer.slots[edge.action] !== undefined) {
    return buffer;
  }

  return {
    ...buffer,
    slots: {
      ...buffer.slots,
      [edge.action]: { ...edge, tick: buffer.inputClock },
    },
  };
};

export const consumeCombatInput = (
  buffer: CombatInputBufferState,
  action: CombatBufferAction,
  legal: boolean,
  windows: CombatBufferWindows,
): CombatInputConsumption => {
  assertWindows(windows);
  const edge = buffer.slots[action];
  if (edge === undefined) {
    return { buffer };
  }
  if (isStale(buffer, edge, windows)) {
    return { buffer: withoutSlot(buffer, action) };
  }
  if (!legal) {
    return { buffer };
  }
  return { buffer: withoutSlot(buffer, action), edge };
};

export const consumeOldestCombatInput = (
  buffer: CombatInputBufferState,
  legalActions: readonly CombatBufferAction[],
  windows: CombatBufferWindows,
): CombatInputConsumption => {
  assertWindows(windows);
  const pruned = pruneStaleSlots(buffer, windows);
  const legal = new Set(legalActions);
  let selected: CombatInputEdge | undefined;
  let selectedOrder = Number.POSITIVE_INFINITY;

  for (const [order, action] of COMBAT_BUFFER_ACTIONS.entries()) {
    const candidate = pruned.slots[action];
    if (candidate === undefined || !legal.has(action)) {
      continue;
    }
    if (
      selected === undefined ||
      candidate.sequence < selected.sequence ||
      (candidate.sequence === selected.sequence && order < selectedOrder)
    ) {
      selected = candidate;
      selectedOrder = order;
    }
  }

  if (selected === undefined) {
    return { buffer: pruned };
  }
  return {
    buffer: withoutSlot(pruned, selected.action),
    edge: selected,
  };
};
