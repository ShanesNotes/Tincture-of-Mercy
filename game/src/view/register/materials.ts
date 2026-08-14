/**
 * Register materials (L2/L3/L6): `rampMaterial` binds a palette family ramp
 * (declared stops, selected never blended) to a procedural placeholder
 * atlas cell. Lighting from the emblem registry only selects the ramp stop
 * — light color is never multiplied into albedo, so surfaces stay exactly
 * on declared colors (L2 covenant; plates read as flat local color +
 * iconic light, not modeled light).
 *
 * The build-time material audit law (D4/PA15): imported materials never
 * survive. `stripToRegister` rebinds every mesh of an imported asset to
 * register materials; `auditRegisterMaterials` fails the gate on any
 * material without a register binding.
 */

import { Mesh, MeshBasicNodeMaterial, Sprite, type Material, type Object3D } from "three/webgpu";
import {
  color,
  dot,
  float,
  max,
  mix,
  normalWorld,
  normalize,
  oneMinus,
  positionWorld,
  saturate,
  step,
  uv,
} from "three/tsl";

import { REGISTER_CONFIG } from "./config";
import { emblemLightSlots } from "./lights";
import { familyStops, PALETTE_LAW, tokenHex } from "./palette";
import { patternCell, type AtlasCell } from "./patterns";
import type { FloatNode, Vec3Node } from "./patterns";

export interface RampBinding {
  /** Palette family name (must exist in palette.json). */
  readonly family: string;
  /** Atlas cell index (PA12); placeholder cells are procedural. */
  readonly cell: AtlasCell;
  /** UV tiles per UV unit — the PA13 texel-density lock for the surface. */
  readonly uvScale: number;
  /** Ink-line overlay strength 0..1 (atlas binding "line token"). */
  readonly lineStrength: number;
  /** PA14: how far pattern grain pulls the stop selector toward shadow. */
  readonly shadeByPattern: number;
  /** Stop selector edges, dark→lit; defaults to an even spread. */
  readonly edges?: readonly number[];
  /** Line token hex override (defaults to the ink token). */
  readonly lineToken?: string;
}

export interface RegisterUserData {
  readonly register: true;
  readonly family: string;
  readonly cell: number;
  readonly emblem?: boolean;
}

const linearRamp = (hexes: readonly string[]): Vec3Node[] =>
  hexes.map((hex) => color(hex).rgb);

/**
 * 2–3 stop stepped shading (L3). `selector` is quantized by the declared
 * edges; the result is exactly one of the family's declared ramp stops.
 */
const steppedColor = (
  stopNodes: readonly Vec3Node[],
  selector: FloatNode,
  edges: readonly number[],
): Vec3Node => {
  const first = stopNodes[0];
  if (first === undefined) {
    throw new Error("Ramp requires at least one stop.");
  }
  let result: Vec3Node = first;
  stopNodes.forEach((stopNode, index) => {
    if (index === 0) return;
    const edge = edges[index - 1] ?? index / stopNodes.length;
    result = mix(result, stopNode, step(edge, selector));
  });
  return result;
};

/**
 * Accumulated emblem-light response in [0,1+]: ambient floor (declared in
 * config — no unregistered fill light, L4) plus each registered emblem's
 * distance-attenuated N·L. Achromatic by law: it only drives the stop
 * selector, never tints albedo.
 */
const emblemLightResponse = (): FloatNode => {
  const n = normalize(normalWorld);
  let acc: FloatNode = float(REGISTER_CONFIG.emblems.ambient);
  for (let i = 0; i < emblemLightSlots.cap; i += 1) {
    const position = emblemLightSlots.positions[i];
    const intensity = emblemLightSlots.intensities[i];
    const range = emblemLightSlots.ranges[i];
    if (position === undefined || intensity === undefined || range === undefined) continue;
    const toLight = position.sub(positionWorld);
    const distance = max(toLight.length(), 0.001);
    const attenuation = saturate(oneMinus(distance.div(range)));
    const ndotl = saturate(dot(n, toLight.div(distance)));
    acc = acc.add(ndotl.mul(attenuation).mul(intensity));
  }
  return acc;
};

/**
 * Build a register ramp material for a palette binding. Band count, edges,
 * line strength and pattern cell are all data-driven (L3, PA12–PA14).
 */
export const rampMaterial = (binding: RampBinding): MeshBasicNodeMaterial => {
  const stops = familyStops(PALETTE_LAW, binding.family);
  const family = PALETTE_LAW.families.find((f) => f.name === binding.family);
  if (family === undefined) {
    throw new Error(`Unknown palette family: ${binding.family}`);
  }
  const material = new MeshBasicNodeMaterial();
  const userData: RegisterUserData = {
    register: true,
    family: binding.family,
    cell: binding.cell,
  };
  material.userData = userData;

  const field = patternCell(binding.cell, uv().mul(binding.uvScale));
  const lineColor = color(binding.lineToken ?? tokenHex(PALETTE_LAW, "ink")).rgb;

  if (family.flatCarrier) {
    // Named flat carriers (PA10): the token, cut by the pattern stamp.
    const stop = stops[0];
    if (stop === undefined) throw new Error(`Family ${binding.family} declares no stops.`);
    material.colorNode = color(stop);
    material.opacityNode = step(0.5, field.grain);
    material.transparent = false;
    material.alphaTest = 0.5;
    return material;
  }

  const response = emblemLightResponse();
  const selector = saturate(response.sub(field.grain.mul(binding.shadeByPattern)));
  const base = steppedColor(linearRamp(stops), selector, binding.edges ?? []);
  material.colorNode = mix(base, lineColor, field.line.mul(binding.lineStrength));
  return material;
};

/**
 * D4 material audit: rebind every mesh of an imported subtree to register
 * materials. Imported materials never survive. Returns the rebound count.
 */
export const stripToRegister = (
  root: Object3D,
  resolve: (mesh: Mesh) => RampBinding,
): number => {
  let rebound = 0;
  root.traverse((child) => {
    if ((child as Mesh).isMesh === true) {
      const mesh = child as Mesh;
      mesh.material = rampMaterial(resolve(mesh));
      rebound += 1;
    }
  });
  return rebound;
};

const materialBinding = (material: Material | Material[]): RegisterUserData | null => {
  const first = Array.isArray(material) ? material[0] : material;
  if (first === undefined) return null;
  const data = first.userData as Partial<RegisterUserData>;
  return data.register === true ? (data as RegisterUserData) : null;
};

type Renderable = Mesh | Sprite;

const asRenderable = (child: Object3D): Renderable | null => {
  if ((child as Mesh).isMesh === true) return child as Mesh;
  if ((child as Sprite).isSprite === true) return child as Sprite;
  return null;
};

/**
 * PA15 gate audit: every rendered material must resolve to a register
 * binding. Returns violation descriptions (empty = clean).
 */
export const auditRegisterMaterials = (root: Object3D): readonly string[] => {
  const violations: string[] = [];
  root.traverse((child) => {
    const renderable = asRenderable(child);
    if (renderable !== null && materialBinding(renderable.material) === null) {
      violations.push(renderable.name !== "" ? renderable.name : renderable.type);
    }
  });
  return violations;
};
