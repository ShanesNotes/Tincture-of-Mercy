import { hashCanonical } from "../combat";
import type { WorldState } from "./types";

export const hashWorldState = (state: WorldState): string => hashCanonical(state);
