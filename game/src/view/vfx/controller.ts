/**
 * The VFX effect controller — pure, deterministic, headless-callable
 * (W1-SHARED rules 3–4: no three.js, no wall clock, no RNG; all timing in
 * integer ticks). It consumes fixture/presenter-shaped events through
 * {@link applyVfxEvents} and owns the lifecycle of every effect the slice
 * names: margin ink-blooms, world ink-strokes, Wither motes, emblem pulses,
 * the Ember desaturation sweep, tag glints, the 1-frame parchment inversion,
 * and the death "page" hook.
 *
 * Law carried here:
 * - F4: a whiff spawns nothing — no juice on air. Bloom startTick is the
 *   application tick, so latency against the event's sim tick is measurable.
 * - TUNING_V0 hitstop table: bloom class/intensity/duration pair with the
 *   sim-owned hitstop freeze; every bloom always decays fully.
 * - Canon impact spec: parchment inversion on critical/death, 1 frame exactly.
 * - Slice deliverable 2: gold is licensed ONLY on riposte/guard-break strokes.
 */

import type { VfxParams } from "./params";
import type {
  BloomInstance,
  Direction8,
  EmberSweep,
  EmblemPulse,
  HitstopClassName,
  StrokeInstance,
  TagGlint,
  VfxEvent,
  VfxState,
  WitherField,
} from "./types";

export const createVfxState = (): VfxState => ({
  tick: 0,
  blooms: [],
  strokes: [],
  wither: null,
  pulses: [],
  emberSweep: null,
  tagGlints: [],
  inversionStartTick: null,
  deathPage: null,
});

/**
 * Map a screen-space impact direction to the nearest of the 8 margin
 * anchors. dx points right, dy points up; a zero vector defaults to north
 * (the top margin — the page's head).
 */
export const directionToAnchor = (dx: number, dy: number): Direction8 => {
  if (dx === 0 && dy === 0) {
    return "n";
  }
  const angle = Math.atan2(dy, dx); // 0 = east, CCW positive
  const sector = Math.round(angle / (Math.PI / 4));
  const anchors: readonly Direction8[] = ["e", "ne", "n", "nw", "w", "sw", "s", "se"];
  const index = ((sector % 8) + 8) % 8;
  const anchor = anchors[index];
  if (anchor === undefined) {
    throw new Error(`directionToAnchor: sector ${sector} out of range`);
  }
  return anchor;
};

/**
 * Resolve a sim-owned hitstop freeze to its TUNING_V0 class. Critical and
 * death share the 12t freeze; the caller disambiguates via `prefer`.
 * Throws on a freeze that matches no class — the table is closed.
 */
export const classifyHitstop = (
  hitstopTicks: number,
  params: VfxParams,
  prefer?: HitstopClassName,
): HitstopClassName => {
  const matches = (
    Object.entries(params.hitstopClasses) as readonly (readonly [HitstopClassName, {
      readonly hitstopTicks: number;
    }])[]
  )
    .filter(([, entry]) => entry.hitstopTicks === hitstopTicks)
    .map(([name]) => name);
  if (matches.length === 0) {
    throw new Error(`No hitstop class for a ${hitstopTicks}t freeze (TUNING_V0 table is closed).`);
  }
  if (prefer !== undefined && matches.includes(prefer)) {
    return prefer;
  }
  const first = matches[0];
  if (first === undefined) {
    throw new Error("unreachable: matches is non-empty");
  }
  return first;
};

/** Decay envelope: 1 at spawn, 0 once the duration elapses. Always decays fully. */
export const envelope01 = (age: number, durationTicks: number): number => {
  if (durationTicks <= 0 || age < 0 || age >= durationTicks) {
    return 0;
  }
  return 1 - age / durationTicks;
};

const active = (startTick: number, durationTicks: number, tick: number): boolean =>
  tick >= startTick && tick < startTick + durationTicks;

/**
 * Advance the controller to `tick`, expiring every finished effect. The
 * parchment inversion lives exactly `inversion.frames` frames from its start.
 */
export const advanceVfx = (state: VfxState, tick: number, params: VfxParams): VfxState => {
  if (!Number.isSafeInteger(tick) || tick < state.tick) {
    throw new Error(`VFX ticks advance monotonically (state at ${state.tick}, got ${tick}).`);
  }
  return {
    tick,
    blooms: state.blooms.filter((b) => active(b.startTick, b.durationTicks, tick)),
    strokes: state.strokes.filter((s) => active(s.startTick, s.durationTicks, tick)),
    wither:
      state.wither !== null && active(state.wither.startTick, state.wither.durationTicks, tick)
        ? state.wither
        : null,
    pulses: state.pulses.filter((p) => active(p.startTick, p.durationTicks, tick)),
    emberSweep:
      state.emberSweep !== null && active(state.emberSweep.startTick, state.emberSweep.durationTicks, tick)
        ? state.emberSweep
        : null,
    tagGlints: state.tagGlints.filter((g) => active(g.startTick, g.durationTicks, tick)),
    inversionStartTick:
      state.inversionStartTick !== null &&
      active(state.inversionStartTick, params.inversion.frames, tick)
        ? state.inversionStartTick
        : null,
    deathPage:
      state.deathPage !== null && active(state.deathPage.startTick, state.deathPage.durationTicks, tick)
        ? state.deathPage
        : null,
  };
};

/** Deterministic stroke-variant pick (no RNG in the view's timing path). */
const strokeVariant = (eventTick: number, targetId: string, variants: number): number => {
  let hash = eventTick * 31;
  for (let i = 0; i < targetId.length; i += 1) {
    hash = (hash * 33 + targetId.charCodeAt(i)) % 1_000_003;
  }
  return Math.abs(hash) % variants;
};

const spawnBloom = (
  eventTick: number,
  hitstopClass: HitstopClassName,
  direction: readonly [number, number],
  tick: number,
  params: VfxParams,
): BloomInstance => {
  const classParams = params.hitstopClasses[hitstopClass];
  const dx = direction[0];
  const dy = direction[1];
  return {
    anchor: directionToAnchor(dx, dy),
    hitstopClass,
    eventTick,
    startTick: tick,
    durationTicks: classParams.bloomTicks,
    peakIntensity: classParams.peakIntensity,
  };
};

const spawnStroke = (
  event: { readonly tick: number; readonly contact: readonly [number, number, number] },
  targetId: string,
  gold: boolean,
  durationTicks: number,
  tick: number,
  params: VfxParams,
): StrokeInstance => ({
  contact: event.contact,
  variant: gold ? 0 : strokeVariant(event.tick, targetId, params.impactStrokes.variants),
  gold,
  startTick: tick,
  durationTicks,
});

const assertEventTick = (eventTick: number, tick: number): void => {
  if (!Number.isSafeInteger(eventTick) || eventTick < 0 || eventTick > tick) {
    throw new Error(
      `VFX events must carry a past-or-present sim tick (event ${eventTick}, applied at ${tick}).`,
    );
  }
};

/**
 * The slice's named seam: apply presenter/fixture-shaped events at `tick`.
 * Expires finished effects first, then spawns. A whiff spawns nothing (F4);
 * criticals and deaths schedule the 1-frame parchment inversion; gold is
 * emitted only for riposte/guard-break (slice deliverable 2, AD6/L9).
 */
export const applyVfxEvents = (
  state: VfxState,
  events: readonly VfxEvent[],
  tick: number,
  params: VfxParams,
): VfxState => {
  let next = advanceVfx(state, tick, params);
  for (const event of events) {
    assertEventTick(event.tick, tick);
    switch (event.kind) {
      case "whiff": {
        // F4: no juice on air. Explicitly nothing.
        break;
      }
      case "hit": {
        const hitstopClass = classifyHitstop(
          event.hitstopTicks,
          params,
          event.critical === true ? "critical" : undefined,
        );
        const bloom = spawnBloom(event.tick, hitstopClass, event.direction, tick, params);
        const stroke = spawnStroke(
          event,
          event.targetId,
          false,
          event.hitstopTicks + params.impactStrokes.tailTicks,
          tick,
          params,
        );
        next = {
          ...next,
          blooms: [...next.blooms, bloom],
          strokes: [...next.strokes, stroke],
          inversionStartTick: event.critical === true ? tick : next.inversionStartTick,
        };
        break;
      }
      case "guard_break": {
        const bloom = spawnBloom(event.tick, "guard_break", event.direction, tick, params);
        const flash = spawnStroke(
          event,
          event.targetId,
          true,
          params.impactStrokes.goldFlashTicks,
          tick,
          params,
        );
        next = { ...next, blooms: [...next.blooms, bloom], strokes: [...next.strokes, flash] };
        break;
      }
      case "riposte": {
        const flash = spawnStroke(
          event,
          event.targetId,
          true,
          params.impactStrokes.goldFlashTicks,
          tick,
          params,
        );
        next = { ...next, strokes: [...next.strokes, flash] };
        break;
      }
      case "death": {
        const bloom = spawnBloom(event.tick, "death", event.direction, tick, params);
        const stroke = spawnStroke(
          event,
          event.targetId,
          false,
          event.hitstopTicks + params.impactStrokes.tailTicks,
          tick,
          params,
        );
        next = {
          ...next,
          blooms: [...next.blooms, bloom],
          strokes: [...next.strokes, stroke],
          inversionStartTick: tick,
          deathPage: { startTick: tick, durationTicks: params.deathPage.ticks },
        };
        break;
      }
      case "wither": {
        const density = Math.min(1, Math.max(0, event.density));
        const wither: WitherField = {
          density,
          startTick: tick,
          durationTicks: event.durationTicks ?? params.wither.defaultDurationTicks,
        };
        next = { ...next, wither };
        break;
      }
      case "flask": {
        const pulse: EmblemPulse = {
          emblem: "vial",
          startTick: tick,
          durationTicks: params.flask.pulseTicks,
          peakIntensity: params.flask.peakIntensity,
        };
        next = { ...next, pulses: [...next.pulses, pulse] };
        break;
      }
      case "ember": {
        const sweep: EmberSweep = {
          startTick: tick,
          durationTicks: params.ember.sweepTicks,
        };
        const glint: EmblemPulse = {
          emblem: "ember",
          startTick: tick,
          durationTicks: params.ember.goldGlintTicks,
          peakIntensity: params.flask.peakIntensity,
        };
        next = { ...next, emberSweep: sweep, pulses: [...next.pulses, glint] };
        break;
      }
      case "tag_chime": {
        const glint: TagGlint = {
          contact: event.contact,
          startTick: tick,
          durationTicks: params.tagChime.glintTicks,
        };
        next = { ...next, tagGlints: [...next.tagGlints, glint] };
        break;
      }
    }
  }
  return next;
};

/** True while the 1-frame parchment inversion is on screen. */
export const inversionActive = (state: VfxState): boolean => state.inversionStartTick !== null;

/** Wither mote count: density × cap, quantized, never above the data cap (EN14). */
export const witherMoteCount = (state: VfxState, params: VfxParams): number => {
  if (state.wither === null) {
    return 0;
  }
  return Math.min(params.wither.maxMotes, Math.round(state.wither.density * params.wither.maxMotes));
};

/** Wither margin desaturation band strength, quantized to the declared stops (L3/EN14). */
export const witherBandStop = (state: VfxState, params: VfxParams): number => {
  if (state.wither === null) {
    return 0;
  }
  const stops = params.wither.bandStops;
  let chosen = 0;
  for (const stop of stops) {
    if (state.wither.density >= stop) {
      chosen = stop;
    }
  }
  return chosen;
};

/**
 * Ember desaturation level at the state's tick: stepped through the declared
 * stops over the 60t sweep, then exactly 0 — the moment is visible once,
 * then gone (slice deliverable 4).
 */
export const emberDesatLevel = (state: VfxState, params: VfxParams): number => {
  const sweep = state.emberSweep;
  if (sweep === null) {
    return 0;
  }
  const stops = params.ember.desatStops;
  const age = state.tick - sweep.startTick;
  const index = Math.min(stops.length - 1, Math.floor((age / sweep.durationTicks) * stops.length));
  return stops[index] ?? 0;
};

/** Emblem light intensity for a named emitter at the state's tick (0 = idle). */
export const emblemIntensity = (
  state: VfxState,
  emblem: EmblemPulse["emblem"],
): number => {
  let intensity = 0;
  for (const pulse of state.pulses) {
    if (pulse.emblem !== emblem) {
      continue;
    }
    intensity = Math.max(
      intensity,
      pulse.peakIntensity * envelope01(state.tick - pulse.startTick, pulse.durationTicks),
    );
  }
  return intensity;
};
