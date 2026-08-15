/**
 * Type declarations for rows.js so the Vitest coverage in
 * src/view/register/gateRows.test.ts typechecks against the same contract
 * the node harness runs. Row shapes come from the s13 page module.
 */

import type { GateRow, RowMeasurement } from "../../src/view/register/gateRows";

/** One rendered HUD border screenshot in a named world state. */
export interface BorderShot {
  readonly state: string;
  readonly png: Uint8Array;
}

export declare const A5_MIN_STATES: number;

export declare function borderDiffMeasurements(
  shots: readonly BorderShot[],
): RowMeasurement[];

export declare function buildA5Row(shots: readonly BorderShot[], id?: string): GateRow;

export declare function buildFullA7Row(subRows: {
  readonly a1: GateRow;
  readonly a2: GateRow;
  readonly a3: GateRow;
  readonly a4: GateRow;
  readonly a5: GateRow;
  readonly a6: GateRow;
}): GateRow;

export declare function markPostOff(row: GateRow): GateRow;

export declare function assembleRows(
  baseRows: readonly GateRow[],
  a5Row: GateRow,
  a7Row: GateRow,
): GateRow[];
