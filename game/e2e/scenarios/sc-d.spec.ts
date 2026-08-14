import { expect, test } from "@playwright/test";

import { Gauntlet, KEY, playerOf } from "./harness";

/**
 * SC-D — death, the Open Page, and walking back for what you dropped.
 *
 * Driven on the replay lane. The reducer's own authored death script is the
 * scenario: it dies to the yard pack, drops the Open Page where it fell,
 * respawns at the cabin Hearth, walks back, and recovers the names.
 *
 * BLOCKER (live lane): the same loop cannot be driven through the shipped
 * `?play=ironwood` page. `syncMenu` in `src/app/main.ts` calls
 * `FixedTickLoop.setMenuPaused` from inside `step()`, and `setMenuPaused`
 * unconditionally zeroes `accumulatorMs`; the enclosing `advance()` then runs
 * `accumulatorMs -= TICK_MS`, so `render()` is handed a negative alpha and
 * `WorldPresenter.apply` throws `RangeError: world presentation alpha must be
 * in [0, 1)` out of the rAF callback, which is never re-armed. Any menu
 * transition — death or Hearth — kills the running game permanently. Repro:
 * boot `/?play=ironwood`, hold `S` for one second (walk into the cabin
 * Hearth's 1.5 m radius); the sim clock stops dead. That defect is in `src/`
 * and outside this pack's footprint. See the fixme at the bottom of this file.
 */

const GOLDEN_TICKS = 41_413;
/**
 * `e2e/world.spec.ts` still pins this hash. On this worktree the same script
 * replays to `a62d4f1d`, so the frozen constant has drifted from the reducer —
 * a repo-level finding this row records rather than duplicates as a second red.
 * SC-D asserts what it can own: the loop is deterministic run-to-run and the
 * authored death/recovery beats all fire.
 */
const WORLD_SPEC_FROZEN_HASH = "4a8d3191";
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

  // DEFECT, recorded not asserted: the shipped `runReplay` rebases world state
  // to the golden yard approach without rebasing the VFX clock, so the next
  // live step throws "VFX ticks advance monotonically (state at N, got 156)"
  // out of the render loop and the running game stops. `setLiveState` in
  // `src/app/main.ts` needs to reset `vfx` alongside `state`.
  const afterReplayErrors = run.errorsSince(errorMark);
  run.finish({
    scenario: "SC-D death → Open Page → recover",
    finalHash: replay.finalHash,
    afterReplayErrors,
  });
});

test.fixme(
  "SC-D live lane: the death overlay must not kill the render loop",
  async ({ page }) => {
    // Blocked on a src/ defect this pack may not touch. `syncMenu` →
    // `FixedTickLoop.setMenuPaused` zeroes the loop accumulator from inside
    // `step()`, so the enclosing `advance()` renders with alpha < 0 and throws
    // out of requestAnimationFrame. Dying (or standing in any Hearth) freezes
    // the game at that tick. The one-line fix belongs in `src/app/loop.ts`
    // (do not reset `accumulatorMs` when the paused flag is unchanged, or
    // clamp the accumulator to >= 0 before computing alpha). Until then no
    // scripted input can reach the Open Page overlay through the live page.
    void page;
  },
);
