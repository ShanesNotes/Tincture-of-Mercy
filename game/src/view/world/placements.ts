import { Group, Mesh, OctahedronGeometry } from "three";

import { rampMaterial } from "../register/materials";
import { ATLAS } from "../register/patterns";
import type { Placement } from "./types";

/**
 * Minimal graybox pickup instances. Gameplay ownership remains with the
 * placement/meta slices; this assembly only makes every authored item present
 * in the world while deliberately leaving Iiro's wave-three route inert.
 */
export const createPlacementMarkers = (placements: readonly Placement[]) => {
  const root = new Group();
  root.name = "world.pickups";
  const geometry = new OctahedronGeometry(0.18, 0);
  const material = rampMaterial({
    family: "blue",
    cell: ATLAS.SCROLL_FILIGREE,
    uvScale: 2,
    lineStrength: 0.42,
    shadeByPattern: 0.18,
    edges: [0.4],
  });

  for (const placement of placements.filter(({ kind }) => kind === "item")) {
    const marker = new Mesh(geometry, material);
    marker.name = `pickup.${placement.id}`;
    marker.position.fromArray(placement.position);
    marker.updateMatrix();
    marker.matrixAutoUpdate = false;
    root.add(marker);
  }

  let disposed = false;
  return {
    root,
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      root.clear();
      geometry.dispose();
      material.dispose();
    },
  };
};
