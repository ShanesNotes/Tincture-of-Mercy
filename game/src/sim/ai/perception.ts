import { angleDelta, degToRad, dist3, yawToward } from "./math";
import type { WolfAiParams } from "./params";
import type {
  AlertLevel,
  LosQuery,
  SoundEvent,
  Vec3,
  WolfActorState,
} from "./types";

export interface PerceptionSample {
  readonly seen: boolean;
  readonly heard: boolean;
  readonly lastKnown: Vec3;
}

export const hasLineOfSight = (
  wolf: Vec3,
  target: Vec3,
  los: LosQuery,
  params: WolfAiParams,
): boolean => {
  const origin = {
    x: wolf.x,
    y: wolf.y + params.perception.eyeHeightM,
    z: wolf.z,
  };
  const end = {
    x: target.x,
    y: target.y + params.perception.targetChestHeightM,
    z: target.z,
  };
  const dx = end.x - origin.x;
  const dy = end.y - origin.y;
  const dz = end.z - origin.z;
  const distance = Math.hypot(dx, dy, dz);
  if (distance <= params.perception.losEpsilonM) {
    return true;
  }

  const hit = los.raycast({
    origin,
    direction: { x: dx / distance, y: dy / distance, z: dz / distance },
    maxDistance: distance,
  });
  return hit === null || hit.distance >= distance - params.perception.losEpsilonM;
};

export const canSee = (
  wolf: Pick<WolfActorState, "x" | "y" | "z" | "yaw">,
  target: Vec3,
  los: LosQuery,
  params: WolfAiParams,
): boolean => {
  const origin = { x: wolf.x, y: wolf.y, z: wolf.z };
  const range = dist3(
    { x: origin.x, y: origin.y + params.perception.eyeHeightM, z: origin.z },
    { x: target.x, y: target.y + params.perception.targetChestHeightM, z: target.z },
  );
  if (range > params.perception.sightRangeM) {
    return false;
  }

  const heading = yawToward(origin, target);
  if (Math.abs(angleDelta(wolf.yaw, heading)) > degToRad(params.perception.sightHalfAngleDeg)) {
    return false;
  }

  return hasLineOfSight(origin, target, los, params);
};

export const canHear = (
  wolf: Vec3,
  sound: SoundEvent,
  params: WolfAiParams,
): boolean => dist3(wolf, sound.position) <= params.perception.hearingRadiusM[sound.kind];

export const samplePerception = (
  wolf: WolfActorState,
  target: Vec3,
  sounds: readonly SoundEvent[],
  los: LosQuery,
  params: WolfAiParams,
): PerceptionSample => {
  const body = { x: wolf.x, y: wolf.y, z: wolf.z };
  const seen = canSee(wolf, target, los, params);
  let heard = false;
  let lastKnown = seen
    ? target
    : { x: wolf.lastKnownX, y: wolf.lastKnownY, z: wolf.lastKnownZ };

  for (const sound of sounds) {
    if (canHear(body, sound, params)) {
      heard = true;
      if (!seen) {
        lastKnown = sound.position;
      }
    }
  }

  if (seen) {
    lastKnown = target;
  }

  return { seen, heard, lastKnown };
};

export const nextAlert = (
  current: AlertLevel,
  alertTimer: number,
  confirmTimer: number,
  seen: boolean,
  heard: boolean,
  params: WolfAiParams,
): { readonly alert: AlertLevel; readonly alertTimer: number; readonly confirmTimer: number } => {
  const stimulus = seen || heard;
  const { suspiciousTicks, suspiciousToAlertTicks, alertHoldTicks } = params.perception;

  if (seen) {
    return { alert: "alert", alertTimer: alertHoldTicks, confirmTimer: 0 };
  }

  if (current === "unaware") {
    if (heard) {
      return { alert: "suspicious", alertTimer: suspiciousTicks, confirmTimer: 1 };
    }
    return { alert: "unaware", alertTimer: 0, confirmTimer: 0 };
  }

  if (current === "suspicious") {
    if (stimulus) {
      const nextConfirm = confirmTimer + 1;
      if (nextConfirm >= suspiciousToAlertTicks) {
        return { alert: "alert", alertTimer: alertHoldTicks, confirmTimer: 0 };
      }
      return { alert: "suspicious", alertTimer: suspiciousTicks, confirmTimer: nextConfirm };
    }
    const remaining = alertTimer - 1;
    if (remaining <= 0) {
      return { alert: "unaware", alertTimer: 0, confirmTimer: 0 };
    }
    return { alert: "suspicious", alertTimer: remaining, confirmTimer: 0 };
  }

  if (stimulus) {
    return { alert: "alert", alertTimer: alertHoldTicks, confirmTimer: 0 };
  }
  const remaining = alertTimer - 1;
  if (remaining <= 0) {
    return { alert: "suspicious", alertTimer: suspiciousTicks, confirmTimer: 0 };
  }
  return { alert: "alert", alertTimer: remaining, confirmTimer: 0 };
};
