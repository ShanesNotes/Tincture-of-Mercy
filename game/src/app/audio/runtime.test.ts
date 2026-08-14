import { describe, expect, it } from "vitest";

import { FakeAudioContext } from "./context";
import { loadCommittedAudioParams } from "./load_params";
import { createAudioRuntime } from "./runtime";

const params = loadCommittedAudioParams();

class DeferredResumeContext extends FakeAudioContext {
  readonly #resumeGate: Promise<void>;
  readonly #resumeStarted: Promise<void>;
  #releaseResume: (() => void) | null = null;
  #markResumeStarted: (() => void) | null = null;

  public constructor() {
    super();
    this.#resumeGate = new Promise((resolve) => {
      this.#releaseResume = resolve;
    });
    this.#resumeStarted = new Promise((resolve) => {
      this.#markResumeStarted = resolve;
    });
  }

  public override resume = async (): Promise<void> => {
    this.#markResumeStarted?.();
    await this.#resumeGate;
    this.state = "running";
  };

  public waitForResume(): Promise<void> {
    return this.#resumeStarted;
  }

  public finishResume(): void {
    this.#releaseResume?.();
  }
}

const unlockedRuntime = async () => {
  const context = new FakeAudioContext();
  const runtime = createAudioRuntime({ params, context });
  await runtime.unlockFromGesture();
  context.currentTime = 0;
  runtime.syncClock(0, 0);
  return { context, runtime };
};

describe("audio runtime", () => {
  it("stays muted until a user gesture unlocks the context", async () => {
    const context = new FakeAudioContext();
    const runtime = createAudioRuntime({ params, context });
    runtime.ingest([{ type: "combat.hit", tick: 12, weight: "light" }]);
    expect(runtime.unlocked).toBe(false);
    expect(runtime.debug.snapshot().scheduled).toEqual([]);
    expect(context.started).toEqual([]);

    await runtime.unlockFromGesture();
    expect(runtime.unlocked).toBe(true);
    expect(context.state).toBe("running");

    runtime.ingest([{ type: "combat.hit", tick: 12, weight: "light" }]);
    const snap = runtime.debug.snapshot();
    expect(snap.scheduled.map((entry) => entry.cueId)).toEqual(["hit.light", "impact.light"]);
    expect(snap.maxAbsImpactDeltaMs).toBeLessThanOrEqual(params.clock.impactWindowMs);
    expect(context.started.length).toBe(2);
  });

  it("drops one-shots while paused and does not flush them on resume", async () => {
    const { context, runtime } = await unlockedRuntime();
    await runtime.setPaused(true);
    runtime.ingest([{ type: "combat.hit", tick: 20, weight: "heavy" }]);
    expect(runtime.debug.snapshot().scheduled).toEqual([]);
    expect(context.started).toEqual([]);

    await runtime.setPaused(false);
    expect(runtime.debug.snapshot().scheduled).toEqual([]);
    expect(context.started).toEqual([]);

    runtime.ingest([{ type: "combat.blocked", tick: 21 }]);
    expect(runtime.debug.snapshot().scheduled.some((entry) => entry.cueId === "hit.blocked")).toBe(
      true,
    );
  });

  it("exposes F4 scheduled-vs-spec deltas on the debug hook", async () => {
    const { runtime } = await unlockedRuntime();
    runtime.ingest([{ type: "combat.hit", tick: 30, weight: "charged" }]);
    const impact = runtime.debug.snapshot().scheduled.find((entry) => entry.cueId === "impact.charged");
    expect(impact).toBeDefined();
    expect(impact?.hitstopTicks).toBe(8);
    expect(Math.abs(impact?.deltaMs ?? 99)).toBeLessThanOrEqual(10);
  });

  it("does not restart ambience as a burst across pause", async () => {
    const { context, runtime } = await unlockedRuntime();
    runtime.ingest([{ type: "ambience.forest", tick: 0, on: true }]);
    expect(context.started.length).toBe(1);
    await runtime.setPaused(true);
    await runtime.setPaused(false);
    expect(context.started.length).toBe(1);
  });

  it("stops every live source and suspends its owned context on dispose", async () => {
    const { context, runtime } = await unlockedRuntime();
    runtime.ingest([
      { type: "ambience.forest", tick: 0, on: true },
      { type: "combat.hit", tick: 1, weight: "light" },
    ]);
    expect(context.started.length).toBe(3);

    await runtime.dispose();

    expect(context.stopped).toHaveLength(3);
    expect(context.state).toBe("suspended");
    expect(runtime.paused).toBe(true);
    expect(runtime.unlocked).toBe(false);
  });

  it("keeps disposal final when an audio resume is already in flight", async () => {
    const context = new DeferredResumeContext();
    const runtime = createAudioRuntime({ params, context });
    const unlocking = runtime.unlockFromGesture();
    await context.waitForResume();

    const disposing = runtime.dispose();
    context.finishResume();
    await Promise.all([unlocking, disposing]);

    expect(context.state).toBe("suspended");
    expect(runtime.paused).toBe(true);
    expect(runtime.unlocked).toBe(false);
  });
});
