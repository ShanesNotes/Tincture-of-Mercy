/**
 * Emblem light registry (L4): every light in the frame is a visible diegetic
 * emitter with a named verb, registered here. The registry is the ONLY way
 * lights enter the scene; `auditSceneLights` fails the gate on any
 * unregistered light in the graph.
 *
 * Verbs (ART_BIBLE EN13): candle=`vigil`, hearth=`warm`, lantern=`guide`,
 * moon=`hide`. Emitters render as flat disks / scalloped halos / ray fans —
 * iconic light, never volumetrics, never generic glow (AD9, AD12).
 *
 * The registry also owns the shared uniform slots the ramp materials read,
 * so shading light and visible emblem can never drift apart.
 */

import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  PointLight,
  Vector3,
  type Object3D,
} from "three/webgpu";
import {
  abs,
  atan,
  color,
  float,
  fract,
  length,
  max,
  saturate,
  step,
  uniform,
  uv,
} from "three/tsl";

import { REGISTER_CONFIG } from "./config";

export const EMBLEM_VERBS = ["vigil", "warm", "guide", "hide"] as const;
export type EmblemVerb = (typeof EMBLEM_VERBS)[number];

export type EmblemShape = "disk" | "scallopHalo" | "rayFan";

export interface EmblemRecord {
  readonly name: string;
  readonly verb: EmblemVerb;
  readonly node: Object3D;
  readonly light: PointLight;
  readonly slot: number;
}

const records = new Map<string, EmblemRecord>();
const registeredLights = new Set<PointLight>();

// Shared uniform slots read by rampMaterial. Fixed size = the hard cap, so
// material shaders never recompile when emblems come and go. Exported with
// their inferred uniform-node types so materials can compose them in TSL.
const CAP = REGISTER_CONFIG.emblems.cap;
const slotPositions = Array.from({ length: CAP }, () => uniform(new Vector3()));
const slotColors = Array.from({ length: CAP }, () => uniform(new Color(0, 0, 0)));
const slotIntensities = Array.from({ length: CAP }, () => uniform(0));
const slotRanges = Array.from({ length: CAP }, () => uniform(1));

export const emblemLightSlots = {
  positions: slotPositions,
  colors: slotColors,
  intensities: slotIntensities,
  ranges: slotRanges,
  cap: CAP,
} as const;

const mustSlot = <T>(slots: readonly T[], index: number): T => {
  const slot = slots[index];
  if (slot === undefined) {
    throw new Error(`Emblem slot ${index} out of range (cap ${CAP}).`);
  }
  return slot;
};

/**
 * Register an emblem light. `node` must contain exactly one PointLight —
 * the light and its visible emitter travel together (L4: no invisible
 * lights, no lightless emitters). Throws on duplicate names, unknown verbs,
 * cap overflow, or malformed nodes.
 */
export const registerEmblem = (
  name: string,
  verb: EmblemVerb,
  node: Object3D,
): EmblemRecord => {
  if (!EMBLEM_VERBS.includes(verb)) {
    throw new Error(
      `Emblem "${name}": unknown verb "${verb}" (L4 verbs: ${EMBLEM_VERBS.join(", ")}).`,
    );
  }
  if (records.has(name)) {
    throw new Error(`Emblem "${name}" is already registered.`);
  }
  if (records.size >= CAP) {
    throw new Error(`Emblem light cap ${CAP} exceeded (L4 registry discipline).`);
  }
  const lights: PointLight[] = [];
  node.traverse((child) => {
    if ((child as PointLight).isPointLight === true) {
      lights.push(child as PointLight);
    }
  });
  if (lights.length !== 1) {
    throw new Error(
      `Emblem "${name}": node must contain exactly one PointLight, found ${lights.length}.`,
    );
  }
  const light = lights[0];
  if (light === undefined) {
    throw new Error(`Emblem "${name}": missing light.`);
  }
  const slot = records.size;
  const record: EmblemRecord = { name, verb, node, light, slot };
  records.set(name, record);
  registeredLights.add(light);
  light.userData.registeredEmblem = name;

  // Bind the shared shading slots to this emblem's live values.
  mustSlot(slotPositions, slot).value.copy(light.getWorldPosition(new Vector3()));
  mustSlot(slotColors, slot).value.copy(light.color);
  mustSlot(slotIntensities, slot).value = light.intensity;
  mustSlot(slotRanges, slot).value =
    light.distance > 0 ? light.distance : REGISTER_CONFIG.emblems.lightRange;
  return record;
};

/** Per-frame: keep shared uniforms glued to live light transforms. */
export const syncEmblemUniforms = (): void => {
  for (const record of records.values()) {
    mustSlot(slotPositions, record.slot).value.copy(record.light.getWorldPosition(new Vector3()));
    mustSlot(slotIntensities, record.slot).value = record.light.intensity;
  }
};

/**
 * L4 runtime assert: every light in the scene graph must be registered.
 * Returns violation descriptions (empty = clean).
 */
export const auditSceneLights = (scene: Object3D): readonly string[] => {
  const violations: string[] = [];
  scene.traverse((child) => {
    if ((child as { isLight?: boolean }).isLight === true) {
      const light = child as PointLight;
      if (!registeredLights.has(light)) {
        violations.push(light.name !== "" ? light.name : light.type);
      }
    }
  });
  return violations;
};

export const registeredEmblems = (): readonly EmblemRecord[] => [...records.values()];

/**
 * Procedural emblem emitter (L4): a flat shape — disk flame, scalloped
 * halo, or ray fan — in a declared token, on a camera-facing quad (the
 * register's "sprite"). Hard steps only (L3); no glow gradient, no
 * volumetrics (AD9/AD12). The plates' reference is the faced sun/moon disk
 * with ink rays (rapunzel-023).
 */
export const emblemVisualMaterial = (shape: EmblemShape, hexColor: string): MeshBasicNodeMaterial => {
  const p = uv().sub(0.5).mul(2).toVar();
  const r = length(p).toVar();
  const theta = atan(p.y, p.x).toVar();

  // Scalloped halo: ring with a 12-scallop outer edge + flat core disk.
  const scallop = abs(fract(theta.mul(12 / (Math.PI * 2))).sub(0.5)).mul(2);
  const haloOuter = float(0.92).sub(scallop.mul(0.1));
  const haloRing = step(r, haloOuter).mul(step(float(0.55), r));
  const haloCore = step(r, 0.34);

  // Flat disk with an ink pin-ring (the plates' faced-moon grammar).
  const disk = step(r, 0.58);
  const pinRing = step(float(0.58), r).mul(step(r, 0.66));

  // Ray fan: 8 hard rays fanning outward (EN8 hearth ray-fan).
  const raySector = abs(fract(theta.mul(8 / (Math.PI * 2))).sub(0.5)).mul(2);
  const rayWidth = max(float(0.5).sub(r.mul(0.25)), 0.12);
  const rays = step(raySector, rayWidth).mul(step(float(0.3), r)).mul(step(r, 0.95));

  let shapeMask = disk;
  if (shape === "scallopHalo") {
    shapeMask = max(haloRing, haloCore);
  } else if (shape === "rayFan") {
    shapeMask = max(rays, step(r, 0.3));
  }
  const inkMask = shape === "disk" ? pinRing : float(0);

  const material = new MeshBasicNodeMaterial();
  material.colorNode = saturate(shapeMask).mul(color(hexColor)).add(inkMask.mul(color("#211b17")));
  material.opacityNode = saturate(shapeMask.add(inkMask));
  material.transparent = true;
  material.depthWrite = false;
  material.side = DoubleSide;
  material.userData.register = true;
  material.userData.family = "gold";
  material.userData.cell = -1;
  material.userData.emblem = true;
  return material;
};

/** Build a camera-facing emblem visual quad of the given shape and size. */
export const buildEmblemVisual = (shape: EmblemShape, size: number, hexColor: string): Mesh => {
  const visual = new Mesh(new PlaneGeometry(1, 1), emblemVisualMaterial(shape, hexColor));
  visual.scale.set(size, size, 1);
  visual.userData.emblemVisual = true;
  return visual;
};

/** Billboard every registered emblem visual toward the camera (per frame). */
export const faceEmblemsToCamera = (camera: Object3D): void => {
  for (const record of records.values()) {
    record.node.traverse((child) => {
      if (child.userData.emblemVisual === true) {
        child.quaternion.copy(camera.quaternion);
      }
    });
  }
};
