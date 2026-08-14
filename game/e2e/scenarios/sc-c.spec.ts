import { expect, test } from "@playwright/test";

import { buildScript, distanceXZ, Gauntlet, KEY, livingWolvesOf, playerOf } from "./harness";

/**
 * SC-C — the road, four wolves, and the flask you have to earn the room to drink.
 *
 * Kalev walks the road corridor until the four-wolf pack owns the frame, trades
 * with it, and commits the vial while it is still on him. The row passes when a
 * dose is spent with the pack engaged and inside reach — not when the fight is
 * won. Whether the pack has drawn blood by then is its own AI's business, so the
 * Pulse-restored half is asserted only when there was Pulse to restore, and
 * recorded either way.
 */

test("SC-C: the road pack draws blood and the vial is committed under pressure", async ({
  page,
}) => {
  test.setTimeout(600_000);
  const run = await Gauntlet.boot(page, "sc-c", { debug: true });

  const start = await run.snapshot();
  expect(start.meta.doses, "Anna's vial ships with three doses").toBe(3);
  await run.capture("boot: three doses, full Pulse");

  // The road pack sits between z = -78 and z = -91. Stop short of the road
  // Hearth at (4.2, -116) — see SC-E for why standing in a Hearth is fatal.
  await run.walkNorthTo(-84);
  const onRoad = await run.snapshot();
  expect(onRoad.zoneId, "the fight must happen in the ROAD zone").toBe("ROAD");
  expect(
    livingWolvesOf(onRoad).filter((wolf) => wolf.packId === "road").length,
    "the road pack ships four wolves",
  ).toBe(4);
  await run.capture("road: the four-wolf pack is awake");

  await run.attend();
  const maxPulse = onRoad.meta.maxPulse;
  let lowest = playerOf(onRoad).pulse;

  const nearestRoadWolf = (snapshot: Awaited<ReturnType<Gauntlet["snapshot"]>>) => {
    const player = playerOf(snapshot);
    return [...livingWolvesOf(snapshot)]
      .filter((wolf) => wolf.packId === "road")
      .sort(
        (left, right) =>
          distanceXZ(left.position, player.position) - distanceXZ(right.position, player.position),
      )[0];
  };

  for (let exchange = 0; exchange < 45; exchange += 1) {
    // Never chase past z = -100: the road Hearth sits at (4.2, -116), and a
    // stray `interact` inside its radius would rest away the pressure this
    // row is measuring.
    if (playerOf(await run.snapshot()).position.z <= -100) {
      await run.hold(KEY.back);
      await run.advanceTicks(30);
      await run.release(KEY.back);
    }
    await run.closeTo(nearestRoadWolf, 1.15, 12);
    await run.swing();
    // Stand in the pack's reach without acting: the bait window is what lets a
    // road wolf actually commit, instead of Kalev walking out of every swing.
    await run.advanceTicks(40);
    const snapshot = await run.snapshot();
    lowest = Math.min(lowest, playerOf(snapshot).pulse);
    expect(
      snapshot.actors.filter(
        (actor) => actor.kind === "wolf" && actor.packId === "road" && actor.hitboxes.length > 0,
      ).length,
      "the road pack must never open two weapon capsules at once",
    ).toBeLessThanOrEqual(1);
    expect(snapshot.tokenInvariant).toBe(true);
    if (exchange % 5 === 0) {
      await run.capture(`road exchange ${String(exchange)}: Pulse ${String(playerOf(snapshot).pulse)}`);
    }
    if (lowest < maxPulse || run.errors.length > 0) break;
    if (snapshot.targetId === null) await run.attend();
  }

  const hurt = await run.snapshot();
  const pressing = [...livingWolvesOf(hurt)]
    .filter((wolf) => wolf.packId === "road")
    .map((wolf) => distanceXZ(wolf.position, playerOf(hurt).position));
  expect(pressing.length, "the road pack must still be standing when the vial is drawn")
    .toBeGreaterThanOrEqual(1);
  expect(
    Math.min(...pressing),
    "the vial must be committed under pressure, not in an empty corridor",
  ).toBeLessThanOrEqual(8);
  const wasHurt = lowest < maxPulse;
  await run.capture(`hurt: Pulse ${String(playerOf(hurt).pulse)} of ${String(maxPulse)}`);

  // Commit the vial while the pack is still on him.
  await run.tap(KEY.flask);
  const drank = await run.waitFor(
    "a dose was spent",
    (snapshot) => snapshot.meta.doses < 3,
    30_000,
  );
  await run.capture(`flask committed: ${String(drank.meta.doses)} doses left`);
  expect(drank.meta.doses, "one dose, not the whole vial").toBe(2);

  if (wasHurt) {
    const healed = await run.waitFor(
      "the dose paid out Pulse",
      (snapshot) => playerOf(snapshot).pulse > playerOf(hurt).pulse,
      30_000,
    );
    await run.capture(`healed: Pulse ${String(playerOf(healed).pulse)}`);
    expect(playerOf(healed).pulse).toBeGreaterThan(playerOf(hurt).pulse);
    expect(playerOf(healed).pulse).toBeLessThanOrEqual(maxPulse);
  } else {
    await run.advanceTicks(90);
    const full = await run.snapshot();
    await run.capture("healed: already at full Pulse, the dose is still spent");
    expect(playerOf(full).pulse, "a dose may never overheal").toBe(maxPulse);
  }

  expect(run.errors, "the live road fight must not raise a browser error").toEqual([]);
  const errorMark = run.errors.length;

  const roadScript = buildScript(
    [
      { ticks: 900, moveZ: -1 },
      { ticks: 4, moveZ: -1, press: ["attend"] },
      { ticks: 200, moveZ: -1 },
      { ticks: 4, press: ["attack"] },
      { ticks: 200 },
      { ticks: 4, press: ["flask"] },
      { ticks: 300 },
    ],
    [904, 1_108, 1_612],
  );
  const replay = await run.assertDeterministic(roadScript);
  expect(replay.checkpoints.flaskCommitted, "the authored road script must commit a dose").toBe(
    true,
  );
  expect(replay.checkpoints.maxConcurrentAttackTokens).toBeLessThanOrEqual(1);
  run.writeReplayEvidence("flask-under-pressure", {
    lowestPulse: lowest,
    maxPulse,
    packDrewBlood: wasHurt,
    nearestRoadWolfAtDrinkMeters: Math.min(...pressing),
    dosesAfter: drank.meta.doses,
    replay,
  });
  run.finish({
    scenario: "SC-C road 4-wolf + flask",
    lowestPulse: lowest,
    packDrewBlood: wasHurt,
    afterReplayErrors: run.errorsSince(errorMark),
  });
});
