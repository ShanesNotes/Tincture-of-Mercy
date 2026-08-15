import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";

/**
 * Shared rig for the frozen gauntlet scenario pack (GAUNTLET.md SC-A..SC-J).
 *
 * Two lanes, both scripted and both deterministic:
 *
 *  - the *live* lane drives the shipped `?play=ironwood` page with real
 *    KeyboardEvents and gates every wait on `snapshot().tick`, never on wall
 *    clock, so a slow box changes how long a scenario takes and nothing else;
 *  - the *replay* lane hands `__TINCTURE_WORLD__.runReplay()` an authored
 *    `WorldReplayScript` and reads the reducer's own checkpoints back, which is
 *    where the cheap two-run `stateHash` proof lives.
 *
 * Every scenario writes frame-numbered panel evidence under
 * `e2e/artifacts/<scenario>/`: one PNG per capture named with the sim tick, one
 * JSON sidecar carrying that tick's input, i-frame and hurtbox/hitbox state, and
 * an `index.json` a human can flip through in order.
 */

export type WorldBackend = "webgpu" | "webgl2";

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface WorldCapsule {
  readonly start: Vec3;
  readonly end: Vec3;
  readonly radius: number;
}

export interface WorldDebugActor {
  readonly id: string;
  readonly kind: "player" | "wolf" | "warden";
  readonly packId: string | null;
  readonly active: boolean;
  readonly position: Vec3;
  readonly facing: number;
  readonly pulse: number;
  readonly breath: number;
  readonly actionId: string | null;
  readonly actionTick: number | null;
  readonly alive: boolean;
  readonly invulnerable: boolean;
  readonly hurtboxes: readonly WorldCapsule[];
  readonly hitboxes: readonly WorldCapsule[];
}

export interface WorldDebugBoss {
  readonly present: boolean;
  readonly fsm: string | null;
  readonly phase: string | null;
  readonly pulse: number;
  readonly maxPulse: number;
  readonly arena: string;
  readonly ceremonyActive: boolean;
  readonly defeated: boolean;
  readonly rootedUntilTick: number;
  readonly enteredArena: boolean;
}

export interface WorldDebugSnapshot {
  readonly tick: number;
  readonly stateHash: string;
  readonly actors: readonly WorldDebugActor[];
  readonly targetId: string | null;
  readonly tokenHolders: readonly { readonly packId: string; readonly wolfId: string | null }[];
  readonly tokenInvariant: boolean;
  readonly engaged: boolean;
  readonly zoneId: string | null;
  readonly boss: WorldDebugBoss;
  readonly scenes: {
    readonly activeId: string | null;
    readonly completed: readonly string[];
    readonly sliceExit: boolean;
    readonly unwrittenTag: boolean;
  };
  readonly meta: {
    readonly life: string;
    readonly doses: number;
    readonly maxDoses: number;
    readonly carriedNames: number;
    readonly openPage: { readonly names: number; readonly position: Vec3 } | null;
    readonly lastHearthId: string | null;
    readonly numbnessStacks: number;
    readonly vigilRestore: number;
    readonly atHearth: boolean;
    readonly turn: number;
    readonly turnCap: number;
    readonly maxPulse: number;
    readonly maxBreath: number;
    readonly inherited?: boolean;
    readonly ember?: number;
    readonly damagePercent?: number;
    readonly turnBuildupPercent?: number;
    readonly breathRegenPercent?: number;
    readonly steadyDelta?: number;
  };
  readonly hearth: {
    readonly nearbyId: string | null;
    readonly lit: boolean;
  };
}

export interface WorldReplayCheckpoint {
  readonly tick: number;
  readonly stateHash: string;
  readonly playerPulse: number;
  readonly playerPosition: Vec3;
  readonly livingWolfIds: readonly string[];
  readonly wolves: readonly {
    readonly id: string;
    readonly position: Vec3;
    readonly pulse: number;
    readonly actionId: string | null;
  }[];
  readonly tokenInvariant: boolean;
  readonly moduleClocksAligned: boolean;
  readonly openPageNames: number;
  readonly targetId: string | null;
  readonly engaged: boolean;
}

export interface WorldReplaySummary {
  readonly wolfKilled: boolean;
  readonly playerDamageTaken: number;
  readonly expectedPlayerDamage: number;
  readonly maxConcurrentAttackTokens: number;
  readonly playerDied: boolean;
  readonly openPageDropped: boolean;
  readonly respawnedAtHearth: boolean;
  readonly openPageRecovered: boolean;
  readonly wolvesRespawned: boolean;
  readonly flaskCommitted: boolean;
  readonly restedAtHearth: boolean;
}

export interface WorldReplayResult {
  readonly ticks: number;
  readonly finalHash: string;
  readonly replayCheckpoints: readonly WorldReplayCheckpoint[];
  readonly checkpoints: WorldReplaySummary;
}

export type WorldInputAction =
  | "attack"
  | "heavy"
  | "roll"
  | "sprint"
  | "jump"
  | "attend"
  | "switchTarget"
  | "flask"
  | "interact";

export interface WorldInputEdge {
  readonly action: WorldInputAction;
  readonly pressed: boolean;
  readonly sequence: number;
  readonly tick: number;
}

export interface WorldInputFrame {
  readonly edges: readonly WorldInputEdge[];
  readonly moveX: number;
  readonly moveZ: number;
  readonly attendStick: { readonly x: number; readonly y: number };
  readonly scene?: {
    readonly enterId?: string;
    readonly hearthId?: string;
    readonly verb?: string;
  };
}

export interface WorldReplayScript {
  readonly formatVersion: 1;
  readonly durationTicks: number;
  readonly frames: readonly { readonly tick: number; readonly input: WorldInputFrame }[];
  readonly checkpointTicks: readonly number[];
}

export interface WorldBrowserFacade {
  readonly ready: boolean;
  readonly backend: WorldBackend;
  snapshot(): WorldDebugSnapshot;
  stateHash(): string;
  runReplay(script?: WorldReplayScript): WorldReplayResult | Promise<WorldReplayResult>;
  stop(): void;
}

interface FacadeWindow {
  __TINCTURE_WORLD__?: WorldBrowserFacade;
}

/**
 * One scripted Warden duel, driven from inside the page.
 *
 * Playwright polls far too coarsely to hold a 0.6 m stance against a boss that
 * moves every tick, so the control loop lives in the page's own
 * `requestAnimationFrame` and drives the shipped `WorldKeyboardInput` with real
 * `KeyboardEvent`s — the same listener a player's keyboard reaches.
 */
export interface DuelPlan {
  /**
   * Metres the driver holds off the Warden. Kalev's reach only bites at
   * contact: measured on the shipped page, every landed swing was inside
   * 0.63 m centre to centre.
   */
  readonly holdMeters: number;
  /** Swing whenever the action clock is free and the Warden is this close. */
  readonly swingRangeMeters: number;
  readonly maxTicks: number;
  /** Swing whenever the action clock is free and the stance is inside reach. */
  readonly attack: boolean;
  /** Stop as soon as the Warden's Pulse falls to or below this. */
  readonly stopAtBossPulse?: number;
  readonly stopWhenDefeated?: boolean;
  /**
   * Stop the first time the world teleports Kalev to a Hearth. That is what a
   * death looks like from outside: `stepWorld` records the death and respawns
   * him inside the same tick, so the only observable is the jump.
   */
  readonly stopOnRespawn?: boolean;
  /** Drink when Pulse falls under this fraction of the pool, while doses last. */
  readonly flaskBelowPulseRatio?: number;
  /**
   * Punish discipline: only swing while the Warden's FSM is in `recovery`.
   * This is what SC-F's tour needs — a hit landed anywhere else is not a punish.
   */
  readonly punishOnly?: boolean;
  /**
   * Stance to collapse to while punishing. Not zero: driving Kalev *through*
   * the Warden shoves him past his own ring clamp, and the level mesh stops at
   * the ring — he either freezes there or falls out of the world. 0.55 m is the
   * stance the SC-G kill run is measured on: close enough to land, gentle
   * enough to leave him standing.
   */
  readonly punishCloseMeters?: number;
  /**
   * Range from which a lost Attend lock is re-taken. The acquisition cone is
   * measured from Kalev's eye (1.40 m) to the Warden's capsule centre (0.84 m),
   * so from inside about 0.8 m he is below the 34-degree cone and no press can
   * select him. Default 1.8 m.
   */
  readonly relockFromMeters?: number;
  /** Stop the moment either fighter's `y` falls below this. */
  readonly abortBelowY?: number;
  /** Sample the position/phase trace every this many sim ticks. */
  readonly traceEveryTicks?: number;
  /** Keep Kalev inside this disc whatever the Warden does. */
  readonly arenaCentre?: { readonly x: number; readonly z: number; readonly radiusMeters: number };
}

/** One tick on which the Warden's Pulse actually fell, with its cause. */
export interface DuelHit {
  readonly tick: number;
  readonly damage: number;
  readonly bossFsm: string | null;
  readonly bossAction: string | null;
  readonly bossActionTick: number | null;
  readonly bossPulseAfter: number;
  readonly distanceMeters: number;
}

export interface DuelReport {
  readonly startTick: number;
  readonly endTick: number;
  readonly reason: string;
  readonly swings: number;
  readonly reacquires: number;
  readonly bossPulseStart: number;
  readonly bossPulseEnd: number;
  readonly playerPulseEnd: number;
  readonly playerAlive: boolean;
  readonly closestApproachMeters: number;
  readonly lockedFrames: number;
  readonly unlockedFrames: number;
  /** Where the Attend lock first broke, if it did. */
  readonly firstLockLoss: { readonly tick: number; readonly distanceMeters: number } | null;
  readonly minPlayerPulse: number;
  readonly flasks: number;
  /** The tick Kalev was teleported to a Hearth, i.e. the tick he died. */
  readonly respawn: {
    readonly tick: number;
    readonly jumpMeters: number;
    readonly hearthId: string | null;
    readonly pulseBefore: number;
    readonly pulseAfter: number;
  } | null;
  /** Frames on which a death overlay was actually mounted in the DOM. */
  readonly deathMenuFrames: number;
  /**
   * The first few frames on which Kalev's weapon capsule was live, with the
   * Warden's hurtboxes beside it. This is the evidence for why a swing at
   * contact range does or does not connect.
   */
  readonly liveSwingFrames: readonly {
    readonly tick: number;
    readonly distanceMeters: number;
    readonly playerHitboxes: readonly WorldCapsule[];
    readonly wardenHurtboxes: readonly WorldCapsule[];
    readonly wardenInvulnerable: boolean;
  }[];
  /** Every tick the Warden's Pulse fell, and what he was doing when it did. */
  readonly hits: readonly DuelHit[];
  /**
   * Periodic ground truth for the duel: where both fighters were, what the FSM
   * was doing, and whether the floor was still under them.
   */
  readonly trace: readonly {
    readonly tick: number;
    readonly player: Vec3;
    readonly warden: Vec3;
    readonly bossPulse: number;
    readonly fsm: string | null;
    readonly phase: string | null;
    readonly bossAction: string | null;
    readonly targetId: string | null;
  }[];
  /** First tick either fighter fell through the level mesh, if either did. */
  readonly belowFloor: {
    readonly tick: number;
    readonly playerY: number;
    readonly wardenY: number;
    readonly playerXZ: Vec3;
  } | null;
  readonly ceremonyTick: number | null;
  readonly ceremonyBossPulse: number | null;
  readonly defeatTick: number | null;
  readonly phaseAtEnd: string | null;
  /** Why a stall was a stall: what the page itself thought it was doing. */
  readonly pageState: {
    readonly bodySimTick: string | null;
    readonly hidden: boolean;
    readonly focused: boolean;
    readonly openMenu: string | null;
    readonly frames: number;
  };
}

/** One sim tick as seen by the in-page recorder (`startRecorder`). */
export interface RecordedTick {
  readonly tick: number;
  readonly fsm: string | null;
  readonly phase: string | null;
  readonly bossPulse: number;
  readonly bossAction: string | null;
  readonly bossActionTick: number | null;
  readonly bossInvulnerable: boolean;
  readonly bossHitboxes: number;
  readonly ceremonyActive: boolean;
  readonly defeated: boolean;
  readonly playerPulse: number;
  readonly playerAction: string | null;
  readonly playerInvulnerable: boolean;
  readonly distance: number;
}

/** Keyboard bindings the shipped play path installs (`src/app/main.ts`). */
export const KEY = {
  forward: "KeyW",
  back: "KeyS",
  left: "KeyA",
  right: "KeyD",
  attack: "Space",
  heavy: "KeyF",
  roll: "ShiftLeft",
  sprint: "ControlLeft",
  attend: "KeyQ",
  switchTarget: "Tab",
  flask: "KeyR",
  interact: "KeyE",
  /** Held while drinking to spend an Ember instead of a Tincture dose. */
  ember: "KeyG",
} as const;

export type GauntletKey = (typeof KEY)[keyof typeof KEY];

const ARTIFACT_ROOT = new URL("../artifacts/", import.meta.url);

const artifactDir = (scenario: string): string =>
  new URL(`${scenario}/`, ARTIFACT_ROOT).pathname;

/** Scenario ids may nest (`sc-i/webgl2`); file names may not. */
const slugOf = (scenario: string): string => scenario.replaceAll("/", "-");

const snapshotOf = (page: Page): Promise<WorldDebugSnapshot> =>
  page.evaluate(() => {
    const world = (window as unknown as FacadeWindow).__TINCTURE_WORLD__;
    if (world === undefined) throw new Error("window.__TINCTURE_WORLD__ is missing");
    return world.snapshot();
  });

const hashOf = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const world = (window as unknown as FacadeWindow).__TINCTURE_WORLD__;
    if (world === undefined) throw new Error("window.__TINCTURE_WORLD__ is missing");
    return world.stateHash();
  });

export const playerOf = (snapshot: WorldDebugSnapshot): WorldDebugActor => {
  const player = snapshot.actors.find((actor) => actor.kind === "player");
  if (player === undefined) throw new Error("snapshot carries no player actor");
  return player;
};

export const wardenOf = (snapshot: WorldDebugSnapshot): WorldDebugActor | undefined =>
  snapshot.actors.find((actor) => actor.kind === "warden");

export const livingWolvesOf = (snapshot: WorldDebugSnapshot): readonly WorldDebugActor[] =>
  snapshot.actors.filter((actor) => actor.kind === "wolf" && actor.active && actor.alive);

export const distanceXZ = (a: Vec3, b: Vec3): number => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * One scripted scenario run: boots the shipped play path, drives it with real
 * key events, and writes frame-numbered panel evidence as it goes.
 */
export class Gauntlet {
  readonly #page: Page;
  readonly #scenario: string;
  readonly #dir: string;
  readonly #slug: string;
  readonly #held = new Set<GauntletKey>();
  readonly #frames: Record<string, unknown>[] = [];
  readonly #errors: string[] = [];
  /** Ground-truth trace of the last scripted approach, for route evidence. */
  readonly #path: Vec3[] = [];
  #lastPressed: readonly GauntletKey[] = [];

  private constructor(page: Page, scenario: string) {
    this.#page = page;
    this.#scenario = scenario;
    this.#dir = artifactDir(scenario);
    this.#slug = slugOf(scenario);
  }

  /** A non-world page (the HUD or VFX register scenes) with the same evidence rig. */
  public static async bootScene(page: Page, scenario: string, url: string): Promise<Gauntlet> {
    const run = new Gauntlet(page, scenario);
    run.#prepareDir();
    run.#watch(page);
    await page.goto(url);
    await expect(page.locator("body")).toHaveAttribute("data-boot-status", "ready");
    return run;
  }

  public static async boot(
    page: Page,
    scenario: string,
    options: { readonly backend?: WorldBackend; readonly debug?: boolean } = {},
  ): Promise<Gauntlet> {
    const backend = options.backend ?? "webgl2";
    const run = new Gauntlet(page, scenario);
    run.#prepareDir();
    run.#watch(page);

    const debug = options.debug === true ? "&debug=1" : "";
    await page.goto(`/?play=ironwood&renderer=${backend}${debug}`);
    await page.waitForFunction(
      () => ["ready", "error"].includes(document.body.dataset.bootStatus ?? ""),
      undefined,
      { timeout: 120_000 },
    );
    await expect(page.locator("body")).toHaveAttribute("data-boot-status", "ready");
    await expect(page.locator("body")).toHaveAttribute("data-renderer-backend", backend);
    await expect
      .poll(
        () =>
          page.evaluate(
            () => (window as unknown as FacadeWindow).__TINCTURE_WORLD__?.ready ?? false,
          ),
        { timeout: 120_000 },
      )
      .toBe(true);
    return run;
  }

  #prepareDir(): void {
    rmSync(this.#dir, { force: true, recursive: true });
    mkdirSync(this.#dir, { recursive: true });
  }

  #watch(page: Page): void {
    page.on("console", (message) => {
      if (message.type() === "error") this.#errors.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => {
      this.#errors.push(`pageerror: ${error.message}`);
    });
  }

  public get errors(): readonly string[] {
    return this.#errors;
  }

  public get scenario(): string {
    return this.#scenario;
  }

  /** Every position sampled by `walkNorthTo` / `walkToArenaRing`, in order. */
  public get approachPath(): readonly Vec3[] {
    return this.#path;
  }

  public snapshot(): Promise<WorldDebugSnapshot> {
    return snapshotOf(this.#page);
  }

  public stateHash(): Promise<string> {
    return hashOf(this.#page);
  }

  public async tick(): Promise<number> {
    return (await this.snapshot()).tick;
  }

  public async hold(...keys: readonly GauntletKey[]): Promise<void> {
    for (const key of keys) {
      if (this.#held.has(key)) continue;
      this.#held.add(key);
      await this.#page.keyboard.down(key);
    }
  }

  public async release(...keys: readonly GauntletKey[]): Promise<void> {
    for (const key of keys) {
      if (!this.#held.delete(key)) continue;
      await this.#page.keyboard.up(key);
    }
  }

  public async releaseAll(): Promise<void> {
    await this.release(...this.#held);
  }

  /** A single scripted action edge: press, hold one render frame, release. */
  public async tap(key: GauntletKey): Promise<void> {
    this.#lastPressed = [key];
    await this.#page.keyboard.down(key);
    await this.#page.keyboard.up(key);
  }

  /**
   * Wait until the sim clock has passed `target`. The gate is always the sim
   * tick, never wall clock — the sleep below is only a poll interval.
   *
   * `FixedTickLoop` pauses itself on a focus or visibility change and then
   * waits for an input edge before resuming (`pauseUntilInput` /
   * `setVisibility`). Two headless pages under one Playwright run trade focus,
   * so a stalled clock gets the same nudge a player would give it: a keypress
   * bound to nothing in the world.
   */
  public async waitForTick(target: number, timeoutMs = 120_000): Promise<number> {
    const deadline = Date.now() + timeoutMs;
    let observed = await this.tick();
    let stalledPolls = 0;
    while (observed < target) {
      if (Date.now() > deadline) {
        throw new Error(
          `sim clock stalled at tick ${String(observed)} waiting for ${String(target)}; ` +
            `browser errors: ${JSON.stringify(this.#errors)}`,
        );
      }
      await this.#page.waitForTimeout(20);
      const next = await this.tick();
      if (next === observed) {
        stalledPolls += 1;
        if (stalledPolls % 25 === 0) await this.#page.keyboard.press("KeyP");
      } else {
        stalledPolls = 0;
      }
      observed = next;
    }
    return observed;
  }

  public async advanceTicks(count: number, timeoutMs = 120_000): Promise<number> {
    return this.waitForTick((await this.tick()) + count, timeoutMs);
  }

  /** Wait until the sim satisfies `predicate`, gated on snapshots, not clocks. */
  public async waitFor(
    label: string,
    predicate: (snapshot: WorldDebugSnapshot) => boolean,
    timeoutMs = 120_000,
  ): Promise<WorldDebugSnapshot> {
    let matched: WorldDebugSnapshot | null = null;
    await expect
      .poll(
        async () => {
          const snapshot = await this.snapshot();
          if (predicate(snapshot)) matched = snapshot;
          return matched !== null;
        },
        { timeout: timeoutMs, intervals: [50] },
      )
      .toBe(true);
    if (matched === null) throw new Error(`scenario condition never held: ${label}`);
    return matched;
  }

  /**
   * Errors raised so far, for scenarios that must run the replay facade and
   * then keep going. `runReplay` rebases the live world onto the golden yard
   * approach; the VFX-clock desync that used to throw out of the render loop
   * afterwards is fixed, and these lists are what would catch a regression.
   */
  public errorsSince(mark: number): readonly string[] {
    return this.#errors.slice(mark);
  }

  /** Lock the Attend camera onto the nearest legal target (F1 switch seam). */
  public async attend(): Promise<WorldDebugSnapshot> {
    await this.#page.keyboard.press(KEY.attend);
    await this.advanceTicks(4);
    return this.snapshot();
  }

  /** One scripted swing plus its recovery, gated on the action clock. */
  public async swing(key: GauntletKey = KEY.attack): Promise<void> {
    this.#lastPressed = [key];
    await this.#page.keyboard.press(key);
    await this.advanceTicks(2);
    await this.waitFor("swing recovered", (s) => playerOf(s).actionId === null, 30_000);
  }

  /**
   * Walk toward a sim-space point for a few ticks using the same cardinal keys
   * a player has. Direction is re-read from the snapshot each call, so this is
   * a closed loop on sim truth rather than an open-loop timing guess.
   */
  public async stepToward(point: Vec3, ticks = 6): Promise<void> {
    const player = playerOf(await this.snapshot());
    const dx = point.x - player.position.x;
    const dz = point.z - player.position.z;
    const keys: GauntletKey[] = [];
    if (Math.abs(dx) > 0.3) keys.push(dx > 0 ? KEY.right : KEY.left);
    if (Math.abs(dz) > 0.3) keys.push(dz < 0 ? KEY.forward : KEY.back);
    if (keys.length === 0) return;
    await this.hold(...keys);
    await this.advanceTicks(ticks);
    await this.release(...keys);
  }

  /** Close to `range` metres of whatever `pick` selects, or give up. */
  public async closeTo(
    pick: (snapshot: WorldDebugSnapshot) => WorldDebugActor | undefined,
    range: number,
    maxSteps = 40,
  ): Promise<boolean> {
    for (let step = 0; step < maxSteps; step += 1) {
      const snapshot = await this.snapshot();
      const target = pick(snapshot);
      if (target === undefined) return false;
      if (distanceXZ(target.position, playerOf(snapshot).position) <= range) return true;
      await this.stepToward(target.position, 5);
    }
    return false;
  }

  /**
   * Walk to a sim-space point on the cardinal keys, re-reading the snapshot
   * each step so a slow box changes the number of steps and nothing else.
   *
   * SC-F and SC-G both use this to drag the fight off the arena rim: the
   * Warden's own bait stance makes him give ground until the ring clamps him,
   * and the level mesh runs out before the ring does on the western arc, so a
   * duel fought at the edge ends with one of the two falling out of the world.
   */
  public async walkTo(
    point: Vec3,
    toleranceMeters = 1,
    budget = 200,
  ): Promise<WorldDebugSnapshot> {
    for (let step = 0; step < budget; step += 1) {
      const player = playerOf(await this.snapshot());
      this.#path.push({ x: player.position.x, y: player.position.y, z: player.position.z });
      if (distanceXZ(player.position, point) <= toleranceMeters) break;
      if (player.position.y < -1 || this.#errors.length > 0) break;
      await this.stepToward(point, 6);
    }
    await this.releaseAll();
    return this.snapshot();
  }

  /**
   * Fast-travel the live world to the yard. The shipped facade rebases live
   * state on the golden replay's tick-155 yard approach after every
   * `runReplay`, which is the only page hook that repositions the player
   * without wall-clock walking. Note this also rewinds the sim clock.
   */
  public async fastTravelToYard(): Promise<WorldDebugSnapshot> {
    await this.runReplay({
      formatVersion: 1,
      durationTicks: 1,
      frames: [],
      checkpointTicks: [1],
    });
    return this.snapshot();
  }

  public runReplay(script?: WorldReplayScript): Promise<WorldReplayResult> {
    return this.#page.evaluate(async (authored) => {
      const world = (window as unknown as FacadeWindow).__TINCTURE_WORLD__;
      if (world === undefined) throw new Error("window.__TINCTURE_WORLD__ is missing");
      return authored === null ? await world.runReplay() : await world.runReplay(authored);
    }, script ?? null);
  }

  /**
   * The cheap determinism proof: the same authored script, replayed twice
   * through the same reducer, must agree checkpoint-for-checkpoint.
   */
  public async assertDeterministic(script: WorldReplayScript): Promise<WorldReplayResult> {
    const [first, second] = await this.#page.evaluate(async (authored) => {
      const world = (window as unknown as FacadeWindow).__TINCTURE_WORLD__;
      if (world === undefined) throw new Error("window.__TINCTURE_WORLD__ is missing");
      const a = await world.runReplay(authored);
      const b = await world.runReplay(authored);
      return [a, b] as const;
    }, script);
    expect(second.finalHash, "two runs of the same script must land on one hash").toBe(
      first.finalHash,
    );
    expect(
      second.replayCheckpoints.map((point) => ({ tick: point.tick, stateHash: point.stateHash })),
      "two runs of the same script must agree at every checkpoint tick",
    ).toEqual(
      first.replayCheckpoints.map((point) => ({ tick: point.tick, stateHash: point.stateHash })),
    );
    expect(first.replayCheckpoints.every((point) => point.tokenInvariant)).toBe(true);
    expect(first.replayCheckpoints.every((point) => point.moduleClocksAligned)).toBe(true);
    return first;
  }

  /**
   * One panel frame: a PNG named with the sim tick plus a JSON sidecar holding
   * the input applied that frame and the i-frame / hurtbox truth behind it.
   */
  public async capture(note: string): Promise<WorldDebugSnapshot> {
    const snapshot = await this.snapshot();
    const stamp = String(snapshot.tick).padStart(5, "0");
    const base = `${this.#slug}.t${stamp}`;
    await this.#page.screenshot({ path: `${this.#dir}${base}.png` });
    const player = playerOf(snapshot);
    const sidecar = {
      scenario: this.#scenario,
      tick: snapshot.tick,
      note,
      stateHash: snapshot.stateHash,
      input: {
        held: [...this.#held],
        pressedThisFrame: this.#lastPressed,
      },
      player: {
        position: player.position,
        facing: player.facing,
        pulse: player.pulse,
        breath: player.breath,
        alive: player.alive,
        invulnerable: player.invulnerable,
        actionId: player.actionId,
        actionTick: player.actionTick,
        hurtboxes: player.hurtboxes,
        hitboxes: player.hitboxes,
      },
      others: snapshot.actors
        .filter((actor) => actor.kind !== "player" && actor.active)
        .map((actor) => ({
          id: actor.id,
          kind: actor.kind,
          packId: actor.packId,
          alive: actor.alive,
          pulse: actor.pulse,
          position: actor.position,
          actionId: actor.actionId,
          actionTick: actor.actionTick,
          invulnerable: actor.invulnerable,
          hurtboxCount: actor.hurtboxes.length,
          hitboxes: actor.hitboxes,
        })),
      tokenHolders: snapshot.tokenHolders,
      tokenInvariant: snapshot.tokenInvariant,
      targetId: snapshot.targetId,
      engaged: snapshot.engaged,
      zoneId: snapshot.zoneId,
      boss: snapshot.boss,
      meta: snapshot.meta,
      hearth: snapshot.hearth,
      scenes: snapshot.scenes,
    };
    writeFileSync(`${this.#dir}${base}.json`, `${JSON.stringify(sidecar, null, 2)}\n`);
    this.#frames.push({ tick: snapshot.tick, note, png: `${base}.png`, json: `${base}.json` });
    this.#lastPressed = [];
    return snapshot;
  }

  /**
   * Install a per-render-frame sim recorder in the page. The loop runs above
   * 60 Hz, so every sim tick is captured exactly once — Playwright polling is
   * far too coarse to measure a 22-tick punish window from the outside.
   */
  public startRecorder(): Promise<void> {
    return this.#page.evaluate(() => {
      interface Recorded {
        tick: number;
        fsm: string | null;
        phase: string | null;
        bossPulse: number;
        bossAction: string | null;
        bossActionTick: number | null;
        bossInvulnerable: boolean;
        bossHitboxes: number;
        ceremonyActive: boolean;
        defeated: boolean;
        playerPulse: number;
        playerAction: string | null;
        playerInvulnerable: boolean;
        distance: number;
      }
      const host = window as unknown as {
        __TINCTURE_WORLD__?: WorldBrowserFacade;
        __gauntletRecord__?: Recorded[];
        __gauntletStop__?: () => void;
      };
      host.__gauntletStop__?.();
      const rows: Recorded[] = [];
      host.__gauntletRecord__ = rows;
      let last = -1;
      let frame = 0;
      const sample = (): void => {
        const snapshot = host.__TINCTURE_WORLD__?.snapshot();
        if (snapshot !== undefined && snapshot.tick !== last) {
          last = snapshot.tick;
          const player = snapshot.actors.find((actor) => actor.kind === "player");
          const warden = snapshot.actors.find((actor) => actor.kind === "warden");
          rows.push({
            tick: snapshot.tick,
            fsm: snapshot.boss.fsm,
            phase: snapshot.boss.phase,
            bossPulse: snapshot.boss.pulse,
            bossAction: warden?.actionId ?? null,
            bossActionTick: warden?.actionTick ?? null,
            bossInvulnerable: warden?.invulnerable ?? false,
            bossHitboxes: warden?.hitboxes.length ?? 0,
            ceremonyActive: snapshot.boss.ceremonyActive,
            defeated: snapshot.boss.defeated,
            playerPulse: player?.pulse ?? 0,
            playerAction: player?.actionId ?? null,
            playerInvulnerable: player?.invulnerable ?? false,
            distance:
              player === undefined || warden === undefined
                ? Number.NaN
                : Math.hypot(
                    player.position.x - warden.position.x,
                    player.position.z - warden.position.z,
                  ),
          });
        }
        frame = requestAnimationFrame(sample);
      };
      frame = requestAnimationFrame(sample);
      host.__gauntletStop__ = () => {
        cancelAnimationFrame(frame);
      };
    });
  }

  public readRecorder(): Promise<readonly RecordedTick[]> {
    return this.#page.evaluate(
      () =>
        (window as unknown as { __gauntletRecord__?: RecordedTick[] }).__gauntletRecord__ ?? [],
    );
  }

  /** A panel frame for a page with no world facade (HUD / register scenes). */
  public async captureRaw(name: string, sidecar: Record<string, unknown>): Promise<void> {
    const base = `${this.#slug}.${name}`;
    await this.#page.screenshot({ path: `${this.#dir}${base}.png` });
    writeFileSync(
      `${this.#dir}${base}.json`,
      `${JSON.stringify({ scenario: this.#scenario, name, ...sidecar }, null, 2)}\n`,
    );
    this.#frames.push({ tick: null, note: name, png: `${base}.png`, json: `${base}.json` });
  }

  /**
   * Hold north until the player passes `stopZ`, coarse then fine so a scenario
   * can stop short of a Hearth radius instead of overshooting into one.
   */
  public async walkNorthTo(stopZ: number, budget = 400): Promise<WorldDebugSnapshot> {
    await this.hold(KEY.forward);
    for (let step = 0; step < budget; step += 1) {
      const player = playerOf(await this.snapshot());
      this.#path.push({ x: player.position.x, y: player.position.y, z: player.position.z });
      if (player.position.z <= stopZ + 6 || player.position.y < -1 || this.#errors.length > 0) break;
      await this.advanceTicks(20, 60_000);
    }
    // The last few metres are tap-stepped with the key released between steps:
    // a held run overshoots by however long a Playwright poll happens to take,
    // and a scenario that means to stop short of a mark has to stop short of it.
    await this.release(KEY.forward);
    for (let step = 0; step < 160; step += 1) {
      const player = playerOf(await this.snapshot());
      if (player.position.z <= stopZ || player.position.y < -1 || this.#errors.length > 0) break;
      await this.hold(KEY.forward);
      await this.advanceTicks(1, 60_000);
      await this.release(KEY.forward);
    }
    return this.snapshot();
  }

  /**
   * The only honest scripted route to the Warden's ring found by this pack.
   *
   * The centre lane is the sole corridor with continuous floor: `walkNorthTo`
   * aborts the moment the player's `y` drops below -1, and every other lane
   * tried fell through. The eastward strafe is a legacy of the two Hearths on
   * the road (`hearth.road` at (4.2, -116)); it is harmless now that a Hearth
   * overlay no longer stops the loop, and is kept because this is the route
   * the pack's route evidence was recorded on.
   */
  public async walkToArenaRing(): Promise<WorldDebugSnapshot> {
    // Stop short of the ring rather than coasting into it: a tap-step still
    // carries, and the strafe below wants to start on open arena floor.
    await this.walkNorthTo(-121.5);
    await this.hold(KEY.right);
    for (let step = 0; step < 60; step += 1) {
      const player = playerOf(await this.snapshot());
      this.#path.push({ x: player.position.x, y: player.position.y, z: player.position.z });
      if (player.position.x >= 2.6 || player.position.y < -1 || this.#errors.length > 0) break;
      await this.advanceTicks(4, 60_000);
    }
    await this.release(KEY.right);
    // Push north until the gate actually fires. The ring is a 9.2 m circle
    // centred on (0, -136), so how far north its southern edge sits depends on
    // how far east the strafe above carried: at x = 4.2 the crossing is
    // z = -127.8, at x = 5.5 it is z = -128.6. A fixed z stop gives up short of
    // the gate on a loaded box, where each poll carries further.
    for (let step = 0; step < 300; step += 1) {
      const snapshot = await this.snapshot();
      const player = playerOf(snapshot);
      this.#path.push({ x: player.position.x, y: player.position.y, z: player.position.z });
      if (
        snapshot.boss.enteredArena ||
        player.position.z <= -133 ||
        player.position.y < -1 ||
        this.#errors.length > 0
      ) {
        break;
      }
      // Drifting east makes the crossing further north for no gain; steer back.
      if (player.position.x > 5) {
        await this.hold(KEY.left);
        await this.advanceTicks(3, 60_000);
        await this.release(KEY.left);
      }
      await this.hold(KEY.forward);
      await this.advanceTicks(4, 60_000);
      await this.release(KEY.forward);
    }
    return this.snapshot();
  }

  /**
   * Walk north up the centre lane and take the Attend lock on the Warden from
   * outside his ring.
   *
   * The lock has to be taken at range. Attend's acquisition cone is 34 degrees
   * around the eye line; Kalev's eye is 1.40 m up (`capsule.height -
   * capsule.radius`) and the Warden's Attend point is his capsule centre at
   * 0.88 m, so on level ground the target sits about 0.53 m below the eye and
   * only enters the cone past roughly 0.8 m of separation. The lock is taken at
   * about 12 m and retained (22 m retain range) all the way into contact.
   */
  public async lockOntoWardenAtRange(rangeMeters = 12): Promise<WorldDebugSnapshot> {
    const warden = wardenOf(await this.snapshot());
    if (warden === undefined) throw new Error("this world assembles no Warden to lock onto");
    await this.walkNorthTo(warden.position.z + rangeMeters);
    for (let tap = 0; tap < 40; tap += 1) {
      const snapshot = await this.snapshot();
      if (snapshot.targetId === warden.id) return snapshot;
      const closing = wardenOf(snapshot);
      if (closing === undefined) return snapshot;
      // He walks in while the lock is being taken, and from inside about 1.6 m
      // he is below the acquisition cone entirely. Give ground rather than
      // spend the whole budget pressing at a target that cannot be selected.
      if (distanceXZ(closing.position, playerOf(snapshot).position) < 3) {
        await this.hold(KEY.back);
        await this.advanceTicks(12, 60_000);
        await this.release(KEY.back);
        continue;
      }
      await this.#page.keyboard.press(KEY.attend);
      await this.advanceTicks(4, 60_000);
    }
    return this.snapshot();
  }

  /**
   * Fight the Warden from inside the page, one decision per rendered frame.
   *
   * Movement is the shipped WASD set, aim is the Attend lock taken before the
   * ring, and every swing is a real `Space` edge through `WorldKeyboardInput`.
   * The loop is closed on `snapshot()` truth, so a slow box changes how long the
   * duel takes and nothing else.
   */
  public driveDuel(plan: DuelPlan): Promise<DuelReport> {
    return this.#page.evaluate(async (input) => {
      const host = window as unknown as FacadeWindow;
      const world = host.__TINCTURE_WORLD__;
      if (world === undefined) throw new Error("window.__TINCTURE_WORLD__ is missing");

      const held = new Set<string>();
      const down = (code: string): void => {
        if (held.has(code)) return;
        held.add(code);
        window.dispatchEvent(new KeyboardEvent("keydown", { code, bubbles: true }));
      };
      const up = (code: string): void => {
        if (!held.delete(code)) return;
        window.dispatchEvent(new KeyboardEvent("keyup", { code, bubbles: true }));
      };
      return await new Promise<DuelReport>((resolve) => {
        const pendingRelease: string[] = [];
        let startTick = -1;
        let bossPulseStart = 0;
        let lastTick = -1;
        let stalledFrames = 0;
        let swings = 0;
        let reacquires = 0;
        let lockedFrames = 0;
        let unlockedFrames = 0;
        let attendCooldown = 0;
        let lastEdgeTick = -1000;
        let firstLockLoss: { tick: number; distanceMeters: number } | null = null;
        let minPlayerPulse = Number.POSITIVE_INFINITY;
        let flasks = 0;
        let deathMenuFrames = 0;
        const liveSwingFrames: {
          tick: number;
          distanceMeters: number;
          playerHitboxes: readonly WorldCapsule[];
          wardenHurtboxes: readonly WorldCapsule[];
          wardenInvulnerable: boolean;
        }[] = [];
        let previousPosition: Vec3 | null = null;
        let previousPulse = 0;
        let respawn: {
          tick: number;
          jumpMeters: number;
          hearthId: string | null;
          pulseBefore: number;
          pulseAfter: number;
        } | null = null;
        let closest = Number.POSITIVE_INFINITY;
        const hits: DuelHit[] = [];
        const trace: DuelReport["trace"][number][] = [];
        let previousBossPulse = -1;
        let tracedTick = -1_000_000;
        let belowFloor: DuelReport["belowFloor"] = null;
        let ceremonyTick: number | null = null;
        let ceremonyBossPulse: number | null = null;
        let defeatTick: number | null = null;
        let frame = 0;
        let frameCount = 0;

        const finish = (reason: string, snapshot: WorldDebugSnapshot): void => {
          cancelAnimationFrame(frame);
          for (const code of [...held]) up(code);
          const player = snapshot.actors.find((actor) => actor.kind === "player");
          resolve({
            startTick,
            endTick: snapshot.tick,
            reason,
            swings,
            reacquires,
            bossPulseStart,
            bossPulseEnd: snapshot.boss.pulse,
            playerPulseEnd: player?.pulse ?? 0,
            playerAlive: player?.alive ?? false,
            closestApproachMeters: closest,
            lockedFrames,
            unlockedFrames,
            firstLockLoss,
            minPlayerPulse: Number.isFinite(minPlayerPulse) ? minPlayerPulse : 0,
            flasks,
            respawn,
            deathMenuFrames,
            liveSwingFrames,
            hits,
            trace,
            belowFloor,
            ceremonyTick,
            ceremonyBossPulse,
            defeatTick,
            phaseAtEnd: snapshot.boss.phase,
            pageState: {
              bodySimTick: document.body.dataset.simTick ?? null,
              hidden: document.hidden,
              focused: document.hasFocus(),
              openMenu:
                document.querySelector(".hud-menu")?.getAttribute("data-testid") ?? null,
              frames: frameCount,
            },
          });
        };

        const tick = (): void => {
          frameCount += 1;
          for (const code of pendingRelease.splice(0)) up(code);
          const snapshot = world.snapshot();
          const player = snapshot.actors.find((actor) => actor.kind === "player");
          const warden = snapshot.actors.find((actor) => actor.kind === "warden");
          if (player === undefined || warden === undefined) {
            finish("actorsMissing", snapshot);
            return;
          }
          if (startTick < 0) {
            startTick = snapshot.tick;
            bossPulseStart = snapshot.boss.pulse;
            previousPulse = player.pulse;
          }
          if (player.pulse < minPlayerPulse) minPlayerPulse = player.pulse;

          const dx = warden.position.x - player.position.x;
          const dz = warden.position.z - player.position.z;
          const distance = Math.hypot(dx, dz);
          if (distance < closest) closest = distance;

          // A hit is a fall in the Warden's Pulse, attributed to whatever his
          // FSM was doing on the tick it fell. This is the punish evidence.
          if (previousBossPulse >= 0 && snapshot.boss.pulse < previousBossPulse) {
            hits.push({
              tick: snapshot.tick,
              damage: previousBossPulse - snapshot.boss.pulse,
              bossFsm: snapshot.boss.fsm,
              bossAction: warden.actionId,
              bossActionTick: warden.actionTick,
              bossPulseAfter: snapshot.boss.pulse,
              distanceMeters: distance,
            });
          }
          previousBossPulse = snapshot.boss.pulse;

          const traceEvery = input.traceEveryTicks ?? 0;
          if (traceEvery > 0 && snapshot.tick - tracedTick >= traceEvery) {
            tracedTick = snapshot.tick;
            trace.push({
              tick: snapshot.tick,
              player: player.position,
              warden: warden.position,
              bossPulse: snapshot.boss.pulse,
              fsm: snapshot.boss.fsm,
              phase: snapshot.boss.phase,
              bossAction: warden.actionId,
              targetId: snapshot.targetId,
            });
          }

          const floor = input.abortBelowY;
          if (
            floor !== undefined &&
            belowFloor === null &&
            (player.position.y < floor || warden.position.y < floor)
          ) {
            belowFloor = {
              tick: snapshot.tick,
              playerY: player.position.y,
              wardenY: warden.position.y,
              playerXZ: player.position,
            };
            finish("belowFloor", snapshot);
            return;
          }

          if (document.querySelector('[data-testid="hud-menu-death"]') !== null) {
            deathMenuFrames += 1;
          }
          if (previousPosition !== null && respawn === null) {
            const jump = Math.hypot(
              player.position.x - previousPosition.x,
              player.position.z - previousPosition.z,
            );
            if (jump > 20) {
              respawn = {
                tick: snapshot.tick,
                jumpMeters: jump,
                hearthId: snapshot.meta.lastHearthId,
                pulseBefore: previousPulse,
                pulseAfter: player.pulse,
              };
            }
          }
          previousPosition = player.position;
          previousPulse = player.pulse;
          if (input.stopOnRespawn === true && respawn !== null) {
            finish("respawned", snapshot);
            return;
          }

          // A paused loop never steps. Any key edge resumes a focus pause, so a
          // stall gets the nudge a player would give it before it is called one.
          if (snapshot.tick === lastTick) {
            stalledFrames += 1;
            if (stalledFrames % 90 === 0) {
              window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyP" }));
              window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyP" }));
            }
            if (stalledFrames > 900) {
              finish("stalled", snapshot);
              return;
            }
          } else {
            stalledFrames = 0;
            lastTick = snapshot.tick;
          }

          if (snapshot.boss.ceremonyActive && ceremonyTick === null) {
            ceremonyTick = snapshot.tick;
            ceremonyBossPulse = snapshot.boss.pulse;
          }
          if (snapshot.boss.defeated && defeatTick === null) defeatTick = snapshot.tick;

          if (!player.alive) {
            finish("playerDead", snapshot);
            return;
          }
          if (input.stopWhenDefeated === true && snapshot.boss.defeated) {
            finish("defeated", snapshot);
            return;
          }
          if (
            input.stopAtBossPulse !== undefined &&
            snapshot.boss.pulse <= input.stopAtBossPulse
          ) {
            finish("bossPulse", snapshot);
            return;
          }
          if (snapshot.tick - startTick >= input.maxTicks) {
            finish("maxTicks", snapshot);
            return;
          }

          // `startAnimationLoop` clears its pacing timestamp on *every* keydown
          // (`onResumeInput`), so the following frame is advanced with 0 ms and
          // the sim clock loses it. A driver that presses something every frame
          // therefore stops the clock dead. Releases are free; presses are
          // rationed to one sim tick in `EDGE_COOLDOWN_TICKS`.
          const EDGE_COOLDOWN_TICKS = 2;
          const mayPress = snapshot.tick - lastEdgeTick >= EDGE_COOLDOWN_TICKS;

          // The stance. Kalev's reach only bites at contact, so a duel closes to
          // `holdMeters` and holds there inside a dead band. The punish tour
          // adds a second gear: the standoff is what provokes a committed move
          // (his table is range-gated), and the moment the FSM enters recovery
          // the stance collapses to contact so the punish can actually land.
          const committed =
            snapshot.boss.fsm === "recovery" || snapshot.boss.fsm === "committed_move";
          const holdTarget =
            input.punishOnly === true && committed
              ? input.punishCloseMeters ?? 0.55
              : input.holdMeters;
          const scale = distance === 0 ? 1 : distance;
          /** Half-width of the stance dead band, in metres. */
          const DEAD_BAND = 0.3;
          let wantX = 0;
          let wantZ = 0;
          if (distance > holdTarget + DEAD_BAND) {
            wantX = dx / scale;
            wantZ = dz / scale;
          } else if (distance < holdTarget - DEAD_BAND) {
            wantX = -dx / scale;
            wantZ = -dz / scale;
          }
          // The arena floor mesh stops at the snare ring. Chasing a Warden who
          // is giving ground for his bait walks Kalev straight off it, so the
          // ring wins over the stance: outside the leash radius he comes back
          // to the middle and lets the boss close instead.
          const centre = input.arenaCentre;
          if (centre !== undefined) {
            const outX = player.position.x - centre.x;
            const outZ = player.position.z - centre.z;
            const outward = Math.hypot(outX, outZ);
            if (outward > centre.radiusMeters) {
              wantX = -outX / (outward === 0 ? 1 : outward);
              wantZ = -outZ / (outward === 0 ? 1 : outward);
            }
          }
          const wanted: Record<string, boolean> = {
            KeyD: wantX > 0.3,
            KeyA: wantX < -0.3,
            KeyW: wantZ < -0.3,
            KeyS: wantZ > 0.3,
          };
          for (const [code, want] of Object.entries(wanted)) {
            if (!want) up(code);
          }

          if (snapshot.targetId === warden.id) lockedFrames += 1;
          else {
            unlockedFrames += 1;
            if (firstLockLoss === null && lockedFrames > 0) {
              firstLockLoss = { tick: snapshot.tick, distanceMeters: distance };
            }
          }
          attendCooldown -= 1;

          // One press per budgeted tick, and the swing outranks the step: a
          // driver that spends its budget on footwork never attacks.
          let pressedThisFrame = false;
          const wantsFlask =
            input.flaskBelowPulseRatio !== undefined &&
            player.actionId === null &&
            snapshot.meta.doses > 0 &&
            player.pulse < snapshot.meta.maxPulse * input.flaskBelowPulseRatio;
          const wantsSwing =
            input.attack &&
            player.actionId === null &&
            distance <= input.swingRangeMeters &&
            (input.punishOnly !== true || snapshot.boss.fsm === "recovery");
          const wantsAttend =
            snapshot.targetId !== warden.id &&
            attendCooldown <= 0 &&
            distance >= (input.relockFromMeters ?? 1.8);
          if (mayPress && wantsFlask) {
            down("KeyR");
            pendingRelease.push("KeyR");
            flasks += 1;
            pressedThisFrame = true;
          } else if (mayPress && wantsSwing) {
            down("Space");
            pendingRelease.push("Space");
            swings += 1;
            pressedThisFrame = true;
          } else if (mayPress && wantsAttend) {
            // Attend's cone cannot see him from inside contact range (the eye
            // line looks 46 degrees down at 0.5 m, past the 34-degree half
            // cone), so a re-lock is only attempted from a legal range.
            down("KeyQ");
            pendingRelease.push("KeyQ");
            reacquires += 1;
            attendCooldown = 45;
            pressedThisFrame = true;
          } else if (mayPress) {
            for (const [code, want] of Object.entries(wanted)) {
              if (want && !held.has(code)) {
                down(code);
                pressedThisFrame = true;
              }
            }
          }
          if (pressedThisFrame) lastEdgeTick = snapshot.tick;

          if (
            player.hitboxes.length > 0 &&
            liveSwingFrames.length < 6 &&
            liveSwingFrames.at(-1)?.tick !== snapshot.tick
          ) {
            liveSwingFrames.push({
              tick: snapshot.tick,
              distanceMeters: distance,
              playerHitboxes: player.hitboxes,
              wardenHurtboxes: warden.hurtboxes,
              wardenInvulnerable: warden.invulnerable,
            });
          }

          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      });
    }, plan);
  }

  /** Sim-truth evidence for a lane with no rendered frames (replay checkpoints). */
  public writeReplayEvidence(name: string, payload: unknown): void {
    const file = `${this.#slug}.${name}.json`;
    writeFileSync(`${this.#dir}${file}`, `${JSON.stringify(payload, null, 2)}\n`);
    this.#frames.push({ tick: null, note: name, json: file });
  }

  public finish(summary: Record<string, unknown> = {}): void {
    writeFileSync(
      `${this.#dir}index.json`,
      `${JSON.stringify(
        { scenario: this.#scenario, ...summary, browserErrors: this.#errors, frames: this.#frames },
        null,
        2,
      )}\n`,
    );
  }
}

/** One authored slice of a replay script: hold a direction, optionally press. */
export interface ScriptSegment {
  readonly ticks: number;
  readonly moveX?: number;
  readonly moveZ?: number;
  /** Action edges emitted on the segment's first tick. */
  readonly press?: readonly WorldInputAction[];
  readonly scene?: { readonly enterId?: string; readonly hearthId?: string; readonly verb?: string };
}

/**
 * Compile authored segments into the reducer's own replay format. Frames are
 * sparse: a tick with no movement, no edge and no scene seam falls through to
 * `EMPTY_WORLD_INPUT` inside the reducer, exactly as the golden script does.
 */
export const buildScript = (
  segments: readonly ScriptSegment[],
  checkpointTicks: readonly number[],
): WorldReplayScript => {
  const frames: { tick: number; input: WorldInputFrame }[] = [];
  let tick = 0;
  let sequence = 0;
  for (const segment of segments) {
    for (let step = 0; step < segment.ticks; step += 1) {
      const moveX = segment.moveX ?? 0;
      const moveZ = segment.moveZ ?? 0;
      const first = step === 0;
      const edges =
        first && segment.press !== undefined
          ? segment.press.map((action) => ({
              action,
              pressed: true,
              sequence: sequence++,
              tick,
            }))
          : [];
      const scene = first ? segment.scene : undefined;
      if (moveX !== 0 || moveZ !== 0 || edges.length > 0 || scene !== undefined) {
        frames.push({
          tick,
          input: {
            edges,
            moveX,
            moveZ,
            attendStick: { x: 0, y: 0 },
            ...(scene === undefined ? {} : { scene }),
          },
        });
      }
      tick += 1;
    }
  }
  const duration = tick;
  return {
    formatVersion: 1,
    durationTicks: duration,
    frames,
    checkpointTicks: checkpointTicks.filter((point) => point > 0 && point <= duration),
  };
};
