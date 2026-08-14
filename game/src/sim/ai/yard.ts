import { hashWolfAiState } from "./hash";
import { compileWalkGraph } from "./nav";
import type { WolfAiParams } from "./params";
import { applyLocomotion, createWolfAiState, stepWolfAi } from "./pack";
import { ScriptedCombatActions } from "./scripted_combat";
import type {
  AiEvent,
  CompiledWalkGraph,
  LosQuery,
  Vec3,
  WalkGraphData,
  WolfAiState,
} from "./types";

export const YARD_SEED = 0x5140_a100;
export const YARD_DURATION_TICKS = 720;
export const YARD_HOWL_TICK = 240;

/** Open yard with a woodpile chokepoint column at the origin. 2m grid. */
export const yardWalkGraph = (): WalkGraphData => {
  const nodes: WalkGraphData["nodes"][number][] = [];
  const edges: WalkGraphData["edges"][number][] = [];
  for (let z = -8; z <= 8; z += 2) {
    for (let x = -8; x <= 8; x += 2) {
      if (x === 0 && z === 0) {
        continue;
      }
      const id = `y${String(x)}_${String(z)}`;
      nodes.push({ id, x, y: 0, z });
      const west = `y${String(x - 2)}_${String(z)}`;
      const south = `y${String(x)}_${String(z - 2)}`;
      if (x > -8 && !(x - 2 === 0 && z === 0)) {
        edges.push({ from: id, to: west, bidirectional: true });
      }
      if (z > -8 && !(x === 0 && z - 2 === 0)) {
        edges.push({ from: id, to: south, bidirectional: true });
      }
    }
  }
  return { nodes, edges, offMeshLinks: [] };
};

export const clearLos: LosQuery = {
  raycast: () => null,
};

export interface YardRun {
  readonly durationTicks: number;
  readonly events: readonly AiEvent[];
  readonly roleActions: readonly AiEvent[];
  readonly state: WolfAiState;
  readonly stateHash: string;
  readonly tokenGrants: readonly AiEvent[];
}

const dummyAt = (tick: number): Vec3 & { readonly yaw: number } => {
  // Scripted dummy: hold, then sidestep east so token angles change, then hold.
  if (tick < 180) {
    return { x: 0, y: 0, z: 4, yaw: Math.PI };
  }
  if (tick < 360) {
    const t = (tick - 180) / 60;
    return { x: Math.min(3, t * 1.5), y: 0, z: 4, yaw: Math.PI };
  }
  return { x: 3, y: 0, z: 4, yaw: Math.PI };
};

export const runYardScenario = (
  params: WolfAiParams,
  graph: CompiledWalkGraph = compileWalkGraph(yardWalkGraph()),
  durationTicks: number = YARD_DURATION_TICKS,
): YardRun => {
  const combat = new ScriptedCombatActions(params);
  let state = createWolfAiState(
    [
      { id: "wolf-a", x: -3, y: 0, z: -6, yaw: 0 },
      { id: "wolf-b", x: 0, y: 0, z: -7, yaw: 0 },
      { id: "wolf-c", x: 3, y: 0, z: -6, yaw: 0 },
    ],
    { x: 0, y: 0, z: -8 },
    params,
  );

  const dt = 1 / params.tickHz;
  for (let step = 0; step < durationTicks; step += 1) {
    const tick = state.tick + 1;
    const result = stepWolfAi(
      state,
      {
        target: dummyAt(tick),
        howlRequested: tick === YARD_HOWL_TICK,
      },
      { params, los: clearLos, combat, graph },
    );
    state = applyLocomotion(result.state, result.locomotion, dt);
  }

  const tokenGrants = state.events.filter((entry) => entry.kind === "token_grant");
  const roleActions = state.events.filter((entry) => entry.kind === "role_action");
  return {
    durationTicks,
    events: state.events,
    roleActions,
    state,
    stateHash: hashWolfAiState(state),
    tokenGrants,
  };
};


