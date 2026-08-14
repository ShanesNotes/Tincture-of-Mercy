import { expect, test } from "@playwright/test";

import { Gauntlet, KEY, playerOf } from "./harness";

/**
 * SC-D — death, the Open Page, and walking back for what you dropped.
 *
 * Driven on the replay lane. The reducer's own authored death script is the
 * scenario: it dies to the yard pack, drops the Open Page where it fell,
 * respawns at the cabin Hearth, walks back, and recovers the names.
 *
 * The live lane at the bottom of this file stays fixme, but on new grounds:
 * the loop defect it was frozen on is fixed, and what replaced it is that the
 * world has no observable death state at all. See the row for the numbers.
 */

const GOLDEN_TICKS = 41_413;
/**
 * The hash `e2e/world.spec.ts` pins for the same golden script. It agrees with
 * the reducer again after the s22 regeneration, so this row anchors on it
 * rather than merely recording the drift.
 */
const WORLD_SPEC_FROZEN_HASH = "13ae38a3";
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

test.fixme("SC-D live lane: a scripted death through the shipped page", async ({ page }) => {
  // Unblocked in `src/`, still unscriptable here, and for two different
  // reasons — neither of them the loop defect this row was frozen on. That
  // one is fixed and is now covered by the SC-E live row, which opens the
  // Hearth overlay and the Escape pause over a clock that keeps stepping.
  //
  //  1. There is no death overlay to drive. `stepWorld` calls `recordDeath`
  //     and then `respawnAtHearth` inside the same tick, so `meta.life` is
  //     never observed as `"dead"` from outside and `hudMenuForWorld` can
  //     never return `"death"`. Measured: across every live run in this pack a
  //     death overlay was mounted on 0 frames. From the page's side a death is
  //     a teleport — Kalev at the cabin Hearth, 132-134 m from where he fell,
  //     at full Pulse, one tick later.
  //  2. The only damage source a script can reach is the Warden, and whether
  //     he lands the kill is not stable run to run. A passive Kalev takes
  //     nothing: 20 000 ticks standing in the yard pack and 8 000 hugging the
  //     Warden unlocked both end at 300/300. What does draw damage is hugging
  //     him *while swinging*, and that outcome is frame-pacing sensitive:
  //       * hold 0.15 m, swing inside 1 m — 2 of 4 runs died (fight-tick
  //         ~1 020-1 100, minimum Pulse 10-12), 2 ran the full budget;
  //       * hold 0.15 m, no swinging — 0 of 2 died, minimum Pulse 216 twice;
  //       * hold 0.15 m, swing inside 3 m — 0 of 3 died, minimum Pulse 300 in
  //         all three, 160 swings each.
  //     A row that dies half the time is not a row.
  //
  // What would close this: a world seam that can put Kalev's Pulse where a
  // scenario needs it (the replay lane already has one — the golden death
  // script — but it costs 41 413 ticks, which is minutes of browser time), or
  // a death state that survives its own tick so the overlay can be driven.
  void page;
});
