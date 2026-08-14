import { TICK_MS } from "../sim/tick";

const MAX_CATCH_UP_TICKS = 5;
const MAX_ACCUMULATED_MS = TICK_MS * MAX_CATCH_UP_TICKS;
const FLOAT_EPSILON_MS = 1e-9;

export interface LoopCallbacks {
  readonly render: (alpha: number) => void;
  readonly sampleInput: () => void;
  readonly step: () => void;
  /** Polled while visibly paused so a gamepad edge can resume the loop. */
  readonly pollResumeInput?: () => boolean;
  readonly onPauseChange?: (paused: boolean) => void;
}

export interface FramePacingCounters {
  readonly alpha: number;
  readonly clampedFrames: number;
  readonly discardedMs: number;
  readonly renderFrames: number;
  readonly simTicks: number;
}

export class FixedTickLoop {
  private accumulatorMs = 0;
  private awaitingInput = false;
  private clampedFrames = 0;
  private discardedMs = 0;
  private hidden = false;
  private menuPaused = false;
  private paused = false;
  private renderFrames = 0;
  private simTicks = 0;

  public constructor(private readonly callbacks: LoopCallbacks) {}

  public get awaitingResumeInput(): boolean {
    return this.awaitingInput;
  }

  public get isPaused(): boolean {
    return this.paused;
  }

  public get counters(): FramePacingCounters {
    return {
      alpha: this.accumulatorMs / TICK_MS,
      clampedFrames: this.clampedFrames,
      discardedMs: this.discardedMs,
      renderFrames: this.renderFrames,
      simTicks: this.simTicks,
    };
  }

  public advance(elapsedMs: number): void {
    if (this.paused) {
      return;
    }
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
      throw new Error("Frame elapsed time must be a finite non-negative number.");
    }

    this.callbacks.sampleInput();
    const accumulated = this.accumulatorMs + elapsedMs;
    if (accumulated > MAX_ACCUMULATED_MS) {
      this.clampedFrames += 1;
      this.discardedMs += accumulated - MAX_ACCUMULATED_MS;
      this.accumulatorMs = MAX_ACCUMULATED_MS;
    } else {
      this.accumulatorMs = accumulated;
    }

    while (this.accumulatorMs + FLOAT_EPSILON_MS >= TICK_MS) {
      this.callbacks.step();
      this.simTicks += 1;
      this.accumulatorMs -= TICK_MS;
      if (Math.abs(this.accumulatorMs) < FLOAT_EPSILON_MS) {
        this.accumulatorMs = 0;
      }
      // A step may open a menu, which pauses and resets the accumulator. Leave
      // the catch-up loop at once rather than subtracting a tick it never ran:
      // that is what drove the interpolation alpha negative.
      if (this.paused) break;
    }

    this.renderFrames += 1;
    this.callbacks.render(Math.max(0, this.accumulatorMs) / TICK_MS);
  }

  public setVisibility(hidden: boolean): void {
    this.accumulatorMs = 0;
    if (hidden) {
      this.hidden = true;
      this.setPaused(true);
      this.awaitingInput = false;
      return;
    }

    if (this.hidden) {
      this.hidden = false;
      this.setPaused(true);
      this.awaitingInput = true;
    }
  }

  /** Check non-DOM input sources without advancing time while paused. */
  public pollForResumeInput(): void {
    if (this.awaitingInput && this.callbacks.pollResumeInput?.() === true) {
      this.resumeFromInput();
    }
  }

  /**
   * An open menu is a deliberate pause, not a lost-focus one: it must survive
   * the ambient keydown/pointerdown that resumes a focus pause.
   */
  public setMenuPaused(paused: boolean): void {
    this.accumulatorMs = 0;
    this.menuPaused = paused;
    this.awaitingInput = false;
    this.setPaused(paused || this.hidden);
  }

  public resumeFromInput(): void {
    if (!this.awaitingInput || this.menuPaused) {
      return;
    }
    this.accumulatorMs = 0;
    this.awaitingInput = false;
    this.setPaused(false);
  }

  public pauseUntilInput(): void {
    this.accumulatorMs = 0;
    this.awaitingInput = true;
    this.setPaused(true);
  }

  private setPaused(paused: boolean): void {
    if (this.paused === paused) {
      return;
    }
    this.paused = paused;
    this.callbacks.onPauseChange?.(paused);
  }
}

export interface AnimationLoopHandle {
  readonly stop: () => void;
}

export const startAnimationLoop = (loop: FixedTickLoop): AnimationLoopHandle => {
  let animationFrame = 0;
  let lastTimestamp: number | undefined;

  const frame = (timestamp: number): void => {
    if (loop.isPaused) {
      lastTimestamp = undefined;
      if (!document.hidden) {
        loop.pollForResumeInput();
      }
    } else if (lastTimestamp === undefined) {
      lastTimestamp = timestamp;
      loop.advance(0);
    } else {
      loop.advance(timestamp - lastTimestamp);
      lastTimestamp = timestamp;
    }
    animationFrame = requestAnimationFrame(frame);
  };

  const onVisibilityChange = (): void => {
    loop.setVisibility(document.hidden);
    lastTimestamp = undefined;
  };
  const onResumeInput = (): void => {
    loop.resumeFromInput();
    lastTimestamp = undefined;
  };
  const onBlur = (): void => {
    loop.pauseUntilInput();
    lastTimestamp = undefined;
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("blur", onBlur);
  window.addEventListener("keydown", onResumeInput);
  window.addEventListener("pointerdown", onResumeInput);
  animationFrame = requestAnimationFrame(frame);

  return {
    stop: () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onResumeInput);
      window.removeEventListener("pointerdown", onResumeInput);
    },
  };
};
