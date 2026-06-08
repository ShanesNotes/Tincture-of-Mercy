---
title: "Sprite and PixelLab pipeline architecture directions"
tags: ["sprites", "pixellab", "aseprite", "asset-pipeline", "architecture", "ralplan-input"]
created: 2026-05-10T16:01:11.673Z
updated: 2026-05-10T16:01:11.673Z
sources: ["CONTEXT.md", "docs/adr/0002-active-canon-routing.md", "design_system/v0_9_mercy_rpg_substrate/10-asset-pipeline.md", "tools/sprites/pixellab.py", "tools/sprites/make_runtime_sprite.py", "tools/sprites/validate_sprite.py", "tools/sprites/cli.py", "tools/sprites/specs/kalev.json", "/home/ark/Downloads/PixelLab.aseprite-extension"]
links: []
category: decision
confidence: medium
schemaVersion: 1
---

# Sprite and PixelLab pipeline architecture directions

# Sprite and PixelLab pipeline architecture directions

Captured before ralplan. This is not an approved implementation plan; it is a durable architecture finding set for later planning.

## Context

The active art pipeline supports source intake, deterministic runtime conversion, validation, Aseprite polish scripts, PixelLab REST generation, and a downloaded PixelLab Aseprite extension. The domain framing should keep generated art as source intake unless/until it passes the runtime sheet contract.

Relevant domain terms: source intake, active packet, mercy RPG vertical slice, combat system, shared substrate.

## Current evidence

- `tools/sprites/pixellab.py` owns PixelLab REST auth, job polling, character state, frame download, frame fitting, palette snapping, runtime sheet writing, and PixelLab CLI subcommands.
- `tools/sprites/make_runtime_sprite.py` owns deterministic high-res source to runtime conversion, including background removal, main-subject isolation, runtime cell fitting, baseline anchoring, palette quantization, and validation handoff.
- `tools/sprites/validate_sprite.py` is the runtime acceptance surface used by CLI, health, catalog, and export flows.
- `tools/sprites/specs/*.json` define frame dimensions, baseline, grid shape, pass names, and animation keys.
- `tools/sprites/specs/kalev.json` includes idle/walk plus future care/tincture/combat animation keys; `tools/sprites/pixellab.py` currently maps only idle/walk keys.
- `tools/sprites/aseprite_scripts/` contains project-specific, spec-aware Lua automation.
- `/home/ark/Downloads/PixelLab.aseprite-extension` contains a large PixelLab Aseprite plugin with generation, animation, rotation, resize, inpaint, skeleton, template, and WebSocket logic; it is powerful but not project-spec-aware.
- `tools/sprites/README.md` and `design_system/v0_9_mercy_rpg_substrate/10-asset-pipeline.md` document the core sprite/Aseprite pipeline but do not yet give PixelLab the same durable read-path prominence.

## Deepening opportunities

### 1. PixelLab generation run Module

Problem: `cmd_generate` is shallow because callers/tests must understand env config, state existence, pass canvas compatibility, animation mapping, HTTP request shapes, polling, download, fitting, quantization, and state update ordering.

Direction: create a deeper PixelLab generation run Module whose Interface is intent-shaped: character, pass, seed/cost/dry-run options, and output policy. Its Implementation owns REST/MCP/manual adapters, polling, artifacts, provenance, and final runtime handoff.

Expected leverage: one place to absorb PixelLab response-shape changes, rate limits, retries, raw artifact preservation, and future MCP integration.

### 2. Runtime sheet assembly Module

Problem: runtime sheet rules are split between deterministic conversion and PixelLab assembly. Baseline anchoring, alpha crop, fit-to-cell, palette snapping, and validation should have stronger locality.

Direction: create a shared assembly Module with Interface like frames + CharacterSpec/pass + output policy -> runtime sheet/report. PixelLab generated frames, Aseprite extension exports, manual frame folders, and high-res source conversion should all pass through the same runtime contract where possible.

Expected leverage: one implementation for baseline, palette, missing-frame padding, and validation behavior across every source intake path.

### 3. Animation key catalog Module

Problem: project specs already describe care/tincture/combat keys, but PixelLab only maps idle/walk. This will block later pass generation and force ad hoc edits.

Direction: move animation-key knowledge into a data-backed catalog: project animation key -> PixelLab template/action/direction/frame policy/fallbacks/cost expectations. The PixelLab extension's `template_info.lua` can seed possible template IDs, but project specs should own final semantics.

Expected leverage: dry-run cost previews, generation, documentation, and validation can share one catalog.

### 4. Art source intake provenance Module

Problem: paid generation artifacts are not preserved as a cohesive run record. Character state stores ids, but raw request/response payloads, downloaded raw frames, normalized cells, prompts, seeds, costs, and validator results are not one durable source intake object.

Direction: introduce per-run source intake records under character drafts or a generated-art ledger. Store prompts, seeds, PixelLab ids, raw frames, normalized frames, runtime output path, validation result, and preview/catalog links.

Expected leverage: reduced paid regeneration, better auditing, better visual comparison, and easier rollback.

### 5. Aseprite extension bridge Module

Problem: the project has two Lua worlds: spec-aware project scripts and the broad PixelLab extension. Without a bridge, extension outputs can bypass project validation or become manual one-offs.

Direction: treat the PixelLab Aseprite extension as an interactive source generator. Bridge its outputs into source intake, frame assembly, preview, compare, validate, and catalog. Keep project runtime sheets produced by the canonical pipeline, not by extension assumptions.

Expected leverage: use the full PixelLab extension while keeping runtime assets spec-clean.

### 6. PixelLab art-pipeline read path

Problem: docs and command surfaces make Aseprite/convert/validate easy to discover, while PixelLab is mostly code/help discoverable.

Direction: update the durable read path so a future agent understands: PixelLab/MCP/extension -> source intake -> runtime assembly -> validation -> Aseprite polish -> catalog.

Expected leverage: future agents stop rediscovering the toolchain and avoid creating parallel asset workflows.

## Planning notes for future ralplan

- Preserve the current CLI happy path.
- Do not let PixelLab/MCP/extension output bypass runtime validation.
- Prefer deletion/reuse before new layers; deepen Modules only where they buy locality and leverage.
- Treat MCP, REST, downloaded frames, and Aseprite extension output as adapters at source/generation seams.
- Tests should target Module Interfaces, not only CLI helper internals.
- Security: do not commit PixelLab tokens; token rotation is already handled by the user.

## Open questions for ralplan

1. Should the first implementation target be provenance, shared assembly, or PixelLab generation-run refactor?
2. Where should source intake run records live: `art/characters/<char>/_drafts/`, `tools/sprites/pixellab_state/`, or a new generated-art ledger?
3. Should MCP become a supported adapter now, or should the first slice stabilize REST and extension-source intake first?
4. Which care/tincture/combat animation keys should map to template mode, v3 text animation, or manual/Aseprite-only generation?

