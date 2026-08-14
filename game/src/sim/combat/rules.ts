import type { CombatData } from "./data";
import type { CombatRules } from "./engine";

export const combatRulesFromData = (data: CombatData): CombatRules => {
  const moves: Record<string, CombatRules["moves"][string]> = {};
  for (const [id, move] of Object.entries(data.frameData.moves)) {
    moves[id] = {
      action: {
        active: move.activeTicks,
        recovery: move.recoveryTicks,
        startup: move.startupTicks,
      },
      activeWindows: move.activeWindows.map(([startTick, endTickExclusive]) => ({
        endTickExclusive,
        startTick,
      })),
      breathCost: move.breathCost,
      chargeHoldMaxTicks: move.chargeHoldMaxTicks,
      committed:
        move.tags.includes("critical") ||
        move.tags.includes("flask") ||
        move.tags.includes("ember") ||
        move.kind === "reaction",
      hyperarmorPoise: move.hyperarmorPoise,
      ...(move.hyperarmorWindow === null
        ? {}
        : {
            hyperarmorWindow: {
              endTickExclusive: move.hyperarmorWindow[1],
              startTick: move.hyperarmorWindow[0],
            },
          }),
      reHitLockoutTicks: move.reHitLockoutTicks,
      ...(id === "roll"
        ? {
            cancelRules: [
              {
                fromTick: data.params.rolls.bands.medium.attackCancelFromTick,
                into: "attack",
              },
            ],
          }
        : {}),
      ...(move.iframes[0] === undefined
        ? {}
        : {
            iframeWindow: {
              endTickExclusive: move.iframes[0][1],
              startTick: move.iframes[0][0],
            },
          }),
      ...(move.trackingUntilTick === null
        ? {}
        : { trackingUntilTick: move.trackingUntilTick }),
      trackingWindows: move.trackingWindows.map(([startTick, endTickExclusive]) => ({
        endTickExclusive,
        startTick,
      })),
      turnRateRadiansPerTick: move.turnRateRadiansPerTick,
    };
  }

  for (const band of ["light", "medium", "heavy"] as const) {
    const authored = data.params.rolls.bands[band];
    const id = `roll_${band}`;
    moves[id] = {
      action: {
        active: authored.iframes[1] - authored.iframes[0],
        recovery: authored.totalTicks - authored.iframes[1],
        startup: authored.iframes[0],
      },
      activeWindows: [
        {
          endTickExclusive: authored.iframes[1],
          startTick: authored.iframes[0],
        },
      ],
      breathCost: authored.breathCost,
      cancelRules: [
        { fromTick: authored.attackCancelFromTick, into: "attack" },
        { fromTick: authored.actionableFromTick, into: "flask" },
        { fromTick: authored.actionableFromTick, into: "roll" },
      ],
      chargeHoldMaxTicks: 0,
      hyperarmorPoise: 0,
      iframeWindow: {
        endTickExclusive: authored.iframes[1],
        startTick: authored.iframes[0],
      },
      reHitLockoutTicks: 0,
      trackingWindows: [],
      turnRateRadiansPerTick: 0,
    };
  }
  return {
    breath: {
      guardingMultiplier: data.params.breath.guardingRegenMultiplier,
      max: data.params.breath.baseMaximum,
      regenDelayTicks: data.params.breath.regenDelayTicks,
      regenPerSecond: data.params.breath.regenPerSecond,
      tickRate: data.params.tickHz,
    },
    bufferWindows: {
      attack: data.params.buffers.attackTicks,
      flask: data.params.buffers.flaskTicks,
      roll: data.params.buffers.rollTicks,
    },
    inputMoves: {
      attack: "light1",
      flask: data.params.flaskActions.drinkMoveId,
      roll: "roll_medium",
    },
    moves,
    recoveryCancelTailTicks: data.params.buffers.recoveryCancelTailTicks,
    rollMoves: {
      heavy: "roll_heavy",
      light: "roll_light",
      medium: "roll_medium",
    },
  };
};
