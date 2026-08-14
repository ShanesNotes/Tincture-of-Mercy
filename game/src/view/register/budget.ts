/**
 * Gold/red budget instrumentation (L8/L9): per-frame counters over the
 * scene graph, approximated via material tagging — every register material
 * carries its palette family in userData (see materials.ts), so the monitor
 * counts tagged meshes and triangles per budgeted family each rendered
 * frame. The art gate cross-checks these against measured pixel coverage
 * (analysis.ts gold/oxblood hue masks).
 */

import { Mesh, Sprite, type Object3D } from "three/webgpu";

import type { RegisterUserData } from "./materials";

export interface FamilyBudget {
  /** Tagged meshes in the graph this frame. */
  readonly meshes: number;
  /** Approximate rendered triangle load carried by the family. */
  readonly triangles: number;
}

export interface BudgetSnapshot {
  readonly frame: number;
  readonly gold: FamilyBudget;
  readonly red: FamilyBudget;
}

export interface BudgetMonitor {
  /** Re-sample the scene graph; call once per rendered frame. */
  readonly tick: (root: Object3D) => BudgetSnapshot;
  readonly latest: () => BudgetSnapshot;
}

const meshTriangles = (mesh: Mesh): number => {
  const geometry = mesh.geometry;
  const index = geometry.index;
  if (index !== null) return Math.floor(index.count / 3);
  const position = geometry.getAttribute("position");
  return position === undefined ? 0 : Math.floor(position.count / 3);
};

export const createBudgetMonitor = (): BudgetMonitor => {
  let frame = 0;
  let latest: BudgetSnapshot = { frame: 0, gold: { meshes: 0, triangles: 0 }, red: { meshes: 0, triangles: 0 } };

  const tick = (root: Object3D): BudgetSnapshot => {
    frame += 1;
    let goldMeshes = 0;
    let goldTriangles = 0;
    let redMeshes = 0;
    let redTriangles = 0;
    root.traverse((child) => {
      const isMesh = (child as Mesh).isMesh === true;
      const isSprite = (child as Sprite).isSprite === true;
      if (!isMesh && !isSprite) return;
      const renderable = child as Mesh | Sprite;
      const material = Array.isArray(renderable.material)
        ? renderable.material[0]
        : renderable.material;
      if (material === undefined) return;
      const data = material.userData as Partial<RegisterUserData>;
      if (data.register !== true) return;
      const triangles = isMesh ? meshTriangles(child as Mesh) : 2;
      if (data.family === "gold") {
        goldMeshes += 1;
        goldTriangles += triangles;
      } else if (data.family === "oxblood") {
        redMeshes += 1;
        redTriangles += triangles;
      }
    });
    latest = {
      frame,
      gold: { meshes: goldMeshes, triangles: goldTriangles },
      red: { meshes: redMeshes, triangles: redTriangles },
    };
    return latest;
  };

  return { tick, latest: () => latest };
};
