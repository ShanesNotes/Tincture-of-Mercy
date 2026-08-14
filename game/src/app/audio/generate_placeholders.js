#!/usr/bin/env node
/**
 * Deterministic placeholder cue generator.
 *
 * Seeded from cue id (FNV-1a). Never Math.random. Swapping a cue to ElevenLabs
 * content later is a data change on audio_params.json `file` only.
 *
 * Usage (from game/): npm run audio:gen
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const gameRoot = join(here, "../../..");
const paramsPath = join(gameRoot, "src/data/audio_params.json");
const outDir = join(gameRoot, "assets/audio/placeholder");
const SAMPLE_RATE = 44100;

const fnv1a = (text) => {
  let hash = 0x811c_9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x0100_0193);
  }
  return hash >>> 0;
};

const mulberry = (seed) => {
  let state = seed >>> 0 || 0x6d2b_79f5;
  return () => {
    state = (state + 0x6d2b_79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

const encodeWav = (samples) => {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < samples.length; index += 1) {
    const clipped = Math.max(-1, Math.min(1, samples[index] ?? 0));
    buffer.writeInt16LE(Math.round(clipped * 32767), 44 + index * 2);
  }
  return buffer;
};

const durationFor = (cue) => {
  if (cue.loop) {
    return 2;
  }
  if (cue.voiceClass === "sting") {
    return 0.85;
  }
  if (cue.voiceClass === "vocal") {
    return cue.file.includes("howl") ? 0.7 : 0.28;
  }
  if (cue.voiceClass === "impact") {
    return cue.layer === "impact" ? 0.09 : 0.16;
  }
  if (cue.file.includes("chime")) {
    return 0.45;
  }
  if (cue.file.includes("flask")) {
    return 0.22;
  }
  return 0.18;
};

const synth = (cueId, cue) => {
  const seconds = durationFor(cue);
  const count = Math.round(SAMPLE_RATE * seconds);
  const samples = new Float32Array(count);
  const rand = mulberry(fnv1a(cueId));
  const baseHz = 80 + (fnv1a(`${cueId}:hz`) % 720);
  const voice = cue.voiceClass;

  for (let index = 0; index < count; index += 1) {
    const t = index / SAMPLE_RATE;
    const env = cue.loop
      ? 0.35 + 0.08 * Math.sin((2 * Math.PI * index) / count)
      : Math.exp(-t * (voice === "sting" ? 2.2 : voice === "impact" ? 28 : 12));
    let sample = 0;
    if (voice === "impact") {
      const bright = cue.layer === "impact" ? 1800 : 420;
      sample = (rand() * 2 - 1) * Math.exp(-t * (bright / 80));
      sample += 0.35 * Math.sin(2 * Math.PI * baseHz * t) * env;
    } else if (voice === "vocal") {
      sample =
        0.55 * Math.sin(2 * Math.PI * (90 + (fnv1a(cueId) % 70)) * t) +
        0.25 * Math.sin(2 * Math.PI * (180 + (fnv1a(cueId) % 40)) * t * (1 + t * 0.15)) +
        0.2 * (rand() * 2 - 1);
    } else if (voice === "sting") {
      const drop = 196 * (1 - t * 0.55);
      sample = 0.6 * Math.sin(2 * Math.PI * drop * t) + 0.25 * Math.sin(2 * Math.PI * (drop * 1.5) * t);
    } else if (voice === "ambience") {
      const brown = (samples[index - 1] ?? 0) * 0.88 + (rand() * 2 - 1) * 0.12;
      const hum = 0.15 * Math.sin(2 * Math.PI * (cueId.includes("hearth") ? 55 : cueId.includes("wither") ? 42 : 68) * t);
      sample = brown * 0.7 + hum;
    } else if (cue.file.includes("chime")) {
      sample =
        0.5 * Math.sin(2 * Math.PI * 988 * t) * Math.exp(-t * 4) +
        0.35 * Math.sin(2 * Math.PI * 1480 * t) * Math.exp(-t * 5);
    } else if (cue.file.includes("scritch") || cue.file.includes("page")) {
      sample = (rand() * 2 - 1) * Math.exp(-t * 18) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 40 * t));
    } else {
      sample = (rand() * 2 - 1) * 0.7 + 0.2 * Math.sin(2 * Math.PI * baseHz * t);
    }
    samples[index] = sample * env * 0.55;
  }

  if (cue.loop) {
    const fade = Math.floor(SAMPLE_RATE * 0.04);
    for (let index = 0; index < fade; index += 1) {
      const w = index / fade;
      const a = samples[index] ?? 0;
      const b = samples[count - fade + index] ?? 0;
      const mixed = a * w + b * (1 - w);
      samples[index] = mixed;
      samples[count - fade + index] = mixed;
    }
  }

  return samples;
};

const main = () => {
  const params = JSON.parse(readFileSync(paramsPath, "utf8"));
  mkdirSync(outDir, { recursive: true });
  const cues = Object.entries(params.cues);
  for (const [cueId, cue] of cues) {
    const fileName = String(cue.file).replace(/^placeholder\//, "");
    writeFileSync(join(outDir, fileName), encodeWav(synth(cueId, cue)));
  }

  const readme = `# Placeholder audio

Generated by \`npm run audio:gen\` (\`src/app/audio/generate_placeholders.js\`).

- 44.1 kHz 16-bit mono PCM WAV
- One file per cue in \`src/data/audio_params.json\`
- Deterministic: FNV-1a(cue id) seeds a Mulberry32 stream. Re-running the generator is byte-stable.
- Shaped noise / tone bursts, distinguishable by voice class (impact, foley, vocal, ui, ambience, sting).
- Register: damp November, liturgical echoes — short, quiet, no bombast.
- Wave 2 (ElevenLabs) replaces these files; the mapping table \`file\` field is the only swap.

Cues: ${cues.length}
`;
  writeFileSync(join(dirname(outDir), "README.md"), readme);
  process.stdout.write(`audio:gen wrote ${String(cues.length)} wavs to ${outDir}\n`);
};

main();
