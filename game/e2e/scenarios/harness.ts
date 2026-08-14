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
   * then keep going: `runReplay` rebases world state without rebasing the VFX
   * clock, which throws out of the render loop (see SC-D).
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
   * Fast-travel the live world to the yard. The shipped facade rebases live
   * state on the golden replay's tick-155 yard approach after every
   * `runReplay`, which is the only page hook that repositions the player
   * without wall-clock walking.
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
      if (player.position.z <= stopZ + 6 || player.position.y < -1 || this.#errors.length > 0) break;
      await this.advanceTicks(20, 60_000);
    }
    // The last few metres are tap-stepped with the key released between steps.
    // A held run overshoots by however long a Playwright poll happens to take,
    // and overshooting into a Hearth radius currently kills the render loop.
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
   * The centre lane is the sole corridor with continuous floor (see SC-F's
   * blocker note), and it stops short of `hearth.arena` at (0, -126) because
   * standing inside any Hearth radius kills the render loop. The eastward
   * strafe happens on arena floor, past the Hearth, before pushing north.
   */
  public async walkToArenaRing(): Promise<WorldDebugSnapshot> {
    // Stop a full three metres short of `hearth.arena` at (0, -126): a tap-step
    // still coasts, and coasting into a 1.5 m Hearth radius kills the loop.
    await this.walkNorthTo(-121.5);
    await this.hold(KEY.right);
    for (let step = 0; step < 60; step += 1) {
      const player = playerOf(await this.snapshot());
      if (player.position.x >= 2.6 || player.position.y < -1 || this.#errors.length > 0) break;
      await this.advanceTicks(4, 60_000);
    }
    await this.release(KEY.right);
    for (let step = 0; step < 120; step += 1) {
      const snapshot = await this.snapshot();
      const player = playerOf(snapshot);
      if (
        snapshot.boss.enteredArena ||
        player.position.z <= -128 ||
        player.position.y < -1 ||
        this.#errors.length > 0
      ) {
        break;
      }
      await this.hold(KEY.forward);
      await this.advanceTicks(4, 60_000);
      await this.release(KEY.forward);
    }
    return this.snapshot();
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
