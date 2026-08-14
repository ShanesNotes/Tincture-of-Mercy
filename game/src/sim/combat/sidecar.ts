import type { Capsule, Vec3 } from "./geometry";

export const SIDECAR_SCHEMA = "tincture.sidecar.v0" as const;

export type SidecarEventType =
  | "hitbox_on"
  | "hitbox_off"
  | "iframe_on"
  | "iframe_off"
  | "actionable"
  | "guard_enter"
  | "guard_hold"
  | "guard_exit"
  | "hyperarmor_on"
  | "hyperarmor_off"
  | "sfx_swing";

export type Vec2Tuple = readonly [number, number];
export type Vec3Tuple = readonly [number, number, number];

export interface SidecarEvent {
  readonly tick: number;
  readonly type: SidecarEventType;
}

export interface SidecarCapsule {
  readonly name: string;
  readonly a: Vec3Tuple;
  readonly b: Vec3Tuple;
  readonly r: number;
}

export interface SidecarHurtboxFrame {
  readonly tick: number;
  readonly capsules: readonly SidecarCapsule[];
}

export interface SidecarFootContact {
  readonly tick: number;
  readonly feet: readonly string[];
}

export interface SidecarSockets {
  readonly weaponBase: readonly Vec3Tuple[];
  readonly weaponTip: readonly Vec3Tuple[];
}

export interface SidecarData {
  readonly schema: typeof SIDECAR_SCHEMA;
  readonly character: string;
  readonly clip: string;
  readonly ticks: number;
  readonly tickHz: 60;
  readonly glb: string;
  readonly glbHash: string;
  readonly rootXZ: readonly Vec2Tuple[];
  readonly events: readonly SidecarEvent[];
  readonly sockets?: SidecarSockets;
  readonly hurtboxes: readonly SidecarHurtboxFrame[];
  readonly footContacts: readonly SidecarFootContact[];
}

export interface NamedCapsule extends Capsule {
  readonly name: string;
}

export interface SidecarTransform {
  readonly position: Vec3;
  readonly yawRadians: number;
}

export interface SidecarSample {
  readonly tick: number;
  readonly rootXZ: Vec2Tuple;
  readonly events: readonly SidecarEvent[];
  readonly weapon?: Capsule;
  readonly hurtboxes: readonly NamedCapsule[];
  readonly feet: readonly string[];
}

const EVENT_TYPES = new Set<SidecarEventType>([
  "hitbox_on",
  "hitbox_off",
  "iframe_on",
  "iframe_off",
  "actionable",
  "guard_enter",
  "guard_hold",
  "guard_exit",
  "hyperarmor_on",
  "hyperarmor_off",
  "sfx_swing",
]);

type UnknownRecord = Record<string, unknown>;

const record = (value: unknown, label: string): UnknownRecord => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as UnknownRecord;
};

const strictKeys = (
  value: UnknownRecord,
  allowed: readonly string[],
  label: string,
): void => {
  const allowedKeys = new Set(allowed);
  const unknown = Object.keys(value).find((key) => !allowedKeys.has(key));
  if (unknown !== undefined) {
    throw new Error(`${label} contains unknown field ${unknown}.`);
  }
};

const array = (value: unknown, label: string): readonly unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value;
};

const finiteNumber = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
  return value;
};

const integer = (value: unknown, label: string): number => {
  const parsed = finiteNumber(value, label);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${label} must be a safe integer.`);
  }
  return parsed;
};

const nonEmptyString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
};

const tuple2 = (value: unknown, label: string): Vec2Tuple => {
  const values = array(value, label);
  if (values.length !== 2) {
    throw new Error(`${label} must contain exactly two coordinates.`);
  }
  return [
    finiteNumber(values[0], `${label}[0]`),
    finiteNumber(values[1], `${label}[1]`),
  ];
};

const tuple3 = (value: unknown, label: string): Vec3Tuple => {
  const values = array(value, label);
  if (values.length !== 3) {
    throw new Error(`${label} must contain exactly three coordinates.`);
  }
  return [
    finiteNumber(values[0], `${label}[0]`),
    finiteNumber(values[1], `${label}[1]`),
    finiteNumber(values[2], `${label}[2]`),
  ];
};

const tickInRange = (value: unknown, ticks: number, label: string): number => {
  const tick = integer(value, label);
  if (tick < 0 || tick >= ticks) {
    throw new Error(`${label} must be in range [0, ${ticks}).`);
  }
  return tick;
};

const exactTickArray = <T>(
  value: unknown,
  ticks: number,
  label: string,
  parse: (item: unknown, index: number) => T,
): readonly T[] => {
  const values = array(value, label);
  if (values.length !== ticks) {
    throw new Error(`${label} length must equal ticks (${ticks}).`);
  }
  return values.map(parse);
};

const parseEvents = (value: unknown, ticks: number): readonly SidecarEvent[] =>
  array(value, "events").map((item, index) => {
    const event = record(item, `events[${index}]`);
    strictKeys(event, ["tick", "type"], `events[${index}]`);
    const type = nonEmptyString(event.type, `events[${index}].type`);
    if (!EVENT_TYPES.has(type as SidecarEventType)) {
      throw new Error(`events[${index}].type is not a supported event type.`);
    }
    return {
      tick: tickInRange(event.tick, ticks, `events[${index}].tick`),
      type: type as SidecarEventType,
    };
  });

const parseSockets = (
  value: unknown,
  ticks: number,
): SidecarSockets | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const sockets = record(value, "sockets");
  strictKeys(sockets, ["weaponBase", "weaponTip"], "sockets");
  const hasBase = sockets.weaponBase !== undefined;
  const hasTip = sockets.weaponTip !== undefined;
  if (!hasBase && !hasTip) {
    return undefined;
  }
  if (!hasBase || !hasTip) {
    throw new Error("sockets must provide both weaponBase and weaponTip.");
  }
  return {
    weaponBase: exactTickArray(
      sockets.weaponBase,
      ticks,
      "sockets.weaponBase",
      (item, index) => tuple3(item, `sockets.weaponBase[${index}]`),
    ),
    weaponTip: exactTickArray(
      sockets.weaponTip,
      ticks,
      "sockets.weaponTip",
      (item, index) => tuple3(item, `sockets.weaponTip[${index}]`),
    ),
  };
};

const parseCapsule = (value: unknown, label: string): SidecarCapsule => {
  const capsule = record(value, label);
  strictKeys(capsule, ["name", "a", "b", "r"], label);
  const radius = finiteNumber(capsule.r, `${label}.r`);
  if (radius < 0) {
    throw new Error(`${label}.r must be non-negative.`);
  }
  return {
    name: nonEmptyString(capsule.name, `${label}.name`),
    a: tuple3(capsule.a, `${label}.a`),
    b: tuple3(capsule.b, `${label}.b`),
    r: radius,
  };
};

const parseHurtboxes = (
  value: unknown,
  ticks: number,
): readonly SidecarHurtboxFrame[] =>
  exactTickArray(value, ticks, "hurtboxes", (item, index) => {
    const frame = record(item, `hurtboxes[${index}]`);
    strictKeys(frame, ["tick", "capsules"], `hurtboxes[${index}]`);
    const tick = tickInRange(frame.tick, ticks, `hurtboxes[${index}].tick`);
    if (tick !== index) {
      throw new Error(`hurtboxes[${index}].tick must equal ${index}.`);
    }
    return {
      tick,
      capsules: array(frame.capsules, `hurtboxes[${index}].capsules`).map(
        (itemCapsule, capsuleIndex) =>
          parseCapsule(itemCapsule, `hurtboxes[${index}].capsules[${capsuleIndex}]`),
      ),
    };
  });

const parseFootContacts = (
  value: unknown,
  ticks: number,
): readonly SidecarFootContact[] =>
  exactTickArray(value, ticks, "footContacts", (item, index) => {
    const frame = record(item, `footContacts[${index}]`);
    strictKeys(frame, ["tick", "feet"], `footContacts[${index}]`);
    const tick = tickInRange(frame.tick, ticks, `footContacts[${index}].tick`);
    if (tick !== index) {
      throw new Error(`footContacts[${index}].tick must equal ${index}.`);
    }
    return {
      tick,
      feet: array(frame.feet, `footContacts[${index}].feet`).map((foot, footIndex) =>
        nonEmptyString(foot, `footContacts[${index}].feet[${footIndex}]`),
      ),
    };
  });

export const acceptSidecar = (value: unknown): SidecarData => {
  const sidecar = record(value, "sidecar");
  strictKeys(
    sidecar,
    [
      "schema",
      "character",
      "clip",
      "ticks",
      "tickHz",
      "glb",
      "glbHash",
      "rootXZ",
      "events",
      "sockets",
      "hurtboxes",
      "footContacts",
    ],
    "sidecar",
  );
  if (sidecar.schema !== SIDECAR_SCHEMA) {
    throw new Error(`sidecar.schema must equal ${SIDECAR_SCHEMA}.`);
  }
  const ticks = integer(sidecar.ticks, "sidecar.ticks");
  if (ticks <= 0) {
    throw new Error("sidecar.ticks must be positive.");
  }
  if (sidecar.tickHz !== 60) {
    throw new Error("sidecar.tickHz must equal 60.");
  }
  const glbHash = nonEmptyString(sidecar.glbHash, "sidecar.glbHash");
  if (!/^[0-9a-f]{64}$/u.test(glbHash)) {
    throw new Error("sidecar.glbHash must be a lowercase SHA-256 hex digest.");
  }

  const accepted: SidecarData = {
    schema: SIDECAR_SCHEMA,
    character: nonEmptyString(sidecar.character, "sidecar.character"),
    clip: nonEmptyString(sidecar.clip, "sidecar.clip"),
    ticks,
    tickHz: 60,
    glb: nonEmptyString(sidecar.glb, "sidecar.glb"),
    glbHash,
    rootXZ: exactTickArray(sidecar.rootXZ, ticks, "rootXZ", (item, index) =>
      tuple2(item, `rootXZ[${index}]`),
    ),
    events: parseEvents(sidecar.events, ticks),
    sockets: parseSockets(sidecar.sockets, ticks),
    hurtboxes: parseHurtboxes(sidecar.hurtboxes, ticks),
    footContacts: parseFootContacts(sidecar.footContacts, ticks),
  };
  return accepted;
};

export const parseSidecarJson = (json: string): SidecarData => {
  if (typeof json !== "string") {
    throw new Error("Sidecar JSON input must be a string.");
  }
  const parsed: unknown = JSON.parse(json);
  return acceptSidecar(parsed);
};

const pointFromTuple = (value: Vec3Tuple): Vec3 => ({
  x: value[0],
  y: value[1],
  z: value[2],
});

const assertTransform = (transform: SidecarTransform): void => {
  if (
    ![transform.position.x, transform.position.y, transform.position.z].every(
      Number.isFinite,
    ) ||
    !Number.isFinite(transform.yawRadians)
  ) {
    throw new Error("Sidecar transform must contain finite values.");
  }
};

export const transformPoint = (
  point: Vec3,
  transform: SidecarTransform,
): Vec3 => {
  assertTransform(transform);
  const cosine = Math.cos(transform.yawRadians);
  const sine = Math.sin(transform.yawRadians);
  return {
    x: transform.position.x + cosine * point.x + sine * point.z,
    y: transform.position.y + point.y,
    z: transform.position.z - sine * point.x + cosine * point.z,
  };
};

export const transformCapsule = (
  capsule: Capsule,
  transform: SidecarTransform,
): Capsule => ({
  a: transformPoint(capsule.a, transform),
  b: transformPoint(capsule.b, transform),
  radius: capsule.radius,
});

const assertSampleTick = (sidecar: SidecarData, tick: number): void => {
  if (!Number.isSafeInteger(tick)) {
    throw new Error("Sidecar sample requires an integer tick.");
  }
  if (tick < 0 || tick >= sidecar.ticks) {
    throw new Error(`Sidecar sample tick must be in range [0, ${sidecar.ticks}).`);
  }
};

export const sampleWeaponCapsule = (
  sidecar: SidecarData,
  tick: number,
  radius: number,
  transform?: SidecarTransform,
): Capsule => {
  assertSampleTick(sidecar, tick);
  if (!Number.isFinite(radius) || radius < 0) {
    throw new Error("Weapon capsule radius must be finite and non-negative.");
  }
  const base = sidecar.sockets?.weaponBase[tick];
  const tip = sidecar.sockets?.weaponTip[tick];
  if (base === undefined || tip === undefined) {
    throw new Error(`Sidecar ${sidecar.clip} has no weapon sockets.`);
  }
  const sampled: Capsule = {
    a: pointFromTuple(base),
    b: pointFromTuple(tip),
    radius,
  };
  return transform === undefined ? sampled : transformCapsule(sampled, transform);
};

export const sampleHurtboxCapsules = (
  sidecar: SidecarData,
  tick: number,
  transform?: SidecarTransform,
): readonly NamedCapsule[] => {
  assertSampleTick(sidecar, tick);
  const frame = sidecar.hurtboxes[tick];
  if (frame === undefined) {
    throw new Error("Sidecar hurtbox sample is missing.");
  }
  return frame.capsules.map((source) => {
    const sampled: NamedCapsule = {
      name: source.name,
      a: pointFromTuple(source.a),
      b: pointFromTuple(source.b),
      radius: source.r,
    };
    if (transform === undefined) {
      return sampled;
    }
    const transformed = transformCapsule(sampled, transform);
    return { name: sampled.name, ...transformed };
  });
};

export const sampleSidecar = (
  sidecar: SidecarData,
  tick: number,
  transform?: SidecarTransform,
): SidecarSample => {
  assertSampleTick(sidecar, tick);
  const rootXZ = sidecar.rootXZ[tick];
  const contact = sidecar.footContacts[tick];
  if (rootXZ === undefined || contact === undefined) {
    throw new Error("Sidecar sample is incomplete.");
  }
  const weapon =
    sidecar.sockets === undefined
      ? undefined
      : sampleWeaponCapsule(sidecar, tick, 0, transform);
  return {
    tick,
    rootXZ: [rootXZ[0], rootXZ[1]],
    events: sidecar.events
      .filter((event) => event.tick === tick)
      .map((event) => ({ ...event })),
    weapon,
    hurtboxes: sampleHurtboxCapsules(sidecar, tick, transform),
    feet: [...contact.feet],
  };
};
