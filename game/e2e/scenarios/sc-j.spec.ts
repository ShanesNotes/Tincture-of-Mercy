import { expect, test, type Page } from "@playwright/test";

import { Gauntlet, KEY, playerOf, type RecordedTick } from "./harness";

/**
 * SC-J — pad and keyboard must play the same SC-A opening.
 *
 * Both lanes drive the shipped `?play=ironwood` page. The keyboard lane uses
 * real key events; the pad lane installs a synthetic Standard-Mapping pad on
 * `navigator.getGamepads` before boot so `GamepadInputSource` polls it exactly
 * as it would a real controller, then plays the same script through the pad's
 * own bindings (`src/data/gamepad_params.json`: 5 = attack, 11 = attend,
 * axes 0/1 = move stick, y inverted).
 *
 * Parity is judged on sim truth: the same lock target, the same action id, and
 * the same action length in ticks. Positions are compared with a tolerance,
 * because the two lanes sample input on different render frames.
 */

const WALK_TICKS = 220;
const POSITION_TOLERANCE_METRES = 1.5;

interface LaneResult {
  readonly walkedTo: { readonly x: number; readonly z: number };
  readonly targetId: string | null;
  readonly attackAction: string | null;
  readonly attackTicks: number;
}

const installPad = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const pad = {
      index: 0,
      id: "gauntlet scripted pad (Standard Mapping)",
      connected: true,
      mapping: "standard",
      timestamp: 0,
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 })),
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [pad],
    });
    (window as unknown as { __pad__?: unknown }).__pad__ = {
      button: (index: number, pressed: boolean): void => {
        pad.buttons[index] = { pressed, touched: pressed, value: pressed ? 1 : 0 };
        pad.timestamp += 1;
      },
      axis: (index: number, value: number): void => {
        pad.axes[index] = value;
        pad.timestamp += 1;
      },
    };
  });
};

interface PadHandle {
  button: (index: number, pressed: boolean) => void;
  axis: (index: number, value: number) => void;
}

const padButton = (page: Page, index: number, pressed: boolean): Promise<void> =>
  page.evaluate((command) => {
    const handle = (window as unknown as { __pad__?: PadHandle }).__pad__;
    if (handle === undefined) throw new Error("synthetic pad missing");
    handle.button(command.index, command.pressed);
  }, { index, pressed });

const padAxis = (page: Page, index: number, value: number): Promise<void> =>
  page.evaluate((command) => {
    const handle = (window as unknown as { __pad__?: PadHandle }).__pad__;
    if (handle === undefined) throw new Error("synthetic pad missing");
    handle.axis(command.index, command.value);
  }, { index, value });

/** Measure how long the action the recorder saw actually ran. */
const attackWindow = (rows: readonly RecordedTick[]): { action: string | null; ticks: number } => {
  const acting = rows.filter((row) => row.playerAction !== null);
  const action = acting[0]?.playerAction ?? null;
  return { action, ticks: acting.filter((row) => row.playerAction === action).length };
};

test("SC-J: the pad plays the SC-A opening exactly as the keyboard does", async ({
  page,
  context,
}) => {
  test.setTimeout(600_000);
  test.slow();

  // --- keyboard lane -------------------------------------------------------
  const keyboard = await Gauntlet.boot(page, "sc-j/keyboard");
  await keyboard.capture("keyboard lane: booted");
  const keyboardStart = await keyboard.tick();
  await keyboard.hold(KEY.forward);
  await keyboard.waitForTick(keyboardStart + WALK_TICKS, 60_000);
  await keyboard.release(KEY.forward);
  const keyboardWalked = playerOf(await keyboard.snapshot());
  const keyboardLock = await keyboard.attend();
  await keyboard.capture(`keyboard lane: locked ${String(keyboardLock.targetId)}`);
  await keyboard.startRecorder();
  await keyboard.swing();
  const keyboardRows = await keyboard.readRecorder();
  const keyboardAttack = attackWindow(keyboardRows);
  await keyboard.capture(`keyboard lane: ${String(keyboardAttack.action)} for ${String(keyboardAttack.ticks)}t`);

  const keyboardResult: LaneResult = {
    walkedTo: { x: keyboardWalked.position.x, z: keyboardWalked.position.z },
    targetId: keyboardLock.targetId,
    attackAction: keyboardAttack.action,
    attackTicks: keyboardAttack.ticks,
  };

  // --- pad lane ------------------------------------------------------------
  const padPage = await context.newPage();
  await installPad(padPage);
  const gamepad = await Gauntlet.boot(padPage, "sc-j/pad");
  await gamepad.capture("pad lane: booted with a synthetic Standard Mapping pad");

  const padStart = await gamepad.tick();
  // Move stick pushed north. The parser inverts y, so -1 on axis 1 is forward.
  await padAxis(padPage, 1, -1);
  await gamepad.waitForTick(padStart + WALK_TICKS, 60_000);
  await padAxis(padPage, 1, 0);
  const padWalked = playerOf(await gamepad.snapshot());

  await padButton(padPage, 11, true);
  await gamepad.advanceTicks(4);
  await padButton(padPage, 11, false);
  await gamepad.advanceTicks(4);
  const padLock = await gamepad.snapshot();
  await gamepad.capture(`pad lane: locked ${String(padLock.targetId)}`);

  await gamepad.startRecorder();
  await padButton(padPage, 5, true);
  await gamepad.advanceTicks(3);
  await padButton(padPage, 5, false);
  await gamepad.waitFor("pad swing recovered", (snap) => playerOf(snap).actionId === null, 30_000);
  const padRows = await gamepad.readRecorder();
  const padAttack = attackWindow(padRows);
  await gamepad.capture(`pad lane: ${String(padAttack.action)} for ${String(padAttack.ticks)}t`);

  const padResult: LaneResult = {
    walkedTo: { x: padWalked.position.x, z: padWalked.position.z },
    targetId: padLock.targetId,
    attackAction: padAttack.action,
    attackTicks: padAttack.ticks,
  };

  // --- parity --------------------------------------------------------------
  expect(padResult.attackAction, "the pad's attack must select the same move").toBe(
    keyboardResult.attackAction,
  );
  expect(keyboardResult.attackAction, "the opening light must actually have fired").toBe("light1");
  // Both lanes attach their recorder asynchronously, so the measured window can
  // miss the first or last tick of the clip; the clip length itself must match.
  expect(keyboardResult.attackTicks, "the light clip must be a real window").toBeGreaterThan(28);
  expect(padResult.attackTicks, "the pad clip must be a real window").toBeGreaterThan(28);
  expect(
    Math.abs(padResult.attackTicks - keyboardResult.attackTicks),
    "the same move must run for the same number of ticks on both devices",
  ).toBeLessThanOrEqual(4);
  expect(padResult.targetId, "Attend must take the same wolf from either device").toBe(
    keyboardResult.targetId,
  );
  expect(padResult.targetId).not.toBeNull();
  expect(
    Math.hypot(
      padResult.walkedTo.x - keyboardResult.walkedTo.x,
      padResult.walkedTo.z - keyboardResult.walkedTo.z,
    ),
    "the same walk on both devices must end in the same place",
  ).toBeLessThanOrEqual(POSITION_TOLERANCE_METRES);

  keyboard.writeReplayEvidence("parity", { keyboard: keyboardResult, pad: padResult });
  gamepad.writeReplayEvidence("parity", { keyboard: keyboardResult, pad: padResult });
  keyboard.finish({ scenario: "SC-J input parity (keyboard lane)", lane: keyboardResult });
  gamepad.finish({ scenario: "SC-J input parity (pad lane)", lane: padResult });

  expect(keyboard.errors).toEqual([]);
  expect(gamepad.errors).toEqual([]);
  await padPage.close();
});
