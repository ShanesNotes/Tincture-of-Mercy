# Implementation Start Order — v0.8.1

The order below is the gate sequence. Commit N cannot start until Commit N−1's
acceptance row passes. No commit may include scaffolding for a later commit.

---

## Commit 1 — v0.8.1 design hardening

**Files**

```
v0_8_1/INDEX.md
v0_8_1/errata_v0_8_to_v0_8_1.md
v0_8_1/canonical_locks_v0_8_1.md
v0_8_1/aesthetic_bible_v0_8_1.md
v0_8_1/micro_symbol_register_v0_8_1.md
v0_8_1/ui_regime_system_v0_8_1.md
v0_8_1/art_direction_v0_8_1.md
v0_8_1/scene_composition_bible_v0_8_1.md
v0_8_1/icon_panel_prompt_pack_v0_8_1.md
v0_8_1/godot_asset_manifest_v0_8_1.md
v0_8_1/godot_design_delta_v0_8_1.md
v0_8_1/backlog_visual_gameplay_v0_8_1.md
v0_8_1/acceptance_tests_v0_8_1.md
v0_8_1/implementation_start_order_v0_8_1.md
v0_8_1/godot_scaffold_start_prompt_v0_8_1.md
v0_8_1/PROMPT_GODOT_SCAFFOLD_AGENT_v0_8_1.md
```

**Acceptance**

- Errata complete; every drift listed has a concrete patch.
- Canonical locks complete; no soft language.
- `INDEX.md` links every doc.
- No unresolved contradictions; §18 *Human decision list* in errata is empty.

---

## Commit 2 — Godot C#/.NET project scaffold

**Files**

```
project.godot
scenes/main.tscn
<empty C#/.NET folder structure per godot_scaffold_start_prompt_v0_8_1.md §3, superseding any GDScript-first wording>
```

**Acceptance**

- Godot 4.6.x opens the project clean.
- `main.tscn` loads at 960×540 logical viewport, 2× scale.
- No art dependencies required to boot.
- `GODOT-01` passes.
- Scene-specific C# scripts, when authored in later commits, live beside their `.tscn` files; global/reusable scripts live under `scripts/`.

---

## Commit 3 — Resources and autoloads

**Files**

```
scripts/autoloads/        # all autoloads from canonical_locks §13
scripts/resources/        # C# Resource classes: ingredient/recipe/patient/notebook_entry/
                          # register_lexicon/tincture_axes/caption
scripts/components/       # reusable Node/Control helpers only; no scene-specific controllers
data/ingredients/         # 8 .tres
data/recipes/             # 6 .tres
data/patients/            # 4 .tres
data/register_lexicons/    # per-regime strings consumed by RegisterLookup.tactile
data/tincture/            # axes resource
data/captions.tres        # single caption table
```

**Acceptance**

- All resources load with non-empty `id`.
- Canonical patient/ingredient/recipe IDs exist; no `nora_field`, no
  `bitterleaf`, no `dr_bell`.
- All autoloads from `canonical_locks_v0_8_1.md §13` initialize as C# autoload scripts.
- UI/register strings are accessed through `RegisterLookup.tactile(field_id, value, regime_id)`, not a static helper.
- `GODOT-02`, `GODOT-03` pass.

---

## Commit 4 — Theme resources

**Files**

```
themes/theme_ironwood.tres
themes/theme_wittehaven.tres
themes/theme_paradise.tres
```

**Acceptance**

- All three themes load.
- Every color in every Theme appears in `colors_and_type.css`.
- Mono font slot is `IBM Plex Mono` in all themes.
- UI can swap regime theme on the root `CanvasLayer` without re-mounting any
  scene.
- `GODOT-05`, `U-01`, `U-02`, `CANON-08` pass.

---

## Commit 5 — Anti-drift CI

**Files**

```
design_system/tools/anti_drift.py
design_system/tools/anti_drift_allowlist.json
tests/                     # GUT or scripted tests for canon/godot/anti-drift
```

**Acceptance**

- `python3 design_system/tools/anti_drift.py --mode all --root design_system` runs and exits 0 on a clean tree.
- Forbidden terms fail the gate; allowed exceptions require annotation or
  allowlist entry.
- `AD-10..13`, `CANON-01`, `CANON-03`, `CANON-07`, `CANON-08`, `CANON-10`
  pass.

---

## Commit 6 — Placeholder UI scenes

**Files**

```
scenes/ui/pouch.tscn
scenes/ui/tincture_wheel.tscn
scenes/ui/notebook.tscn
scenes/ui/patient_panel.tscn
scenes/ui/kalev_state_overlay.tscn
scenes/ui/dialogue_box.tscn
scenes/ui/manuscript_intercut.tscn
```

**Acceptance**

- Pouch slots correct (slot 1 cedar dog locked; slot 16 Ember locked).
- Notebook write API: page-66 line-7 succeeds; page-77 line-7 rejects.
- Patient panel uses `RegisterLookup.tactile`; no hard-coded labels.
- No `ProgressBar` anywhere in the UI scenes.
- No morality, success, or failure labels.
- Tincture Wheel quality readout pulls strings from `RegisterLookup` only.
- `GODOT-04`, `GODOT-06..10`, `U-03..U-14`, `CANON-09` pass.

---

## Commit 7 — Placeholder world scenes

**Files**

```
scenes/cabin/cabin.tscn
scenes/ironwood_road/ironwood_road.tscn
scenes/bethany/bethany.tscn
scenes/characters/kalev.tscn
scenes/characters/birdie.tscn
scenes/characters/lena.tscn
```

**Acceptance**

- Kalev can move (CharacterBody2D + idle/walk placeholder).
- Interactables exist as placeholders only.
- Scene transitions stubbed via `SceneRouter`.
- Cabin: Ember verb greys when target is Eli; unlocks self-use after
  Beat 4.
- Ironwood: Birdie apple-refusal beat fires unconditionally.
- Bethany: three beds, three patients (Miriam elder, Nora Finch, Dr. Amos
  Bell).
- No final art required.
- `SC-01` (rewritten), `SC-04` (rewritten), `CANON-04..06` pass.

---

## After Commit 7

The slice is now scaffolded. The next phase is content: animations, audio
beds, dialogue, and the three required intercut panels. None of that begins
until Commits 1–7 are clean and tagged `v0.8.1-scaffold`.

The acceptance gate from `acceptance_tests_v0_8_1.md` then applies in full.
