import { describe, expect, it } from "vitest";

import { auditRegisterMaterials } from "../register/materials";
import { createPlacementMarkers } from "./placements";
import type { Placement } from "./types";

describe("world placement markers", () => {
  it("spawns every authored pickup and leaves route markers inert", () => {
    const placements: readonly Placement[] = [
      { id: "item.bread", kind: "item", position: [1, 2, 3] },
      { id: "iiro.00", kind: "iiro_waypoint", position: [4, 5, 6] },
      { id: "item.vial", kind: "item", position: [-1, 0.5, -3] },
    ];

    const markers = createPlacementMarkers(placements);

    expect(markers.root.children.map(({ name }) => name)).toEqual([
      "pickup.item.bread",
      "pickup.item.vial",
    ]);
    expect(markers.root.children.map(({ position }) => position.toArray())).toEqual([
      [1, 2, 3],
      [-1, 0.5, -3],
    ]);
    expect(auditRegisterMaterials(markers.root)).toEqual([]);

    markers.dispose();
    expect(markers.root.children).toEqual([]);
  });
});
