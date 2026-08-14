import { describe, expect, it } from "vitest";

import {
  advanceActionTick,
  canCancelAction,
  firstActionableTick,
  getActionPhase,
  getActionTotalTicks,
  inclusiveTickWindow,
  isActionActive,
  isCriticalIframe,
  isTickInWindow,
  type ActionFrameData,
  type ActionCancelRule,
} from "./action";

const light: ActionFrameData = { startup: 11, active: 4, recovery: 20 };

describe("action frame queries", () => {
  it("uses half-open startup, active, and recovery intervals", () => {
    expect(getActionTotalTicks(light)).toBe(35);
    expect(getActionPhase(light, 0)).toBe("startup");
    expect(getActionPhase(light, 10)).toBe("startup");
    expect(getActionPhase(light, 11)).toBe("active");
    expect(getActionPhase(light, 14)).toBe("active");
    expect(getActionPhase(light, 15)).toBe("recovery");
    expect(getActionPhase(light, 34)).toBe("recovery");
    expect(getActionPhase(light, 35)).toBe("complete");
    expect(isActionActive(light, 14)).toBe(true);
    expect(isActionActive(light, 15)).toBe(false);
  });

  it("converts inclusive authored intervals exactly once at the data edge", () => {
    const window = inclusiveTickWindow(2, 16);

    expect(window).toEqual({ startTick: 2, endTickExclusive: 17 });
    expect(isTickInWindow(1, window)).toBe(false);
    expect(isTickInWindow(2, window)).toBe(true);
    expect(isTickInWindow(16, window)).toBe(true);
    expect(isTickInWindow(17, window)).toBe(false);
  });

  it("applies recovery-tail and authored roll-cancel first-actionable ticks", () => {
    const rules: readonly ActionCancelRule[] = [
      { into: "attack", fromTick: 20 },
    ];
    const mediumRoll: ActionFrameData = {
      startup: 2,
      active: 13,
      recovery: 28,
    };

    expect(firstActionableTick(light, "attack", [], 6)).toBe(29);
    expect(canCancelAction(light, 28, "attack", [], 6)).toBe(false);
    expect(canCancelAction(light, 29, "attack", [], 6)).toBe(true);
    expect(firstActionableTick(mediumRoll, "attack", rules, 6)).toBe(20);
    expect(canCancelAction(mediumRoll, 19, "attack", rules, 6)).toBe(false);
    expect(canCancelAction(mediumRoll, 20, "attack", rules, 6)).toBe(true);
    expect(firstActionableTick(mediumRoll, "flask", rules, 6)).toBe(37);
  });

  it("freezes action clocks and exposes critical i-frames from inclusive data", () => {
    expect(advanceActionTick(12, true)).toBe(12);
    expect(advanceActionTick(12, false)).toBe(13);

    const criticalIframes = inclusiveTickWindow(0, 80);
    expect(isCriticalIframe(0, criticalIframes)).toBe(true);
    expect(isCriticalIframe(80, criticalIframes)).toBe(true);
    expect(isCriticalIframe(81, criticalIframes)).toBe(false);
  });
});
