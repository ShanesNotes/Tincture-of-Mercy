/**
 * The VFX demo scene (`?scene=vfx`, slice s27 deliverable 6): a staged
 * frontal arena — needle-floor, pines, a target dummy, the Warden's
 * snare-ring of tin tags, the vial and the Ember on their stands — driven by
 * the scripted event timeline in `vfx_params.json`. Every effect the slice
 * ships fires on schedule: margin ink-blooms, ink-stroke flashes, the
 * licensed gold riposte/guard-break flash, Wither motes + margin band, the
 * vial's `mercy` emblem pulse, the Ember gold-to-grey sweep, the tag glint,
 * the 1-frame parchment inversion, and the death page hook.
 *
 * `?auto=0` (the e2e mode) freezes the timeline for scripted stepping via
 * `window.__vfx.advance(n)` / `.inject(payloads)`; default auto-advances one
 * tick per rAF. `.captureStats()` runs the shared frame analysis (A3 oxblood
 * budget row) and `.auditLights()` runs the L4 registry audit.
 */

import {
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  RenderTarget,
  Scene,
  TorusGeometry,
  Vector3,
  type WebGPURenderer,
} from "three/webgpu";

import type { ImpactLayerHandle } from "../../app/hud/impact/impact";
import { bloomAreaPx, bloomOxbloodCoverage, layoutBlooms } from "../../app/hud/impact/bloom";
import type { RendererBackendName } from "../renderer";
import { analyzeFrame, type FrameStats } from "../register/analysis";
import { REGISTER_CONFIG } from "../register/config";
import { rampMaterial } from "../register/materials";
import { PALETTE_LAW, tokenHex } from "../register/palette";
import { ATLAS } from "../register/patterns";
import { createRegisterPipeline } from "../register/post";
import {
  applyVfxEvents,
  emberDesatLevel,
  emblemIntensity,
  inversionActive,
  witherBandStop,
  witherMoteCount,
} from "./controller";
import { createVfxEmblemRegistry } from "./emblem";
import {
  buildEmberProp,
  buildMoteField,
  buildStrokeMesh,
  buildTagGlintMesh,
  buildVialProp,
  createDesatUniform,
  wrapDesaturatable,
  type FloatUniform,
} from "./nodes";
import { VFX_PARAMS } from "./params";
import type { VfxEvent, VfxEventPayload, VfxState } from "./types";
import { createVfxState } from "./controller";

export interface VfxSceneBootOptions {
  readonly renderer: WebGPURenderer;
  readonly backend: RendererBackendName;
  readonly params: URLSearchParams;
  readonly impactLayer: ImpactLayerHandle;
}

export interface VfxStateSnapshot {
  readonly tick: number;
  readonly blooms: readonly {
    readonly anchor: string;
    readonly hitstopClass: string;
    readonly eventTick: number;
    readonly startTick: number;
  }[];
  readonly strokeCount: number;
  readonly goldStrokeCount: number;
  readonly inversion: boolean;
  readonly witherMotes: number;
  readonly witherBand: number;
  readonly flaskPulse: boolean;
  readonly emberSweep: boolean;
  readonly emberDesat: number;
  readonly tagGlints: number;
  readonly deathPage: boolean;
}

export interface VfxBudgetReport {
  readonly bloomCoverage: number;
  readonly maxOxbloodCoverage: number;
  readonly bloomAreaPx: number;
  readonly viewportAreaPx: number;
}

export interface VfxDemoApi {
  readonly advance: (ticks?: number) => void;
  readonly inject: (payloads: readonly VfxEventPayload[]) => void;
  readonly tick: () => number;
  readonly state: () => VfxStateSnapshot;
  readonly budget: () => VfxBudgetReport;
  readonly captureStats: () => Promise<FrameStats>;
  readonly auditLights: () => readonly string[];
}

declare global {
  interface Window {
    __vfx?: VfxDemoApi;
  }
}

const params = VFX_PARAMS;

/** Deterministic placement hash (no RNG in the view's timing path). */
const hash01 = (index: number, salt: number): number => {
  const s = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Stepped fade stops for strokes/glints (L3: declared stops, never a ramp). */
const steppedFade = (age: number, durationTicks: number): number => {
  if (age < 0 || age >= durationTicks) return 0;
  const t = age / durationTicks;
  if (t < 1 / 3) return 1;
  if (t < 2 / 3) return 0.6;
  return 0.25;
};

export const bootVfxScene = async (options: VfxSceneBootOptions): Promise<VfxDemoApi> => {
  const { renderer, params: urlParams, impactLayer } = options;
  const registry = createVfxEmblemRegistry(4);
  const desat = createDesatUniform();

  const viewport = (): { readonly width: number; readonly height: number } => ({
    width: Math.max(window.innerWidth, 1),
    height: Math.max(window.innerHeight, 1),
  });

  renderer.setPixelRatio(1);
  const initial = viewport();
  renderer.setSize(initial.width, initial.height, true);

  const scene = new Scene();
  scene.background = new Color(tokenHex(PALETTE_LAW, "parchment"));
  const camera = new PerspectiveCamera(44, initial.width / initial.height, 0.1, 120);
  camera.position.set(0, 2.2, 3.8);
  camera.lookAt(new Vector3(0, 1.0, -4));

  const worldMaterial = (
    binding: Parameters<typeof rampMaterial>[0],
  ): ReturnType<typeof rampMaterial> =>
    wrapDesaturatable(rampMaterial(binding), desat);

  // Needle-floor (EN3).
  const ground = new Mesh(
    new PlaneGeometry(40, 40),
    worldMaterial({
      family: "muted",
      cell: ATLAS.NEEDLE_FLOOR,
      uvScale: 16,
      lineStrength: 0.35,
      shadeByPattern: 0.25,
      edges: [0.42],
    }),
  );
  ground.name = "needle-floor";
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Pine colonnade edges (EN1).
  const trunkMaterial = worldMaterial({
    family: "green",
    cell: ATLAS.PINE_BARK,
    uvScale: 3,
    lineStrength: 0.55,
    shadeByPattern: 0.2,
    edges: [0.38],
  });
  const canopyMaterial = worldMaterial({
    family: "green",
    cell: ATLAS.PINE_CANOPY,
    uvScale: 2.5,
    lineStrength: 0.6,
    shadeByPattern: 0.3,
    edges: [0.34],
  });
  for (let i = 0; i < 4; i += 1) {
    for (const side of [-1, 1] as const) {
      const trunk = new Mesh(new CylinderGeometry(0.22, 0.32, 6, 8), trunkMaterial);
      trunk.position.set(side * 6, 3, -2 - i * 4);
      const canopy = new Mesh(new ConeGeometry(2.1, 5.5, 8), canopyMaterial);
      canopy.position.set(side * 6, 7.5, -2 - i * 4);
      scene.add(trunk, canopy);
    }
  }

  // The target dummy — a standing form in the muted ramp.
  const dummy = new Mesh(
    new CapsuleGeometry(0.35, 1.1, 4, 8),
    worldMaterial({
      family: "muted",
      cell: ATLAS.WOOL_WEAVE,
      uvScale: 1.5,
      lineStrength: 0.35,
      shadeByPattern: 0.3,
      edges: [0.45],
    }),
  );
  dummy.name = "target-dummy";
  dummy.position.set(0, 0.9, -4);
  scene.add(dummy);

  // The snare line: a wire ring strung with pressed tin tags (PR5).
  const wire = new Mesh(
    new TorusGeometry(3.8, 0.012, 4, 64),
    worldMaterial({
      family: "ink",
      cell: ATLAS.WOODGRAIN,
      uvScale: 1,
      lineStrength: 0,
      shadeByPattern: 0,
    }),
  );
  wire.name = "snare-wire";
  wire.rotation.x = Math.PI / 2;
  wire.position.set(0, 1.0, -4);
  scene.add(wire);

  const tagMaterial = worldMaterial({
    family: "muted",
    cell: ATLAS.MOSAIC_BAND,
    uvScale: 1,
    lineStrength: 0.3,
    shadeByPattern: 0.2,
    edges: [0.5],
  });
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const tag = new Mesh(new PlaneGeometry(0.12, 0.18), tagMaterial);
    tag.name = `snare-tag-${i}`;
    tag.position.set(Math.cos(angle) * 3.8, 1.0, -4 + Math.sin(angle) * 3.8);
    tag.rotation.y = -angle + Math.PI / 2;
    scene.add(tag);
  }

  // The vial and the Ember — registered emblem emitters, verb `mercy` (L4).
  const vial = buildVialProp(registry, REGISTER_CONFIG.emblems.lightRange);
  vial.position.set(2.2, 0, -2.5);
  scene.add(vial);
  const ember = buildEmberProp(registry, REGISTER_CONFIG.emblems.lightRange);
  ember.position.set(2.8, 0, -2.5);
  scene.add(ember);

  const moteField: InstancedMesh = buildMoteField(params);
  scene.add(moteField);

  const pipeline = createRegisterPipeline(renderer, scene, camera, REGISTER_CONFIG);
  pipeline.setPostEnabled(urlParams.get("post") !== "off");

  // --- Effect pools (keyed by spawn tick; expired entries are disposed) ----
  interface StrokeEntry {
    readonly mesh: Mesh;
    readonly fade: FloatUniform;
    readonly startTick: number;
    readonly durationTicks: number;
  }
  const strokePool = new Map<string, StrokeEntry>();
  const glintPool = new Map<string, StrokeEntry>();

  const syncStrokes = (state: VfxState, tick: number): void => {
    const activeKeys = new Set<string>();
    state.strokes.forEach((stroke, index) => {
      const key = `${stroke.startTick}:${index}:${stroke.gold ? "g" : "i"}`;
      activeKeys.add(key);
      let entry = strokePool.get(key);
      if (entry === undefined) {
        const built = buildStrokeMesh(params, stroke.variant, stroke.gold);
        built.mesh.position.set(stroke.contact[0], stroke.contact[1], stroke.contact[2]);
        scene.add(built.mesh);
        entry = {
          mesh: built.mesh,
          fade: built.fade,
          startTick: stroke.startTick,
          durationTicks: stroke.durationTicks,
        };
        strokePool.set(key, entry);
      }
      entry.fade.value = steppedFade(tick - entry.startTick, entry.durationTicks);
      entry.mesh.quaternion.copy(camera.quaternion);
    });
    for (const [key, entry] of strokePool) {
      if (!activeKeys.has(key)) {
        entry.mesh.removeFromParent();
        entry.mesh.geometry.dispose();
        (entry.mesh.material as { dispose(): void }).dispose();
        strokePool.delete(key);
      }
    }
  };

  const syncGlints = (state: VfxState, tick: number): void => {
    const activeKeys = new Set<string>();
    state.tagGlints.forEach((glint, index) => {
      const key = `${glint.startTick}:${index}`;
      activeKeys.add(key);
      let entry = glintPool.get(key);
      if (entry === undefined) {
        const built = buildTagGlintMesh(params);
        built.mesh.position.set(glint.contact[0], glint.contact[1], glint.contact[2]);
        scene.add(built.mesh);
        entry = {
          mesh: built.mesh,
          fade: built.fade,
          startTick: glint.startTick,
          durationTicks: glint.durationTicks,
        };
        glintPool.set(key, entry);
      }
      entry.fade.value = steppedFade(tick - entry.startTick, entry.durationTicks);
      entry.mesh.quaternion.copy(camera.quaternion);
    });
    for (const [key, entry] of glintPool) {
      if (!activeKeys.has(key)) {
        entry.mesh.removeFromParent();
        entry.mesh.geometry.dispose();
        (entry.mesh.material as { dispose(): void }).dispose();
        glintPool.delete(key);
      }
    }
  };

  const syncMotes = (state: VfxState, tick: number): void => {
    const count = witherMoteCount(state, params);
    moteField.count = count;
    const matrix = new Matrix4();
    for (let i = 0; i < count; i += 1) {
      const fall = (tick * params.wither.driftMetersPerTick + hash01(i, 4) * 3.2) % 3.2;
      const x = -5 + hash01(i, 1) * 10 + Math.sin((tick + i * 7) * 0.02) * 0.05;
      const y = 3.4 - fall;
      const z = -7 + hash01(i, 3) * 5;
      matrix.makeRotationFromQuaternion(camera.quaternion).setPosition(x, y, z);
      moteField.setMatrixAt(i, matrix);
    }
    moteField.instanceMatrix.needsUpdate = true;
  };

  const syncEmblems = (state: VfxState): void => {
    for (const record of registry.records()) {
      const intensity = emblemIntensity(state, record.name === "vial" ? "vial" : "ember");
      record.light.intensity = intensity;
      record.node.traverse((child) => {
        if (child.userData.emblemVisual === true) {
          child.visible = intensity > 0;
          child.quaternion.copy(camera.quaternion);
        }
      });
    }
  };

  let state: VfxState = createVfxState();
  let demoTick = 0;
  let lastLayout: ReturnType<typeof layoutBlooms> = [];

  const syncDataset = (snapshot: VfxStateSnapshot): void => {
    document.body.dataset.vfxTick = String(snapshot.tick);
    document.body.dataset.vfxBloomAnchor = snapshot.blooms[0]?.anchor ?? "";
    document.body.dataset.vfxBloomCount = String(snapshot.blooms.length);
    document.body.dataset.vfxInversion = snapshot.inversion ? "1" : "0";
    document.body.dataset.vfxWitherMotes = String(snapshot.witherMotes);
    document.body.dataset.vfxFlask = snapshot.flaskPulse ? "1" : "0";
    document.body.dataset.vfxEmber = snapshot.emberSweep ? "1" : "0";
    document.body.dataset.vfxEmberDesat = String(snapshot.emberDesat);
    document.body.dataset.vfxTagGlints = String(snapshot.tagGlints);
    document.body.dataset.vfxDeathPage = snapshot.deathPage ? "1" : "0";
  };

  const snapshot = (): VfxStateSnapshot => ({
    tick: state.tick,
    blooms: state.blooms.map((bloom) => ({
      anchor: bloom.anchor,
      hitstopClass: bloom.hitstopClass,
      eventTick: bloom.eventTick,
      startTick: bloom.startTick,
    })),
    strokeCount: state.strokes.length,
    goldStrokeCount: state.strokes.filter((s) => s.gold).length,
    inversion: inversionActive(state),
    witherMotes: witherMoteCount(state, params),
    witherBand: witherBandStop(state, params),
    flaskPulse: emblemIntensity(state, "vial") > 0,
    emberSweep: state.emberSweep !== null,
    emberDesat: emberDesatLevel(state, params),
    tagGlints: state.tagGlints.length,
    deathPage: state.deathPage !== null,
  });

  const syncAll = (): void => {
    syncStrokes(state, demoTick);
    syncGlints(state, demoTick);
    syncMotes(state, demoTick);
    syncEmblems(state);
    desat.value = emberDesatLevel(state, params);
    lastLayout = layoutBlooms(state.blooms, state.tick, viewport(), params);
    impactLayer.apply({
      blooms: lastLayout,
      inversion: inversionActive(state),
      witherBand: witherBandStop(state, params),
      deathPage: state.deathPage !== null,
    });
    syncDataset(snapshot());
  };

  const step = (): void => {
    const loopTick = demoTick % params.demo.loopTicks;
    const events: VfxEvent[] = params.demo.timeline
      .filter((cue) => cue.tick === loopTick)
      .map((cue) => ({ ...cue.event, tick: demoTick }) as VfxEvent);
    state = applyVfxEvents(state, events, demoTick, params);
    syncAll();
    pipeline.render();
    demoTick += 1;
  };

  const api: VfxDemoApi = {
    advance: (ticks = 1) => {
      for (let i = 0; i < ticks; i += 1) {
        step();
      }
    },
    inject: (payloads) => {
      const events: VfxEvent[] = payloads.map(
        (payload) => ({ ...payload, tick: demoTick }) as VfxEvent,
      );
      state = applyVfxEvents(state, events, demoTick, params);
      syncAll();
      pipeline.render();
    },
    tick: () => demoTick,
    state: () => snapshot(),
    budget: () => {
      const vp = viewport();
      return {
        bloomCoverage: bloomOxbloodCoverage(lastLayout, vp),
        maxOxbloodCoverage: params.budget.maxOxbloodCoverage,
        bloomAreaPx: bloomAreaPx(lastLayout),
        viewportAreaPx: vp.width * vp.height,
      };
    },
    captureStats: async () => {
      const vp = viewport();
      const target = new RenderTarget(vp.width, vp.height, { depthBuffer: false });
      const pixels = await pipeline.capture(target);
      target.dispose();
      return analyzeFrame(pixels, vp.width, vp.height, PALETTE_LAW, {
        deltaETolerance: PALETTE_LAW.deltaETolerance,
        minBandPopulation: REGISTER_CONFIG.gates.a4MinBandPopulation,
      });
    },
    auditLights: () => registry.auditSceneLights(scene),
  };
  window.__vfx = api;

  const resize = (): void => {
    const vp = viewport();
    camera.aspect = vp.width / vp.height;
    camera.updateProjectionMatrix();
    renderer.setSize(vp.width, vp.height);
  };
  window.addEventListener("resize", resize);

  // Present one real tick immediately so the scene is never blank and
  // state.tick / demoTick stay aligned for scripted stepping.
  step();

  if (urlParams.get("auto") !== "0") {
    const loop = (): void => {
      step();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  document.body.dataset.scene = "vfx";
  document.body.dataset.vfxBackend = options.backend;
  document.body.dataset.bootStatus = "ready";
  return api;
};
