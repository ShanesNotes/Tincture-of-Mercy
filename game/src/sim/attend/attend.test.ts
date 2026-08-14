import { describe, expect, it } from "vitest";

import rawAttendParams from "../../data/attend_params.json";
import { stepAttend } from "./attend";
import { parseAttendParams } from "./params";
import type {
  AttendActor,
  AttendCollisionQueries,
  AttendState,
  AttendStepInput,
  AttendStickSample,
  AttendViewer,
} from "./types";
import { createAttendState } from "./types";

const params = parseAttendParams(rawAttendParams);

const viewer: AttendViewer = {
  position: { x: 0, y: 0, z: 0 },
  forward: { x: 0, y: 0, z: -1 },
  right: { x: 1, y: 0, z: 0 },
};

const clearWorld: AttendCollisionQueries = { raycast: () => null };
const blockedWorld: AttendCollisionQueries = { raycast: () => ({ distance: 0.5 }) };
const noStick: AttendStickSample = { x: 0, y: 0 };

const radians = (degrees: number): number => (degrees * Math.PI) / 180;

const actorAt = (id: string, degrees: number, distance: number, alive = true): AttendActor => ({
  id,
  alive,
  position: {
    x: Math.sin(radians(degrees)) * distance,
    y: 0,
    z: -Math.cos(radians(degrees)) * distance,
  },
});

const step = (state: AttendState, overrides: Partial<AttendStepInput>): AttendState =>
  stepAttend(state, params, {
    viewer,
    actors: [],
    attendPressed: false,
    stick: noStick,
    queries: clearWorld,
    ...overrides,
  });

const attendTo = (actors: readonly AttendActor[]): AttendState =>
  step(createAttendState(), { actors, attendPressed: true });

const wolf = actorAt("wolf", 0, 6);

describe("acquisition", () => {
  it("acquires the best candidate on the Attend press edge", () => {
    const state = attendTo([wolf]);
    expect(state.mode).toBe("attending");
    expect(state.targetId).toBe("wolf");
  });

  it("stays idle when nothing is inside the cone", () => {
    expect(attendTo([actorAt("behind", 150, 4)]).mode).toBe("idle");
  });

  it("does nothing without a press edge", () => {
    expect(step(createAttendState(), { actors: [wolf] }).mode).toBe("idle");
  });

  it("releases on a second press", () => {
    const released = step(attendTo([wolf]), { actors: [wolf], attendPressed: true });
    expect(released.mode).toBe("idle");
    expect(released.targetId).toBeNull();
  });
});

describe("retention", () => {
  it("holds a target out to the 22m retain range and drops past it", () => {
    const held = step(attendTo([wolf]), { actors: [actorAt("wolf", 0, 22)] });
    expect(held.targetId).toBe("wolf");

    const dropped = step(held, { actors: [actorAt("wolf", 0, 22.01)] });
    expect(dropped.mode).toBe("idle");
    expect(dropped.targetId).toBeNull();
  });

  it("retains a target that leaves the acquisition cone", () => {
    const wide = actorAt("wolf", 80, 6);
    expect(step(attendTo([wolf]), { actors: [wide] }).targetId).toBe("wolf");
  });

  it("drops only after 30 consecutive ticks of broken line of sight", () => {
    let state = attendTo([wolf]);
    for (let tick = 1; tick < params.lineOfSightBreakTicks; tick += 1) {
      state = step(state, { actors: [wolf], queries: blockedWorld });
      expect(state.mode).toBe("attending");
      expect(state.lostLineOfSightTicks).toBe(tick);
    }

    state = step(state, { actors: [wolf], queries: blockedWorld });
    expect(state.mode).toBe("idle");
  });

  it("resets the line-of-sight counter when the target reappears", () => {
    let state = attendTo([wolf]);
    for (let tick = 0; tick < 20; tick += 1) {
      state = step(state, { actors: [wolf], queries: blockedWorld });
    }
    expect(state.lostLineOfSightTicks).toBe(20);

    state = step(state, { actors: [wolf] });
    expect(state.lostLineOfSightTicks).toBe(0);

    for (let tick = 0; tick < params.lineOfSightBreakTicks - 1; tick += 1) {
      state = step(state, { actors: [wolf], queries: blockedWorld });
    }
    expect(state.mode).toBe("attending");
  });
});

describe("switching", () => {
  const pack = [actorAt("left", -18, 7), actorAt("centre", 0, 6), actorAt("right", 18, 7)];
  const flickRight: AttendStickSample = { x: 0.95, y: 0.1 };
  const flickLeft: AttendStickSample = { x: -0.95, y: 0.1 };

  it("switches on a flick edge and applies the 12 tick cooldown", () => {
    const attending = attendTo(pack);
    expect(attending.targetId).toBe("centre");

    const switched = step(attending, { actors: pack, stick: flickRight });
    expect(switched.targetId).toBe("right");
    expect(switched.switchCooldownTicks).toBe(params.switchCooldownTicks);
  });

  it("ignores a held stick — the flick must be a fresh edge", () => {
    let state = step(attendTo(pack), { actors: pack, stick: flickRight });
    for (let tick = 0; tick < params.switchCooldownTicks + 4; tick += 1) {
      state = step(state, { actors: pack, stick: flickRight });
    }
    expect(state.targetId).toBe("right");
  });

  it("refuses a second switch until the 12 tick cooldown expires", () => {
    const idleTicks = (state: AttendState, ticks: number): AttendState => {
      let advanced = state;
      for (let tick = 0; tick < ticks; tick += 1) {
        advanced = step(advanced, { actors: pack });
      }
      return advanced;
    };

    const switched = step(attendTo(pack), { actors: pack, stick: flickRight });
    expect(switched.switchCooldownTicks).toBe(params.switchCooldownTicks);

    const tooEarly = idleTicks(switched, params.switchCooldownTicks - 2);
    expect(step(tooEarly, { actors: pack, stick: flickLeft }).targetId).toBe("right");

    const ready = idleTicks(switched, params.switchCooldownTicks - 1);
    expect(step(ready, { actors: pack, stick: flickLeft }).targetId).toBe("centre");
  });

  it("ignores flicks steeper than 45 degrees off horizontal", () => {
    const vertical: AttendStickSample = { x: 0.3, y: 0.9 };
    expect(step(attendTo(pack), { actors: pack, stick: vertical }).targetId).toBe("centre");
  });

  it("keeps the target when the flicked side is empty", () => {
    const attending = step(attendTo(pack), { actors: pack, stick: flickRight });
    let state = attending;
    for (let tick = 0; tick < params.switchCooldownTicks; tick += 1) {
      state = step(state, { actors: pack });
    }
    expect(step(state, { actors: pack, stick: flickRight }).targetId).toBe("right");
  });
});

describe("target death", () => {
  const dead = actorAt("wolf", 0, 6, false);

  it("re-acquires a living actor within 8m of the corpse", () => {
    const state = step(attendTo([wolf]), {
      actors: [dead, { id: "pack-mate", alive: true, position: { x: 4, y: 0, z: -6 } }],
    });
    expect(state.mode).toBe("attending");
    expect(state.targetId).toBe("pack-mate");
  });

  it("re-acquires late inside the 20 tick window", () => {
    let state = step(attendTo([wolf]), { actors: [dead] });
    expect(state.mode).toBe("reacquiring");

    for (let tick = 0; tick < params.reacquireWindowTicks - 2; tick += 1) {
      state = step(state, { actors: [dead] });
      expect(state.mode).toBe("reacquiring");
    }

    const recovered = step(state, {
      actors: [dead, { id: "late", alive: true, position: { x: 0, y: 0, z: -8 } }],
    });
    expect(recovered.targetId).toBe("late");
  });

  it("drops attend when the window expires with nothing in reach", () => {
    let state = attendTo([wolf]);
    for (let tick = 0; tick < params.reacquireWindowTicks; tick += 1) {
      state = step(state, { actors: [dead] });
    }
    expect(state.mode).toBe("idle");
    expect(state.targetId).toBeNull();
  });

  it("ignores survivors beyond the 8m radius", () => {
    const state = step(attendTo([wolf]), {
      actors: [dead, { id: "distant", alive: true, position: { x: 0, y: 0, z: -14.01 } }],
    });
    expect(state.mode).toBe("reacquiring");
  });

  it("treats a vanished actor as a death and re-acquires from its last seen spot", () => {
    const state = step(attendTo([wolf]), {
      actors: [{ id: "pack-mate", alive: true, position: { x: 0, y: 0, z: -9 } }],
    });
    expect(state.targetId).toBe("pack-mate");
  });
});

describe("determinism", () => {
  it("produces identical state from identical inputs regardless of actor order", () => {
    const pack = [actorAt("wolf-b", -12, 7), actorAt("wolf-a", 12, 7)];
    const forward = attendTo(pack);
    const reversed = attendTo([...pack].reverse());
    expect(forward).toEqual(reversed);
    expect(forward.targetId).toBe("wolf-a");
  });

  it("never mutates the state handed to it", () => {
    const before = createAttendState();
    const snapshot = { ...before };
    step(before, { actors: [wolf], attendPressed: true });
    expect(before).toEqual(snapshot);
  });
});
