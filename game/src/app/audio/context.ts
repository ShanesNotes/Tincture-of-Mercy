export type ContextState = "suspended" | "running" | "closed" | "interrupted";

export interface GainPort {
  readonly gain: { value: number };
}

export interface BufferSourcePort {
  playbackRate: { value: number };
  loop: boolean;
  onended: (() => void) | null;
  connect(node: GainPort): void;
  start(when: number): void;
  stop(when?: number): void;
}

export interface AudioContextPort {
  readonly currentTime: number;
  readonly state: ContextState;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  createGain(): GainPort;
  createBufferSource(): BufferSourcePort;
}

export const isBrowserAudioContextAvailable = (): boolean =>
  typeof globalThis !== "undefined" && "AudioContext" in globalThis;

export const createBrowserAudioContext = (): AudioContextPort | null => {
  if (!isBrowserAudioContextAvailable()) {
    return null;
  }
  const Ctor = (globalThis as { AudioContext: new () => AudioContext }).AudioContext;
  return new Ctor() as unknown as AudioContextPort;
};

/** Headless stand-in: records start() times, never plays. */
export class FakeAudioContext implements AudioContextPort {
  public currentTime = 0;
  public state: ContextState = "suspended";
  public readonly started: { when: number; rate: number; loop: boolean }[] = [];
  public readonly stopped: number[] = [];

  public resume = async (): Promise<void> => {
    this.state = "running";
  };

  public suspend = async (): Promise<void> => {
    this.state = "suspended";
  };

  public createGain(): GainPort {
    return { gain: { value: 1 } };
  }

  public createBufferSource(): BufferSourcePort {
    const started = this.started;
    const stopped = this.stopped;
    const source: BufferSourcePort = {
      playbackRate: { value: 1 },
      loop: false,
      onended: null,
      connect: () => undefined,
      start: (when: number) => {
        started.push({ when, rate: source.playbackRate.value, loop: source.loop });
      },
      stop: (when?: number) => {
        stopped.push(when ?? 0);
        source.onended?.();
      },
    };
    return source;
  }
}
