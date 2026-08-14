import { describe, expect, it } from "vitest";

import {
  INPUT_BUFFER_WINDOWS,
  InputBuffer,
  type InputAction,
  type InputEdge,
} from "../input";
import {
  advanceCombatInputClock,
  captureCombatInput,
  consumeCombatInput,
  consumeOldestCombatInput,
  createCombatInputBuffer,
  type CombatInputBufferState,
} from "./buffer";

const press = (
  action: InputAction,
  tick: number,
  sequence: number,
): InputEdge => ({ action, pressed: true, sequence, tick });

const advanceTo = (
  buffer: CombatInputBufferState,
  inputClock: number,
): CombatInputBufferState => {
  let advanced = buffer;
  while (advanced.inputClock < inputClock) {
    advanced = advanceCombatInputClock(advanced, false);
  }
  return advanced;
};

describe("combat input buffer", () => {
  it("matches InputBuffer's earliest-press and inclusive-expiry semantics", () => {
    const reference = new InputBuffer();
    reference.capture(press("attack", 10, 2));
    reference.capture(press("attack", 11, 3));

    let immutable = createCombatInputBuffer(10);
    immutable = captureCombatInput(immutable, press("attack", 90, 2));
    immutable = advanceTo(immutable, 11);
    immutable = captureCombatInput(immutable, press("attack", 91, 3));
    immutable = advanceTo(immutable, 20);

    const referenceEdge = reference.consume("attack", 20, true);
    const result = consumeCombatInput(
      immutable,
      "attack",
      true,
      INPUT_BUFFER_WINDOWS,
    );

    expect(result.edge).toEqual(referenceEdge);
    expect(result.edge?.tick).toBe(10);
    expect(result.buffer.slots.attack).toBeUndefined();

    const staleReference = new InputBuffer();
    staleReference.capture(press("attack", 10, 0));
    expect(staleReference.consume("attack", 21, false)).toBeUndefined();

    let staleImmutable = createCombatInputBuffer(10);
    staleImmutable = captureCombatInput(
      staleImmutable,
      press("attack", 500, 0),
    );
    staleImmutable = advanceTo(staleImmutable, 21);
    const staleResult = consumeCombatInput(
      staleImmutable,
      "attack",
      false,
      INPUT_BUFFER_WINDOWS,
    );
    expect(staleResult.edge).toBeUndefined();
    expect(staleResult.buffer.slots.attack).toBeUndefined();
  });

  it("ignores releases and does not mutate prior serialized states", () => {
    const initial = createCombatInputBuffer(4);
    const released = captureCombatInput(initial, {
      action: "roll",
      pressed: false,
      sequence: 0,
      tick: 40,
    });
    const captured = captureCombatInput(
      released,
      press("roll", 41, 1),
    );

    expect(released).toBe(initial);
    expect(initial.slots.roll).toBeUndefined();
    expect(captured).not.toBe(initial);
    expect(captured.slots.roll).toEqual({
      action: "roll",
      pressed: true,
      sequence: 1,
      tick: 4,
    });
    expect(JSON.parse(JSON.stringify(captured))).toEqual(captured);
  });

  it("freezes buffered-input age while the actor is in hitstop", () => {
    let buffer = createCombatInputBuffer(10);
    buffer = captureCombatInput(buffer, press("attack", 100, 0));

    for (let globalTick = 11; globalTick <= 40; globalTick += 1) {
      buffer = advanceCombatInputClock(buffer, globalTick <= 30);
    }

    expect(buffer.inputClock).toBe(20);
    const result = consumeCombatInput(
      buffer,
      "attack",
      true,
      INPUT_BUFFER_WINDOWS,
    );
    expect(result.edge?.tick).toBe(10);
  });

  it("keeps one slot per action, consumes oldest legal, and prunes stale slots", () => {
    let buffer = createCombatInputBuffer(7);
    buffer = captureCombatInput(buffer, press("flask", 80, 8));
    buffer = captureCombatInput(buffer, press("attack", 81, 4));
    buffer = captureCombatInput(buffer, press("roll", 82, 6));

    const first = consumeOldestCombatInput(
      buffer,
      ["flask", "roll", "attack"],
      INPUT_BUFFER_WINDOWS,
    );
    expect(first.edge?.action).toBe("attack");
    expect(first.edge?.sequence).toBe(4);

    const second = consumeOldestCombatInput(
      first.buffer,
      ["flask", "roll"],
      INPUT_BUFFER_WINDOWS,
    );
    expect(second.edge?.action).toBe("roll");

    const expired = advanceTo(second.buffer, 20);
    const pruned = consumeOldestCombatInput(
      expired,
      [],
      INPUT_BUFFER_WINDOWS,
    );
    expect(pruned.edge).toBeUndefined();
    expect(pruned.buffer.slots).toEqual({});
  });
});
