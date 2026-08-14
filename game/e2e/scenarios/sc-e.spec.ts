import { expect, test } from "@playwright/test";

import { buildScript, distanceXZ, Gauntlet } from "./harness";

/**
 * SC-E — the full rest cycle at a Hearth.
 *
 * Authored replay: Kalev walks back to the cabin Hearth he was born at and
 * presses `interact`. The rest is the world's reset boundary — it snaps him to
 * the Hearth anchor, stands the packs back up at full Pulse, and drops
 * engagement.
 *
 * BLOCKER (live lane): standing inside any Hearth radius kills the shipped
 * render loop. `hudMenuForWorld` returns `"hearth"` the moment
 * `snapshot().hearth.nearbyId` is non-null; `syncMenu` then calls
 * `FixedTickLoop.setMenuPaused` from inside `step()`, which zeroes
 * `accumulatorMs` mid-`advance()`, and the trailing `accumulatorMs -= TICK_MS`
 * hands `render()` a negative alpha. `WorldPresenter.apply` throws
 * `RangeError: world presentation alpha must be in [0, 1)` out of the rAF
 * callback and the loop is never re-armed. Repro: `/?play=ironwood`, hold `S`
 * for one second. Fix belongs in `src/app/loop.ts`, outside this footprint.
 *
 * BLOCKER (refill / level): the browser facade's replay projection
 * (`runReplay` in `src/app/main.ts`) exposes only player Pulse, position, wolf
 * rows and a fixed summary. Doses, carried names and Vigil restore never leave
 * the reducer, so the "refill" and "level" halves of this row can only be
 * asserted through the pack respawn and the Hearth snap below. A
 * `metaSnapshot` field on the replay checkpoint would close it.
 */

const CABIN_HEARTH = { x: 0, y: 0.16, z: 3.15 } as const;
const APPROACH_TICKS = 90;
/** `interact` is pressed on frame tick 90, so the rest lands on sim tick 91. */
const REST_TICK = APPROACH_TICKS + 1;

test("SC-E: the Hearth rest snaps him home and stands the packs back up", async ({ page }) => {
  test.setTimeout(300_000);
  const run = await Gauntlet.boot(page, "sc-e", { debug: true });
  await run.capture("boot: inside the cabin, the Hearth is behind him");
  expect(run.errors, "the live boot must be silent before the replay").toEqual([]);

  const restScript = buildScript(
    [
      // South, back to the fire he was sitting at when the slice opened.
      { ticks: APPROACH_TICKS, moveZ: 1 },
      { ticks: 1, press: ["interact"] },
      { ticks: 240 },
    ],
    [APPROACH_TICKS, REST_TICK, REST_TICK + 240],
  );

  const replay = await run.assertDeterministic(restScript);
  const [beforeRest, justAfter, settled] = replay.replayCheckpoints;
  expect(beforeRest, "the approach checkpoint must exist").toBeDefined();
  expect(justAfter, "the rest checkpoint must exist").toBeDefined();
  expect(settled, "the settled checkpoint must exist").toBeDefined();
  if (beforeRest === undefined || justAfter === undefined || settled === undefined) return;

  // He actually reached the fire before pressing anything.
  expect(
    distanceXZ(beforeRest.playerPosition, CABIN_HEARTH),
    "the approach must end inside the 1.5 m Hearth radius",
  ).toBeLessThanOrEqual(1.5);

  // The rest is a reset boundary: it snaps him onto the Hearth anchor itself.
  expect(
    distanceXZ(justAfter.playerPosition, CABIN_HEARTH),
    "resting must place him on the Hearth anchor",
  ).toBeLessThanOrEqual(1);

  // Respawn: every wolf in the world is standing at full Pulse again.
  expect(settled.wolves.length, "the world ships ten wolves across four packs").toBe(10);
  expect(
    settled.wolves.every((wolf) => wolf.pulse === 100),
    "every pack must be restored to full Pulse by the rest",
  ).toBe(true);
  expect(settled.livingWolfIds.length).toBe(settled.wolves.length);
  // FINDING, recorded not asserted: the published snapshot still reports
  // `engaged: true` on the rest tick and after it, even though `stepWorld`
  // clears engagement inside the Hearth-rest branch. Worth a round ruling —
  // either the flag is recomputed after the reset, or the reset is cosmetic.
  expect(settled.tokenInvariant).toBe(true);
  expect(settled.moduleClocksAligned).toBe(true);

  run.writeReplayEvidence("rest-cycle", {
    hearth: CABIN_HEARTH,
    approach: beforeRest,
    rested: justAfter,
    settled,
    finalHash: replay.finalHash,
  });
  run.finish({
    scenario: "SC-E hearth rest cycle",
    finalHash: replay.finalHash,
    engagedAtRestTick: justAfter.engaged,
    settledEngaged: settled.engaged,
    afterReplayErrors: run.errors,
  });
});

test.fixme(
  "SC-E live lane: resting at a Hearth through the shipped page",
  async ({ page }) => {
    // Blocked: entering any Hearth radius opens the HUD hearth menu, which
    // takes the loop's accumulator to zero mid-step and throws a negative
    // presentation alpha out of requestAnimationFrame (see the file header).
    // Additionally `src/app/main.ts` only consumes the `resume` and
    // `death-acknowledged` HUD intents, so the rendered hearth verbs
    // (`hearth-rest-request`, `hearth-leave`) never reach `stepWorld`. Two
    // hooks would unblock this row: a non-throwing alpha clamp in
    // `src/app/loop.ts`, and a hearth-intent bridge into `WorldInputFrame`.
    void page;
  },
);
