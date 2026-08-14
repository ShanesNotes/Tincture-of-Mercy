import {
  UniformCapsuleGrid,
  sweepWeaponCapsule,
  type Aabb,
  type Capsule,
  type GridActor,
} from "./geometry";

export interface HurtboxActor {
  readonly hurtboxes: readonly Capsule[];
  readonly id: string;
}

export interface RehitEntry {
  readonly eligibleAtCombatClock: number;
  readonly key: string;
}

export interface SwingContact {
  readonly substep: number;
  readonly targetId: string;
  readonly tickFractionStart: number;
}

export interface ActiveSwingInput {
  readonly actionTick: number;
  readonly activeWindows: readonly (readonly [number, number])[];
  readonly combatClock: number;
  readonly currentWeapon: Capsule;
  readonly epsilonMeters: number;
  readonly gridCellSizeMeters: number;
  readonly previousWeapon: Capsule;
  readonly rehitLedger: readonly RehitEntry[];
  readonly rehitLockoutTicks: number;
  readonly swingId: string;
  readonly substepsPerTick: number;
  readonly targets: readonly HurtboxActor[];
}

export interface ActiveSwingResult {
  readonly contacts: readonly SwingContact[];
  readonly rehitLedger: readonly RehitEntry[];
}

const segmentLength = (capsule: Capsule): number =>
  Math.hypot(
    capsule.b.x - capsule.a.x,
    capsule.b.y - capsule.a.y,
    capsule.b.z - capsule.a.z,
  );

// A rotating tip can leave the AABB of its two endpoint poses. Bounding the
// entire maximum-length sphere around the swept base is conservative and
// keeps the broad phase incapable of culling a true curved sweep.
const sweptWeaponBounds = (
  previous: Capsule,
  current: Capsule,
  epsilonMeters: number,
): Aabb => {
  const reach = Math.max(
    segmentLength(previous) + previous.radius,
    segmentLength(current) + current.radius,
  ) + epsilonMeters;
  return {
    min: {
      x: Math.min(previous.a.x, current.a.x) - reach,
      y: Math.min(previous.a.y, current.a.y) - reach,
      z: Math.min(previous.a.z, current.a.z) - reach,
    },
    max: {
      x: Math.max(previous.a.x, current.a.x) + reach,
      y: Math.max(previous.a.y, current.a.y) + reach,
      z: Math.max(previous.a.z, current.a.z) + reach,
    },
  };
};

const isActive = (
  actionTick: number,
  windows: readonly (readonly [number, number])[],
): boolean => windows.some(([start, end]) => actionTick >= start && actionTick < end);

export const detectActiveSwingHits = (input: ActiveSwingInput): ActiveSwingResult => {
  if (
    !Number.isSafeInteger(input.actionTick) ||
    !Number.isSafeInteger(input.combatClock) ||
    !Number.isSafeInteger(input.rehitLockoutTicks) ||
    input.actionTick < 0 ||
    input.combatClock < 0 ||
    input.rehitLockoutTicks < 0
  ) {
    throw new Error("Swing clocks and re-hit lockout must be non-negative safe integers.");
  }
  if (!isActive(input.actionTick, input.activeWindows)) {
    return { contacts: [], rehitLedger: [...input.rehitLedger] };
  }

  const orderedTargets = [...input.targets].sort((left, right) => left.id.localeCompare(right.id));
  const targetByGridId = new Map<number, HurtboxActor>();
  const gridActors: GridActor[] = orderedTargets.map((target, index) => {
    targetByGridId.set(index, target);
    return { capsules: target.hurtboxes, id: index };
  });
  const grid = new UniformCapsuleGrid(input.gridCellSizeMeters, gridActors);
  const bounds = sweptWeaponBounds(
    input.previousWeapon,
    input.currentWeapon,
    input.epsilonMeters,
  );
  const ledger = new Map(input.rehitLedger.map((entry) => [entry.key, entry]));
  const contacts: SwingContact[] = [];

  for (const gridId of grid.queryBounds(bounds)) {
    const target = targetByGridId.get(gridId);
    if (target === undefined) continue;
    const key = `${input.swingId}>${target.id}`;
    const existing = ledger.get(key);
    if (existing !== undefined && input.combatClock < existing.eligibleAtCombatClock) continue;

    let firstContact: SwingContact | undefined;
    for (const hurtbox of target.hurtboxes) {
      const hit = sweepWeaponCapsule(
        input.previousWeapon,
        input.currentWeapon,
        hurtbox,
        {
          epsilonMeters: input.epsilonMeters,
          substepsPerTick: input.substepsPerTick,
        },
      );
      if (
        hit !== null &&
        (firstContact === undefined || hit.substep < firstContact.substep)
      ) {
        firstContact = {
          substep: hit.substep,
          targetId: target.id,
          tickFractionStart: hit.tickFractionStart,
        };
      }
    }
    if (firstContact !== undefined) {
      contacts.push(firstContact);
      ledger.set(key, {
        eligibleAtCombatClock: input.combatClock + input.rehitLockoutTicks,
        key,
      });
    }
  }

  contacts.sort(
    (left, right) =>
      left.substep - right.substep || left.targetId.localeCompare(right.targetId),
  );
  return {
    contacts,
    rehitLedger: [...ledger.values()].sort((left, right) => left.key.localeCompare(right.key)),
  };
};
