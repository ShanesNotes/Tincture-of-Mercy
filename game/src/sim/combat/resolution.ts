import {
  applyAuthoredDisplacement,
  applyDamageNegation,
  scalePoiseDamage,
  type AuthoredDisplacement,
  type CombatPosition,
  type DamageNegation,
  type DamageType,
} from "./damage";
import type { CombatPresenterEvent } from "./events";
import { resolveSteadyOutcome, type SteadyOutcomeBands } from "./resources";

export interface HitActorSnapshot {
  readonly breath: number;
  readonly combatClock: number;
  readonly guarding: boolean;
  readonly hyperarmorPoise: number;
  readonly id: string;
  readonly invulnerable: boolean;
  readonly negation: DamageNegation;
  readonly poiseBands: SteadyOutcomeBands;
  readonly position: CombatPosition;
  readonly pulse: number;
  readonly riposteUntilClock?: number;
  readonly staggerUntilClock?: number;
  readonly steadyBuildup: number;
  readonly steadyCleanTicks: number;
  readonly turnBuildup: number;
  readonly turned: boolean;
}

export interface AuthoredHit {
  readonly attackerFacingRadians: number;
  readonly attackerId: string;
  readonly critical: boolean;
  readonly damageType: DamageType;
  readonly hitstopClass:
    | "light"
    | "heavy"
    | "charged"
    | "blocked"
    | "guard_break"
    | "critical"
    | "death";
  readonly knockback: AuthoredDisplacement;
  readonly poiseDamage: number;
  readonly pulseDamage: number;
  readonly swingId: string;
  readonly targetId: string;
  readonly witherBuildup: number;
}

export interface HitResolutionParams {
  readonly guardAbsorption: number;
  readonly guardBreathMultiplier: number;
  readonly guardBreakHitstopTicks: number;
  readonly guardBreakStaggerTicks: number;
  readonly hitstopTicks: Readonly<Record<AuthoredHit["hitstopClass"], number>>;
  readonly riposteWindowTicks: number;
  readonly turnThreshold: number;
  readonly witherPoiseMultiplier: number;
}

export interface ResolvedHitActor extends HitActorSnapshot {
  readonly riposteUntilClock?: number;
}

export interface HitBatchResult {
  readonly actors: Readonly<Record<string, ResolvedHitActor>>;
  readonly displacements: Readonly<Record<string, CombatPosition>>;
  readonly events: readonly CombatPresenterEvent[];
  readonly hitLedger: readonly string[];
  readonly hitstopByActor: Readonly<Record<string, number>>;
  readonly nextEventSequence: number;
}

interface TargetAggregate {
  breathCost: number;
  hits: Array<{ hit: AuthoredHit; guarded: boolean; pulseDamage: number }>;
  poiseDamage: number;
  pulseDamage: number;
  turnBuildup: number;
  x: number;
  y: number;
  z: number;
}

const stable = (value: number): number => Math.round(value * 1_000_000_000) / 1_000_000_000;

const orderedHits = (hits: readonly AuthoredHit[]): readonly AuthoredHit[] =>
  [...hits].sort(
    (left, right) =>
      left.attackerId.localeCompare(right.attackerId) ||
      left.swingId.localeCompare(right.swingId) ||
      left.targetId.localeCompare(right.targetId),
  );

export const resolveHitBatch = (
  actorSnapshots: readonly HitActorSnapshot[],
  hits: readonly AuthoredHit[],
  existingHitLedger: readonly string[],
  params: HitResolutionParams,
  worldTick: number,
  eventSequence: number,
): HitBatchResult => {
  const snapshots = new Map(actorSnapshots.map((actor) => [actor.id, actor]));
  if (snapshots.size !== actorSnapshots.length) throw new Error("Hit actors must have unique ids.");
  const ledger = new Set(existingHitLedger);
  const acceptedKeys = new Set<string>();
  const aggregates = new Map<string, TargetAggregate>();
  const hitstopByActor: Record<string, number> = {};

  for (const hit of orderedHits(hits)) {
    const attacker = snapshots.get(hit.attackerId);
    const target = snapshots.get(hit.targetId);
    if (attacker === undefined || target === undefined) throw new Error("A hit references an unknown actor.");
    if (attacker.pulse <= 0 || target.pulse <= 0) continue;
    const key = `${hit.swingId}>${hit.targetId}`;
    if (target.invulnerable || ledger.has(key) || acceptedKeys.has(key)) continue;
    acceptedKeys.add(key);

    const guarded = target.guarding && !hit.critical;
    const rawPulseDamage = guarded
      ? hit.pulseDamage * (1 - params.guardAbsorption)
      : hit.pulseDamage;
    const pulseDamage = applyDamageNegation(rawPulseDamage, target.negation[hit.damageType]);
    const poiseDamage = scalePoiseDamage(
      hit.poiseDamage,
      hit.damageType,
      params.witherPoiseMultiplier,
    );
    const delta = applyAuthoredDisplacement(
      { x: 0, y: 0, z: 0 },
      hit.attackerFacingRadians,
      hit.knockback,
    );
    const aggregate = aggregates.get(hit.targetId) ?? {
      breathCost: 0,
      hits: [],
      poiseDamage: 0,
      pulseDamage: 0,
      turnBuildup: 0,
      x: 0,
      y: 0,
      z: 0,
    };
    aggregate.hits.push({ hit, guarded, pulseDamage });
    aggregate.pulseDamage = stable(aggregate.pulseDamage + pulseDamage);
    aggregate.poiseDamage = stable(aggregate.poiseDamage + poiseDamage);
    aggregate.turnBuildup = stable(aggregate.turnBuildup + hit.witherBuildup);
    aggregate.breathCost = stable(
      aggregate.breathCost + (guarded ? hit.pulseDamage * params.guardBreathMultiplier : 0),
    );
    aggregate.x = stable(aggregate.x + delta.x);
    aggregate.y = stable(aggregate.y + delta.y);
    aggregate.z = stable(aggregate.z + delta.z);
    aggregates.set(hit.targetId, aggregate);

    const hitstop = params.hitstopTicks[guarded ? "blocked" : hit.hitstopClass];
    hitstopByActor[hit.attackerId] = Math.max(hitstopByActor[hit.attackerId] ?? 0, hitstop);
    hitstopByActor[hit.targetId] = Math.max(hitstopByActor[hit.targetId] ?? 0, hitstop);
  }

  const actors: Record<string, ResolvedHitActor> = {};
  const events: CombatPresenterEvent[] = [];
  const displacements: Record<string, CombatPosition> = {};
  let sequence = eventSequence;

  for (const targetId of [...snapshots.keys()].sort()) {
    const snapshot = snapshots.get(targetId);
    if (snapshot === undefined) throw new Error("Internal hit snapshot lookup failed.");
    const aggregate = aggregates.get(targetId);
    if (aggregate === undefined) {
      actors[targetId] = { ...snapshot };
      continue;
    }
    const breath = stable(Math.max(0, snapshot.breath - aggregate.breathCost));
    const pulse = stable(Math.max(0, snapshot.pulse - aggregate.pulseDamage));
    const steadyBuildup = stable(snapshot.steadyBuildup + aggregate.poiseDamage);
    const turnBuildup = stable(snapshot.turnBuildup + aggregate.turnBuildup);
    const guardBroken = snapshot.guarding && aggregate.breathCost > 0 && breath === 0;
    const attackerId = aggregate.hits.map(({ hit }) => hit.attackerId).sort()[0];
    if (attackerId === undefined) throw new Error("Accepted hit aggregate is empty.");
    const resolved: ResolvedHitActor = {
      ...snapshot,
      breath,
      guarding: guardBroken ? false : snapshot.guarding,
      pulse,
      steadyBuildup,
      steadyCleanTicks: 0,
      turnBuildup,
      turned: snapshot.turned || turnBuildup >= params.turnThreshold,
      ...(guardBroken
        ? {
            riposteUntilClock: snapshot.combatClock + params.riposteWindowTicks,
            staggerUntilClock: snapshot.combatClock + params.guardBreakStaggerTicks,
          }
        : snapshot.riposteUntilClock === undefined
          ? {}
          : { riposteUntilClock: snapshot.riposteUntilClock }),
    };
    actors[targetId] = guardBroken
      ? {
          ...resolved,
          riposteUntilClock: snapshot.combatClock + params.riposteWindowTicks,
          staggerUntilClock: snapshot.combatClock + params.guardBreakStaggerTicks,
        }
      : resolved;
    displacements[targetId] = {
      x: stable(snapshot.position.x + aggregate.x),
      y: stable(snapshot.position.y + aggregate.y),
      z: stable(snapshot.position.z + aggregate.z),
    };

    for (const accepted of aggregate.hits) {
      events.push({
        actorId: accepted.hit.attackerId,
        amount: accepted.pulseDamage,
        damageType: accepted.hit.damageType,
        guarded: accepted.guarded,
        kind: "damage",
        sequence,
        targetId,
        tick: worldTick,
      });
      sequence += 1;
    }

    if (guardBroken) {
      events.push({
        actorId: attackerId,
        kind: "guard_break",
        riposteUntilClock: snapshot.combatClock + params.riposteWindowTicks,
        sequence,
        targetId,
        tick: worldTick,
      });
      sequence += 1;
      for (const { hit } of aggregate.hits) {
        hitstopByActor[hit.attackerId] = Math.max(
          hitstopByActor[hit.attackerId] ?? 0,
          params.guardBreakHitstopTicks,
        );
      }
      hitstopByActor[targetId] = params.guardBreakHitstopTicks;
    }

    if (pulse === 0) {
      events.push({ actorId: attackerId, kind: "death", sequence, targetId, tick: worldTick });
      sequence += 1;
      for (const { hit } of aggregate.hits) {
        hitstopByActor[hit.attackerId] = Math.max(
          hitstopByActor[hit.attackerId] ?? 0,
          params.hitstopTicks.death,
        );
      }
      hitstopByActor[targetId] = Math.max(
        hitstopByActor[targetId] ?? 0,
        params.hitstopTicks.death,
      );
    } else if (!guardBroken) {
      const outcome = resolveSteadyOutcome(
        steadyBuildup,
        snapshot.poiseBands,
        snapshot.hyperarmorPoise,
      );
      if (outcome !== "none") {
        events.push({
          actorId: attackerId,
          kind: "stagger",
          sequence,
          severity: outcome,
          targetId,
          tick: worldTick,
        });
        sequence += 1;
      }
    }
  }

  const hitLedger = [...ledger, ...acceptedKeys].sort();
  return {
    actors,
    displacements,
    events,
    hitLedger,
    hitstopByActor,
    nextEventSequence: sequence,
  };
};
