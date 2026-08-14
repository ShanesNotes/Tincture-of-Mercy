import { blockedEdgeKey, compareId, distXz, hypot2, yawToward } from "./math";
import type { WolfAiParams } from "./params";
import { circleRadiusForTier } from "./roles";
import type {
  CompiledWalkGraph,
  CrowdFailure,
  Vec3,
  WalkGraphData,
  WalkNeighbor,
  WalkNode,
  WolfActorState,
  WolfRole,
} from "./types";

export const compileWalkGraph = (data: WalkGraphData): CompiledWalkGraph => {
  const nodes = new Map<string, WalkNode>();
  for (const node of data.nodes) {
    if (nodes.has(node.id)) {
      throw new Error(`walk graph: duplicate node id ${node.id}`);
    }
    nodes.set(node.id, node);
  }

  const buckets = new Map<string, WalkNeighbor[]>();
  const ensure = (id: string): WalkNeighbor[] => {
    const existing = buckets.get(id);
    if (existing !== undefined) {
      return existing;
    }
    const created: WalkNeighbor[] = [];
    buckets.set(id, created);
    return created;
  };

  const add = (from: string, to: string, drop: boolean): void => {
    const a = nodes.get(from);
    const b = nodes.get(to);
    if (a === undefined || b === undefined) {
      throw new Error(`walk graph: edge ${from}->${to} references a missing node`);
    }
    const cost = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    ensure(from).push({ id: to, cost, drop });
  };

  for (const edge of data.edges) {
    add(edge.from, edge.to, false);
    if (edge.bidirectional !== false) {
      add(edge.to, edge.from, false);
    }
  }
  for (const link of data.offMeshLinks) {
    if (link.kind !== "drop") {
      throw new Error(`walk graph: unsupported off-mesh kind ${String(link.kind)}`);
    }
    add(link.from, link.to, true);
  }

  const adj = new Map<string, readonly WalkNeighbor[]>();
  for (const node of nodes.keys()) {
    const neighbors = ensure(node);
    neighbors.sort((left, right) => compareId(left.id, right.id));
    adj.set(node, neighbors);
  }

  return { nodes, adj };
};

export const nearestNodeId = (graph: CompiledWalkGraph, point: Vec3): string | null => {
  let best: string | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const node of graph.nodes.values()) {
    const distance = distXz(node, point);
    if (best === null || distance < bestDist || (distance === bestDist && compareId(node.id, best) < 0)) {
      best = node.id;
      bestDist = distance;
    }
  }
  return best;
};

export const findPath = (
  graph: CompiledWalkGraph,
  startId: string,
  goalId: string,
  blocked: ReadonlySet<string> = new Set(),
): readonly string[] | null => {
  if (!graph.nodes.has(startId) || !graph.nodes.has(goalId)) {
    return null;
  }
  if (startId === goalId) {
    return [startId];
  }

  const goal = graph.nodes.get(goalId);
  if (goal === undefined) {
    return null;
  }

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const parent = new Map<string, string>();
  const open = new Set<string>([startId]);
  const closed = new Set<string>();

  gScore.set(startId, 0);
  const startNode = graph.nodes.get(startId);
  fScore.set(
    startId,
    startNode === undefined ? 0 : Math.hypot(goal.x - startNode.x, goal.y - startNode.y, goal.z - startNode.z),
  );

  const popOpen = (): string | null => {
    let best: string | null = null;
    let bestF = Number.POSITIVE_INFINITY;
    for (const id of open) {
      const f = fScore.get(id) ?? Number.POSITIVE_INFINITY;
      if (best === null || f < bestF || (f === bestF && compareId(id, best) < 0)) {
        best = id;
        bestF = f;
      }
    }
    if (best !== null) {
      open.delete(best);
    }
    return best;
  };

  while (open.size > 0) {
    const current = popOpen();
    if (current === null) {
      break;
    }
    if (current === goalId) {
      const path = [current];
      let cursor = current;
      while (parent.has(cursor)) {
        const previous = parent.get(cursor);
        if (previous === undefined) {
          break;
        }
        path.push(previous);
        cursor = previous;
      }
      path.reverse();
      return path;
    }

    closed.add(current);
    const neighbors = graph.adj.get(current) ?? [];
    const currentG = gScore.get(current) ?? Number.POSITIVE_INFINITY;

    for (const neighbor of neighbors) {
      if (closed.has(neighbor.id) || blocked.has(blockedEdgeKey(current, neighbor.id))) {
        continue;
      }
      const tentative = currentG + neighbor.cost;
      const existing = gScore.get(neighbor.id);
      if (existing !== undefined && tentative >= existing) {
        continue;
      }

      parent.set(neighbor.id, current);
      gScore.set(neighbor.id, tentative);
      const node = graph.nodes.get(neighbor.id);
      const heuristic =
        node === undefined ? 0 : Math.hypot(goal.x - node.x, goal.y - node.y, goal.z - node.z);
      fScore.set(neighbor.id, tentative + heuristic);
      open.add(neighbor.id);
    }
  }

  return null;
};

export const pathWaypoint = (
  graph: CompiledWalkGraph,
  path: readonly string[],
  pathIndex: number,
): Vec3 | null => {
  const id = path[pathIndex];
  if (id === undefined) {
    return null;
  }
  return graph.nodes.get(id) ?? null;
};

export const advancePathIndex = (
  wolf: Vec3,
  graph: CompiledWalkGraph,
  path: readonly string[],
  pathIndex: number,
  arrivalRadiusM: number,
): number => {
  let index = pathIndex;
  while (index < path.length) {
    const waypoint = pathWaypoint(graph, path, index);
    if (waypoint === null) {
      break;
    }
    if (distXz(wolf, waypoint) > arrivalRadiusM) {
      break;
    }
    index += 1;
  }
  return index;
};

export interface AvoidanceSample {
  readonly x: number;
  readonly z: number;
}

export const boundedSeparation = (
  wolf: Vec3,
  others: readonly Vec3[],
  params: WolfAiParams,
): AvoidanceSample => {
  let sx = 0;
  let sz = 0;
  for (const other of others) {
    const dx = wolf.x - other.x;
    const dz = wolf.z - other.z;
    const distance = hypot2(dx, dz);
    if (distance <= 0 || distance >= params.nav.avoidanceRadiusM) {
      continue;
    }
    const strength = (params.nav.avoidanceRadiusM - distance) / params.nav.avoidanceRadiusM;
    sx += (dx / distance) * strength;
    sz += (dz / distance) * strength;
  }

  const length = hypot2(sx, sz);
  if (length > params.nav.avoidanceMaxMps && length > 0) {
    return {
      x: (sx / length) * params.nav.avoidanceMaxMps,
      z: (sz / length) * params.nav.avoidanceMaxMps,
    };
  }
  return { x: sx, z: sz };
};

export const seekVelocity = (
  from: Vec3,
  dest: Vec3,
  speedMps: number,
  others: readonly Vec3[],
  params: WolfAiParams,
): { readonly x: number; readonly z: number } => {
  const dx = dest.x - from.x;
  const dz = dest.z - from.z;
  const distance = hypot2(dx, dz);
  const seekX = distance > 0 ? (dx / distance) * speedMps : 0;
  const seekZ = distance > 0 ? (dz / distance) * speedMps : 0;
  const sep = boundedSeparation(from, others, params);
  const vx = seekX + sep.x;
  const vz = seekZ + sep.z;
  const length = hypot2(vx, vz);
  if (length > speedMps && length > 0) {
    return { x: (vx / length) * speedMps, z: (vz / length) * speedMps };
  }
  return { x: vx, z: vz };
};

export interface SlotAssignment {
  readonly slot: number;
  readonly dest: Vec3;
  readonly outerQueue: boolean;
}

const preferredSlot = (role: WolfRole, slotCount: number, targetYaw: number): number => {
  const front = Math.round(((targetYaw % (Math.PI * 2)) + Math.PI * 2) / ((Math.PI * 2) / slotCount)) % slotCount;
  if (role === "lunger") {
    return front;
  }
  if (role === "harrier") {
    return (front + Math.floor(slotCount / 2)) % slotCount;
  }
  return (front + Math.floor(slotCount / 4)) % slotCount;
};

export const assignPackSlots = (
  wolves: readonly WolfActorState[],
  target: Vec3 & { readonly yaw: number },
  claimed: ReadonlySet<number>,
  params: WolfAiParams,
  aggressionTier: number,
): ReadonlyMap<string, SlotAssignment> => {
  const living = wolves.filter((wolf) => wolf.alive && wolf.mode === "engage");
  const slotCount = Math.max(1, living.length);
  const taken = new Set(claimed);
  const result = new Map<string, SlotAssignment>();
  const radius = Math.min(params.nav.slotInnerRadiusM, circleRadiusForTier(params, aggressionTier));

  const ordered = [...living].sort((left, right) => compareId(left.id, right.id));
  for (const wolf of ordered) {
    const preferred = preferredSlot(wolf.role, slotCount, target.yaw);
    let slot = preferred;
    let outer = false;
    if (taken.has(preferred)) {
      slot = preferred;
      outer = true;
    } else {
      taken.add(preferred);
    }
    const angle = target.yaw + (slot * Math.PI * 2) / slotCount;
    const ring = outer ? params.nav.slotOuterRadiusM : radius;
    result.set(wolf.id, {
      slot,
      dest: {
        x: target.x + Math.sin(angle) * ring,
        y: target.y,
        z: target.z + Math.cos(angle) * ring,
      },
      outerQueue: outer,
    });
  }
  return result;
};

export const roleDestination = (
  wolf: WolfActorState,
  target: Vec3,
  home: Vec3,
  slot: SlotAssignment | undefined,
  params: WolfAiParams,
  aggressionTier: number,
  tick: number,
): Vec3 => {
  if (wolf.mode === "flee" || wolf.mode === "leash_reset" || wolf.mode === "return") {
    return home;
  }
  if (wolf.mode === "loiter") {
    const angle = tick * params.nav.loiterStepRadPerTick * wolf.circleSign;
    return {
      x: wolf.x + Math.sin(angle) * params.nav.loiterRadiusM,
      y: wolf.y,
      z: wolf.z + Math.cos(angle) * params.nav.loiterRadiusM,
    };
  }

  if (wolf.role === "baiter") {
    const radius = circleRadiusForTier(params, aggressionTier);
    const inward =
      tick < wolf.feintReadyTick
        ? params.roles.feintInwardRadiusM
        : radius;
    const current = yawToward(target, wolf);
    const angle = current + params.roles.circleStepRadPerTick * wolf.circleSign;
    return {
      x: target.x + Math.sin(angle) * inward,
      y: target.y,
      z: target.z + Math.cos(angle) * inward,
    };
  }

  if (slot !== undefined) {
    return slot.dest;
  }

  const fallbackRadius =
    wolf.role === "harrier" ? params.roles.harrierFlankRadiusM : params.roles.lungeCommitRadiusM;
  const heading = yawToward(target, wolf);
  return {
    x: target.x + Math.sin(heading) * fallbackRadius,
    y: target.y,
    z: target.z + Math.cos(heading) * fallbackRadius,
  };
};

export const speedFor = (wolf: WolfActorState, params: WolfAiParams): number => {
  if (wolf.mode === "flee" || wolf.mode === "return") {
    return params.speeds.fleeMps;
  }
  if (wolf.mode === "leash_reset") {
    return params.speeds.approachMps;
  }
  if (wolf.mode === "loiter" || wolf.mode === "idle") {
    return params.speeds.loiterMps;
  }
  if (wolf.role === "harrier") {
    return params.speeds.harrierMps;
  }
  if (wolf.role === "baiter") {
    return params.speeds.circleMps;
  }
  return wolf.hasToken ? params.speeds.approachMps : params.speeds.stalkMps;
};

export const planRoute = (
  wolf: WolfActorState,
  dest: Vec3,
  graph: CompiledWalkGraph,
  blocked: ReadonlySet<string>,
  params: WolfAiParams,
): {
  readonly path: readonly string[];
  readonly pathIndex: number;
  readonly failure: CrowdFailure;
} => {
  if (distXz(wolf, dest) <= params.nav.directSeekRadiusM) {
    return { path: wolf.path, pathIndex: wolf.pathIndex, failure: "none" };
  }

  const start = nearestNodeId(graph, wolf);
  const goal = nearestNodeId(graph, dest);
  if (start === null || goal === null) {
    return { path: [], pathIndex: 0, failure: "unreachable_loiter" };
  }

  const currentWaypoint = pathWaypoint(graph, wolf.path, wolf.pathIndex);
  const nextId = wolf.path[wolf.pathIndex];
  const prevId = wolf.pathIndex > 0 ? wolf.path[wolf.pathIndex - 1] : undefined;
  const nextBlocked =
    prevId !== undefined && nextId !== undefined && blocked.has(blockedEdgeKey(prevId, nextId));

  if (
    wolf.path.length > 0 &&
    !nextBlocked &&
    currentWaypoint !== null &&
    nearestNodeId(graph, dest) === wolf.path[wolf.path.length - 1]
  ) {
    return { path: wolf.path, pathIndex: wolf.pathIndex, failure: "none" };
  }

  const path = findPath(graph, start, goal, blocked);
  if (path === null) {
    return { path: [], pathIndex: 0, failure: "unreachable_loiter" };
  }
  return {
    path,
    pathIndex: 0,
    failure: nextBlocked ? "blocked_replan" : "none",
  };
};
