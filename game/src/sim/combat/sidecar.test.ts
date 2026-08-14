import { describe, expect, it } from "vitest";

import {
  acceptSidecar,
  parseSidecarJson,
  sampleHurtboxCapsules,
  sampleSidecar,
  sampleWeaponCapsule,
  transformPoint,
} from "./sidecar";

const validSidecar = () => ({
  schema: "tincture.sidecar.v0",
  character: "kalev",
  clip: "light1",
  ticks: 2,
  tickHz: 60,
  glb: "kalev.0123456789ab.glb",
  glbHash: "a".repeat(64),
  rootXZ: [[0, 0], [0.25, -0.5]],
  events: [
    { tick: 0, type: "hitbox_on" },
    { tick: 1, type: "hitbox_off" },
  ],
  sockets: {
    weaponBase: [[0, 1, 0], [1, 1, 0]],
    weaponTip: [[0, 1, -2], [1, 1, -2]],
  },
  hurtboxes: [
    {
      tick: 0,
      capsules: [{ name: "torso", a: [0, 0.6, 0], b: [0, 1.4, 0], r: 0.35 }],
    },
    {
      tick: 1,
      capsules: [{ name: "torso", a: [0.1, 0.6, 0], b: [0.1, 1.4, 0], r: 0.35 }],
    },
  ],
  footContacts: [
    { tick: 0, feet: ["foot.L"] },
    { tick: 1, feet: ["foot.R"] },
  ],
});

describe("sidecar acceptance", () => {
  it("strictly accepts the documented sidecar and returns detached data", () => {
    const input = validSidecar();
    const accepted = acceptSidecar(input);

    input.rootXZ[0]?.splice(0, 2, 99, 99);
    expect(accepted.schema).toBe("tincture.sidecar.v0");
    expect(accepted.rootXZ[0]).toEqual([0, 0]);
    expect(parseSidecarJson(JSON.stringify(validSidecar()))).toEqual(
      acceptSidecar(validSidecar()),
    );
  });

  it("accepts non-attack clips without weapon sockets", () => {
    const input = validSidecar();
    const { sockets, ...withoutSockets } = input;
    const accepted = acceptSidecar(withoutSockets);

    expect(sockets).toBeDefined();
    expect(accepted.sockets).toBeUndefined();
    expect(() => sampleWeaponCapsule(accepted, 0, 0.05)).toThrow(/weapon sockets/i);
  });

  it("rejects malformed lengths, ticks, hashes, events, and unknown fields", () => {
    expect(() => acceptSidecar({ ...validSidecar(), rootXZ: [[0, 0]] })).toThrow(
      /rootXZ.*ticks/i,
    );
    expect(() =>
      acceptSidecar({
        ...validSidecar(),
        hurtboxes: [{ ...validSidecar().hurtboxes[0], tick: 1 }, validSidecar().hurtboxes[1]],
      }),
    ).toThrow(/hurtboxes\[0\]\.tick/i);
    expect(() =>
      acceptSidecar({
        ...validSidecar(),
        events: [{ tick: 2, type: "hitbox_on" }],
      }),
    ).toThrow(/events\[0\]\.tick/i);
    expect(() => acceptSidecar({ ...validSidecar(), glbHash: "abc" })).toThrow(
      /glbHash/i,
    );
    expect(() => acceptSidecar({ ...validSidecar(), surprise: true })).toThrow(
      /surprise/i,
    );
  });
});

describe("sidecar sampling and transforms", () => {
  it("samples one integer tick and rotates local game space into world space", () => {
    const sidecar = acceptSidecar(validSidecar());
    const transform = {
      position: { x: 10, y: 2, z: 20 },
      yawRadians: Math.PI / 2,
    };
    const sample = sampleSidecar(sidecar, 1, transform);

    expect(sample.rootXZ).toEqual([0.25, -0.5]);
    expect(sample.events).toEqual([{ tick: 1, type: "hitbox_off" }]);
    expect(sample.feet).toEqual(["foot.R"]);
    expect(sample.weapon?.a).toEqual({ x: 10, y: 3, z: 19 });
    expect(sample.weapon?.b.x).toBeCloseTo(8);
    expect(sample.weapon?.b.y).toBe(3);
    expect(sample.weapon?.b.z).toBeCloseTo(19);
    expect(sample.hurtboxes[0]?.name).toBe("torso");
    expect(sample.hurtboxes[0]?.a.x).toBeCloseTo(10);
    expect(sample.hurtboxes[0]?.a.y).toBeCloseTo(2.6);
    expect(sample.hurtboxes[0]?.a.z).toBeCloseTo(19.9);
  });

  it("exposes focused weapon, hurtbox, and point helpers", () => {
    const sidecar = acceptSidecar(validSidecar());

    expect(sampleWeaponCapsule(sidecar, 0, 0.04)).toEqual({
      a: { x: 0, y: 1, z: 0 },
      b: { x: 0, y: 1, z: -2 },
      radius: 0.04,
    });
    expect(sampleHurtboxCapsules(sidecar, 0)[0]?.radius).toBe(0.35);
    expect(
      transformPoint(
        { x: 1, y: 2, z: 0 },
        { position: { x: 10, y: 3, z: 20 }, yawRadians: Math.PI / 2 },
      ),
    ).toEqual({ x: 10, y: 5, z: 19 });
    expect(() => sampleSidecar(sidecar, 0.5)).toThrow(/integer tick/i);
    expect(() => sampleSidecar(sidecar, 2)).toThrow(/range/i);
  });
});
