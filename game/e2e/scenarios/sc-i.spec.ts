import { expect, test } from "@playwright/test";

import { buildScript, Gauntlet, playerOf } from "./harness";

/**
 * SC-I — backend parity: SC-A and SC-D on the forced WebGL2 fallback.
 *
 * The claim is that the renderer is downstream of the sim. The same authored
 * SC-A opening and the same SC-D death loop are replayed through the reducer on
 * the forced WebGL2 fallback and on the strict WebGPU lane, and both must land
 * on one hash, checkpoint for checkpoint.
 */

const GOLDEN_TICKS = 41_413;
/** See SC-D: the hash `e2e/world.spec.ts` pins for the same golden script. */
const WORLD_SPEC_FROZEN_HASH = "858797d7";

/** The SC-A opening, authored once and replayed on both backends. */
const SC_A_OPENING = buildScript(
  [
    { ticks: 200, moveZ: -1 },
    { ticks: 4, moveZ: -1, press: ["attend"] },
    { ticks: 90, moveZ: -1 },
    { ticks: 4, press: ["attack"] },
    { ticks: 90 },
    { ticks: 4, press: ["attack"] },
    { ticks: 90 },
    { ticks: 4, press: ["roll"] },
    { ticks: 120 },
  ],
  [200, 294, 388, 482, 606],
);

test("SC-I: the SC-A opening and the SC-D death loop agree across render backends", async ({
  page,
  context,
}) => {
  test.setTimeout(900_000);
  test.slow();

  const portable = await Gauntlet.boot(page, "sc-i/webgl2", { backend: "webgl2" });
  await expect(page.locator("body")).toHaveAttribute("data-renderer-backend", "webgl2");
  await portable.capture("forced WebGL2 fallback: booted");

  const portableMark = portable.errors.length;
  expect(portable.errors, "the WebGL2 boot must be silent before any replay").toEqual([]);
  const webgl2Opening = await portable.assertDeterministic(SC_A_OPENING);
  expect(webgl2Opening.ticks).toBe(SC_A_OPENING.durationTicks);

  const strictPage = await context.newPage();
  const strict = await Gauntlet.boot(strictPage, "sc-i/webgpu", { backend: "webgpu" });
  await expect(strictPage.locator("body")).toHaveAttribute("data-renderer-backend", "webgpu");
  await strict.capture("strict WebGPU lane: booted");
  const strictMark = strict.errors.length;
  expect(strict.errors, "the WebGPU boot must be silent before any replay").toEqual([]);
  const webgpuOpening = await strict.assertDeterministic(SC_A_OPENING);

  // SC-A parity: the reducer does not know which backend drew the frame.
  expect(webgpuOpening.finalHash, "SC-A must hash identically on both backends").toBe(
    webgl2Opening.finalHash,
  );
  expect(
    webgpuOpening.replayCheckpoints.map(({ tick, stateHash }) => ({ tick, stateHash })),
    "every SC-A checkpoint must agree across backends",
  ).toEqual(webgl2Opening.replayCheckpoints.map(({ tick, stateHash }) => ({ tick, stateHash })));
  expect(webgpuOpening.checkpoints).toEqual(webgl2Opening.checkpoints);

  // SC-D parity: the authored death loop, run on both backends.
  const deathLoop = await portable.runReplay();
  const deathLoopStrict = await strict.runReplay();
  expect(deathLoop.ticks).toBe(GOLDEN_TICKS);
  expect(
    deathLoopStrict.finalHash,
    "the death loop must hash identically on both backends",
  ).toBe(deathLoop.finalHash);
  expect(
    deathLoopStrict.replayCheckpoints.map(({ tick, stateHash }) => ({ tick, stateHash })),
    "every death-loop checkpoint must agree across backends",
  ).toEqual(deathLoop.replayCheckpoints.map(({ tick, stateHash }) => ({ tick, stateHash })));
  expect(deathLoopStrict.checkpoints).toEqual(deathLoop.checkpoints);
  expect(deathLoop.checkpoints.playerDied).toBe(true);
  expect(deathLoop.checkpoints.openPageDropped).toBe(true);
  expect(deathLoop.checkpoints.openPageRecovered).toBe(true);
  expect(deathLoop.checkpoints.respawnedAtHearth).toBe(true);
  expect(deathLoop.finalHash, "both backends must still hash to the frozen golden").toBe(
    WORLD_SPEC_FROZEN_HASH,
  );

  const portableSnapshot = await portable.snapshot();
  const strictSnapshot = await strict.snapshot();
  expect(
    playerOf(strictSnapshot).position.z.toFixed(3),
    "the rebased live world must land on the same yard approach on both backends",
  ).toBe(playerOf(portableSnapshot).position.z.toFixed(3));

  portable.writeReplayEvidence("parity", {
    webgl2: { opening: webgl2Opening.finalHash, deathLoop: deathLoop.finalHash },
    webgpu: { opening: webgpuOpening.finalHash, deathLoop: deathLoopStrict.finalHash },
    scAOpeningTicks: SC_A_OPENING.durationTicks,
    worldSpecFrozenHash: WORLD_SPEC_FROZEN_HASH,
    frozenHashStillMatches: deathLoop.finalHash === WORLD_SPEC_FROZEN_HASH,
  });
  strict.writeReplayEvidence("parity", { opening: webgpuOpening });
  // The post-replay VFX-clock desync this row used to record is fixed
  // (`setLiveState` now rebases `vfx` with `state`); the error lists are still
  // captured on both lanes so a regression shows up in the evidence.
  portable.finish({
    scenario: "SC-I backend parity (webgl2)",
    finalHash: deathLoop.finalHash,
    afterReplayErrors: portable.errorsSince(portableMark),
  });
  strict.finish({
    scenario: "SC-I backend parity (webgpu)",
    finalHash: webgpuOpening.finalHash,
    afterReplayErrors: strict.errorsSince(strictMark),
  });
  await strictPage.close();
});
