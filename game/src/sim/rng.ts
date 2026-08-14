export const RNG_STATE_VERSION = 1 as const;

export interface RngState {
  readonly state: number;
  readonly version: typeof RNG_STATE_VERSION;
}

const ZERO_SEED_FALLBACK = 0x6d2b_79f5;

const asUint32 = (value: number): number => value >>> 0;

export class SeededRng {
  private state: number;

  public constructor(seed: number) {
    const normalized = asUint32(seed);
    this.state = normalized === 0 ? ZERO_SEED_FALLBACK : normalized;
  }

  public static fromState(dto: RngState): SeededRng {
    if (dto.version !== RNG_STATE_VERSION) {
      throw new Error(`Unsupported RNG state version: ${String(dto.version)}`);
    }

    const rng = new SeededRng(dto.state);
    rng.state = asUint32(dto.state);
    return rng;
  }

  public nextUint32(): number {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = asUint32(value);
    return this.state;
  }

  public serialize(): RngState {
    return { state: this.state, version: RNG_STATE_VERSION };
  }
}
