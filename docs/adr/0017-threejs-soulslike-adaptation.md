# ADR 0017 — three.js souls-like adaptation is the active game direction

Status: accepted (Shane, 2026-08-13; council-ratified same day)

## Context
STORY_RESCUE_PLAN (2026-06-11, accepted) froze the Godot build, directed the story to be finished as prose, and declared any future game "an adaptation of the story." On 2026-08-13 Shane ordered that adaptation: resurrect the game with the lore intact, scrap the care-mechanic substrate, and rebuild gameplay as a souls-like (Elden Ring bar) coded entirely in three.js, with the Tincture functioning as the flask and art strictly in the illuminated fairy-tale register of the Symbolic World Press plates (style emulation only — never copying the copyrighted pages). Hard decisions were delegated to a four-model council (Codex xhigh, Grok, Kimi, Opus 5; Fable chairing) with no human-in-the-loop portions.

## Decision
- The active build is `game/` — three.js (pinned 0.185.1) + three-mesh-bvh, WebGPU/TSL with WebGL2 fallback, Vite/TS-strict/Vitest/Playwright, own CI lane. No code ports from the Godot/C# tree, which remains provenance alongside `design_system/v0_9_mercy_rpg_substrate/` and earlier packets.
- Architecture: pure deterministic 60Hz sim (Odyssey lineage) with genre-new machinery — tick-synchronized input buffering, sim-owned animation phase clocks and per-actor hitstop, analytic swept-capsule combat, custom capsule controller, no physics engine.
- Character animation: first-party Blender rigs/clips, GLB as in-house build artifact + sim-consumed sidecar frame data, CI hash-gated, proportion/silhouette/face laws from the symbolic-world grammar; third-party animation banned for the cast.
- Presentation: renderer law set L1–L12 (palette covenant, emblem light, quantized depth bands, ink outline, no camera shake, diegetic border HUD) — the flat-stage grammar translated to a free souls camera by staging the world, not fixing the camera.
- Fiction mapping ruled by council: Names/Open Page/Hearth/Attend/the Turn/Burden bands; the flask is Anna's medicine; Ember costs permanent Numbness including world-text register degradation; slice = Ironwood leg ending at the Warden of the Ironwood and Birdie's apple refusal.
- Quality: measurable latency/feel/art/perf gates + cross-seat adversarial audit, looped to two consecutive clean rounds ("the gauntlet").

Binding detail lives in `design_system/v1_0_threejs_soulslike/` (DECISIONS, PRD, GATES, TUNING_V0, ENCOUNTERS).

## Consequences
- `design_system/v1_0_threejs_soulslike/` is the ACTIVE packet; v0.9 is provenance. Story canon (lore surface, cast bible, ADRs 0004–0008) is unchanged and binding on adaptation content.
- The care-verb substrate is not ported; Anna's gravity encounter survives as the one staged presence-verb scene (ADR 0007 spirit) and care beats fold into the prologue as item verbs.
- `anti_drift.py` scope remains `design_system`; it does not govern `game/`. The Godot CI lane and the `game/` CI lane are independent.
- Scanned plates and their 1:1 derivatives never enter `game/` or any shipped artifact.
