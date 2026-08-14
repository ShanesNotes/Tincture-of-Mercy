import type { AudioDebugSnapshot, ScheduledDelta } from "./types";

export class AudioDebugHook {
  private readonly scheduled: ScheduledDelta[] = [];
  private unlocked = false;
  private paused = false;
  private reducedFeedback = false;
  private contextState = "suspended";

  public record(delta: ScheduledDelta): void {
    this.scheduled.push(delta);
  }

  public clearScheduled(): void {
    this.scheduled.length = 0;
  }

  public setLifecycle(flags: {
    unlocked?: boolean;
    paused?: boolean;
    reducedFeedback?: boolean;
    contextState?: string;
  }): void {
    if (flags.unlocked !== undefined) {
      this.unlocked = flags.unlocked;
    }
    if (flags.paused !== undefined) {
      this.paused = flags.paused;
    }
    if (flags.reducedFeedback !== undefined) {
      this.reducedFeedback = flags.reducedFeedback;
    }
    if (flags.contextState !== undefined) {
      this.contextState = flags.contextState;
    }
  }

  public snapshot(): AudioDebugSnapshot {
    const impact = this.scheduled.filter((entry) => entry.hitstopTicks > 0);
    const maxAbsImpactDeltaMs = impact.reduce(
      (max, entry) => Math.max(max, Math.abs(entry.deltaMs)),
      0,
    );
    return {
      unlocked: this.unlocked,
      paused: this.paused,
      reducedFeedback: this.reducedFeedback,
      contextState: this.contextState,
      scheduled: [...this.scheduled],
      maxAbsImpactDeltaMs,
    };
  }
}
