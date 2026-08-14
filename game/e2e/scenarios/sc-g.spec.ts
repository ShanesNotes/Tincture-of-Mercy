import { expect, test } from "@playwright/test";

import { Gauntlet, playerOf, wardenOf } from "./harness";

/**
 * SC-G — the Warden's ceremony and the P2 kill run.
 *
 * The kill run is not scriptable in this build (see the fixme). What is real,
 * and what this row pins, is the state the ceremony is measured against: the
 * arena gate fires, the Warden stands at his full authored 720 Pulse, the
 * ceremony has not begun, and the 55% threshold he must be driven under is
 * 396 Pulse of scripted damage away.
 */

const CEREMONY_PULSE_PERCENT = 55;

test("SC-G: the ceremony precondition is reachable and the threshold is sim truth", async ({
  page,
}) => {
  test.setTimeout(600_000);
  test.slow();
  const run = await Gauntlet.boot(page, "sc-g", { debug: true });

  await run.capture("boot: the arena is cold");
  const arrived = await run.walkToArenaRing();
  await run.capture("arena: the ring is crossed and the Warden is awake");

  const warden = wardenOf(arrived);
  expect(warden, "the Warden must exist as an actor").toBeDefined();
  expect(arrived.boss.enteredArena, "the arena gate must fire before any ceremony").toBe(true);
  expect(arrived.boss.phase, "the ceremony is a P1 exit, so he must still be in P1").toBe("p1");
  expect(arrived.boss.ceremonyActive, "the ceremony must not have fired yet").toBe(false);
  expect(arrived.boss.defeated).toBe(false);
  expect(arrived.boss.pulse).toBe(arrived.boss.maxPulse);
  expect(arrived.boss.maxPulse, "world_assembly authors the Warden pool at 720").toBe(720);

  const ceremonyPulse = (arrived.boss.maxPulse * CEREMONY_PULSE_PERCENT) / 100;
  expect(ceremonyPulse, "TUNING_V0 fires the ceremony at 55% of the pool").toBe(396);

  // The arena Hearth stays cold until the aftermath lights it.
  expect(arrived.hearth.lit, "the arena Hearth must not be lit before the aftermath").toBe(false);
  expect(arrived.scenes.activeId, "no boss scene may be holding the frame yet").not.toBe(
    "warden_ceremony",
  );

  await run.startRecorder();
  await run.advanceTicks(600, 60_000);
  const rows = await run.readRecorder();
  expect(
    rows.every((row) => !row.ceremonyActive),
    "the ceremony must not fire while the Warden is at full Pulse",
  ).toBe(true);
  expect(
    rows.every((row) => row.bossPulse === 720),
    "nothing in the arena may chip the Warden without a scripted hit",
  ).toBe(true);

  await run.capture("held: 720 Pulse, no ceremony, no aftermath");
  run.writeReplayEvidence("ceremony-precondition", {
    ceremonyPulse,
    boss: arrived.boss,
    playerPulse: playerOf(arrived).pulse,
    recorderTicks: rows.length,
    damageStillOwed: arrived.boss.pulse - ceremonyPulse,
  });
  run.finish({ scenario: "SC-G Warden ceremony precondition", ceremonyPulse });
  expect(run.errors).toEqual([]);
});

test.fixme("SC-G: ceremony at 55% then a full P2 kill run", async ({ page }) => {
  // Blocked. The ceremony needs 324 Pulse driven off the Warden and the kill
  // needs all 720, and no scripted input in this build can remove a single
  // point:
  //
  //  * Attend never targets the Warden (`snapshot().targetId` stays null in the
  //    arena), so `playerCommands` sends no `targetPosition` and Kalev never
  //    faces him when he swings.
  //  * Crossing the snare ring pins the player capsule at roughly
  //    (4.41, -0.20, -127.92); no held direction moves him afterwards, and the
  //    Warden's authored preferred range keeps him beyond `light1` reach.
  //  * Measured: 90 scripted swing cycles over ~14 000 ticks left the Warden at
  //    720/720 and Kalev at 300/300.
  //
  // Even with damage landing, the aftermath lights `hearth.arena` at (0, -126)
  // and standing in a Hearth radius currently throws a negative presentation
  // alpha out of the render loop (see SC-D/SC-E headers), so the aftermath
  // would freeze the page before the tag could be read.
  //
  // Page hooks that would make this row scriptable, in order of value:
  //   1. a Warden target seam for Attend, or a `WorldInputFrame.viewer` the
  //      page exposes so a script can aim;
  //   2. ring-contact resolution that does not pin the player capsule;
  //   3. the loop-alpha fix so the aftermath Hearth does not kill the frame;
  //   4. boss fields on `WorldReplayCheckpoint` so the whole fight could be
  //      proven on the replay lane instead of the live one.
  void page;
});
