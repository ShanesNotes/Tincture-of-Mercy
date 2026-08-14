/**
 * World event stream → VFX event stream (slice s19). The world stream is
 * already globally sequenced, so this is a pure, order-preserving
 * filter-and-translate: no sorting, no state, no clock. The result feeds
 * `applyVfxEvents` directly.
 *
 * Honest defaults, forced by the real sim shapes (nothing here is invented):
 * - `CombatPresenterEvent` carries no world-space impact point and no
 *   screen-space impact direction, so every hit/guard_break/death is emitted
 *   with `contact [0, 0, 0]` and `direction [0, 0]`. The caller owns actor
 *   transforms and the camera basis and may enrich both before applying; a
 *   `[0, 0]` direction anchors the margin bloom north (`directionToAnchor`).
 * - Nothing in the combat stream marks a critical, so `critical` is never set.
 * - There is no riposte presenter event — `guard_break` carries only the
 *   `riposteUntilClock` window, which is an opening, not a landed riposte — so
 *   `VfxRiposteEvent` is never produced from a world stream.
 * - `hitstopTicks` is read from a `hitstop` combat event for the same target on
 *   the same tick when the stream carries one, else 0. s11 now emits that
 *   presenter event on every confirmed hit, so a live stream carries the real
 *   freeze; the 0 stays as the honest floor for a stream that does not, and
 *   `classifyHitstop` rejects a 0t freeze (the TUNING_V0 table is closed). The
 *   table is not duplicated here.
 * - `wither-pulse-applied` carries no duration, so `durationTicks` is omitted
 *   and the controller's authored default applies.
 * - Meta events carry no actor of their own; the actor comes from the world
 *   event envelope, which is the player for every meta seed.
 */

import type { CombatPresenterEvent } from "../../sim/combat";
import type { WorldEvent, WorldEventPayload } from "../../sim/world/types";
import type { Vec2, Vec3Tuple, VfxEvent } from "./types";

/**
 * Everything the sim event stream cannot carry, supplied by the caller that
 * owns actor transforms, the camera basis, and the frame-data table.
 *
 * `hitstopTicks` in particular is not optional dressing: `classifyHitstop`
 * rejects a 0t freeze because the TUNING_V0 table is closed, so a live stream
 * must be enriched before it reaches `applyVfxEvents`. A class that maps to no
 * freeze (an unauthored or non-damaging row) returns 0 and the event is
 * dropped rather than crashing the frame.
 */
export interface VfxWorldContext {
  readonly hitstopTicksFor: (payload: CombatPresenterEvent) => number;
  readonly contactFor: (actorId: string) => Vec3Tuple;
  readonly directionFor: (actorId: string) => Vec2;
}

/** No world-space contact in the sim event; the caller may enrich. */
const ORIGIN: Vec3Tuple = [0, 0, 0];

/** No screen-space impact direction in the sim event; the caller may enrich. */
const NO_DIRECTION: Vec2 = [0, 0];

/**
 * TUNING_V0 "25 Wither in 6m": the Warden's quiet is the authored full-density
 * pulse and `wither-pulse-applied` carries only the amount applied — no
 * ceiling — so the normalizing divisor has to be named here.
 */
const QUIET_WITHER_AMOUNT = 25;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const hitstopKey = (tick: number, targetId: string): string => `${tick}|${targetId}`;

/**
 * `sequence` is carried by every `CombatPresenterEvent` and by no other world
 * payload, so it discriminates combat from the `WorldAiEvent` rows that also
 * key on `kind`.
 */
const isCombatEvent = (payload: WorldEventPayload): payload is CombatPresenterEvent =>
  "sequence" in payload;

const indexHitstop = (events: readonly WorldEvent[]): ReadonlyMap<string, number> => {
  const freezes = new Map<string, number>();
  for (const event of events) {
    const payload = event.payload;
    if (isCombatEvent(payload) && payload.kind === "hitstop") {
      freezes.set(hitstopKey(payload.tick, payload.targetId), payload.durationTicks);
    }
  }
  return freezes;
};

/**
 * Translate one world stream into the VFX events it licenses, in input order.
 *
 * Without a {@link VfxWorldContext} the impact rows carry the honest defaults
 * documented above and are safe only for tests. A live stream must pass one:
 * the freeze it supplies is what keeps `classifyHitstop` from throwing.
 */
export const vfxEventsFromWorld = (
  events: readonly WorldEvent[],
  context?: VfxWorldContext,
): readonly VfxEvent[] => {
  const freezes = indexHitstop(events);
  const mapped: VfxEvent[] = [];
  const freezeFor = (payload: CombatPresenterEvent, targetId: string, tick: number): number =>
    context?.hitstopTicksFor(payload) ?? freezes.get(hitstopKey(tick, targetId)) ?? 0;
  const contactFor = (actorId: string): Vec3Tuple => context?.contactFor(actorId) ?? ORIGIN;
  const directionFor = (actorId: string): Vec2 => context?.directionFor(actorId) ?? NO_DIRECTION;

  for (const event of events) {
    const payload = event.payload;

    if (isCombatEvent(payload)) {
      switch (payload.kind) {
        case "damage":
        case "guard_break":
        case "death": {
          const hitstopTicks = freezeFor(payload, payload.targetId, event.tick);
          // A row with no authored freeze has no bloom class to spawn into.
          if (context !== undefined && hitstopTicks <= 0) break;
          mapped.push({
            kind: payload.kind === "damage" ? "hit" : payload.kind,
            tick: event.tick,
            targetId: payload.targetId,
            hitstopTicks,
            direction: directionFor(payload.targetId),
            contact: contactFor(payload.targetId),
          });
          break;
        }
        default: {
          // action_started / action_ended / hitstop / stagger light nothing.
          break;
        }
      }
      continue;
    }

    if (!("type" in payload)) {
      // WorldAiEvent — diagnostics only, never a VFX row.
      continue;
    }

    switch (payload.type) {
      case "dose-used": {
        mapped.push({ kind: "flask", tick: event.tick, actorId: event.actorId ?? "" });
        break;
      }
      case "ember-used": {
        mapped.push({ kind: "ember", tick: event.tick, actorId: event.actorId ?? "" });
        break;
      }
      case "wither-pulse-applied": {
        mapped.push({
          kind: "wither",
          tick: event.tick,
          density: clamp01(payload.witherAmount / QUIET_WITHER_AMOUNT),
        });
        break;
      }
      case "snare-contact": {
        if (payload.chime) {
          mapped.push({ kind: "tag_chime", tick: event.tick, contact: contactFor(payload.actorId) });
        }
        break;
      }
      default: {
        break;
      }
    }
  }

  return mapped;
};
