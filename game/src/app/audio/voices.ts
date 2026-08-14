import type { VoiceClass, VoiceSlot } from "./types";

export interface VoiceAdmitResult {
  readonly active: readonly VoiceSlot[];
  readonly evicted: VoiceSlot | null;
  readonly admitted: boolean;
}

const compareEvict = (left: VoiceSlot, right: VoiceSlot): number => {
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }
  return left.startedTick - right.startedTick;
};

export const admitVoice = (
  active: readonly VoiceSlot[],
  incoming: VoiceSlot,
  caps: Readonly<Record<VoiceClass, number>>,
): VoiceAdmitResult => {
  const cap = caps[incoming.voiceClass];
  const sameClass = active.filter((slot) => slot.voiceClass === incoming.voiceClass);
  if (sameClass.length < cap) {
    return { active: [...active, incoming], evicted: null, admitted: true };
  }

  const victim = [...sameClass].sort(compareEvict)[0];
  if (victim === undefined || victim.priority > incoming.priority) {
    return { active, evicted: null, admitted: false };
  }

  return {
    active: [...active.filter((slot) => slot.id !== victim.id), incoming],
    evicted: victim,
    admitted: true,
  };
};

export const releaseVoice = (active: readonly VoiceSlot[], id: string): readonly VoiceSlot[] =>
  active.filter((slot) => slot.id !== id);
