import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicNodeMaterial,
  PerspectiveCamera,
  Scene,
  TSL,
} from "three/webgpu";

import rawAttendParams from "../data/attend_params.json";
import rawCombatParams from "../data/combat_params.json";
import rawFrameData from "../data/frame_data.json";
import rawMotionParams from "../data/motion_params.json";
import rawSceneScripts from "../data/scene_scripts.json";
import rawWolfAiParams from "../data/wolf_ai_params.json";
import rawWorldAssembly from "../data/world_assembly.json";
import { compileWalkGraph, parseWolfAiParams, type WalkGraphData } from "../sim/ai";
import { parseAttendParams } from "../sim/attend";
import { compileCombatData } from "../sim/combat";
import {
  FrameInputSampler,
  TickInputQueue,
  type InputAction,
  type SampledInputEdge,
} from "../sim/input";
import { parseMotionParams } from "../sim/motion";
import { presentSim } from "../sim/presenter";
import { parseSceneScripts } from "../sim/scenes";
import { createSimState, type SimState } from "../sim/state";
import { stepTick } from "../sim/tick";
import {
  EMPTY_WORLD_INPUT,
  WORLD_BROWSER_GOLDEN_INPUTS,
  WORLD_BROWSER_GOLDEN_REPLAY,
  createWorldDebugSnapshot,
  createWorldDefinition,
  createWorldState,
  hashWorldState,
  playWorldReplay,
  stepWorld,
  type WorldDebugSnapshot,
  type WorldQueries,
  type WorldReplayScript,
  type WorldState,
} from "../sim/world";
import { bootRenderer } from "../view/renderer";
import {
  adaptWorldEvents,
  bootIronwoodWorldView,
  presentWorldDebug,
  type WorldPresentation,
} from "../view/world";
import { GamepadInputSource } from "./gamepad";
import { FixedTickLoop, startAnimationLoop } from "./loop";
import { BrowserInputSource } from "./input";

const makeCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.dataset.testid = "game-canvas";
  canvas.setAttribute("aria-label", "Tincture of Mercy game view");
  return canvas;
};

const p95 = (samples: readonly number[]): number => {
  if (samples.length === 0) return 0;
  const ordered = [...samples].sort((left, right) => left - right);
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * 0.95) - 1)] ?? 0;
};

const recordDuration = (samples: number[], startedAt: number): void => {
  samples.push(performance.now() - startedAt);
  if (samples.length > 600) samples.shift();
};

const WORLD_ACTION_KEYS: Readonly<Record<string, InputAction>> = {
  Space: "attack",
  KeyF: "heavy",
  ShiftLeft: "roll",
  ShiftRight: "roll",
  ControlLeft: "sprint",
  ControlRight: "sprint",
  KeyC: "jump",
  KeyQ: "attend",
  Tab: "switchTarget",
  KeyR: "flask",
  KeyE: "interact",
};

class WorldKeyboardInput {
  readonly #codes = new Set<string>();
  readonly #edges: SampledInputEdge[] = [];

  public constructor() {
    window.addEventListener("keydown", this.#onKeyDown);
    window.addEventListener("keyup", this.#onKeyUp);
    window.addEventListener("blur", this.#onBlur);
  }

  public get move(): Readonly<{ x: number; z: number }> {
    const x = Number(this.#codes.has("KeyD")) - Number(this.#codes.has("KeyA"));
    const z = Number(this.#codes.has("KeyS")) - Number(this.#codes.has("KeyW"));
    const length = Math.hypot(x, z);
    return length > 1 ? { x: x / length, z: z / length } : { x, z };
  }

  public drain(): readonly SampledInputEdge[] {
    return this.#edges.splice(0);
  }

  public dispose(): void {
    window.removeEventListener("keydown", this.#onKeyDown);
    window.removeEventListener("keyup", this.#onKeyUp);
    window.removeEventListener("blur", this.#onBlur);
  }

  #actionHeld(action: InputAction): boolean {
    return [...this.#codes].some((code) => WORLD_ACTION_KEYS[code] === action);
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat || this.#codes.has(event.code)) return;
    const action = WORLD_ACTION_KEYS[event.code];
    const wasHeld = action === undefined ? false : this.#actionHeld(action);
    this.#codes.add(event.code);
    if (action !== undefined && !wasHeld) this.#edges.push({ action, pressed: true });
    if (action !== undefined || event.code === "Space" || event.code === "Tab") event.preventDefault();
  };

  readonly #onKeyUp = (event: KeyboardEvent): void => {
    const action = WORLD_ACTION_KEYS[event.code];
    if (!this.#codes.delete(event.code) || action === undefined) return;
    if (!this.#actionHeld(action)) this.#edges.push({ action, pressed: false });
  };

  readonly #onBlur = (): void => {
    for (const action of new Set(
      [...this.#codes]
        .map((code) => WORLD_ACTION_KEYS[code])
        .filter((value): value is InputAction => value !== undefined),
    )) {
      this.#edges.push({ action, pressed: false });
    }
    this.#codes.clear();
  };
}

interface ConditionalWalkGraph extends Omit<WalkGraphData, "edges"> {
  readonly edges: readonly (WalkGraphData["edges"][number] & { readonly conditional?: boolean })[];
}

const compileIronwoodNav = (raw: unknown) => {
  const source = raw as ConditionalWalkGraph;
  return compileWalkGraph({
    ...source,
    // The merged placement declares gate.loop_b locked. Conditional graph
    // edges remain inert until a later system opens that gate.
    edges: source.edges.filter((edge) => edge.conditional !== true),
  });
};

const placementsBeforeSynthesis = (
  placements: Readonly<{ readonly all: readonly { readonly id: string }[]; readonly hearths: readonly { readonly id: string }[]; readonly [key: string]: unknown }>,
): unknown => {
  const syntheticIds = new Set(rawWorldAssembly.syntheticPlacements.map((placement) => placement.id));
  return {
    ...placements,
    all: placements.all.filter((placement) => !syntheticIds.has(placement.id)),
    hearths: placements.hearths.filter((placement) => !syntheticIds.has(placement.id)),
  };
};

const bootIronwoodPlay = async (
  mount: HTMLElement,
  canvas: HTMLCanvasElement,
  boot: Awaited<ReturnType<typeof bootRenderer>>,
  params: URLSearchParams,
  staging: { dispose: (() => void) | null },
): Promise<void> => {
  if (params.get("renderer") === "webgpu" && boot.backend !== "webgpu") {
    throw new Error("The strict WebGPU route initialized a WebGL2 fallback.");
  }

  const worldView = await bootIronwoodWorldView({
    renderer: boot.renderer,
    backend: boot.backend,
    reversedDepthBuffer: boot.reversedDepthBuffer,
    debug: params.get("debug") === "1",
  });
  staging.dispose = () => worldView.dispose();
  const definition = createWorldDefinition(rawWorldAssembly, {
    aiParams: parseWolfAiParams(rawWolfAiParams),
    attendParams: parseAttendParams(rawAttendParams),
    combatData: compileCombatData(rawFrameData, rawCombatParams),
    motionParams: parseMotionParams(rawMotionParams),
    navGraph: compileIronwoodNav(worldView.assets.nav),
    // The view registry already exposes the synthetic Hearth for anchors;
    // the sim parser receives the authored list and performs the single,
    // validated synthesis itself.
    placements: placementsBeforeSynthesis(worldView.assets.placements),
    sceneCatalog: parseSceneScripts(rawSceneScripts),
    sidecars: Object.fromEntries(worldView.assets.sidecarsByFile),
  });
  const queries: WorldQueries = { ...worldView.assets.collisionQueries, definition };
  let state = createWorldState(queries);
  let snapshot = createWorldDebugSnapshot(state, definition);
  let presentation = presentWorldDebug(snapshot);
  let previousPresentation = presentation;
  let queue = new TickInputQueue();
  const sampler = new FrameInputSampler();
  const gamepad = new GamepadInputSource();
  const keyboard = new WorldKeyboardInput();
  staging.dispose = () => {
    keyboard.dispose();
    worldView.dispose();
  };
  const pendingPadEdges: SampledInputEdge[] = [];
  let moveX = 0;
  let moveZ = 0;
  let attendX = 0;
  let attendY = 0;
  let stopped = false;
  const renderSamples: number[] = [];
  const simStepSamples: number[] = [];
  const reducerSamples: number[] = [];
  const snapshotSamples: number[] = [];

  const pollGamepad = (): boolean => {
    gamepad.poll();
    const edges = gamepad.drainLatchedEdges();
    pendingPadEdges.push(...edges);
    return edges.some((edge) => edge.pressed);
  };

  const resize = (): void => {
    worldView.resize(
      Math.max(window.innerWidth, 1),
      Math.max(window.innerHeight, 1),
      window.devicePixelRatio,
    );
  };

  const sampleInput = (): void => {
    pollGamepad();
    const keyboardMove = keyboard.move;
    moveX = keyboardMove.x + gamepad.moveStick.x;
    moveZ = keyboardMove.z - gamepad.moveStick.y;
    const moveLength = Math.hypot(moveX, moveZ);
    if (moveLength > 1) {
      moveX /= moveLength;
      moveZ /= moveLength;
    }
    attendX = gamepad.cameraStick.x;
    attendY = gamepad.cameraStick.y;
    sampler.sample(state.tick, [...keyboard.drain(), ...pendingPadEdges.splice(0)], queue);
  };

  const setLiveState = (next: WorldState): void => {
    state = next;
    snapshot = createWorldDebugSnapshot(next, definition);
    presentation = presentWorldDebug(snapshot);
    previousPresentation = presentation;
    queue = new TickInputQueue();
  };

  const replayAtYard = (): WorldState => {
    const frames = new Map(WORLD_BROWSER_GOLDEN_INPUTS.map((frame) => [frame.tick, frame.input]));
    let yard = createWorldState(queries);
    for (let tick = 0; tick < 155; tick += 1) {
      yard = stepWorld(yard, frames.get(tick) ?? EMPTY_WORLD_INPUT, queries).state;
    }
    return yard;
  };

  let loopHandle: ReturnType<typeof startAnimationLoop> | null = null;
  let installedFacade: object | null = null;
  const disposeWorld = (): boolean => {
    if (stopped) return false;
    stopped = true;
    loopHandle?.stop();
    keyboard.dispose();
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    const browser = window as unknown as { __TINCTURE_WORLD__?: unknown };
    if (browser.__TINCTURE_WORLD__ === installedFacade) {
      delete browser.__TINCTURE_WORLD__;
    }
    worldView.dispose();
    return true;
  };
  staging.dispose = () => {
    void disposeWorld();
  };
  const stop = (): void => {
    if (disposeWorld()) boot.renderer.dispose();
  };
  const unlockAudio = (): void => {
    void worldView.unlockAudio().catch(() => undefined);
  };

  const loop = new FixedTickLoop({
    render: (alpha) => {
      const startedAt = performance.now();
      const orbit = { x: attendX, y: attendY };
      worldView.render(
        { ...previousPresentation, orbit } satisfies WorldPresentation,
        { ...presentation, orbit } satisfies WorldPresentation,
        alpha,
      );
      document.body.dataset.simTick = String(state.tick);
      recordDuration(renderSamples, startedAt);
    },
    sampleInput,
    step: () => {
      const startedAt = performance.now();
      previousPresentation = presentation;
      const reducerStartedAt = performance.now();
      const stepped = stepWorld(state, {
        ...EMPTY_WORLD_INPUT,
        edges: queue.drain(state.tick),
        moveX,
        moveZ,
        attendStick: { x: attendX, y: attendY },
      }, queries);
      recordDuration(reducerSamples, reducerStartedAt);
      state = stepped.state;
      const snapshotStartedAt = performance.now();
      snapshot = createWorldDebugSnapshot(state, definition);
      presentation = presentWorldDebug(snapshot);
      recordDuration(snapshotSamples, snapshotStartedAt);
      worldView.consumeEvents(adaptWorldEvents(stepped.events));
      recordDuration(simStepSamples, startedAt);
    },
    pollResumeInput: pollGamepad,
    onPauseChange: (paused) => {
      void worldView.setPaused(paused).catch(() => undefined);
    },
  });

  const facade = {
    ready: true,
    backend: boot.backend,
    snapshot: (): WorldDebugSnapshot => snapshot,
    stateHash: (): string => hashWorldState(state),
    runReplay: (script: WorldReplayScript = WORLD_BROWSER_GOLDEN_REPLAY) => {
      const replay = playWorldReplay(queries, script);
      setLiveState(replayAtYard());
      worldView.resetPerformanceSamples();
      renderSamples.length = 0;
      simStepSamples.length = 0;
      reducerSamples.length = 0;
      snapshotSamples.length = 0;
      return {
        ticks: replay.summary.ticks,
        finalHash: replay.stateHash,
        replayCheckpoints: replay.checkpoints,
        checkpoints: {
          wolfKilled: replay.summary.wolfKilled,
          playerDamageTaken: replay.summary.firstPlayerDamage ?? 0,
          expectedPlayerDamage: definition.combatData.frameData.moves.lunge?.pulseDamage ?? 0,
          maxConcurrentAttackTokens: replay.summary.maxConcurrentAttackTokens,
          playerDied: replay.summary.playerDied,
          openPageDropped: replay.summary.openPageDropped,
          respawnedAtHearth: replay.summary.respawnedAtHearth,
          openPageRecovered: replay.summary.openPageRecovered,
          wolvesRespawned: replay.summary.wolvesRespawned,
          flaskCommitted: replay.summary.flaskCommitted,
          restedAtHearth: replay.summary.restedAfterPageRecovery,
        },
      };
    },
    stop,
    perfSnapshot: () => {
      const perf = worldView.debugSnapshot();
      return {
        backend: perf.backend,
        sampleCount: perf.frameSampleCount,
        p95FrameMs: perf.p95FrameMs,
        p95RenderSubmitMs: p95(renderSamples),
        p95ReducerMs: p95(reducerSamples),
        p95SimStepMs: p95(simStepSamples),
        p95SnapshotMs: p95(snapshotSamples),
      };
    },
  };
  installedFacade = facade;
  (window as unknown as { __TINCTURE_WORLD__?: typeof facade }).__TINCTURE_WORLD__ = facade;

  mount.append(canvas);
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointerdown", unlockAudio);
  window.addEventListener("keydown", unlockAudio);
  loopHandle = startAnimationLoop(loop);
  document.body.dataset.simTick = String(state.tick);
  document.body.dataset.bootStatus = "ready";
  staging.dispose = null;
};

export const bootApp = async (): Promise<void> => {
  const mount = document.querySelector<HTMLElement>("#app");
  if (mount === null) {
    throw new Error("Missing #app mount point.");
  }

  document.body.dataset.bootStatus = "loading";
  const canvas = makeCanvas();

  const params = new URLSearchParams(window.location.search);
  const forceWebGL = params.get("renderer") === "webgl2";
  const boot = await bootRenderer(canvas, { forceWebGL });
  document.body.dataset.rendererBackend = boot.backend;

  if (params.get("play") === "ironwood") {
    const staging: { dispose: (() => void) | null } = { dispose: null };
    try {
      await bootIronwoodPlay(mount, canvas, boot, params, staging);
    } catch (error) {
      staging.dispose?.();
      boot.renderer.dispose();
      document.body.dataset.bootStatus = "error";
      document.body.dataset.bootFault = error instanceof Error ? error.message : String(error);
      const fallback = document.createElement("p");
      fallback.setAttribute("role", "alert");
      fallback.textContent = "Ironwood could not be assembled from its verified world data.";
      mount.replaceChildren(fallback);
    }
    return;
  }

  mount.append(canvas);

  // s13 renderer-register sample scene: additive mount, the default boot
  // path below is untouched for every other URL.
  if (params.get("scene") === "register") {
    const { bootRegisterScene } = await import("../view/register/scene");
    await bootRegisterScene({
      renderer: boot.renderer,
      backend: boot.backend,
      reversedDepth: boot.reversedDepthBuffer,
      params,
    });
    return;
  }

  const scene = new Scene();
  scene.background = new Color("#f8f1e5");
  const camera = new PerspectiveCamera(44, 1, 0.1, 1_000);
  camera.position.set(0, 0, 4);

  const material = new MeshBasicNodeMaterial();
  material.colorNode = TSL.color("#a87a2e");
  const marker = new Mesh(new BoxGeometry(1, 1.6, 0.3), material);
  scene.add(marker);

  const resize = (): void => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    boot.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    boot.renderer.setSize(width, height);
  };
  resize();
  window.addEventListener("resize", resize);

  let state: SimState = createSimState(0x544f_4d31);
  let previousState = state;
  const inputQueue = new TickInputQueue();
  const inputSampler = new FrameInputSampler();
  const inputSource = new BrowserInputSource();
  const loop = new FixedTickLoop({
    render: (alpha) => {
      const presentation = presentSim(previousState, state, alpha);
      marker.rotation.y = presentation.presentationTick * 0.01;
      document.body.dataset.simTick = String(presentation.committedTick);
      document.body.dataset.simInputCount = String(presentation.acceptedInputCount);
      boot.renderer.render(scene, camera);
    },
    sampleInput: () => {
      inputSampler.sample(state.tick, inputSource.drainLatchedEdges(), inputQueue);
    },
    step: () => {
      previousState = state;
      state = stepTick(state, inputQueue.drain(state.tick));
    },
  });

  document.body.dataset.simTick = String(state.tick);
  document.body.dataset.simInputCount = String(state.inputCount);
  startAnimationLoop(loop);
  document.body.dataset.bootStatus = "ready";
};
