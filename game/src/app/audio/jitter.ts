/** Deterministic pitch jitter. Seeded from sim tick + cue id — never Math.random. */

const asUint32 = (value: number): number => value >>> 0;

export const hashTickSeed = (tick: number, cueId: string): number => {
  let hash = asUint32(Math.imul(asUint32(tick), 0x9e37_79b9) ^ 0x85eb_ca6b);
  for (let index = 0; index < cueId.length; index += 1) {
    hash = asUint32(Math.imul(hash ^ cueId.charCodeAt(index), 0x0100_0193));
  }
  return hash === 0 ? 0x6d2b_79f5 : hash;
};

/** Convert cents to a playback-rate multiplier. */
export const pitchRateFromSeed = (seed: number, jitterCents: number): number => {
  if (jitterCents === 0) {
    return 1;
  }
  const unit = (seed & 0xffff) / 0xffff;
  const cents = (unit * 2 - 1) * jitterCents;
  return 2 ** (cents / 1200);
};
