import { describe, expect, it } from "vitest";

import {
  FrameInputSampler,
  INPUT_BUFFER_WINDOWS,
  InputBuffer,
  TickInputQueue,
  type InputEdge,
} from "./input";

const attackPress = (tick: number, sequence = 0): InputEdge => ({
  action: "attack",
  pressed: true,
  sequence,
  tick,
});

describe("TickInputQueue", () => {
  it("drains same-tick edges in enqueue order", () => {
    const queue = new TickInputQueue();
    const first = attackPress(4, 0);
    const second: InputEdge = { ...first, action: "roll", sequence: 1 };

    queue.enqueue(first);
    queue.enqueue(second);

    expect(queue.drain(3)).toEqual([]);
    expect(queue.drain(4)).toEqual([first, second]);
  });

  it("rejects retrograde tick stamps", () => {
    const queue = new TickInputQueue();
    queue.enqueue(attackPress(4));

    expect(() => queue.enqueue(attackPress(3, 1))).toThrow(/ordered/i);
  });

  it("does not emit repeated presses before release", () => {
    const queue = new TickInputQueue();
    const press = attackPress(1, 0);
    const release: InputEdge = { ...press, pressed: false, sequence: 2, tick: 3 };
    const nextPress = attackPress(4, 3);

    queue.enqueue(press);
    queue.enqueue(attackPress(2, 1));
    queue.enqueue(release);
    queue.enqueue(nextPress);

    expect(queue.drain(1)).toEqual([press]);
    expect(queue.drain(2)).toEqual([]);
    expect(queue.drain(3)).toEqual([release]);
    expect(queue.drain(4)).toEqual([nextPress]);
  });
});

describe("InputBuffer", () => {
  it("consumes a buffered press on the first legal tick", () => {
    const buffer = new InputBuffer();
    const press = attackPress(10);
    buffer.capture(press);

    for (let tick = 10; tick < 15; tick += 1) {
      expect(buffer.consume("attack", tick, false)).toBeUndefined();
    }

    expect(buffer.consume("attack", 15, true)).toEqual(press);
    expect(buffer.consume("attack", 15, true)).toBeUndefined();
  });

  it("keeps the press through the inclusive window and drops it once stale", () => {
    const valid = new InputBuffer();
    valid.capture(attackPress(10));
    expect(valid.consume("attack", 20, true)).toBeDefined();

    const stale = new InputBuffer();
    stale.capture(attackPress(10));
    expect(stale.consume("attack", 21, false)).toBeUndefined();
    expect(stale.consume("attack", 21, true)).toBeUndefined();
  });

  it("retains the earliest unconsumed press in its single slot", () => {
    const buffer = new InputBuffer();
    const first = attackPress(2, 0);
    buffer.capture(first);
    buffer.capture(attackPress(3, 1));

    expect(buffer.consume("attack", 3, true)).toEqual(first);
  });
});

describe("FrameInputSampler", () => {
  it("stamps every latched edge even when a full tap occurs between frames", () => {
    const queue = new TickInputQueue();
    const sampler = new FrameInputSampler();

    sampler.sample(
      7,
      [
        { action: "attack", pressed: true },
        { action: "attack", pressed: false },
      ],
      queue,
    );
    sampler.sample(8, [{ action: "roll", pressed: true }], queue);

    expect(queue.drain(7)).toEqual([
      { action: "attack", pressed: true, sequence: 0, tick: 7 },
      { action: "attack", pressed: false, sequence: 1, tick: 7 },
    ]);
    expect(queue.drain(8)).toEqual([
      { action: "roll", pressed: true, sequence: 2, tick: 8 },
    ]);
  });
});

describe("world input vocabulary", () => {
  it("extends the original action set additively without changing its windows", () => {
    expect(INPUT_BUFFER_WINDOWS).toEqual({
      attack: 10,
      flask: 12,
      roll: 12,
      heavy: 10,
      sprint: 0,
      jump: 0,
      attend: 0,
      switchTarget: 0,
      interact: 0,
    });
  });
});
