import { Color, Scene, type WebGPURenderer } from "three/webgpu";

import rawAudioParams from "../../data/audio_params.json";
import { createAudioRuntime, parseAudioParams } from "../../app/audio";
import type { RendererBackendName } from "../renderer";
import { WorldCameraBinding } from "./camera";
import { SimCapsuleOverlay } from "./debug";
import { loadIronwoodWorldAssets, type IronwoodAssetLoadOptions } from "./load";
import { WorldActorPresenter } from "./presenter";
import type {
  ActorPresentation,
  IronwoodWorldView,
  WorldPresentation,
  WorldViewDebugSnapshot,
  WorldViewEventBatch,
} from "./types";

export interface IronwoodWorldViewBootOptions extends IronwoodAssetLoadOptions {
  readonly renderer: WebGPURenderer;
  readonly backend: RendererBackendName;
  readonly reversedDepthBuffer: boolean;
  readonly debug: boolean;
}

const percentile95 = (samples: readonly number[]): number => {
  if (samples.length === 0) return 0;
  const ordered = [...samples].sort((left, right) => left - right);
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * 0.95) - 1)] ?? 0;
};

const playerSpawn = (
  placements: readonly { readonly kind: string; readonly position: readonly [number, number, number] }[],
) => {
  const spawn = placements.find((placement) => placement.kind === "spawn_player");
  const [x, y, z] = spawn?.position ?? [0, 0, 0];
  return { x, y, z };
};

export const bootIronwoodWorldView = async (
  options: IronwoodWorldViewBootOptions,
): Promise<IronwoodWorldView> => {
  const assets = await loadIronwoodWorldAssets({ fetcher: options.fetcher });
  const scene = new Scene();
  scene.name = "ironwood-world";
  scene.background = new Color("#8a7f6b");
  scene.add(assets.levelRoot);

  const actors = new WorldActorPresenter(assets);
  scene.add(actors.root);
  const overlay = new SimCapsuleOverlay(options.debug);
  scene.add(overlay.root);
  const camera = new WorldCameraBinding(
    assets,
    { reversedDepthBuffer: options.reversedDepthBuffer },
    playerSpawn(assets.placements.spawns),
  );
  const audio = createAudioRuntime({ params: parseAudioParams(rawAudioParams) });
  const frameSamples: number[] = [];
  let lastFrameStart: number | null = null;
  let currentPresentation: WorldPresentation | null = null;
  let disposed = false;

  const assertLive = (): void => {
    if (disposed) throw new Error("Ironwood world view has been disposed");
  };

  const resize = (width: number, height: number, pixelRatio = 1): void => {
    assertLive();
    if (width <= 0 || height <= 0) throw new RangeError("world view size must be positive");
    options.renderer.setPixelRatio(Math.min(Math.max(pixelRatio, 1), 2));
    options.renderer.setSize(width, height);
    camera.setAspect(width / height);
  };

  const consumeEvents = (events: WorldViewEventBatch): void => {
    assertLive();
    camera.consume(events.camera);
    audio.ingest(events.audio);
  };

  const render = (
    previous: WorldPresentation,
    current: WorldPresentation,
    alpha: number,
  ): void => {
    assertLive();
    const frameStart = performance.now();
    if (lastFrameStart !== null) {
      frameSamples.push(frameStart - lastFrameStart);
      if (frameSamples.length > 600) frameSamples.shift();
    }
    lastFrameStart = frameStart;
    currentPresentation = current;
    actors.apply(previous, current, alpha);
    overlay.apply(current.actors);
    camera.apply(current, alpha);
    audio.syncClock(current.tick);
    options.renderer.render(scene, camera.camera);
  };

  const debugSnapshot = (): WorldViewDebugSnapshot => {
    const presentedActors: readonly ActorPresentation[] = currentPresentation?.actors ?? [];
    return {
      tick: currentPresentation?.tick ?? 0,
      backend: options.backend,
      actors: presentedActors.map((actor) => ({
        id: actor.id,
        invulnerable: actor.invulnerable,
        hurtboxCount: actor.hurtboxes.length,
        hitboxCount: actor.hitboxes.length,
      })),
      fallbackClips: [...actors.fallbackClips].sort(),
      assetDiagnostics: assets.diagnostics,
      p95FrameMs: percentile95(frameSamples),
      frameSampleCount: frameSamples.length,
    };
  };

  return {
    scene,
    assets,
    actorRoot: actors.root,
    resize,
    consumeEvents,
    render,
    setPaused: (paused) => audio.setPaused(paused),
    unlockAudio: () => audio.unlockFromGesture(),
    debugSnapshot,
    resetPerformanceSamples: () => {
      frameSamples.length = 0;
      lastFrameStart = null;
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      void audio.dispose().catch(() => undefined);
      actors.dispose();
      overlay.dispose();
      scene.clear();
      assets.dispose();
    },
  };
};
