import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { createTickClock, mapTickToAudioTime } from "./clock";
import { FakeAudioContext } from "./context";
import { loadCommittedAudioParams } from "./load_params";
import {
  createMusicSystem,
  defaultMusicState,
  equalPowerCrossfade,
  fadeWeight,
  loopPeriodTicks,
  musicDuck,
  musicLayerGain,
  parseMusicParams,
  REQUIRED_TRACK_IDS,
  resolveTrack,
  type MusicParams,
  type MusicState,
} from "./music";

const here = dirname(fileURLToPath(import.meta.url));
const musicParamsPath = join(here, "../../data/music_params.json");
const musicAssets = join(here, "../../../assets/audio/music");
const audio = loadCommittedAudioParams();

const loadParams = (): MusicParams =>
  parseMusicParams(JSON.parse(readFileSync(musicParamsPath, "utf8")) as unknown);

const state = (partial: Partial<MusicState>): MusicState => ({
  ...defaultMusicState(),
  ...partial,
});

const unlockedSystem = async (params: MusicParams = loadParams()) => {
  const context = new FakeAudioContext();
  const system = createMusicSystem({ params, audioParams: audio, context });
  await system.unlockFromGesture();
  context.currentTime = 0;
  system.syncClock(0, 0);
  return { context, system, params };
};

describe("music_params schema + files", () => {
  it("parses the committed table and lists every required track", () => {
    const params = loadParams();
    expect(params.version).toBe(1);
    expect(params.tickHz).toBe(60);
    expect(params.ceremonySilence.fadeTicks).toBe(12);
    expect(params.ducking.deathSting).toBe(0.05);
    for (const id of REQUIRED_TRACK_IDS) {
      expect(params.tracks[id], id).toBeDefined();
      expect(params.tracks[id]?.loopEndSeconds ?? 0).toBeGreaterThan(
        params.tracks[id]?.loopStartSeconds ?? 1,
      );
    }
    expect(params.tracks.road_motif?.loop).toBe(false);
    expect(params.tracks.hearth_theme?.loop).toBe(true);
    expect(params.tracks.warden_ceremony?.loop).toBe(true);
  });

  it("points every track at an existing file under assets/audio/music", () => {
    const params = loadParams();
    for (const [id, track] of Object.entries(params.tracks)) {
      expect(existsSync(join(musicAssets, track.file)), `${id}:${track.file}`).toBe(true);
    }
  });

  it("rejects an unsupported version and a missing required track", () => {
    expect(() => parseMusicParams({ version: 99 })).toThrow(/unsupported version/);
    const raw = JSON.parse(readFileSync(musicParamsPath, "utf8")) as {
      tracks: Record<string, unknown>;
    };
    delete raw.tracks.warden_p2;
    expect(() => parseMusicParams(raw)).toThrow(/missing required track warden_p2/);
  });

  it("rejects a rule that names an unknown track", () => {
    const raw = JSON.parse(readFileSync(musicParamsPath, "utf8")) as {
      rules: { id: string; when: object; track: string | null }[];
    };
    raw.rules.unshift({ id: "bad", when: { zone: "arena" }, track: "does.not.exist" });
    expect(() => parseMusicParams(raw)).toThrow(/missing track does.not.exist/);
  });

  it("never calls Math.random on the music TypeScript path", () => {
    const files = readdirSync(here).filter((name) => name === "music.ts");
    expect(files).toEqual(["music.ts"]);
    expect(readFileSync(join(here, "music.ts"), "utf8")).not.toMatch(/Math\.random\s*\(/);
  });
});

describe("state → track", () => {
  const params = loadParams();

  it("keeps the road silent, including during wolf combat", () => {
    expect(resolveTrack(state({ zone: "road" }), params)).toBeNull();
    expect(resolveTrack(state({ zone: "road", inCombat: true }), params)).toBeNull();
    expect(resolveTrack(state({ zone: "forest", inCombat: true }), params)).toBeNull();
  });

  it("enters warden p1 on arena combat and leaves it when the fight is not latched", () => {
    expect(resolveTrack(state({ zone: "arena", inCombat: true }), params)).toBe("warden_p1");
    expect(resolveTrack(state({ zone: "arena", inCombat: false, bossPhase: 0 }), params)).toBeNull();
    expect(resolveTrack(state({ zone: "arena", bossPhase: 1, inCombat: false }), params)).toBe(
      "warden_p1",
    );
  });

  it("narrows to p2 on phase 2 and holds the ceremony bed over both phases", () => {
    expect(resolveTrack(state({ zone: "arena", bossPhase: 2 }), params)).toBe("warden_p2");
    expect(resolveTrack(state({ zone: "arena", bossPhase: 1, ceremony: true }), params)).toBe(
      "warden_ceremony",
    );
    expect(resolveTrack(state({ zone: "arena", bossPhase: 2, ceremony: true }), params)).toBe(
      "warden_ceremony",
    );
    expect(resolveTrack(state({ zone: "arena", bossPhase: 2, ceremony: false }), params)).toBe(
      "warden_p2",
    );
  });

  it("plays the hearth theme only while resting, even if the zone is the cabin", () => {
    expect(resolveTrack(state({ zone: "cabin", hearthRest: true }), params)).toBe("hearth_theme");
    expect(resolveTrack(state({ zone: "cabin", hearthRest: false }), params)).toBeNull();
    expect(
      resolveTrack(state({ zone: "arena", hearthRest: true, bossPhase: 1 }), params),
    ).toBe("hearth_theme");
  });

  it("licenses the road motif only at the threshold", () => {
    expect(resolveTrack(state({ zone: "threshold" }), params)).toBe("road_motif");
  });
});

describe("fade math", () => {
  it("is a closed unit ramp, deterministic for any tick pair", () => {
    expect(fadeWeight(0, 90)).toBe(0);
    expect(fadeWeight(45, 90)).toBe(0.5);
    expect(fadeWeight(90, 90)).toBe(1);
    expect(fadeWeight(180, 90)).toBe(1);
    expect(fadeWeight(-3, 90)).toBe(0);
    expect(fadeWeight(1, 0)).toBe(1);
    expect(fadeWeight(0, 0)).toBe(0);
    const mid = fadeWeight(30, 120);
    expect(fadeWeight(30, 120)).toBe(mid);
    expect(mid).toBe(0.25);
  });

  it("keeps equal-power energy at unity across the fade", () => {
    for (const elapsed of [0, 12, 45, 90]) {
      const pair = equalPowerCrossfade(elapsed, 90);
      expect(pair.incoming ** 2 + pair.outgoing ** 2).toBeCloseTo(1, 12);
    }
    expect(equalPowerCrossfade(0, 90).incoming).toBeCloseTo(0, 12);
    expect(equalPowerCrossfade(0, 90).outgoing).toBeCloseTo(1, 12);
    expect(equalPowerCrossfade(90, 90).incoming).toBeCloseTo(1, 12);
    expect(equalPowerCrossfade(90, 90).outgoing).toBeCloseTo(0, 12);
  });

  it("composes master × music bus × track × fade × duck without touching sfx/ambience buses", () => {
    const full = musicLayerGain(audio.buses.master, 0.2, 0.55, 1, 1);
    expect(full).toBeCloseTo(audio.buses.master * 0.2 * 0.55, 10);
    expect(full).toBeLessThan(audio.buses.sfx * 0.3);
    expect(musicLayerGain(1, 0.2, 0.55, 0.5, 0.05)).toBeCloseTo(0.2 * 0.55 * 0.5 * 0.05, 12);
  });

  it("replays a state timeline to the same gains", () => {
    const params = loadParams();
    const timeline: { tick: number; state: MusicState; sting: boolean }[] = [
      { tick: 0, state: state({ zone: "arena", inCombat: true }), sting: false },
      { tick: 90, state: state({ zone: "arena", bossPhase: 1, ceremony: true }), sting: false },
      { tick: 180, state: state({ zone: "arena", bossPhase: 2 }), sting: false },
      { tick: 270, state: state({ zone: "arena", bossPhase: 2 }), sting: true },
      { tick: 300, state: state({ hearthRest: true }), sting: false },
    ];
    const run = async () => {
      const { system } = await unlockedSystem(params);
      const rows: { tick: number; track: string | null; gains: number[] }[] = [];
      for (const step of timeline) {
        system.setState(step.state);
        system.setDeathSting(step.sting);
        system.syncClock(step.tick, step.tick / 60);
        const snap = system.snapshot();
        rows.push({
          tick: snap.tick,
          track: snap.track,
          gains: snap.layers.map((layer) => layer.gain),
        });
      }
      return rows;
    };
    return Promise.all([run(), run()]).then(([a, b]) => {
      expect(a).toEqual(b);
      expect(a.map((row) => row.track)).toEqual([
        "warden_p1",
        "warden_ceremony",
        "warden_p2",
        "warden_p2",
        "hearth_theme",
      ]);
    });
  });
});

describe("music system", () => {
  it("stays silent until unlock and then starts the latched track on the clock", async () => {
    const params = loadParams();
    const context = new FakeAudioContext();
    const system = createMusicSystem({ params, audioParams: audio, context });
    system.setState(state({ hearthRest: true }));
    system.syncClock(12, 0.2);
    expect(system.unlocked).toBe(false);
    expect(context.started).toEqual([]);
    expect(system.currentTrack).toBe("hearth_theme");

    await system.unlockFromGesture();
    system.syncClock(12, 0.2);
    expect(system.unlocked).toBe(true);
    expect(context.started.length).toBe(1);
    expect(context.started[0]?.loop).toBe(true);
    const clock = createTickClock(12, 0.2);
    expect(context.started[0]?.when).toBeCloseTo(mapTickToAudioTime(clock, 12), 8);
  });

  it("crossfades combat enter/exit and does not restart an already-latched p1", async () => {
    const { system, params, context } = await unlockedSystem();
    system.setState(state({ zone: "arena", inCombat: true }));
    system.syncClock(10, 10 / 60);
    expect(system.currentTrack).toBe("warden_p1");
    const started = context.started.length;

    system.setState(state({ zone: "arena", bossPhase: 1, inCombat: true }));
    system.syncClock(20, 20 / 60);
    expect(system.currentTrack).toBe("warden_p1");
    expect(context.started.length).toBe(started);

    system.setState(state({ zone: "arena", bossPhase: 0, inCombat: false }));
    system.syncClock(30, 30 / 60);
    const outgoing = system.snapshot().layers.find((layer) => layer.trackId === "warden_p1");
    expect(outgoing?.fadingOut).toBe(true);
    expect(outgoing?.fadeTicks).toBe(params.tracks.warden_p1?.fadeTicks);
    system.syncClock(30 + (params.tracks.warden_p1?.fadeTicks ?? 90), 2);
    expect(system.snapshot().layers.some((layer) => layer.trackId === "warden_p1")).toBe(false);
    expect(system.currentTrack).toBeNull();
  });

  it("applies the ceremony silence rule: p1 ducks to zero over 12t while the bed fades in", async () => {
    const { system, params } = await unlockedSystem();
    system.setState(state({ zone: "arena", bossPhase: 1 }));
    system.syncClock(0, 0);
    system.syncClock(90, 1.5);
    const p1Full = system.snapshot().layers.find((layer) => layer.trackId === "warden_p1")?.gain ?? 0;
    expect(p1Full).toBeGreaterThan(0);

    system.setState(state({ zone: "arena", bossPhase: 1, ceremony: true }));
    system.syncClock(100, 100 / 60);
    const atStart = system.snapshot();
    expect(atStart.track).toBe("warden_ceremony");
    const p1 = atStart.layers.find((layer) => layer.trackId === "warden_p1");
    const bed = atStart.layers.find((layer) => layer.trackId === "warden_ceremony");
    expect(p1?.fadingOut).toBe(true);
    expect(p1?.fadeTicks).toBe(params.ceremonySilence.fadeTicks);
    expect(p1?.gain).toBe(0);
    expect(bed?.gain).toBe(0);

    system.syncClock(106, 106 / 60);
    const mid = system.snapshot();
    const p1Mid = mid.layers.find((layer) => layer.trackId === "warden_p1");
    const bedMid = mid.layers.find((layer) => layer.trackId === "warden_ceremony");
    expect(p1Mid?.gain).toBe(0);
    expect(bedMid?.gain).toBeGreaterThan(0);
    expect(bedMid?.gain ?? 1).toBeLessThan(
      musicLayerGain(
        audio.buses.master,
        params.buses.music,
        params.tracks.warden_ceremony?.gain ?? 1,
        1,
        1,
      ),
    );

    system.syncClock(112, 112 / 60);
    const done = system.snapshot();
    expect(done.layers.some((layer) => layer.trackId === "warden_p1")).toBe(false);
    const bedDone = done.layers.find((layer) => layer.trackId === "warden_ceremony");
    expect(bedDone?.gain).toBeCloseTo(
      musicLayerGain(
        audio.buses.master,
        params.buses.music,
        params.tracks.warden_ceremony?.gain ?? 0,
        1,
        1,
      ),
      10,
    );
  });

  it("ducks every layer under the death sting without changing the track", async () => {
    const { system, params } = await unlockedSystem();
    system.setState(state({ hearthRest: true }));
    system.syncClock(0, 0);
    system.syncClock(120, 2);
    const before = system.snapshot().layers[0]?.gain ?? 0;
    expect(before).toBeGreaterThan(0);
    system.setDeathSting(true);
    const ducked = system.snapshot().layers[0]?.gain ?? 0;
    expect(system.currentTrack).toBe("hearth_theme");
    expect(ducked).toBeCloseTo(before * params.ducking.deathSting, 10);
    expect(musicDuck(params, true, false, false)).toBe(params.ducking.deathSting);
    system.setDeathSting(false);
    expect(system.snapshot().layers[0]?.gain).toBeCloseTo(before, 10);
  });

  it("plays the road motif once per threshold entry and not as a loop", async () => {
    const { system, context } = await unlockedSystem();
    system.setState(state({ zone: "threshold" }));
    system.syncClock(0, 0);
    expect(system.currentTrack).toBe("road_motif");
    expect(context.started[0]?.loop).toBe(false);
    const started = context.started.length;

    system.setState(state({ zone: "threshold" }));
    system.syncClock(8, 8 / 60);
    expect(context.started.length).toBe(started);

    system.setState(state({ zone: "road" }));
    system.syncClock(16, 16 / 60);
    expect(system.currentTrack).toBeNull();

    system.setState(state({ zone: "threshold" }));
    system.syncClock(24, 24 / 60);
    expect(system.currentTrack).toBe("road_motif");
    expect(context.started.length).toBe(started + 1);
  });

  it("schedules loop periods from the track table on the tick clock", async () => {
    const { system, params } = await unlockedSystem();
    system.setState(state({ hearthRest: true }));
    system.syncClock(0, 0);
    const hearth = params.tracks.hearth_theme;
    if (hearth === undefined) {
      throw new Error("hearth_theme missing");
    }
    const period = loopPeriodTicks(hearth, params.tickHz);
    const layer = system.snapshot().layers[0];
    expect(layer?.loop).toBe(true);
    expect(layer?.nextLoopTick).toBe(period);
    system.syncClock(period, period / 60);
    expect(system.snapshot().layers[0]?.nextLoopTick).toBe(period * 2);
  });

  it("drops one-shots on pause and rematerializes looping beds on resume", async () => {
    const { system, context } = await unlockedSystem();
    system.setState(state({ zone: "threshold" }));
    system.syncClock(0, 0);
    expect(context.started.length).toBe(1);
    await system.setPaused(true);
    expect(system.paused).toBe(true);
    expect(system.snapshot().layers.some((layer) => layer.trackId === "road_motif")).toBe(false);

    await system.setPaused(false);
    system.setState(state({ hearthRest: true }));
    system.syncClock(40, 40 / 60);
    const loops = context.started.length;
    await system.setPaused(true);
    await system.setPaused(false);
    expect(context.started.length).toBeGreaterThanOrEqual(loops);
    expect(system.snapshot().layers.some((layer) => layer.trackId === "hearth_theme")).toBe(true);
  });

  it("is a no-op bindVisibility in node and does not throw", async () => {
    const { system } = await unlockedSystem();
    const unbind = system.bindVisibility();
    expect(typeof unbind).toBe("function");
    unbind();
  });
});
