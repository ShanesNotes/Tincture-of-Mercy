/**
 * VFX emblem light registry (L4, slice-local). The foundation registry
 * (`view/register/lights.ts`) is read-only to this slice and its verb set is
 * fixed (vigil/warm/guide/hide), so the slice's licensed `mercy` verb — the
 * vial's drink glow and Ember's gold glint, both runtime emblem light by the
 * earned-colors law (KA4/PR8) — gets its own registry here under the same
 * discipline: every light is a visible diegetic emitter with a named verb,
 * the emitter and its light travel in one node, and `auditSceneLights` fails
 * on any unregistered light in the graph.
 *
 * Instance-based (not module-global) so the demo scene cannot pollute the
 * foundation register's state.
 */

import { PointLight, type Object3D } from "three/webgpu";

export const VFX_EMBLEM_VERBS = ["mercy"] as const;
export type VfxEmblemVerb = (typeof VFX_EMBLEM_VERBS)[number];

export interface VfxEmblemRecord {
  readonly name: string;
  readonly verb: VfxEmblemVerb;
  readonly node: Object3D;
  readonly light: PointLight;
}

export interface VfxEmblemRegistry {
  readonly register: (name: string, verb: VfxEmblemVerb, node: Object3D) => VfxEmblemRecord;
  readonly auditSceneLights: (scene: Object3D) => readonly string[];
  readonly records: () => readonly VfxEmblemRecord[];
}

export const createVfxEmblemRegistry = (cap: number): VfxEmblemRegistry => {
  const records = new Map<string, VfxEmblemRecord>();
  const registeredLights = new Set<PointLight>();

  const register = (name: string, verb: VfxEmblemVerb, node: Object3D): VfxEmblemRecord => {
    if (!VFX_EMBLEM_VERBS.includes(verb)) {
      throw new Error(
        `VFX emblem "${name}": unknown verb "${verb}" (licensed: ${VFX_EMBLEM_VERBS.join(", ")}).`,
      );
    }
    if (records.has(name)) {
      throw new Error(`VFX emblem "${name}" is already registered.`);
    }
    if (records.size >= cap) {
      throw new Error(`VFX emblem light cap ${cap} exceeded (L4 registry discipline).`);
    }
    const lights: PointLight[] = [];
    node.traverse((child) => {
      if ((child as PointLight).isPointLight === true) {
        lights.push(child as PointLight);
      }
    });
    if (lights.length !== 1) {
      throw new Error(
        `VFX emblem "${name}": node must contain exactly one PointLight, found ${lights.length}.`,
      );
    }
    const light = lights[0];
    if (light === undefined) {
      throw new Error(`VFX emblem "${name}": missing light.`);
    }
    const record: VfxEmblemRecord = { name, verb, node, light };
    records.set(name, record);
    registeredLights.add(light);
    light.userData.registeredEmblem = name;
    return record;
  };

  const auditSceneLights = (scene: Object3D): readonly string[] => {
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

  return { register, auditSceneLights, records: () => [...records.values()] };
};
