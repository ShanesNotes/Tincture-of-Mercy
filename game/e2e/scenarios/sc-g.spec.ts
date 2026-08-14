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
/** Contact stance: close to this before standing and swinging. */
const CONTACT_HOLD_METERS = 0.15;
/** Swing whenever the Warden is inside this, measured centre to centre. */
const CONTACT_SWING_RANGE_METERS = 1;

test("SC-G: the ceremony precondition is reachable and the threshold is sim truth", async ({
  page,
}) => {
  test.setTimeout(600_000);
  test.slow();
  const run = await Gauntlet.boot(page, "sc-g", { debug: true });

  await run.capture("boot: the arena is cold");
  // The lock has to be taken before the ring: Attend's 34-degree acquisition
  // cone is measured from Kalev's eye and the Warden's capsule centre sits
  // about 1.06 m below it, so at 0.5 m of separation he is 65 degrees down and
  // there is no candidate at all. Twelve metres out he is 5 degrees down.
  const locked = await run.lockOntoWardenAtRange(12);
  expect(locked.targetId, "Attend must take the Warden from outside his ring").toBe("warden");
  await run.capture("attend: the lock is taken at 12 m, outside the ring");
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

  // RECORDED, NOT ASSERTED — the reproduction the fixme below is written from.
  // A scripted contact duel, Attend held, Kalev standing inside the Warden's
  // own capsule, swinging every time his action clock frees. `liveSwingFrames`
  // is the dump that explains the result: Kalev's light capsule spans roughly
  // y 0.50 down to y -0.01 with radius 0, and the Warden's lowest hurtbox is a
  // 0.14 m capsule centred at y 0.91. They cannot overlap.
  const contact = await run.driveDuel({
    holdMeters: CONTACT_HOLD_METERS,
    swingRangeMeters: CONTACT_SWING_RANGE_METERS,
    maxTicks: 2_000,
    attack: true,
  });
  await run.capture(
    `scripted contact: ${String(contact.swings)} swings, Warden at ${String(contact.bossPulseEnd)}`,
  );
  run.writeReplayEvidence("scripted-contact", contact);

  run.writeReplayEvidence("ceremony-precondition", {
    ceremonyPulse,
    boss: arrived.boss,
    playerPulse: playerOf(arrived).pulse,
    recorderTicks: rows.length,
    damageStillOwed: arrived.boss.pulse - ceremonyPulse,
    approachPath: run.approachPath,
  });
  run.finish({ scenario: "SC-G Warden ceremony precondition", ceremonyPulse });
  expect(run.errors).toEqual([]);
});

test.fixme("SC-G: ceremony at 55% then a full P2 kill run", async ({ page }) => {
  // Blocked, and no longer on any of the three reasons this row used to give.
  // Attend does take the Warden (from 12 m, outside his ring — see the row
  // above), the snare no longer pins Kalev, and the Hearth overlay no longer
  // kills the frame. What blocks the row now is that Kalev cannot hit him.
  //
  // The `scripted-contact` evidence this file writes is the measurement. With
  // the lock held for every frame of a 2 000-tick duel and Kalev standing
  // 0.02-0.09 m from the Warden — inside his capsule — his light capsule is
  // published as a zero-radius segment running from about y 0.50 down to
  // y -0.01, while the Warden's three hurtboxes are capsules centred at
  // y 0.91 (r 0.14), y 1.04-1.36 (r 0.16) and y 1.70-1.94 (r 0.11). The lowest
  // point of the Warden's lowest hurtbox is y 0.77; the highest point of
  // Kalev's weapon is y 0.50. There is a ~0.27 m vertical gap and the two can
  // never overlap, so the swing is a miss by construction.
  //
  // Measured on the shipped page, all with the lock held:
  //   * 21-30 swings at 0.02-0.09 m over ~1 000 ticks: Warden 720/720;
  //   * 160 swings at up to 3 m over 6 000 ticks: Warden 720/720;
  //   * 132 swings at 0.7 m over 6 000 ticks: Warden 692/720 — a single hit,
  //     landed during one of his own lowered animation frames.
  // The same driver against a flat-plane ground probe (`probeGround` returning
  // y = 0 everywhere, which drops the Warden's rig ~0.5 m relative to Kalev's)
  // takes him from 720 to 0 in about 2 400 ticks with 67 swings. So the
  // headless "first blood at tick 251" measurement is an artefact of the flat
  // probe, not evidence that the assembled world is winnable.
  //
  // The fix belongs in the rigs, not in this pack: either Kalev's authored
  // weapon capsule needs a real radius and a height that reaches a standing
  // opponent, or the Warden's hurtboxes need to descend to his own feet.
  void page;
});
