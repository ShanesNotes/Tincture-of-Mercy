import { expect, test } from "@playwright/test";

import { Gauntlet, KEY, playerOf } from "./harness";

/**
 * SC-D — death, the Open Page, and walking back for what you dropped.
 *
 * Driven on the replay lane. The reducer's own authored death script is the
 * scenario: it dies to the yard pack, drops the Open Page where it fell,
 * respawns at the cabin Hearth, walks back, and recovers the names.
 *
 * The live lane at the bottom now runs too: the Warden kills Kalev in the
 * middle of his own ring, the page holds the Open Page overlay open across the
 * respawn tick, and the row dismisses it and keeps playing.
 */

const GOLDEN_TICKS = 41_413;
/**
 * The hash `e2e/world.spec.ts` pins for the same golden script. It agrees with
 * the reducer again after the s22 regeneration, so this row anchors on it
 * rather than merely recording the drift.
 */
const WORLD_SPEC_FROZEN_HASH = "0e0810f9";
/** The middle of the Warden's ring: the only ground he can reach Kalev on. */
const ARENA_MIDDLE = { x: 0, y: 0, z: -136 } as const;
/**
 * Kalev is held near the middle so the fight stays on the arena mesh, which
 * runs out with the 9.2 m snare ring.
 */
const ARENA_GUARD = { x: 0, z: -136, radiusMeters: 3 } as const;
/** The three frozen checkpoints that bracket the death loop. */
const DEATH_LOOP_CHECKPOINT_TICKS = [39_788, 39_996, GOLDEN_TICKS] as const;

test("SC-D: death drops the Open Page, the Hearth takes him back, the walk recovers it", async ({
  page,
}) => {
  test.setTimeout(600_000);
  const run = await Gauntlet.boot(page, "sc-d", { debug: true });

  await run.capture("boot: alive, page unwritten, three doses");
  await run.hold(KEY.forward);
  await run.waitFor("engaged in the yard", (snapshot) => playerOf(snapshot).position.z <= -12);
  await run.release(KEY.forward);
  await run.capture("the yard: where the authored death happens");

  expect(run.errors, "the live approach must be silent before the replay").toEqual([]);
  const errorMark = run.errors.length;

  const replay = await run.runReplay();
  const second = await run.runReplay();
  expect(replay.ticks).toBe(GOLDEN_TICKS);
  expect(second.finalHash, "two runs of the death loop must land on one hash").toBe(
    replay.finalHash,
  );
  expect(
    second.replayCheckpoints.map(({ tick, stateHash }) => ({ tick, stateHash })),
    "two runs of the death loop must agree at every checkpoint",
  ).toEqual(replay.replayCheckpoints.map(({ tick, stateHash }) => ({ tick, stateHash })));
  expect(replay.finalHash).toMatch(/^[0-9a-f]{8}$/);
  expect(replay.finalHash, "the death loop must still hash to the frozen golden").toBe(
    WORLD_SPEC_FROZEN_HASH,
  );

  const { checkpoints } = replay;
  expect(checkpoints.playerDied, "the loop starts with a real death").toBe(true);
  expect(checkpoints.openPageDropped, "death must leave the Open Page behind").toBe(true);
  expect(checkpoints.respawnedAtHearth, "death must return him to the Hearth").toBe(true);
  expect(checkpoints.openPageRecovered, "the walk back must recover the names").toBe(true);
  expect(checkpoints.wolvesRespawned, "the pack must be standing again after the respawn").toBe(
    true,
  );
  expect(checkpoints.playerDamageTaken).toBe(checkpoints.expectedPlayerDamage);
  expect(checkpoints.maxConcurrentAttackTokens).toBeLessThanOrEqual(1);

  const loop = replay.replayCheckpoints.filter((point) =>
    (DEATH_LOOP_CHECKPOINT_TICKS as readonly number[]).includes(point.tick),
  );
  expect(loop.map((point) => point.tick)).toEqual([...DEATH_LOOP_CHECKPOINT_TICKS]);
  expect(loop.every((point) => point.tokenInvariant)).toBe(true);
  expect(loop.every((point) => point.moduleClocksAligned)).toBe(true);
  // The names are back on him by the end of the loop, not still on the ground.
  expect(loop.at(-1)?.openPageNames).toBe(0);

  run.writeReplayEvidence("death-loop", {
    ticks: replay.ticks,
    finalHash: replay.finalHash,
    worldSpecFrozenHash: WORLD_SPEC_FROZEN_HASH,
    frozenHashStillMatches: replay.finalHash === WORLD_SPEC_FROZEN_HASH,
    summary: checkpoints,
    checkpoints: replay.replayCheckpoints,
  });

  const rebased = await run.snapshot();
  expect(rebased.meta.life, "the rebased live world is alive again").toBe("alive");

  // The VFX-clock desync this row used to record is fixed: `setLiveState` in
  // `src/app/main.ts` now resets `vfx` alongside `state`. Still captured, so a
  // regression shows up in the evidence rather than only in a red assertion.
  const afterReplayErrors = run.errorsSince(errorMark);
  run.finish({
    scenario: "SC-D death → Open Page → recover",
    finalHash: replay.finalHash,
    afterReplayErrors,
  });
});

test("SC-D live lane: a scripted death through the shipped page", async ({ page }) => {
  test.setTimeout(900_000);
  test.slow();
  const run = await Gauntlet.boot(page, "sc-d/live", { debug: true });
  await run.capture("boot: alive, three doses, the page unwritten");

  // The only damage source a live script can reach is the Warden, and he can
  // only reach Kalev where his own move table is legal — 0.8 m and out. Pinned
  // against his ring he has no legal move at all, so the fight is dragged into
  // the middle of the arena, where he commits and lands.
  const locked = await run.lockOntoWardenAtRange(12);
  expect(locked.targetId, "Attend must take the Warden from outside his ring").toBe("warden");
  const arrived = await run.walkToArenaRing();
  expect(arrived.boss.enteredArena, "the arena gate must fire before the fight").toBe(true);
  const middle = await run.walkTo(ARENA_MIDDLE, 1.5);
  await run.capture(
    `the middle of the ring at ${playerOf(middle).pulse.toFixed(0)} Pulse: within his reach`,
  );

  const duel = await run.driveDuel({
    holdMeters: 0.2,
    swingRangeMeters: 1.2,
    maxTicks: 20_000,
    attack: true,
    relockFromMeters: 1,
    stopOnRespawn: true,
    abortBelowY: -2,
    traceEveryTicks: 500,
    arenaCentre: ARENA_GUARD,
  });

  expect(duel.belowFloor, "the fight must stay on the arena mesh").toBeNull();
  expect(duel.respawn, "the Warden must actually kill him").not.toBeNull();
  const respawn = duel.respawn;
  if (respawn === null) return;
  // The last blow is worth up to 84 Pulse (the two-step chop), so "he died at
  // the bottom of the pool" is bounded by the biggest thing that can kill him.
  expect(respawn.pulseBefore, "he must die at the bottom of his pool").toBeLessThan(120);
  expect(respawn.jumpMeters, "a death is a teleport back to the Hearth").toBeGreaterThan(100);
  expect(respawn.hearthId, "the cabin Hearth is the one he was born at").toBe("cabin");
  expect(respawn.pulseAfter, "the Hearth gives the pool back whole").toBe(middle.meta.maxPulse);

  // The world records the death and respawns inside the same tick, so the page
  // latches it: the Open Page overlay stands until it is dismissed. It stands
  // over a living world — it is a notice, not a game over — so the clock keeps
  // stepping behind it.
  const overlay = page.locator('[data-testid="hud-menu-death"]');
  await expect(overlay, "the Open Page overlay must be standing after the death").toBeVisible();
  await run.capture("the page falls open over a world that keeps going");
  const openedAt = await run.tick();
  await page.waitForTimeout(750);
  expect(
    await run.tick(),
    "the Open Page is a notice, not a modal: the world keeps its clock",
  ).toBeGreaterThan(openedAt);
  await expect(overlay, "and it is still standing while the world runs").toBeVisible();

  await page.locator('[data-testid="menu-respawn"]').click();
  await expect(overlay, "acknowledging the death must close the overlay").toHaveCount(0);
  const resumed = await run.advanceTicks(180, 60_000);
  expect(resumed, "the clock is still stepping once the page is closed").toBeGreaterThan(openedAt);
  const after = await run.snapshot();
  await run.capture(`play resumes at tick ${String(after.tick)}, ${String(after.meta.life)}`);

  expect(after.meta.life, "he is alive on the far side of the overlay").toBe("alive");
  expect(playerOf(after).alive).toBe(true);
  expect(after.boss.enteredArena, "his death resets the arena gate behind him").toBe(false);
  expect(after.boss.pulse, "and stands the Warden back up whole").toBe(after.boss.maxPulse);

  run.writeReplayEvidence("live-death", {
    ticks: duel.endTick - duel.startTick,
    respawn,
    minPlayerPulse: duel.minPlayerPulse,
    swings: duel.swings,
    overlayOpenedTick: openedAt,
    resumedTick: resumed,
    trace: duel.trace,
  });
  run.finish({ scenario: "SC-D live death → Open Page → acknowledge", deathTick: respawn.tick });
  expect(run.errors).toEqual([]);
});
