import { expect, test } from "@playwright/test";

import { buildScript, Gauntlet, livingWolvesOf } from "./harness";

/**
 * SC-B — the yard, three wolves, one attack token.
 *
 * The fairness claim under test is not "the pack is beatable"; it is that only
 * one yard wolf may ever be committed to a swing, and that the token actually
 * moves between them rather than parking on the first wolf to reach Kalev.
 *
 * The live world is rebased onto the golden replay's tick-155 yard approach —
 * the one page hook that puts Kalev in the yard without wall-clock walking.
 */

const YARD_WINDOW_TICKS = 1_400;

test("SC-B: the yard pack shares one attack token and rotates it", async ({ page }) => {
  test.setTimeout(600_000);
  const run = await Gauntlet.boot(page, "sc-b", { debug: true });

  const arrived = await run.fastTravelToYard();
  // The facade rebases live state on the golden tick-155 yard approach; the
  // loop keeps running while the snapshot is read back, so allow the drift.
  expect(arrived.tick, "the yard rebase must land on the golden approach tick").toBeGreaterThanOrEqual(155);
  expect(arrived.tick).toBeLessThan(400);
  expect(
    livingWolvesOf(arrived).filter((wolf) => wolf.packId === "yard").length,
    "the yard pack ships three wolves",
  ).toBe(3);
  await run.capture("yard: three wolves, no token committed yet");

  await run.attend();
  const holders = new Set<string>();
  let maxSimultaneousSwings = 0;
  let samples = 0;
  const deadline = arrived.tick + YARD_WINDOW_TICKS;

  while ((await run.tick()) < deadline) {
    const snapshot = await run.snapshot();
    samples += 1;

    const yardHolders = snapshot.tokenHolders.filter((holder) => holder.packId === "yard");
    expect(yardHolders.length, "the yard pack must publish exactly one token slot").toBe(1);
    for (const holder of yardHolders) {
      if (holder.wolfId !== null) holders.add(holder.wolfId);
    }

    const swinging = snapshot.actors.filter(
      (actor) => actor.kind === "wolf" && actor.packId === "yard" && actor.hitboxes.length > 0,
    ).length;
    maxSimultaneousSwings = Math.max(maxSimultaneousSwings, swinging);
    expect(
      swinging,
      `two yard wolves had live weapon capsules at tick ${String(snapshot.tick)}`,
    ).toBeLessThanOrEqual(1);
    expect(snapshot.tokenInvariant, `token invariant broke at tick ${String(snapshot.tick)}`).toBe(
      true,
    );

    if (samples % 12 === 0) {
      await run.capture(
        `token holder ${String(yardHolders[0]?.wolfId ?? "none")} · ${String(holders.size)} distinct so far`,
      );
    }
    await run.swing();
  }

  const settled = await run.snapshot();
  await run.capture("yard window closed");
  expect(
    holders.size,
    "the token parked on one wolf for the whole window instead of rotating",
  ).toBeGreaterThanOrEqual(2);
  expect(maxSimultaneousSwings).toBeLessThanOrEqual(1);
  expect(settled.tokenInvariant).toBe(true);

  // Sim-truth corroboration: the same claim measured across a whole authored
  // replay rather than at sampled live frames.
  const yardScript = buildScript(
    [
      { ticks: 150, moveZ: -1 },
      { ticks: 4, moveZ: -1, press: ["attend"] },
      { ticks: 200, moveZ: -1 },
      { ticks: 4, press: ["attack"] },
      { ticks: 400 },
      { ticks: 4, press: ["attack"] },
      { ticks: 400 },
    ],
    [354, 758, 1_162],
  );
  const replay = await run.assertDeterministic(yardScript);
  expect(
    replay.checkpoints.maxConcurrentAttackTokens,
    "no tick of the authored yard replay may hold two attack tokens",
  ).toBeLessThanOrEqual(1);
  run.writeReplayEvidence("token-fairness", {
    liveDistinctHolders: [...holders],
    liveSamples: samples,
    maxSimultaneousSwings,
    replay,
  });
  run.finish({ scenario: "SC-B yard 3-wolf token fairness", distinctHolders: [...holders] });
  expect(run.errors).toEqual([]);
});
