import { expect, test } from "@playwright/test";

import { Gauntlet, playerOf, wardenOf } from "./harness";

/**
 * SC-G — the Warden's ceremony and the P2 kill run.
 *
 * Two rows, both live on the shipped page. The first pins the state the
 * ceremony is measured against: the arena gate fires, the Warden stands at his
 * full authored 720 Pulse, and the 55% threshold is 396 Pulse of scripted
 * damage away. The second drives the whole fight — 720 to 0, through the
 * ceremony, into P2, to `victoryNoRespawn`.
 */

const CEREMONY_PULSE_PERCENT = 55;
/**
 * The duel stance, measured. Every landed swing in this pack connected inside
 * 0.65 m centre to centre, so the driver holds contact — but not *through* him:
 * driving Kalev into the Warden's own capsule shoves him past his authored ring
 * clamp, and the arena mesh stops at the ring. 0.55 m lands and leaves him
 * standing.
 */
const CONTACT_HOLD_METERS = 0.55;
/** Swing whenever the Warden is inside this, measured centre to centre. */
const CONTACT_SWING_RANGE_METERS = 1;
/**
 * The snare ring is a 9.2 m circle on (0, -136) and the level mesh runs out
 * with it. Kalev is kept inside 8.6 m of the middle so a chase along the rim
 * cannot walk him off the world.
 */
const ARENA_GUARD = { x: 0, z: -136, radiusMeters: 8.6 } as const;

test("SC-G: the ceremony precondition is reachable and the threshold is sim truth", async ({
  page,
}) => {
  test.setTimeout(600_000);
  test.slow();
  const run = await Gauntlet.boot(page, "sc-g", { debug: true });

  await run.capture("boot: the arena is cold");
  // The lock is taken before the ring. Attend's 34-degree acquisition cone is
  // measured from Kalev's eye — `capsule.height - capsule.radius`, 1.40 m — to
  // the Warden's capsule centre at `capsule.height / 2`, 0.88 m, so on level
  // ground the target sits about 0.53 m below the eye line: 46 degrees down at
  // half a metre, and inside the cone only past about 0.8 m. Twelve metres out
  // he is 2.5 degrees down, which is as clean an acquisition as the cone gives.
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

test("SC-G: ceremony at 55% then a full P2 kill run", async ({ page }) => {
  test.setTimeout(900_000);
  test.slow();
  const run = await Gauntlet.boot(page, "sc-g/kill", { debug: true });
  const startedAt = Date.now();

  const locked = await run.lockOntoWardenAtRange(12);
  expect(locked.targetId, "Attend must take the Warden from outside his ring").toBe("warden");
  const arrived = await run.walkToArenaRing();
  expect(arrived.boss.enteredArena, "the arena gate must fire before the fight").toBe(true);
  expect(arrived.boss.pulse).toBe(720);
  await run.capture("the ring is crossed at 720 Pulse, phase p1");

  await run.startRecorder();
  const duelStartedAt = Date.now();
  const kill = await run.driveDuel({
    holdMeters: CONTACT_HOLD_METERS,
    swingRangeMeters: CONTACT_SWING_RANGE_METERS,
    maxTicks: 12_000,
    attack: true,
    relockFromMeters: 1,
    stopWhenDefeated: true,
    abortBelowY: -2,
    traceEveryTicks: 200,
    flaskBelowPulseRatio: 0.5,
    arenaCentre: ARENA_GUARD,
  });
  const duelMs = Date.now() - duelStartedAt;
  await run.capture(
    `defeated: ${String(kill.swings)} swings, ${String(kill.hits.length)} landed, Warden at ${String(kill.bossPulseEnd)}`,
  );

  const settled = await run.snapshot();
  run.writeReplayEvidence("kill-run", {
    duelMs,
    totalMs: Date.now() - startedAt,
    ticks: kill.endTick - kill.startTick,
    startTick: kill.startTick,
    endTick: kill.endTick,
    reason: kill.reason,
    swings: kill.swings,
    hits: kill.hits,
    ceremonyTick: kill.ceremonyTick,
    ceremonyBossPulse: kill.ceremonyBossPulse,
    defeatTick: kill.defeatTick,
    minPlayerPulse: kill.minPlayerPulse,
    flasks: kill.flasks,
    belowFloor: kill.belowFloor,
    trace: kill.trace,
    boss: settled.boss,
  });
  run.finish({
    scenario: "SC-G Warden kill run",
    ticks: kill.endTick - kill.startTick,
    duelMs,
    ceremonyBossPulse: kill.ceremonyBossPulse,
  });

  expect(kill.belowFloor, "neither fighter may leave the level mesh").toBeNull();
  expect(kill.reason, "the duel must end because the Warden fell, not on a budget").toBe(
    "defeated",
  );
  expect(kill.ceremonyTick, "the ceremony must fire during the run").not.toBeNull();
  expect(
    kill.ceremonyBossPulse,
    `the ceremony is a ${String(CEREMONY_PULSE_PERCENT)}% gate, so it cannot fire above 396 Pulse`,
  ).toBeLessThanOrEqual((720 * CEREMONY_PULSE_PERCENT) / 100);
  expect(kill.defeatTick, "the Warden must actually be defeated").not.toBeNull();
  expect(kill.phaseAtEnd, "the kill must land in P2, on the far side of the ceremony").toBe("p2");
  expect(kill.bossPulseEnd).toBe(0);
  expect(settled.boss.defeated).toBe(true);
  expect(settled.boss.arena, "the arena gate must close on victory").toBe("victoryNoRespawn");
  expect(run.errors).toEqual([]);
});
