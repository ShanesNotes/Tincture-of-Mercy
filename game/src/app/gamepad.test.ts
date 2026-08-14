import { describe, expect, it } from "vitest";

import rawGamepadParams from "../data/gamepad_params.json";
import { FrameInputSampler, TickInputQueue } from "../sim/input";
import {
  applyRadialDeadzone,
  GAMEPAD_PARAMS,
  GamepadInputSource,
  parseGamepadParams,
  type GamepadActionEdge,
  type GamepadSnapshot,
} from "./gamepad";

const BUTTON_COUNT = 16;
const AXIS_COUNT = 4;

class FakePad {
  public connected = true;
  public readonly axes: number[] = Array.from({ length: AXIS_COUNT }, () => 0);
  public readonly buttons = Array.from({ length: BUTTON_COUNT }, () => ({
    pressed: false,
    value: 0,
  }));

  public constructor(public readonly index = 0) {}

  public press(index: number): void {
    const button = this.buttons[index];
    if (button !== undefined) {
      button.pressed = true;
      button.value = 1;
    }
  }

  public release(index: number): void {
    const button = this.buttons[index];
    if (button !== undefined) {
      button.pressed = false;
      button.value = 0;
    }
  }

  public analog(index: number, value: number): void {
    const button = this.buttons[index];
    if (button !== undefined) {
      button.value = value;
    }
  }

  public stick(xAxis: number, yAxis: number, x: number, y: number): void {
    this.axes[xAxis] = x;
    this.axes[yAxis] = y;
  }

  public snapshot(): GamepadSnapshot {
    return {
      index: this.index,
      connected: this.connected,
      axes: [...this.axes],
      buttons: this.buttons.map((button) => ({ ...button })),
    };
  }
}

const sourceFor = (
  pads: () => readonly (GamepadSnapshot | null)[],
): GamepadInputSource => new GamepadInputSource(GAMEPAD_PARAMS, { read: pads });

const withPad = (): { pad: FakePad; source: GamepadInputSource } => {
  const pad = new FakePad();
  return { pad, source: sourceFor(() => [pad.snapshot()]) };
};

const actions = (edges: readonly GamepadActionEdge[]): readonly string[] =>
  edges.map((edge) => `${edge.action}:${edge.pressed ? "down" : "up"}`);

describe("gamepad params", () => {
  it("ships the TUNING_V0 deadzone and flick threshold", () => {
    expect(GAMEPAD_PARAMS.deadzone.moveRadial).toBe(0.18);
    expect(GAMEPAD_PARAMS.deadzone.cameraRadial).toBe(0.18);
    expect(GAMEPAD_PARAMS.flickMagnitude).toBe(0.6);
  });

  it("binds the whole souls action set through the remap table", () => {
    const bound = new Set(GAMEPAD_PARAMS.buttons.values());
    expect(bound).toEqual(new Set(["attack", "heavy", "roll", "sprint", "jump", "flask", "attend"]));
  });

  it("cites its source", () => {
    expect(rawGamepadParams._source.deadzone).toMatch(/TUNING_V0/);
    expect(rawGamepadParams._source.flickMagnitude).toMatch(/TUNING_V0/);
  });

  it("refuses to read the move stick and the camera stick off the same axes (F1)", () => {
    expect(() =>
      parseGamepadParams({
        ...rawGamepadParams,
        axes: { moveX: 0, moveY: 1, cameraX: 0, cameraY: 3, invertY: true },
      }),
    ).toThrow(/F1/);
  });

  it.each([
    ["an unknown action", { buttons: { "0": "parry" } }],
    ["an empty remap table", { buttons: {} }],
    ["a deadzone at full throw", { deadzone: { moveRadial: 1, cameraRadial: 0.18 } }],
    ["a flick threshold above full throw", { flickMagnitude: 1.4 }],
    ["a zero trigger threshold", { triggerThreshold: 0 }],
  ])("rejects %s", (_label, patch) => {
    expect(() => parseGamepadParams({ ...rawGamepadParams, ...patch })).toThrow();
  });
});

describe("applyRadialDeadzone", () => {
  it("kills everything inside the deadzone, edge included", () => {
    expect(applyRadialDeadzone(0.1, 0.1, 0.18)).toEqual({ x: 0, y: 0 });
    expect(applyRadialDeadzone(0.18, 0, 0.18)).toEqual({ x: 0, y: 0 });
  });

  it("rescales the live band back to a full throw and keeps direction", () => {
    const nudge = applyRadialDeadzone(0.19, 0, 0.18);
    expect(nudge.x).toBeGreaterThan(0);
    expect(nudge.x).toBeLessThan(0.02);

    const full = applyRadialDeadzone(1, 0, 0.18);
    expect(full.x).toBeCloseTo(1, 12);

    const diagonal = applyRadialDeadzone(1, 1, 0.18);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(1, 12);
    expect(diagonal.x).toBeCloseTo(diagonal.y, 12);
  });
});

describe("edge latching", () => {
  it("emits one press and one release, never a repeat", () => {
    const { pad, source } = withPad();
    pad.press(5);
    source.poll();
    expect(actions(source.drainActionEdges())).toEqual(["attack:down"]);

    for (let frame = 0; frame < 100; frame += 1) {
      source.poll();
    }
    expect(source.drainActionEdges()).toEqual([]);

    pad.release(5);
    source.poll();
    expect(actions(source.drainActionEdges())).toEqual(["attack:up"]);
  });

  it("latches analog triggers past the threshold", () => {
    const { pad, source } = withPad();
    pad.analog(7, 0.4);
    source.poll();
    expect(source.drainActionEdges()).toEqual([]);

    pad.analog(7, 0.8);
    source.poll();
    expect(actions(source.drainActionEdges())).toEqual(["heavy:down"]);
  });

  it("keeps the sim-facing drain to the actions the tick queue knows", () => {
    const { pad, source } = withPad();
    pad.press(5);
    pad.press(0);
    pad.press(2);
    pad.press(3);
    pad.press(11);
    source.poll();

    expect(source.drainLatchedEdges()).toEqual([
      { action: "roll", pressed: true },
      { action: "flask", pressed: true },
      { action: "attack", pressed: true },
    ]);
    expect(source.drainActionEdges()).toEqual([]);
  });

  it("keeps every souls action available on the raw drain", () => {
    const { pad, source } = withPad();
    pad.press(1);
    pad.press(3);
    pad.press(11);
    source.poll();
    expect(actions(source.drainActionEdges())).toEqual([
      "sprint:down",
      "jump:down",
      "attend:down",
    ]);
  });
});

describe("sticks", () => {
  it("keeps the move stick and the camera stick apart (F1)", () => {
    const { pad, source } = withPad();
    pad.stick(GAMEPAD_PARAMS.axes.moveX, GAMEPAD_PARAMS.axes.moveY, 1, 0);
    source.poll();
    expect(source.moveStick.x).toBeCloseTo(1, 12);
    expect(source.cameraStick).toEqual({ x: 0, y: 0 });

    pad.stick(GAMEPAD_PARAMS.axes.moveX, GAMEPAD_PARAMS.axes.moveY, 0, 0);
    pad.stick(GAMEPAD_PARAMS.axes.cameraX, GAMEPAD_PARAMS.axes.cameraY, 0, 1);
    source.poll();
    expect(source.moveStick).toEqual({ x: 0, y: 0 });
    expect(Math.abs(source.cameraStick.y)).toBeCloseTo(1, 12);
  });

  it("reports sticks in screen convention, pushing up as +y", () => {
    const { pad, source } = withPad();
    pad.stick(GAMEPAD_PARAMS.axes.moveX, GAMEPAD_PARAMS.axes.moveY, 0, -1);
    source.poll();
    expect(source.moveStick.y).toBeCloseTo(1, 12);
  });

  it("latches a camera-stick flick as the Attend switch, once per flick", () => {
    const { pad, source } = withPad();
    pad.stick(GAMEPAD_PARAMS.axes.cameraX, GAMEPAD_PARAMS.axes.cameraY, 0.5, 0);
    source.poll();
    expect(source.drainActionEdges()).toEqual([]);

    pad.stick(GAMEPAD_PARAMS.axes.cameraX, GAMEPAD_PARAMS.axes.cameraY, 1, 0);
    source.poll();
    source.poll();
    expect(actions(source.drainActionEdges())).toEqual(["switchTarget:down"]);

    pad.stick(GAMEPAD_PARAMS.axes.cameraX, GAMEPAD_PARAMS.axes.cameraY, 0, 0);
    source.poll();
    expect(actions(source.drainActionEdges())).toEqual(["switchTarget:up"]);
  });
});

describe("connection recovery", () => {
  it("releases held actions when the pad disappears and recovers on reconnect", () => {
    const pad = new FakePad();
    let visible = true;
    const source = sourceFor(() => (visible ? [pad.snapshot()] : [null]));

    pad.press(5);
    source.poll();
    expect(source.connected).toBe(true);
    expect(actions(source.drainActionEdges())).toEqual(["attack:down"]);

    visible = false;
    source.poll();
    expect(source.connected).toBe(false);
    expect(actions(source.drainActionEdges())).toEqual(["attack:up"]);
    expect(source.moveStick).toEqual({ x: 0, y: 0 });

    visible = true;
    pad.release(5);
    source.poll();
    expect(source.connected).toBe(true);
    expect(source.drainActionEdges()).toEqual([]);

    pad.press(5);
    source.poll();
    expect(actions(source.drainActionEdges())).toEqual(["attack:down"]);
  });

  it("ignores a disconnected pad and takes the lowest connected index", () => {
    const first = new FakePad(0);
    const second = new FakePad(1);
    first.connected = false;
    second.press(0);
    const source = sourceFor(() => [first.snapshot(), second.snapshot()]);

    source.poll();
    expect(source.connected).toBe(true);
    expect(actions(source.drainActionEdges())).toEqual(["roll:down"]);
  });

  it("stays quiet with no pad at all", () => {
    const source = sourceFor(() => []);
    source.poll();
    expect(source.connected).toBe(false);
    expect(source.drainActionEdges()).toEqual([]);
  });
});

describe("tick queue integration", () => {
  it("delivers latched actions into the sim tick stream, ordered by remap index within a poll", () => {
    const { pad, source } = withPad();
    const queue = new TickInputQueue();
    const sampler = new FrameInputSampler();

    pad.press(5);
    source.poll();
    sampler.sample(7, source.drainLatchedEdges(), queue);

    pad.release(5);
    pad.press(0);
    source.poll();
    sampler.sample(7, source.drainLatchedEdges(), queue);

    expect(queue.drain(7)).toEqual([
      { action: "attack", pressed: true, sequence: 0, tick: 7 },
      { action: "roll", pressed: true, sequence: 1, tick: 7 },
      { action: "attack", pressed: false, sequence: 2, tick: 7 },
    ]);
  });
});
