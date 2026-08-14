import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseAudioParams } from "./params";
import type { AudioParams } from "./types";

export const loadCommittedAudioParams = (): AudioParams =>
  parseAudioParams(
    JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../data/audio_params.json"), "utf8"),
    ) as unknown,
  );
