# Tincture of Mercy

Godot 4.6 (C#, Forward+) project. 2D top-down narrative survival-care game.
This README is the single entry point — everything else is reachable from here.

## Canon spine and read path

Use this short path before engine or content work:

1. **Agent/context guide** → `AGENTS.md`, then `CONTEXT.md`
   _Start here. These files prevent older P0 scope limits from becoming project-wide doctrine._
2. **Decision records** → `docs/adr/`
   _Read accepted routing and design decisions before treating older packets as active canon._
3. **Active v0.9 packet hub** → `design_system/v0_9_mercy_rpg_substrate/INDEX.md`
   _Current combat-capable mercy RPG substrate packet and source hierarchy._
4. **Active requirements and backlog** → `design_system/v0_9_mercy_rpg_substrate/PRD.md`, `ACCEPTANCE.md`, and `ISSUE_SLICES.md`
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
├── project.godot           # Godot 4.6, C#/.NET, Forward+
├── icon.svg
├── .godot/                 # generated engine cache (gitignored)
│
├── scenes/                 # future runtime scenes; scene-domain folders
│   ├── main.tscn
│   ├── cabin/cabin.tscn
│   ├── ironwood_road/ironwood_road.tscn
│   ├── bethany/bethany.tscn
│   ├── characters/{kalev,birdie,lena}.tscn
│   └── ui/{pouch,tincture_wheel,notebook,patient_panel,kalev_state_overlay,dialogue_box,manuscript_intercut}.tscn
│
├── scripts/                # future reusable/global C# code
│   ├── autoloads/          # GameEvents, KalevState, RegisterLookup, etc.
│   ├── resources/          # typed C# Resource classes
│   └── components/         # reusable Node/Control helpers only
│   # scene-specific C# scripts live beside their .tscn files in scenes/**
│
├── data/                   # future runtime .tres resources
│   ├── ingredients/
│   ├── recipes/
│   ├── patients/
│   ├── register_lexicons/
│   ├── tincture/wheel_axes.tres
│   └── captions.tres
│
├── themes/                 # theme_ironwood.tres, theme_wittehaven.tres, theme_paradise.tres
├── audio/                  # bed/, mark/, ui/
│
├── art/                    # runtime art Godot imports as res://art/...
│   ├── characters/         # runtime sheets plus documented design-only concept exceptions
│   │   ├── kalev/kalev_design_asset.png        # CANONICAL concept reference, not runtime sheet
│   │   └── kalev/animations/                   # pre-64×96 sheets; must be redrawn before shipping
│   ├── environment/        # runtime tiles/backgrounds/scene environment assets
│   ├── props/
│   ├── ui/
│   ├── icon_panels/
│   ├── vfx/
│   └── reference/          # concept/reference only; .gdignore
│
├── docs/                   # source intake, lore/provenance, ADRs; .gdignore
│   ├── adr/                # decision records
│   ├── source/             # raw source intake; not active implementation contract
│   └── lore/               # rich sources; active direction/ADRs arbitrate conflicts
├── design_system/          # visual + system canon; .gdignore
│   ├── v0_9_mercy_rpg_substrate/ # ACTIVE PACKET — read INDEX.md, PRD.md, ISSUE_SLICES.md
│   ├── v0_8_1/             # provenance + scoped P0 locks
│   └── tools/              # anti_drift.py + check_topology.py gates
├── concept_packet.html     # generated review surface; not independent canon
│
└── _archive/               # provenance only; gitignored
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

- **Sprite scales:** Kalev / Lena 64×96 · Birdie 48×64 · minor adults 48×72 · bedside patients 96×48 (or 128×64) · environment tiles 32×32 · viewport 960×540 logical (480×270 composition, 2× zoom).
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

## Notes for the next session

- Character `.png.import` files at the project root were removed when assets
  were relocated under `art/`. Godot will regenerate them at the new paths
  on next editor open.
- C#/.NET is the canonical Godot implementation language. The `.csproj`
  appears when the first C# script is added through the editor or scaffold.
- Items moved to `_archive/superseded/` are kept for provenance and are
  gitignored. Do not delete/export archive history without a separate
  explicit decision.
- The five existing Kalev animation sheets in
  `art/characters/kalev/animations/` predate the 64×96 decision. Per
  v0.8.1 they will need to be redrawn at 64×96 native (not downscaled
  from the concept) before they can ship as runtime sprites.
