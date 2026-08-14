/**
 * The register sample scene (`?scene=register`): a staged frontal plate in
 * the Ironwood — needle-floor ground, pine colonnade, the s02 wolf GLB
 * stripped to register materials (D4 audit law), hearth + lantern emblem
 * lights (L4), a thistle as the scene's one licensed red carrier (L8), a
 * painted backdrop plane (EN11), and four standing-stone depth markers
 * seated one per L5 band. Cameras are deterministic via `?shot=1..4`;
 * post passes die via `?post=off` (A7/L12).
 *
 * Also exposes `window.__registerArtgate` — the page-side half of the
 * machine art gate (capture + analysis + row evaluation all run the shared
 * pure modules inside the page bundle; the Playwright harness only
 * orchestrates).
 */

import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  RenderTarget,
  Scene,
  Vector3,
  type WebGPURenderer,
} from "three/webgpu";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { RENDERER_LAW_DEFAULTS, type RendererBackendName } from "../renderer";
import { analyzeFrame } from "./analysis";
import { createBudgetMonitor } from "./budget";
import { REGISTER_CONFIG } from "./config";
import { evaluateGate, type Capture, type GateReport, type LawAudit } from "./gateRows";
import {
  auditSceneLights,
  buildEmblemVisual,
  faceEmblemsToCamera,
  registerEmblem,
  syncEmblemUniforms,
} from "./lights";
import { auditRegisterMaterials, stripToRegister, rampMaterial } from "./materials";
import { ATLAS } from "./patterns";
import { PALETTE_LAW, tokenHex } from "./palette";
import { createRegisterPipeline } from "./post";

const WOLF_GLB_URL = "/assets/build/wolf.ac7dfc084aa5.glb";

export interface RegisterSceneBootOptions {
  readonly renderer: WebGPURenderer;
  readonly backend: RendererBackendName;
  readonly reversedDepth: boolean;
  readonly params: URLSearchParams;
}

export interface RegisterCapture {
  readonly meta: {
    readonly backend: RendererBackendName;
    readonly shot: string;
    readonly post: boolean;
    readonly silhouette: boolean;
  };
  readonly stats: unknown;
}

export interface RegisterArtgateApi {
  readonly renderFrame: () => void;
  readonly capture: () => Promise<RegisterCapture>;
  readonly audit: () => LawAudit;
  readonly evaluateRows: (
    captures: readonly Capture[],
    audits: Readonly<Record<string, LawAudit>>,
  ) => GateReport;
  readonly budget: () => unknown;
}

declare global {
  interface Window {
    __registerArtgate?: RegisterArtgateApi;
  }
}

const buildGround = (): Mesh => {
  const ground = new Mesh(
    new PlaneGeometry(90, 90),
    rampMaterial({
      family: "muted",
      cell: ATLAS.NEEDLE_FLOOR,
      // Placeholder cells run coarser than the PA13 final-atlas lock for
      // legibility at gate resolution; the texel-density lock binds when the
      // real atlas lands (NON-GOAL for this slice).
      uvScale: 24,
      lineStrength: 0.35,
      shadeByPattern: 0.25,
      edges: [0.42],
    }),
  );
  ground.name = "needle-floor";
  ground.rotation.x = -Math.PI / 2;
  return ground;
};

const buildBackdrop = (): Mesh => {
  const backdrop = new Mesh(
    new PlaneGeometry(150, 50),
    rampMaterial({
      family: "parchment",
      cell: ATLAS.SCALLOP_HILL,
      uvScale: 6,
      lineStrength: 0.5,
      shadeByPattern: 0.15,
      edges: [0.2, 0.5],
    }),
  );
  backdrop.name = "painted-backdrop";
  backdrop.position.set(0, 12, -48);
  return backdrop;
};

const buildPines = (): readonly InstancedMesh[] => {
  const placements: Vector3[] = [];
  for (let i = 0; i < 8; i += 1) {
    placements.push(new Vector3(-6, 0, -2 - i * 4));
    placements.push(new Vector3(6, 0, -2 - i * 4));
  }
  for (let i = 0; i < 9; i += 1) {
    placements.push(new Vector3(-20 + i * 5, 0, -38));
  }

  const trunks = new InstancedMesh(
    new CylinderGeometry(0.22, 0.32, 6, 8),
    rampMaterial({
      family: "green",
      cell: ATLAS.PINE_BARK,
      uvScale: 3,
      lineStrength: 0.55,
      shadeByPattern: 0.2,
      edges: [0.38],
    }),
    placements.length,
  );
  trunks.name = "pine-trunks";
  const canopies = new InstancedMesh(
    new ConeGeometry(2.1, 5.5, 8),
    rampMaterial({
      family: "green",
      cell: ATLAS.PINE_CANOPY,
      uvScale: 2.5,
      lineStrength: 0.6,
      shadeByPattern: 0.3,
      edges: [0.34],
    }),
    placements.length,
  );
  canopies.name = "pine-canopies";

  const matrix = new Matrix4();
  placements.forEach((p, index) => {
    matrix.makeTranslation(p.x, p.y + 3, p.z);
    trunks.setMatrixAt(index, matrix);
    matrix.makeTranslation(p.x, p.y + 7.5, p.z);
    canopies.setMatrixAt(index, matrix);
  });
  trunks.instanceMatrix.needsUpdate = true;
  canopies.instanceMatrix.needsUpdate = true;
  return [trunks, canopies];
};

const buildHearth = (): Group => {
  const group = new Group();
  group.name = "hearth";
  group.position.set(3.5, 0, -6);

  const stoneMaterial = rampMaterial({
    family: "blue",
    cell: ATLAS.GRANITE,
    uvScale: 1,
    lineStrength: 0.4,
    shadeByPattern: 0.2,
    edges: [0.4],
  });
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const stone = new Mesh(new BoxGeometry(0.34, 0.3, 0.26), stoneMaterial);
    stone.position.set(Math.cos(angle) * 0.8, 0.15, Math.sin(angle) * 0.8);
    stone.rotation.y = -angle;
    group.add(stone);
  }

  const logMaterial = rampMaterial({
    family: "muted",
    cell: ATLAS.WOODGRAIN,
    uvScale: 2,
    lineStrength: 0.4,
    shadeByPattern: 0.2,
    edges: [0.45],
  });
  for (let i = 0; i < 3; i += 1) {
    const log = new Mesh(new CylinderGeometry(0.09, 0.09, 0.9, 6), logMaterial);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i / 3) * Math.PI;
    log.position.y = 0.12 + i * 0.07;
    group.add(log);
  }

  const gold = tokenHex(PALETTE_LAW, "gold");
  const halo = buildEmblemVisual("scallopHalo", 1.7, gold);
  halo.position.set(0, 0.85, 0);
  const flame = buildEmblemVisual("rayFan", 0.9, gold);
  flame.position.set(0, 0.85, 0.05);
  group.add(halo, flame);

  const light = new PointLight(new Color(gold), 2.4, REGISTER_CONFIG.emblems.lightRange, 0);
  light.position.set(0, 1.2, 0);
  group.add(light);

  registerEmblem("hearth", "warm", group);
  return group;
};

const buildLantern = (): Group => {
  const group = new Group();
  group.name = "lantern";
  group.position.set(-4, 0, -3);

  const post = new Mesh(
    new CylinderGeometry(0.06, 0.08, 1.7, 6),
    rampMaterial({
      family: "muted",
      cell: ATLAS.WOODGRAIN,
      uvScale: 2,
      lineStrength: 0.4,
      shadeByPattern: 0.2,
      edges: [0.45],
    }),
  );
  post.position.y = 0.85;
  group.add(post);

  // The lantern head is the named gold carrier (L9): gold with a job.
  const head = new Mesh(
    new BoxGeometry(0.28, 0.36, 0.28),
    rampMaterial({
      family: "gold",
      cell: ATLAS.MOSAIC_BAND,
      uvScale: 1,
      lineStrength: 0.3,
      shadeByPattern: 0.2,
      edges: [0.5],
    }),
  );
  head.position.y = 1.8;
  group.add(head);

  const gold = tokenHex(PALETTE_LAW, "gold");
  const flame = buildEmblemVisual("disk", 0.7, gold);
  flame.position.set(0, 1.8, 0);
  group.add(flame);

  const light = new PointLight(new Color(gold), 1.5, REGISTER_CONFIG.emblems.lightRange, 0);
  light.position.set(0, 1.8, 0);
  group.add(light);

  registerEmblem("lantern", "guide", group);
  return group;
};

const buildThistle = (): Mesh => {
  // The scene's one licensed red carrier (L8/EN3): a thistle sprig stamp.
  const material = rampMaterial({
    family: "oxblood",
    cell: ATLAS.THISTLE,
    uvScale: 1,
    lineStrength: 0,
    shadeByPattern: 0,
  });
  material.side = DoubleSide;
  const sprig = new Mesh(new PlaneGeometry(0.5, 0.7), material);
  sprig.name = "thistle-red-carrier";
  sprig.position.set(2.2, 0.35, -4.2);
  sprig.rotation.y = 0.5;
  return sprig;
};

const buildBandMarkers = (): Group => {
  const group = new Group();
  group.name = "depth-band-markers";
  const material = rampMaterial({
    family: "blue",
    cell: ATLAS.GRANITE,
    uvScale: 1.2,
    lineStrength: 0.5,
    shadeByPattern: 0.2,
    edges: [0.4],
  });
  // One marker per L5 band, measured against shot 4's camera (z=8).
  const placements: readonly (readonly [number, number])[] = [
    [-5.5, -4],
    [4.5, -12],
    [-2.5, -22],
    [5.5, -37],
  ];
  placements.forEach(([x, z], index) => {
    const marker = new Mesh(new BoxGeometry(0.8, 2.2, 0.5), material);
    marker.name = `band-marker-${index}`;
    marker.position.set(x, 1.1, z);
    group.add(marker);
  });
  return group;
};

const loadWolf = async (): Promise<Group> => {
  const gltf = await new GLTFLoader().loadAsync(WOLF_GLB_URL);
  const wolf = gltf.scene;
  wolf.name = "wolf";
  // D4 build-time material audit: imported materials never survive — every
  // mesh is rebound to the register (damp-ash muted ramp, WF4).
  stripToRegister(wolf, () => ({
    family: "muted",
    cell: ATLAS.WOOL_WEAVE,
    uvScale: 1.5,
    lineStrength: 0.35,
    shadeByPattern: 0.3,
    edges: [0.45],
  }));
  wolf.position.set(-1.5, 0, -7);
  wolf.rotation.y = 0.6;
  const wrapper = new Group();
  wrapper.add(wolf);
  return wrapper;
};

export const bootRegisterScene = async (
  options: RegisterSceneBootOptions,
): Promise<void> => {
  const { renderer, params } = options;
  const config = REGISTER_CONFIG;

  renderer.setPixelRatio(1);
  renderer.setSize(config.captureWidth, config.captureHeight, true);

  const scene = new Scene();
  scene.background = new Color(tokenHex(PALETTE_LAW, "blue"));
  const camera = new PerspectiveCamera(
    config.cameraFov,
    config.captureWidth / config.captureHeight,
    0.1,
    120,
  );

  const shotIndex = Math.min(
    Math.max(Number.parseInt(params.get("shot") ?? "1", 10) || 1, 1),
    config.shots.length,
  );
  const shot = config.shots[shotIndex - 1];
  if (shot === undefined) {
    throw new Error(`No shot config at index ${shotIndex}.`);
  }
  camera.position.set(shot.position[0], shot.position[1], shot.position[2]);
  camera.lookAt(new Vector3(shot.target[0], shot.target[1], shot.target[2]));

  scene.add(buildGround());
  scene.add(buildBackdrop());
  for (const pines of buildPines()) {
    scene.add(pines);
  }
  scene.add(buildHearth());
  scene.add(buildLantern());
  scene.add(buildThistle());
  scene.add(buildBandMarkers());
  scene.add(await loadWolf());

  const pipeline = createRegisterPipeline(renderer, scene, camera, config);
  const postEnabled = params.get("post") !== "off";
  pipeline.setPostEnabled(postEnabled);

  const budget = createBudgetMonitor();
  const captureTarget = new RenderTarget(config.captureWidth, config.captureHeight, {
    depthBuffer: false,
  });

  const renderFrame = (): void => {
    syncEmblemUniforms();
    faceEmblemsToCamera(camera);
    budget.tick(scene);
    pipeline.render();
  };

  const audit = (): LawAudit => {
    // True roll: the camera's local X (right) axis must stay level — its
    // world Y component is the sine of the roll angle. (Euler rotation.z is
    // not a roll measure: yaw+pitch leak into it under XYZ order.)
    const elements = camera.matrixWorld.elements;
    const rightY = elements[1] ?? 0;
    const cameraRoll = Math.asin(Math.min(1, Math.max(-1, rightY)));
    return {
      bannedFlagsEnabled: Object.entries(RENDERER_LAW_DEFAULTS)
        .filter(([, value]) => value)
        .map(([key]) => key),
      unregisteredLights: [...auditSceneLights(scene)],
      unboundMaterials: [...auditRegisterMaterials(scene)],
      sceneFogPresent: scene.fog !== null,
      cameraFov: camera.fov,
      cameraRoll,
      reversedDepth: options.reversedDepth,
    };
  };

  window.__registerArtgate = {
    renderFrame,
    capture: async () => {
      syncEmblemUniforms();
      faceEmblemsToCamera(camera);
      budget.tick(scene);
      const pixels = await pipeline.capture(captureTarget);
      const stats = analyzeFrame(pixels, config.captureWidth, config.captureHeight, PALETTE_LAW, {
        deltaETolerance: PALETTE_LAW.deltaETolerance,
        minBandPopulation: config.gates.a4MinBandPopulation,
      });
      return {
        meta: {
          backend: options.backend,
          shot: shot.name,
          post: postEnabled,
          silhouette: shot.silhouette,
        },
        stats,
      };
    },
    audit,
    evaluateRows: (captures, audits) => evaluateGate(captures, audits, config),
    budget: () => budget.latest(),
  };

  renderFrame();

  document.body.dataset.scene = "register";
  document.body.dataset.registerShot = String(shotIndex);
  document.body.dataset.post = postEnabled ? "on" : "off";
  document.body.dataset.bootStatus = "ready";
};
