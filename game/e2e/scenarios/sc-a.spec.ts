import { expect, test } from "@playwright/test";

import {
  buildScript,
  distanceXZ,
  Gauntlet,
  KEY,
  livingWolvesOf,
  playerOf,
  type WorldDebugActor,
  type WorldDebugSnapshot,
} from "./harness";

/**
 * SC-A — doorway 1v1, the teach fight.
 *
 * The whole opening lesson in one scripted run: walk out of the cabin, take the
 * Attend lock on the doorway lunger, and trade. Every wait is gated on
 * `snapshot().tick`; the only timing input is how fast the box runs the loop.
 *
 * The pass bar is a real trade, not a kill: how many of a scripted swing budget
 * connect depends on where the lunger's own AI stands that run, so the row
 * requires at least two landed lights (a 28-Pulse authored hit each) plus a
 * committed attack from the wolf, and records whether the kill landed.
 */

const DOORWAY_LUNGER = "spawn.wolf.doorway.lunger.0";

/** The actor row, alive or not — `livingWolvesOf` hides a wolf that leashes. */
const doorwayRow = (snapshot: WorldDebugSnapshot): WorldDebugActor | undefined =>
  snapshot.actors.find((actor) => actor.id === DOORWAY_LUNGER);

/** The live target for the duel loop, or undefined once he is down or away. */
const doorwayWolf = (snapshot: WorldDebugSnapshot): WorldDebugActor | undefined =>
  livingWolvesOf(snapshot).find((wolf) => wolf.id === DOORWAY_LUNGER);

test("SC-A: the doorway lunger is locked, traded with, and driven down", async ({ page }) => {
  test.setTimeout(600_000);
  const run = await Gauntlet.boot(page, "sc-a", { debug: true });

  await run.capture("boot: cabin threshold, nothing engaged yet");
  await run.hold(KEY.forward);
  await run.waitFor(
    "doorway lunger awake and in front of Kalev",
    (snapshot) => {
      const wolf = doorwayWolf(snapshot);
      return (
        wolf !== undefined &&
        wolf.active &&
        distanceXZ(wolf.position, playerOf(snapshot).position) <= 6
      );
    },
    120_000,
  );
  await run.release(KEY.forward);
  await run.capture("approach: the doorway pack is awake");

  const locked = await run.attend();
  expect(locked.targetId, "Attend must take the doorway lunger, not a yard wolf").toBe(
    DOORWAY_LUNGER,
  );
  await run.capture("attend: lock taken on the doorway lunger");

  let playerWasHit = false;
  let wolfWasHit = false;
  let wolfThreatened = false;
  let killed = false;
  const startingPulse = playerOf(locked).pulse;

  const maxPulse = locked.meta.maxPulse;
  for (let exchange = 0; exchange < 60 && !killed; exchange += 1) {
    // Stay out of the death overlay: it is the menu transition that currently
    // kills the render loop (see SC-D), and a teach fight has three doses.
    const opening = await run.snapshot();
    if (playerOf(opening).pulse <= maxPulse * 0.55 && opening.meta.doses > 0) {
      await run.tap(KEY.flask);
      await run.advanceTicks(90);
      await run.capture(`flask: Pulse was ${String(playerOf(opening).pulse)}`);
    }
    await run.closeTo(doorwayWolf, 1.15, 14);
    await run.swing();
    const snapshot = await run.snapshot();
    const wolf = doorwayWolf(snapshot);
    const row = doorwayRow(snapshot);
    const player = playerOf(snapshot);

    // Fairness rails hold on every single exchange, not just at the end.
    expect(snapshot.tokenInvariant, `token invariant broke on exchange ${String(exchange)}`).toBe(
      true,
    );
    // One attack token per pack: two packs may both be committed, but never
    // two wolves inside the same pack.
    const swingsByPack = new Map<string, number>();
    for (const actor of snapshot.actors) {
      if (actor.kind !== "wolf" || actor.hitboxes.length === 0) continue;
      const pack = actor.packId ?? "unpacked";
      swingsByPack.set(pack, (swingsByPack.get(pack) ?? 0) + 1);
    }
    expect(
      Math.max(0, ...swingsByPack.values()),
      `two wolves in one pack swung at once on exchange ${String(exchange)}`,
    ).toBeLessThanOrEqual(1);

    if (player.pulse < startingPulse) playerWasHit = true;
    // A weapon capsule is live for three ticks and one snapshot per exchange
    // will miss it; the committed action clock runs for the whole clip, so that
    // is what a per-exchange sample can honestly see.
    if (row?.actionId != null) wolfThreatened = true;
    if (row !== undefined && row.pulse < 100) wolfWasHit = true;
    // Put down means out of Pulse, not merely out of the active set: a wolf
    // that leashes home also drops out of `livingWolvesOf`.
    if (row !== undefined && (!row.alive || row.pulse <= 0)) killed = true;
    if (exchange % 4 === 0 || killed) {
      await run.capture(
        killed
          ? "kill: the doorway lunger is out of Pulse"
          : `exchange ${String(exchange)}: Pulse ${String(player.pulse)} vs ${String(Math.round(row?.pulse ?? 0))}`,
      );
    }
    if (snapshot.targetId === null && !killed && wolf !== undefined) await run.attend();
    if (run.errors.length > 0) break;
    // Two landed lights is the row's bar; stop trading once it is met so the
    // scenario does not spend its whole budget chasing a kill the AI may or may
    // not stand still for.
    if ((row?.pulse ?? 100) <= 44) break;
  }

  const settled = await run.snapshot();
  const lungerPulse = doorwayRow(settled)?.pulse ?? 100;
  expect(wolfWasHit, "the player must have landed Pulse damage on the wolf").toBe(true);
  expect(
    lungerPulse,
    "two authored lights (28 Pulse each) must have connected inside the budget",
  ).toBeLessThanOrEqual(44);
  // Whether the lunger actually connects is up to its own AI on the day; that
  // it commits a real weapon capsule at Kalev is the part the teach fight owes.
  expect(wolfThreatened, "a teach fight where the lunger never commits teaches nothing").toBe(true);
  expect(playerOf(settled).alive, "the teach fight must be survivable").toBe(true);
  expect(settled.tokenInvariant).toBe(true);

  // The roll's i-frame band is the other half of the lesson (GATES F5/F6).
  await run.hold(KEY.roll);
  const rolling = await run.waitFor(
    "roll started",
    (snapshot) => playerOf(snapshot).actionId?.startsWith("roll") === true,
    20_000,
  );
  await run.release(KEY.roll);
  let sawIFrames = playerOf(rolling).invulnerable;
  for (let sample = 0; sample < 14 && !sawIFrames; sample += 1) {
    const snapshot = await run.snapshot();
    if (playerOf(snapshot).invulnerable) sawIFrames = true;
    if (playerOf(snapshot).actionId === null) break;
  }
  await run.capture(`roll: invulnerable=${String(sawIFrames)}`);
  expect(sawIFrames, "the roll must open a real i-frame band").toBe(true);

  expect(run.errors, "the live teach fight must not raise a browser error").toEqual([]);
  const errorMark = run.errors.length;

  // Cheap determinism proof on the same reducer the live loop is running.
  const opening = buildScript(
    [
      { ticks: 200, moveZ: -1 },
      { ticks: 4, moveZ: -1, press: ["attend"] },
      { ticks: 60, moveZ: -1 },
      { ticks: 4, press: ["attack"] },
      { ticks: 120 },
    ],
    [200, 264, 388],
  );
  const replay = await run.assertDeterministic(opening);
  run.writeReplayEvidence("determinism", replay);
  run.finish({
    scenario: "SC-A doorway 1v1",
    killed,
    playerWasHit,
    wolfWasHit,
    wolfCommittedAnAttack: wolfThreatened,
    lungerPulseAtEnd: lungerPulse,
    afterReplayErrors: run.errorsSince(errorMark),
  });
});
