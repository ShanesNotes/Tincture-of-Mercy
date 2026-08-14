/**
 * VFX world-space node builders (three.js side of slice s27). Every effect
 * mesh is authored flat line-work on camera-facing quads — 2–3 authored ink
 * strokes, never particle spray (AD9); hard-stepped masks only (L3); gold
 * appears only as the riposte/guard-break flash and the registered emblem
 * glints (L9, slice deliverable 2). Materials carry register userData so the
 * budget monitor and the material audit can see them.
 */

import {
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  PointLight,
  BoxGeometry,
} from "three/webgpu";
import {
  abs,
  atan,
  color,
  dot,
  float,
  max,
  mix,
  sin,
  step,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";

import { PALETTE_LAW, tokenHex } from "../register/palette";
import type { FloatNode, Vec3Node } from "../register/patterns";
import { rampMaterial, type RegisterUserData } from "../register/materials";
import { ATLAS } from "../register/patterns";
import type { VfxEmblemRegistry } from "./emblem";
import type { VfxParams } from "./params";

const floatUniform = () => uniform(0);

/** A shared float uniform (fade stops, the Ember desat level). */
export type FloatUniform = ReturnType<typeof floatUniform>;

const tagMaterial = (
  material: MeshBasicNodeMaterial,
  family: RegisterUserData["family"],
  emblem = false,
): MeshBasicNodeMaterial => {
  const userData: RegisterUserData = { register: true, family, cell: -1, emblem };
  material.userData = userData;
  return material;
};

// ---------------------------------------------------------------------------
// Ink-stroke hit flashes (deliverable 2) — 3 authored variants
// ---------------------------------------------------------------------------

/**
 * Procedural stroke mask, one per authored variant (hatch family line-work):
 * 0 = slash (a cut with a short parallel nick), 1 = cross (two crossed
 * strokes), 2 = blot (an irregular ink splat). All hard steps (L3).
 */
const strokeMask = (variant: number): FloatNode => {
  const p = uv().sub(0.5).mul(2).toVar();
  const r = p.length().toVar();
  if (variant === 1) {
    const d1 = p.x.add(p.y).mul(0.7071).toVar();
    const d2 = p.x.sub(p.y).mul(0.7071).toVar();
    const a = step(abs(d1), 0.1).mul(step(abs(d2), 0.6));
    const b = step(abs(d2), 0.1).mul(step(abs(d1), 0.6));
    return max(a, b).mul(step(r, 0.85));
  }
  if (variant === 2) {
    const theta = atan(p.y, p.x);
    const wobble = sin(theta.mul(5).add(1.3)).mul(0.18).add(0.5);
    const blot = step(r, wobble);
    const fleck = step(p.sub(vec2(0.52, 0.3)).length(), 0.12);
    return max(blot, fleck);
  }
  const d = p.x.add(p.y).mul(0.7071).toVar();
  const cut = step(abs(d), 0.13).mul(step(r, 0.9));
  const nick = step(abs(d.add(0.3)), 0.05).mul(step(r, 0.55));
  return max(cut, nick);
};

export interface StrokeMaterial {
  readonly material: MeshBasicNodeMaterial;
  /** Stepped fade (declared stops only, L3); the scene quantizes per tick. */
  readonly fade: FloatUniform;
}

/**
 * Stroke/flash material. Ink for ordinary hits; gold ONLY for the licensed
 * riposte/guard-break flash (slice deliverable 2 — the earned opening).
 */
export const buildStrokeMaterial = (variant: number, gold: boolean): StrokeMaterial => {
  const mask = strokeMask(variant);
  const fade = uniform(1);
  const material = new MeshBasicNodeMaterial();
  const hex = gold ? tokenHex(PALETTE_LAW, "gold") : tokenHex(PALETTE_LAW, "ink");
  material.colorNode = color(hex);
  material.opacityNode = mask.mul(fade);
  material.transparent = true;
  material.depthWrite = false;
  material.side = DoubleSide;
  tagMaterial(material, gold ? "gold" : "ink");
  return { material, fade };
};

/** A world-space stroke/flash quad at a contact point. */
export const buildStrokeMesh = (
  params: VfxParams,
  variant: number,
  gold: boolean,
): { readonly mesh: Mesh; readonly fade: FloatUniform } => {
  const { material, fade } = buildStrokeMaterial(variant, gold);
  const size = gold ? params.impactStrokes.goldFlashSizeMeters : params.impactStrokes.sizeMeters;
  const mesh = new Mesh(new PlaneGeometry(size, size), material);
  mesh.name = gold ? "vfx-gold-flash" : "vfx-ink-stroke";
  return { mesh, fade };
};

// ---------------------------------------------------------------------------
// Wither motes (deliverable 3, EN14) — sparse ink motes, never green fog
// ---------------------------------------------------------------------------

export const buildMoteField = (params: VfxParams): InstancedMesh => {
  const material = new MeshBasicNodeMaterial();
  material.colorNode = color(tokenHex(PALETTE_LAW, "ink"));
  tagMaterial(material, "ink");
  const size = params.wither.moteSizeMeters;
  const field = new InstancedMesh(new PlaneGeometry(size, size), material, params.wither.maxMotes);
  field.name = "vfx-wither-motes";
  field.count = 0;
  field.frustumCulled = false;
  return field;
};

// ---------------------------------------------------------------------------
// Snare-ring tag glint (deliverable 5) — tin/parchment flash, never gold
// ---------------------------------------------------------------------------

export const buildTagGlintMesh = (params: VfxParams): { readonly mesh: Mesh; readonly fade: FloatUniform } => {
  const fade = uniform(0);
  const material = new MeshBasicNodeMaterial();
  material.colorNode = color(tokenHex(PALETTE_LAW, "parchment"));
  const p = uv().sub(0.5).mul(2).toVar();
  // A tiny four-point tin sparkle: thin vertical + horizontal flash.
  const sparkle = max(
    step(abs(p.x), 0.12).mul(step(abs(p.y), 0.9)),
    step(abs(p.y), 0.12).mul(step(abs(p.x), 0.9)),
  );
  material.opacityNode = sparkle.mul(fade);
  material.transparent = true;
  material.depthWrite = false;
  material.side = DoubleSide;
  tagMaterial(material, "parchment");
  const size = params.tagChime.glintSizeMeters;
  const mesh = new Mesh(new PlaneGeometry(size, size), material);
  mesh.name = "vfx-tag-glint";
  return { mesh, fade };
};

// ---------------------------------------------------------------------------
// Named flat-carrier disk (oxblood vial fill) — emblem grammar, PA10
// ---------------------------------------------------------------------------

const flatTokenDiskMaterial = (hex: string, family: RegisterUserData["family"]): MeshBasicNodeMaterial => {
  const material = new MeshBasicNodeMaterial();
  const p = uv().sub(0.5).mul(2).toVar();
  const r = p.length().toVar();
  const disk = step(r, 0.7);
  const pinRing = step(float(0.7), r).mul(step(r, 0.8));
  material.colorNode = disk
    .mul(color(hex))
    .add(pinRing.mul(color(tokenHex(PALETTE_LAW, "ink"))));
  material.opacityNode = disk.add(pinRing);
  material.transparent = true;
  material.depthWrite = false;
  material.side = DoubleSide;
  tagMaterial(material, family);
  return material;
};

/** Flat gold emblem disk for a pulsing emitter (the L4 visible source). */
const goldEmblemDisk = (size: number): Mesh => {
  const material = new MeshBasicNodeMaterial();
  const p = uv().sub(0.5).mul(2).toVar();
  const r = p.length().toVar();
  const disk = step(r, 0.58);
  const pinRing = step(float(0.58), r).mul(step(r, 0.66));
  material.colorNode = disk
    .mul(color(tokenHex(PALETTE_LAW, "gold")))
    .add(pinRing.mul(color(tokenHex(PALETTE_LAW, "ink"))));
  material.opacityNode = disk.add(pinRing);
  material.transparent = true;
  material.depthWrite = false;
  material.side = DoubleSide;
  tagMaterial(material, "gold", true);
  const mesh = new Mesh(new PlaneGeometry(size, size), material);
  mesh.userData.emblemVisual = true;
  return mesh;
};

/**
 * The vial prop (PR6): oxblood-family glass on a stand, its jewel glint a
 * registered emblem light with the slice-licensed verb `mercy` (KA4: the
 * vial's warm accent is runtime emblem light only — never painted, so the
 * light idles at 0 until the drink pulse drives it).
 */
export const buildVialProp = (
  registry: VfxEmblemRegistry,
  lightRange: number,
): Group => {
  const group = new Group();
  group.name = "vfx-vial";

  const stand = new Mesh(
    new BoxGeometry(0.3, 0.5, 0.3),
    rampMaterial({
      family: "muted",
      cell: ATLAS.WOODGRAIN,
      uvScale: 2,
      lineStrength: 0.4,
      shadeByPattern: 0.2,
      edges: [0.45],
    }),
  );
  stand.position.y = 0.25;
  group.add(stand);

  const body = new Mesh(
    new CylinderGeometry(0.05, 0.07, 0.22, 8),
    rampMaterial({
      family: "blue",
      cell: ATLAS.GRANITE,
      uvScale: 1,
      lineStrength: 0.3,
      shadeByPattern: 0.15,
      edges: [0.4],
    }),
  );
  body.name = "vial-glass";
  body.position.y = 0.65;
  group.add(body);

  // The fill line (PR6: material memory) — the oxblood disk stamp inside.
  const fill = new Mesh(
    new PlaneGeometry(0.09, 0.09),
    flatTokenDiskMaterial(tokenHex(PALETTE_LAW, "oxblood"), "oxblood"),
  );
  fill.name = "vial-fill";
  fill.position.set(0, 0.62, 0.06);
  group.add(fill);

  const glint = goldEmblemDisk(0.16);
  glint.name = "vial-glint";
  glint.position.set(0, 0.78, 0.06);
  group.add(glint);

  const light = new PointLight(new Color(tokenHex(PALETTE_LAW, "gold")), 0, lightRange, 0);
  light.name = "vial-mercy-light";
  light.position.set(0, 0.78, 0.1);
  group.add(light);

  registry.register("vial", "mercy", group);
  return group;
};

/**
 * The Ember (PR8: pouch slot 16, runtime emblem light, never painted): a
 * small dull stone whose gold glint idles dark until Ember use pulses it.
 */
export const buildEmberProp = (
  registry: VfxEmblemRegistry,
  lightRange: number,
): Group => {
  const group = new Group();
  group.name = "vfx-ember";

  const stone = new Mesh(
    new BoxGeometry(0.12, 0.1, 0.1),
    rampMaterial({
      family: "muted",
      cell: ATLAS.GRANITE,
      uvScale: 1,
      lineStrength: 0.4,
      shadeByPattern: 0.2,
      edges: [0.4],
    }),
  );
  stone.position.y = 0.55;
  group.add(stone);

  const glint = goldEmblemDisk(0.14);
  glint.name = "ember-glint";
  glint.position.set(0, 0.66, 0.05);
  group.add(glint);

  const light = new PointLight(new Color(tokenHex(PALETTE_LAW, "gold")), 0, lightRange, 0);
  light.name = "ember-mercy-light";
  light.position.set(0, 0.66, 0.08);
  group.add(light);

  registry.register("ember", "mercy", group);
  return group;
};

// ---------------------------------------------------------------------------
// Ember desaturation sweep (deliverable 4) — gold-to-grey, stepped, then gone
// ---------------------------------------------------------------------------

export const createDesatUniform = (): FloatUniform => floatUniform();

/**
 * Wrap a register material so the Ember sweep can step it toward grey. The
 * desat amount is a uniform quantized to declared stops by the scene (L3);
 * at 0 the material is byte-identical to the unwrapped register binding.
 */
export const wrapDesaturatable = (
  material: MeshBasicNodeMaterial,
  desat: FloatNode,
): MeshBasicNodeMaterial => {
  const base = material.colorNode;
  if (base === undefined || base === null) {
    return material;
  }
  const baseColor = base as Vec3Node;
  const luma = dot(baseColor, vec3(0.2126, 0.7152, 0.0722));
  material.colorNode = mix(baseColor, vec3(luma, luma, luma), desat);
  return material;
};
