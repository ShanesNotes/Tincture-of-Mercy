# Tincture of Mercy

Godot 4.6 (C#, Forward+) project. 2D top-down combat-capable mercy RPG.
This README is the single entry point — everything else is reachable from here.

## Canon spine and read path

Use this short path before engine or content work:

1. **Context and agent guide** → `CONTEXT.md`, then `AGENTS.md`
   _Start here. These files prevent older P0 scope limits from becoming project-wide doctrine._
2. **Decision records** → `docs/adr/`
   _Read accepted routing and design decisions before treating older packets as active canon._
3. **Active v0.9 packet hub** → `design_system/v0_9_mercy_rpg_substrate/INDEX.md`
   _Current combat-capable mercy RPG substrate packet and source hierarchy._
4. **Active requirements and backlog** → `design_system/v0_9_mercy_rpg_substrate/PRD.md`, `design_system/v0_9_mercy_rpg_substrate/ACCEPTANCE.md`, and `design_system/v0_9_mercy_rpg_substrate/ISSUE_SLICES.md`
   _Use these for substrate-first requirements, acceptance, and implementation issue dependencies._
5. **Active registry and assigned slice** → `design_system/v0_9_mercy_rpg_substrate/06-canon-surface-registry.md`, then the assigned slice doc.
   _The registry labels active, support, provenance, source, generated-review, archive, and stale surfaces._
6. **v0.8.1 provenance** → `design_system/v0_8_1/INDEX.md`
   _Use for tone, names, visual language, and Godot/C# scaffold constraints where not contradicted by active direction._
7. **Raw source intake, when evidence is needed** → `docs/source/`
   _Vendored handoff/source materials. Provenance only; distill decisions into active packet docs before implementation._
8. **Lore sources, when nuance is needed** → `docs/lore/tincture_of_mercy_v0_3.md`, `docs/lore/tincture_of_mercy_packet_v0_6.md`, `docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md`
   _Rich source leaves. They preserve voice, theology, and history; active direction and ADRs arbitrate conflicts._

`concept_packet.html` is a generated review surface for humans, not an independent canon source. `_archive/**` is provenance only.

## Layout

Godot sees the repository filesystem directly. Runtime roots below are intended
for `res://` loading; docs, design notes, reference art, and archive provenance
are intentionally non-runtime surfaces.

```
.
├── project.godot              # Godot 4.6, C#/.NET, Forward+
├── Tincture-of-Mercy.csproj   # Godot game assembly (references Substrate)
├── icon.svg
├── .godot/                    # generated engine cache (gitignored)
│
├── Tincture.Substrate/        # headless mercy RPG substrate library (plain C#)
├── Tincture.Tests/            # xUnit substrate regression suite
├── Tincture.AiMock/           # standalone LLM character-runtime mock (see its README)
│
├── scenes/                    # runtime scenes; scene-specific C# lives beside .tscn
│   ├── main.tscn + Main.cs    # boots world_lab/ironwood_world_lab.tscn
│   ├── cabin/cabin_graybox.tscn
│   ├── world_lab/             # ironwood_world_lab + regime scaffolds
│   ├── sprite_lab/kalev_locomotion_test.tscn
│   ├── characters/            # (planned) kalev, birdie, lena
│   ├── ironwood_road/         # (planned)
│   ├── bethany/               # (planned)
│   └── ui/                    # (planned) pouch, tincture_wheel, notebook, etc.
│
├── scripts/
│   ├── autoloads/             # (planned) GameEvents, KalevState, RegisterLookup
│   ├── resources/             # (planned) typed C# Resource classes
│   ├── components/            # reusable C# helpers (e.g. OpeningActGrayboxKeys)
│   ├── godot/                 # validate, export, test runner Python tools
│   ├── build_ironwood_tileset.gd
│   └── verify_ironwood_tileset.gd
│
├── data/
│   ├── opening/opening_act_cabin_prologue_events.json
│   ├── tilesets/
│   ├── ingredients/           # (planned)
│   ├── recipes/               # (planned)
│   ├── patients/              # (planned)
│   ├── register_lexicons/     # (planned)
│   └── tincture/              # (planned) wheel_axes.tres, captions.tres
│
├── themes/ironwood_folk.tres  # active; wittehaven/paradise themes planned
├── audio/                     # bed/, mark/, ui/; music/ holds draft source (non-P0)
├── fonts/
├── shaders/
│
├── art/                       # runtime art Godot imports as res://art/...
│   ├── characters/
│   │   ├── kalev/kalev_design_asset.png   # CANONICAL concept reference
│   │   ├── kalev/sheets/                  # 64×96 runtime sheets
│   │   └── kalev/animations/              # legacy pre-64×96 concept sheets
│   ├── environment/
│   ├── props/, ui/, icon_panels/, vfx/
│   └── reference/             # concept/reference only; .gdignore
│
├── tools/sprites/             # deterministic sprite pipeline (see 10-asset-pipeline.md)
├── test/                      # Godot headless smoke (cabin_graybox_scene_smoke.gd)
├── tests/                     # Python sprite-tool + optional PlayGodot E2E tests
│
├── docs/                      # source intake, lore/provenance, ADRs; .gdignore
│   ├── adr/
│   ├── source/                # raw source intake; not active implementation contract
│   ├── lore/
│   └── story/                 # narrative provenance; active direction/ADRs arbitrate
├── design_system/             # visual + system canon; .gdignore
│   ├── v0_9_mercy_rpg_substrate/  # ACTIVE PACKET
│   ├── v0_8_1/                    # provenance + scoped P0 locks
│   ├── v0_9_combat_rpg_layer/     # superseded research stub (provenance only)
│   └── tools/                     # anti_drift.py + check_topology.py gates
├── concept_packet.html        # generated review surface; not independent canon
├── art_direction_review.html  # generated review surface; not independent canon
│
├── .github/workflows/         # Godot CI: validate, build, test, export
└── _archive/                  # provenance only; gitignored
    └── superseded/
```

## Canonical decisions in force

The active implementation direction is the mercy RPG substrate packet:
`design_system/v0_9_mercy_rpg_substrate/INDEX.md`, with requirements in
`design_system/v0_9_mercy_rpg_substrate/PRD.md` and work slicing in
`design_system/v0_9_mercy_rpg_substrate/ISSUE_SLICES.md`.

v0.8.1 decisions below remain useful where they do not conflict with the
active direction. Treat v0.8.1 combat-exclusion language as historical P0
scope, not a project-wide rule.

- **Sprite scales:** Kalev / Lena 64×96 · Birdie 48×64 · minor adults 48×72 · bedside patients 96×48 (or 128×64) · environment tiles 32×32 · viewport 640×360 logical (640×360 composition, 1× zoom; ~20 tiles wide × ~11 tall, scales cleanly to 1080p at 3× and 4K at 6×).
- **Cast names:** Kalev Ward · Lena Hart · Birdie/Ruth · Eli Keene · Miriam Toll (elder) · Nora Finch · Dr. Amos Bell. _(Not Nora Field. Not Dr. Bell.)_
- **Pouch:** slot 1 cedar dog (locked) · slot 16 Ember (locked).
- **Ember:** cannot target Eli; self-use after Eli's name is written; scarce.
- **Notebook:** page 66 line 7 = Eli; page 77 line 7 = RESERVED future arc.
- **Birdie:** apple refusal mandatory.
- **Mono font:** IBM Plex Mono. _(Not JetBrains Mono.)_
- **Godot implementation language:** C#/.NET is canonical for engine code. GDScript-first guidance in older packets is historical only.
- **No Bitterleaf in P0.** No IC XC NIKA / halos / narthex in P0 (all P2 reserved).
- **No music in P0** — diegetic audio only.
- **Kalev concept:** `res://art/characters/kalev/kalev_design_asset.png` is the visual law. Runtime sprite must be redrawn at 64×96, not downscaled from the concept.

Full strict list: `design_system/v0_8_1/canonical_locks_v0_8_1.md`.

## Engine and verification quick start

```bash
# Design-system gates (run before doc commits)
python3 design_system/tools/check_topology.py
python3 design_system/tools/anti_drift.py --mode all --root design_system

# Substrate + Godot smoke
dotnet test Tincture.Tests/Tincture.Tests.csproj
python3 scripts/godot/validate_project.py --project .
godot --headless --path . -s res://test/cabin_graybox_scene_smoke.gd
```

CI runs the same gates on push to `main` (see `.github/workflows/tincture-godot-ci.yml`).
Local Linux export needs Godot 4.6.2 mono export templates installed.

## Notes for the next session

- **Projects:** `Tincture-of-Mercy.csproj` (Godot), `Tincture.Substrate/`, `Tincture.Tests/`, and `Tincture.AiMock/` (standalone mock, excluded from Godot export).
- **Scaffold state:** substrate core and opening graybox exist; autoloads, most UI scenes, and `.tres` data paths are still planned placeholders.
- **Kalev art:** canonical 64×96 runtime sheets live in `art/characters/kalev/sheets/`. Legacy concept sheets in `animations/` predate the 64×96 decision and must not ship as runtime sprites.
- **Archive:** items under `_archive/superseded/` are provenance only and gitignored.
