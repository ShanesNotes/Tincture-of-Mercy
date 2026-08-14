export const INPUT_BUFFER_WINDOWS = {
  attack: 10,
  flask: 12,
  roll: 12,
} as const;

export type InputAction = keyof typeof INPUT_BUFFER_WINDOWS;

export interface InputEdge {
  readonly action: InputAction;
  readonly pressed: boolean;
  readonly sequence: number;
  readonly tick: number;
}

export interface SampledInputEdge {
  readonly action: InputAction;
  readonly pressed: boolean;
}

const assertStamp = (edge: InputEdge): void => {
  if (
    !Number.isSafeInteger(edge.tick) ||
    edge.tick < 0 ||
    !Number.isSafeInteger(edge.sequence) ||
    edge.sequence < 0
  ) {
    throw new Error("Input edge tick and sequence must be non-negative safe integers.");
  }
};

const isAfter = (candidate: InputEdge, previous: InputEdge): boolean =>
  candidate.tick > previous.tick ||
  (candidate.tick === previous.tick && candidate.sequence > previous.sequence);

export class TickInputQueue {
  private readonly edges: InputEdge[] = [];
  private readonly heldActions = new Set<InputAction>();
  private lastEnqueued: InputEdge | undefined;

  public enqueue(edge: InputEdge): void {
    assertStamp(edge);
    if (this.lastEnqueued !== undefined && !isAfter(edge, this.lastEnqueued)) {
      throw new Error("Input edges must remain ordered by tick and sequence.");
    }

    this.lastEnqueued = edge;

    const alreadyHeld = this.heldActions.has(edge.action);
    if (edge.pressed === alreadyHeld) {
      return;
    }
    if (edge.pressed) {
      this.heldActions.add(edge.action);
    } else {
      this.heldActions.delete(edge.action);
    }
    this.edges.push(edge);
  }

  public drain(tick: number): readonly InputEdge[] {
    if (!Number.isSafeInteger(tick) || tick < 0) {
      throw new Error("Drain tick must be a non-negative safe integer.");
    }

    let count = 0;
    while (count < this.edges.length && this.edges[count]?.tick === tick) {
      count += 1;
    }
    return this.edges.splice(0, count);
  }
}

export class InputBuffer {
  private readonly slots: Partial<Record<InputAction, InputEdge>> = {};

  public capture(edge: InputEdge): void {
    assertStamp(edge);
    if (edge.pressed && this.slots[edge.action] === undefined) {
      this.slots[edge.action] = edge;
    }
  }

  public consume(action: InputAction, tick: number, legal: boolean): InputEdge | undefined {
    const edge = this.slots[action];
    if (edge === undefined) {
      return undefined;
    }

    if (tick > edge.tick + INPUT_BUFFER_WINDOWS[action]) {
      this.slots[action] = undefined;
      return undefined;
    }

    if (!legal) {
      return undefined;
    }

    this.slots[action] = undefined;
    return edge;
  }
}

export class FrameInputSampler {
  private sequence = 0;

  public sample(
    tick: number,
    sampledEdges: readonly SampledInputEdge[],
    queue: TickInputQueue,
  ): void {
    for (const edge of sampledEdges) {
      queue.enqueue({ ...edge, sequence: this.sequence, tick });
      this.sequence += 1;
    }
  }
}
