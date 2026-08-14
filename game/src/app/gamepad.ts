import rawGamepadParams from "../data/gamepad_params.json";
import { INPUT_BUFFER_WINDOWS, type InputAction, type SampledInputEdge } from "../sim/input";

/**
 * Gamepad polling — the feel-reference device (GATES preamble).
 *
 * Polled once per render frame, edge-latched with the same semantics as the
 * keyboard source in `app/input.ts`: a held button emits exactly one press edge
 * and one release edge, never a repeat. Sticks are radially deadzoned per
 * TUNING_V0 and reported in screen convention (+y up).
 *
 * The move stick and the camera stick are separate axis pairs and are never
 * read from the same axes (GATES F1) — the parser refuses a table that mixes
 * them.
 */

export const GAMEPAD_ACTIONS = [
  "attack",
  "heavy",
  "roll",
  "sprint",
  "jump",
  "flask",
  "attend",
  "switchTarget",
  "interact",
] as const;

export type GamepadAction = (typeof GAMEPAD_ACTIONS)[number];

export interface GamepadStick {
  readonly x: number;
  readonly y: number;
}

export interface GamepadActionEdge {
  readonly action: GamepadAction;
  readonly pressed: boolean;
}

export interface GamepadButtonSnapshot {
  readonly pressed: boolean;
  readonly value: number;
}

/** Structural subset of the DOM `Gamepad` so the source is testable headless. */
export interface GamepadSnapshot {
  readonly index: number;
  readonly connected: boolean;
  readonly axes: readonly number[];
  readonly buttons: readonly GamepadButtonSnapshot[];
}

export type GamepadReader = () => readonly (GamepadSnapshot | null | undefined)[];

export interface GamepadAxisParams {
  readonly moveX: number;
  readonly moveY: number;
  readonly cameraX: number;
  readonly cameraY: number;
  /** Browser axes report +y downward; flip so the queue speaks screen space. */
  readonly invertY: boolean;
}

export interface GamepadParams {
  readonly deadzone: { readonly moveRadial: number; readonly cameraRadial: number };
  readonly flickMagnitude: number;
  readonly triggerThreshold: number;
  readonly axes: GamepadAxisParams;
  /** Remap table: standard-mapping button index to action. */
  readonly buttons: ReadonlyMap<number, GamepadAction>;
}

const CENTRED: GamepadStick = { x: 0, y: 0 };

const isGamepadAction = (value: unknown): value is GamepadAction =>
  typeof value === "string" && (GAMEPAD_ACTIONS as readonly string[]).includes(value);

const readNumber = (source: Record<string, unknown>, label: string): number => {
  const value = source[label];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`gamepad params: ${label} must be a finite number`);
  }
  return value;
};

const readAxisIndex = (source: Record<string, unknown>, label: string): number => {
  const value = readNumber(source, label);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`gamepad params: axes.${label} must be a non-negative whole index`);
  }
  return value;
};

const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null) {
    throw new TypeError(`gamepad params: ${label} must be an object`);
  }
  return value as Record<string, unknown>;
};

export const parseGamepadParams = (raw: unknown): GamepadParams => {
  const source = asRecord(raw, "root");
  const deadzoneSource = asRecord(source["deadzone"], "deadzone");
  const axesSource = asRecord(source["axes"], "axes");
  const buttonsSource = asRecord(source["buttons"], "buttons");

  const deadzone = {
    moveRadial: readNumber(deadzoneSource, "moveRadial"),
    cameraRadial: readNumber(deadzoneSource, "cameraRadial"),
  };
  for (const [label, value] of Object.entries(deadzone)) {
    if (value < 0 || value >= 1) {
      throw new RangeError(`gamepad params: deadzone.${label} must sit in [0, 1)`);
    }
  }

  const axes: GamepadAxisParams = {
    moveX: readAxisIndex(axesSource, "moveX"),
    moveY: readAxisIndex(axesSource, "moveY"),
    cameraX: readAxisIndex(axesSource, "cameraX"),
    cameraY: readAxisIndex(axesSource, "cameraY"),
    invertY: axesSource["invertY"] === true,
  };
  const indices = [axes.moveX, axes.moveY, axes.cameraX, axes.cameraY];
  if (new Set(indices).size !== indices.length) {
    throw new RangeError(
      "gamepad params: GATES F1 requires the move stick and camera stick on distinct axes",
    );
  }

  const buttons = new Map<number, GamepadAction>();
  for (const [key, value] of Object.entries(buttonsSource)) {
    const index = Number(key);
    if (!Number.isSafeInteger(index) || index < 0) {
      throw new RangeError(`gamepad params: button key "${key}" must be a whole index`);
    }
    if (!isGamepadAction(value)) {
      throw new RangeError(`gamepad params: button ${key} maps to unknown action "${String(value)}"`);
    }
    buttons.set(index, value);
  }
  if (buttons.size === 0) {
    throw new RangeError("gamepad params: the remap table must bind at least one button");
  }

  const flickMagnitude = readNumber(source, "flickMagnitude");
  const triggerThreshold = readNumber(source, "triggerThreshold");
  if (flickMagnitude <= 0 || flickMagnitude > 1) {
    throw new RangeError("gamepad params: flickMagnitude must sit in (0, 1]");
  }
  if (triggerThreshold <= 0 || triggerThreshold > 1) {
    throw new RangeError("gamepad params: triggerThreshold must sit in (0, 1]");
  }

  return { deadzone, flickMagnitude, triggerThreshold, axes, buttons };
};

export const GAMEPAD_PARAMS: GamepadParams = parseGamepadParams(rawGamepadParams);

/** Radial deadzone with the live band rescaled back to a full 0..1 throw. */
export const applyRadialDeadzone = (x: number, y: number, deadzone: number): GamepadStick => {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= deadzone) {
    return CENTRED;
  }
  const live = Math.min((magnitude - deadzone) / (1 - deadzone), 1);
  return { x: (x / magnitude) * live, y: (y / magnitude) * live };
};

const isSimAction = (action: GamepadAction): action is GamepadAction & InputAction =>
  Object.prototype.hasOwnProperty.call(INPUT_BUFFER_WINDOWS, action);

const defaultReader: GamepadReader = () =>
  typeof navigator === "undefined" ? [] : navigator.getGamepads();

export interface GamepadInputOptions {
  readonly read?: GamepadReader;
}

export class GamepadInputSource {
  readonly #params: GamepadParams;
  readonly #read: GamepadReader;
  readonly #edges: GamepadActionEdge[] = [];
  readonly #held = new Set<GamepadAction>();
  #moveStick: GamepadStick = CENTRED;
  #cameraStick: GamepadStick = CENTRED;
  #connectedIndex: number | null = null;

  public constructor(params: GamepadParams = GAMEPAD_PARAMS, options: GamepadInputOptions = {}) {
    this.#params = params;
    this.#read = options.read ?? defaultReader;
  }

  public get connected(): boolean {
    return this.#connectedIndex !== null;
  }

  public get moveStick(): GamepadStick {
    return this.#moveStick;
  }

  public get cameraStick(): GamepadStick {
    return this.#cameraStick;
  }

  /** Sample the pad once per render frame, latching every button transition. */
  public poll(): void {
    const pad = this.#firstConnectedPad();
    if (pad === null) {
      if (this.#connectedIndex !== null) {
        this.releaseAll();
        this.#connectedIndex = null;
      }
      return;
    }

    if (this.#connectedIndex !== pad.index) {
      // Fresh pad (first connect or a hot swap): let go of everything the old
      // pad held before the new one's state latches.
      this.releaseAll();
      this.#connectedIndex = pad.index;
    }

    this.#moveStick = applyRadialDeadzone(
      this.#axis(pad, this.#params.axes.moveX),
      this.#axisY(pad, this.#params.axes.moveY),
      this.#params.deadzone.moveRadial,
    );
    this.#cameraStick = applyRadialDeadzone(
      this.#axis(pad, this.#params.axes.cameraX),
      this.#axisY(pad, this.#params.axes.cameraY),
      this.#params.deadzone.cameraRadial,
    );

    for (const [index, action] of this.#params.buttons) {
      this.#latch(action, this.#isButtonDown(pad, index));
    }
    // Attend switching is a camera-stick flick, not a button (TUNING_V0 Attend).
    this.#latch(
      "switchTarget",
      Math.hypot(this.#cameraStick.x, this.#cameraStick.y) > this.#params.flickMagnitude,
    );
  }

  /**
   * Every latched transition since the last drain. Transitions seen in the same
   * poll are ordered by remap-table index — the only ordering a polled device
   * can offer, and a deterministic one.
   */
  public drainActionEdges(): readonly GamepadActionEdge[] {
    return this.#edges.splice(0);
  }

  /**
   * The subset the sim input queue understands today, in the shape
   * `FrameInputSampler.sample` expects. Actions the sim has not grown yet stay
   * available through `drainActionEdges`.
   */
  public drainLatchedEdges(): readonly SampledInputEdge[] {
    const sampled: SampledInputEdge[] = [];
    for (const edge of this.drainActionEdges()) {
      if (isSimAction(edge.action)) {
        sampled.push({ action: edge.action, pressed: edge.pressed });
      }
    }
    return sampled;
  }

  /** Release everything held — disconnect, hot swap, or window blur. */
  public releaseAll(): void {
    for (const action of GAMEPAD_ACTIONS) {
      if (this.#held.has(action)) {
        this.#held.delete(action);
        this.#edges.push({ action, pressed: false });
      }
    }
    this.#moveStick = CENTRED;
    this.#cameraStick = CENTRED;
  }

  #firstConnectedPad(): GamepadSnapshot | null {
    let best: GamepadSnapshot | null = null;
    for (const pad of this.#read()) {
      if (pad === null || pad === undefined || !pad.connected) {
        continue;
      }
      if (best === null || pad.index < best.index) {
        best = pad;
      }
    }
    return best;
  }

  #latch(action: GamepadAction, down: boolean): void {
    if (down === this.#held.has(action)) {
      return;
    }
    if (down) {
      this.#held.add(action);
    } else {
      this.#held.delete(action);
    }
    this.#edges.push({ action, pressed: down });
  }

  #isButtonDown(pad: GamepadSnapshot, index: number): boolean {
    const button = pad.buttons[index];
    if (button === undefined) {
      return false;
    }
    return button.pressed || button.value > this.#params.triggerThreshold;
  }

  #axis(pad: GamepadSnapshot, index: number): number {
    const value = pad.axes[index];
    return value === undefined || !Number.isFinite(value) ? 0 : value;
  }

  #axisY(pad: GamepadSnapshot, index: number): number {
    return this.#axis(pad, index) * (this.#params.axes.invertY ? -1 : 1);
  }
}
