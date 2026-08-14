/**
 * The mercy loop's typed event stream. Added additively for the presenter/HUD —
 * `src/sim/presenter.ts` is untouched (slice contract deliverable 8). Every mutator
 * returns its events alongside the new state; nothing is buffered inside the state,
 * so replays stay byte-stable.
 */

import type { MercyStats, MetaState, TinctureVariantId, WorldPosition } from "./types";

export type MetaEvent =
  | {
      readonly type: "dose-used";
      readonly tick: number;
      readonly variant: TinctureVariantId;
      readonly dosesLeft: number;
      readonly healedPulse: number;
    }
  | {
      readonly type: "ember-used";
      readonly tick: number;
      readonly dosesLeft: number;
      readonly numbnessStacks: number;
    }
  | {
      readonly type: "numbness-changed";
      readonly tick: number;
      readonly stacks: number;
      readonly textStep: number;
    }
  | {
      readonly type: "names-changed";
      readonly tick: number;
      readonly delta: number;
      readonly carried: number;
      readonly banked: number;
    }
  | { readonly type: "death"; readonly tick: number; readonly position: WorldPosition }
  | {
      readonly type: "page-dropped";
      readonly tick: number;
      readonly names: number;
      readonly position: WorldPosition;
    }
  | { readonly type: "page-recovered"; readonly tick: number; readonly names: number }
  | { readonly type: "page-lost"; readonly tick: number; readonly names: number }
  | {
      readonly type: "hearth-rested";
      readonly tick: number;
      readonly hearthId: string;
      readonly doses: number;
    };

export type MetaEventType = MetaEvent["type"];

/** Result of a state-only mutator. */
export interface MetaResult {
  readonly state: MetaState;
  readonly events: readonly MetaEvent[];
}

/** Result of a mutator that also writes the actor stats DTO. */
export interface MetaStatsResult extends MetaResult {
  readonly stats: MercyStats;
}
