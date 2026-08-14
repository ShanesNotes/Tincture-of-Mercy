import type { WalkGraphData } from "./types";

/** 3×3 grid. Equal-cost paths exist so A* tie-breaks are observable. */
export const gridGraph = (): WalkGraphData => {
  const nodes: WalkGraphData["nodes"][number][] = [];
  const edges: WalkGraphData["edges"][number][] = [];
  for (let z = 0; z <= 2; z += 1) {
    for (let x = 0; x <= 2; x += 1) {
      nodes.push({ id: `n${String(x)}${String(z)}`, x, y: 0, z });
      if (x > 0) {
        edges.push({ from: `n${String(x)}${String(z)}`, to: `n${String(x - 1)}${String(z)}` });
      }
      if (z > 0) {
        edges.push({ from: `n${String(x)}${String(z)}`, to: `n${String(x)}${String(z - 1)}` });
      }
    }
  }
  return { nodes, edges, offMeshLinks: [] };
};

/** Upper ledge a0/a1 only connects to lower b0 via a one-way drop. */
export const dropGraph = (): WalkGraphData => ({
  nodes: [
    { id: "a0", x: 0, y: 3, z: 0 },
    { id: "a1", x: 2, y: 3, z: 0 },
    { id: "b0", x: 2, y: 0, z: 0 },
    { id: "b1", x: 4, y: 0, z: 0 },
  ],
  edges: [
    { from: "a0", to: "a1" },
    { from: "b0", to: "b1" },
  ],
  offMeshLinks: [{ from: "a1", to: "b0", kind: "drop" }],
});

/** Corridor with a bypass. Blocking mid forces a re-plan around. */
export const blockedCorridorGraph = (): WalkGraphData => ({
  nodes: [
    { id: "start", x: 0, y: 0, z: 0 },
    { id: "mid", x: 2, y: 0, z: 0 },
    { id: "end", x: 4, y: 0, z: 0 },
    { id: "alt1", x: 1, y: 0, z: 2 },
    { id: "alt2", x: 3, y: 0, z: 2 },
  ],
  edges: [
    { from: "start", to: "mid" },
    { from: "mid", to: "end" },
    { from: "start", to: "alt1" },
    { from: "alt1", to: "alt2" },
    { from: "alt2", to: "end" },
  ],
  offMeshLinks: [],
});

/** Open plaza used for slot contention (no walls). */
export const plazaGraph = (): WalkGraphData => {
  const nodes: WalkGraphData["nodes"][number][] = [];
  const edges: WalkGraphData["edges"][number][] = [];
  for (let z = -4; z <= 4; z += 2) {
    for (let x = -4; x <= 4; x += 2) {
      const id = `p${String(x)}_${String(z)}`;
      nodes.push({ id, x, y: 0, z });
      if (x > -4) {
        edges.push({ from: id, to: `p${String(x - 2)}_${String(z)}` });
      }
      if (z > -4) {
        edges.push({ from: id, to: `p${String(x)}_${String(z - 2)}` });
      }
    }
  }
  return { nodes, edges, offMeshLinks: [] };
};

/** Two disconnected rooms — the target island is unreachable. */
export const islandGraph = (): WalkGraphData => ({
  nodes: [
    { id: "home", x: 0, y: 0, z: 0 },
    { id: "near", x: 2, y: 0, z: 0 },
    { id: "isle", x: 20, y: 0, z: 0 },
    { id: "isle2", x: 22, y: 0, z: 0 },
  ],
  edges: [
    { from: "home", to: "near" },
    { from: "isle", to: "isle2" },
  ],
  offMeshLinks: [],
});

/** Long hallway for leash-and-reset (home at west, far node beyond 25m). */
export const leashHallGraph = (): WalkGraphData => {
  const nodes: WalkGraphData["nodes"][number][] = [];
  const edges: WalkGraphData["edges"][number][] = [];
  for (let x = 0; x <= 40; x += 5) {
    nodes.push({ id: `h${String(x)}`, x, y: 0, z: 0 });
    if (x > 0) {
      edges.push({ from: `h${String(x)}`, to: `h${String(x - 5)}` });
    }
  }
  return { nodes, edges, offMeshLinks: [] };
};
