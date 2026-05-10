# Tincture of Mercy — Codex Local Handoff Pack

Use this pack to turn the dense design artifacts into a sequence of local Codex tasks.

The rule: Codex should not receive the whole vision as one giant prompt. It should receive:

1. A stable canon hierarchy.
2. A small architecture packet.
3. One implementation task at a time.
4. Tests and acceptance criteria before content expansion.

Copy the files in this pack into the root of your game repo. Put the original artifacts in `docs/source/` and keep them there as reference, not as instructions to re-litigate every time.

Recommended repo shape:

```text
/tincture-of-mercy
  AGENTS.md
  .codex/config.toml          # optional, after review
  docs/
    source/
      Forward Substrate - Tincture of Mercy Hybrid Primitive Set.md
      opening_slice_design_v2.md
      three_registers.md
      latent_paths.md
    00_SOURCE_OF_TRUTH.md
    01_BUILD_ORDER.md
    02_CODEX_PROMPTS.md
    03_ACCEPTANCE_CRITERIA.md
    04_OPEN_QUESTIONS.md
    05_BACKLOG.yaml
  game/                       # Godot project or equivalent
  tests/
```

Start Codex from the repo root. Before each Codex task, commit or stash your current work. After each task, inspect the diff, run tests, and commit only the slice you trust.

