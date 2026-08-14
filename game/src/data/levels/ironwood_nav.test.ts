import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { compileWalkGraph, findPath } from "../../sim/ai/nav";
import type { WalkGraphData } from "../../sim/ai/types";

const here = dirname(fileURLToPath(import.meta.url));

type IronwoodEdge = WalkGraphData["edges"][number] & {
  readonly conditional?: boolean;
};

type IronwoodGraph = Omit<WalkGraphData, "edges"> & {
  readonly edges: readonly IronwoodEdge[];
};

const raw = JSON.parse(readFileSync(join(here, "ironwood_nav.json"), "utf8")) as IronwoodGraph;

describe("ironwood walk graph", () => {
  it("loads in the s14 compiler", () => {
    const graph = compileWalkGraph(raw);
    expect(graph.nodes.has("cabin")).toBe(true);
    expect(graph.nodes.has("yard")).toBe(true);
    expect(graph.nodes.has("forest")).toBe(true);
    expect(graph.nodes.has("arena")).toBe(true);
  });

  it("reaches cabin → yard → forest → arena", () => {
    const graph = compileWalkGraph(raw);
    expect(findPath(graph, "cabin", "yard")).not.toBeNull();
    expect(findPath(graph, "yard", "forest")).not.toBeNull();
    expect(findPath(graph, "forest", "arena")).not.toBeNull();
    const full = findPath(graph, "cabin", "arena");
    expect(full).not.toBeNull();
    expect(full?.[0]).toBe("cabin");
    expect(full?.[full.length - 1]).toBe("arena");
  });

  it("drop link is one-way", () => {
    expect(raw.offMeshLinks).toEqual([{ from: "drop_top", to: "drop_bottom", kind: "drop" }]);
    const graph = compileWalkGraph(raw);
    const down = graph.adj.get("drop_top") ?? [];
    const up = graph.adj.get("drop_bottom") ?? [];
    expect(down.some((n) => n.id === "drop_bottom" && n.drop)).toBe(true);
    expect(up.some((n) => n.id === "drop_top")).toBe(false);
  });

  it("gate edge is flagged conditional", () => {
    const gates = raw.edges.filter((edge) => edge.conditional === true);
    expect(gates.length).toBeGreaterThan(0);
    expect(gates.some((edge) => edge.from === "gate_a" && edge.to === "gate_b")).toBe(true);
    const graph = compileWalkGraph(raw);
    expect(graph.nodes.has("gate_a")).toBe(true);
    expect(graph.nodes.has("gate_b")).toBe(true);
  });
});
