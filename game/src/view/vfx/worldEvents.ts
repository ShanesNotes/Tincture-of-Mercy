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
 *   the same SIM tick — the payload's own `tick`, not the world envelope's. The
 *   world step stamps envelopes with `nextTick` while combat payloads carry the
 *   pre-step `worldTick`, so the envelope runs one tick ahead on every combat
 *   row; pairing on the envelope tick misses every real freeze (K10). s11 emits
 *   that hitstop event on every confirmed hit, and it is the ONLY freeze source
 *   (DECISIONS: hitstop is sim-owned; the view adds no unowned timing). The
 *   post-step pose re-derivation the live adapter once preferred is gone from
 *   this seam: in a same-tick trade both actors are interrupted by the other's
 *   hit, the re-derived freeze collapses to 0, and both blooms drop (K2). A
 *   damage row with no paired hitstop row keeps the honest 0 floor; with a live
 *   context it is dropped rather than crashing the frame, since
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
 * owns actor transforms and the camera basis.
 *
 * The freeze is NOT among them: the sim's `hitstop` events are the only
 * freeze source (K2 — the post-step pose re-derivation dropped both blooms
 * of a same-tick trade). `hitstopTicksFor` survives only because the world
 * adapter still builds it structurally; this seam never consults it.
 */
export interface VfxWorldContext {
  /**
   * @deprecated Legacy post-step pose re-derivation. Ignored by
   * `vfxEventsFromWorld`; the sim's `hitstop` events are the only freeze
   * source. Retained for the world adapter's structural compatibility.
   */
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
 * The freeze for an impact row is paired from the stream's `hitstop` events on
 * the payload's own sim tick (`payload.tick`) — never the world envelope tick
 * (K10: the envelope runs one tick ahead on a real stream) and never the
 * context's post-step re-derivation (K2: the sim's hitstop events are the only
 * freeze source).
 *
 * Without a {@link VfxWorldContext} the impact rows carry the honest
 * contact/direction defaults documented above and are safe only for tests.
 */
export const vfxEventsFromWorld = (
  events: readonly WorldEvent[],
  context?: VfxWorldContext,
): readonly VfxEvent[] => {
  const freezes = indexHitstop(events);
  const mapped: VfxEvent[] = [];
  const freezeFor = (payload: CombatPresenterEvent, targetId: string): number =>
    freezes.get(hitstopKey(payload.tick, targetId)) ?? 0;
  const contactFor = (actorId: string): Vec3Tuple => context?.contactFor(actorId) ?? ORIGIN;
  const directionFor = (actorId: string): Vec2 => context?.directionFor(actorId) ?? NO_DIRECTION;

  for (const event of events) {
    const payload = event.payload;

    if (isCombatEvent(payload)) {
      switch (payload.kind) {
        case "damage":
        case "guard_break":
        case "death": {
          const hitstopTicks = freezeFor(payload, payload.targetId);
          // A live row with no sim-emitted freeze has no bloom class to spawn
          // into; `classifyHitstop` rejects a 0t freeze (the table is closed).
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
