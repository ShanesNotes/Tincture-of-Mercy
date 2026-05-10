# Slice 8 — Godot Naming Conventions

Status: active naming canon
Owner lane: Godot integration + production
Authority level: active for v0.9 Godot artifact naming. Every new asset, resource, scene, script, animation, signal, event ID, item ID, encounter ID, and game-data identifier conforms to these rules.
Dependencies: `02-substrate-primitives.md`, `03-opening-act-bible.md`, `04-latent-paths-receptivity.md`, `05-rpg-economy-progression.md`, `06-canon-surface-registry.md`, `prompts/06-name-an-artifact.md`
Maximum intended scope: naming rules + folder layout + blocked legacy patterns. Not a Godot tutorial. Not a C# style guide.
Validation gate: pre-commit grep for blocked legacy patterns; manual review on PRs that introduce new asset types.

## Why this exists

A consistent naming convention turns a sprite sheet from an artist into a one-step Godot import. Without it, every new artifact triggers ad-hoc decisions: where does it live? what's it called? how does code reference it? Multiplied across art, audio, code, data, scenes, and signals, that overhead compounds into project-wide drift and AI-agent confusion.

The rules below are the project canon. They take precedence over per-folder taste. They apply to every new artifact under `res://`.

## Folder layout — the canonical tree

```
res://
├── art/
│   ├── characters/<character>/
│   │   ├── <character>_design_asset.png      (concept reference; not runtime)
│   │   └── sheets/
│   │       └── <character>_<purpose>_<canvas>.png   (runtime sprite sheets)
│   ├── environment/
│   │   └── tilesets/<biome>/<tileset>.png
│   ├── icon_panels/
│   ├── props/<prop>.png
│   ├── ui/<surface>/<element>.png
│   └── vfx/<effect>.png
├── audio/
│   ├── sfx/<category>/<sound>.ogg
│   └── ambient/<scene>/<bed>.ogg
├── data/
│   ├── abilities/<verb_id>.tres
│   ├── items/<item_id>.tres
│   ├── loot_tables/<table_id>.tres
│   ├── encounters/<encounter_id>.tres
│   ├── receptivity_profiles/<profile_id>.tres
│   └── sprite_frames/<character>_frames.tres
├── scenes/
│   ├── characters/<character>/<character>.tscn
│   ├── encounters/<encounter_id>.tscn
│   └── acts/<act_number>_<act_name>.tscn
├── shaders/<effect>.gdshader
├── scripts/
│   ├── core/<class>.cs
│   ├── characters/<character>/<class>.cs
│   └── systems/<system>/<class>.cs
└── tests/
    └── <area>/<TestClass>.cs
```

## Filesystem (lowercase snake_case)

| Artifact | Pattern | Example |
|---|---|---|
| Folder | `lowercase_snake` | `art/characters/kalev/`, `data/loot_tables/` |
| Sprite sheet | `<character>_<purpose>_<canvas>.png` | `kalev_locomotion_64x96.png`, `wolf_full_sheet_96x64.png` |
| Concept reference | `<character>_design_asset.png` | `kalev_design_asset.png` (do not edit; not runtime) |
| Tileset | `<biome>_tileset.png` | `cabin_tileset.png`, `ironwood_tileset.png` |
| Prop | `<prop>.png` or `<prop>_<state>.png` | `notebook.png`, `kettle_whistling.png` |
| UI element | `<surface>_<element>.png` | `pouch_slot.png`, `wheel_ring.png` |
| VFX | `<effect>.png` | `breath_puff.png`, `hearth_dim.png` |
| Audio sfx | `<category>_<sound>.ogg` | `breath_short.ogg`, `tincture_pour.ogg` |
| Audio ambient | `<scene>_<bed>.ogg` | `cabin_hearth.ogg`, `ironwood_wind.ogg` |
| Shader | `<effect>.gdshader` | `tremor.gdshader`, `vellum_paper.gdshader` |
| Resource (.tres) | `<context>_<purpose>.tres` | `kalev_frames.tres`, `bread_loaf.tres` |
| Scene (.tscn) | `<context>_<purpose>.tscn` | `kalev.tscn`, `wolves_road.tscn`, `act4_witness.tscn` |
| C# script | `<ClassName>.cs` (PascalCase filename matching class) | `KalevPlayer.cs`, `OutcomeResolver.cs` |
| Test | `<TargetClass>Test.cs` or `<TargetClass>Tests.cs` | `OutcomeResolverTests.cs`, `SimEventTests.cs` |

## Code identifiers (C#)

| Element | Convention | Example |
|---|---|---|
| Class | PascalCase | `KalevPlayer`, `WolfActor`, `OutcomeResolver`, `SimEvent` |
| Interface | `I` + PascalCase | `IOutcomeResolver`, `IPresenter` |
| Public method | PascalCase | `Resolve()`, `EmitEvent()`, `ApplyAura()` |
| Private method | PascalCase | `ComputeModifiers()`, `_internalHelper()` accepted only with leading underscore convention if team-wide |
| Public field / property | PascalCase | `public int Health`, `public string ActorId` |
| Private field | `_camelCase` | `private int _currentTick`, `private List<SimEvent> _eventBuffer` |
| Constant | `PascalCase` for `const`, `UPPER_SNAKE_CASE` reserved for true compile-time literals when team agrees | `public const int MaxColors = 48;` |
| Local variable | camelCase | `var actorState = ...;`, `int tick = 0;` |
| Enum type | PascalCase | `SimDomain`, `KalevAnimation` |
| Enum value | PascalCase | `SimDomain.Care`, `KalevAnimation.IdleDown` |
| Generic type parameter | `T` + PascalCase | `T`, `TResult`, `TActor` |
| Namespace | PascalCase, period-separated | `TinctureOfMercy.Core`, `TinctureOfMercy.Combat`, `TinctureOfMercy.Presenters` |

## Godot scene-tree node names

| Element | Convention | Example |
|---|---|---|
| Node name | PascalCase | `KalevPlayer`, `AnimatedSprite2D`, `CollisionShape2D` |
| Custom signal | snake_case | `care_action_completed`, `boy_reached_safety`, `wolf_target_shifted` |
| Custom node type (class_name) | PascalCase | `KalevPlayer`, `WolfActor`, `Notebook` |
| Group name | snake_case | `npcs`, `wolves`, `bedside_patients` |
| Input action | snake_case | `move_up`, `move_left`, `interact`, `open_notebook` |

## Animation names (in `SpriteFrames` / `AnimationPlayer`)

| Element | Convention | Example |
|---|---|---|
| Animation key | `<verb>` or `<verb>_<direction>` or `<verb>_<modifier>`, all snake_case | `idle_down`, `walk_left`, `write_name`, `administer_ember`, `self_administer`, `recoil_neutral`, `hurt`, `downed` |
| Direction suffix order (when used) | `_down` · `_left` · `_up` · `_right` (matches sprite-sheet row order) | n/a |
| Combat verbs | snake_case, action-first | `hurt`, `dodge_brace`, `push_guard`, `lunge`, `bite`, `pack_call` |

## Game data IDs (string identifiers in `SimEvent`, item defs, encounters)

These are the strings that appear in event logs, debug panels, save files, and notebook entries. Stable names matter more than elegance.

| ID type | Convention | Examples |
|---|---|---|
| Verb ID | dotted snake_case, domain-first | `care.water.use`, `care.bread.offer`, `care.tincture.administer`, `combat.attack.resolve`, `combat.damage.apply`, `notebook.write_name`, `progression.recollection_seed` |
| Actor ID | snake_case, lowercase | `kalev`, `mother`, `boy`, `wolf_01`, `wolf_02`, `lena_hart` |
| Item ID | snake_case | `bread_loaf`, `wolf_hide_rough`, `pulseleaf_draught`, `cedar_wool_compress`, `tincture_calm` |
| Encounter ID | dotted snake_case | `opening.wolves_road`, `cabin.act4_witness`, `bethany.recognition` |
| Path ID | snake_case | `apothecary`, `hesychasm`, `iconographic` |
| Voice register ID | snake_case | `folk`, `sanctioned`, `sacred` |
| Aura ID | dotted snake_case with `aura.` prefix | `aura.tincture_calm`, `aura.bleed_minor`, `aura.witnessed` |
| Loot table ID | dotted snake_case | `opening.wolf.materials`, `cabin.bread_supply` |
| Receptivity profile ID | snake_case, descriptive | `child.after_water_fearful`, `mother.fading_act4`, `child.after_bread_trusting` |
| Resource key | snake_case | `health`, `spirit`, `steady`, `burden`, `pressure`, `numbness` |
| Domain (`SimDomain` stable id / event tag) | snake_case via explicit `SimDomainExtensions.ToId()` switch | `care`, `craft`, `combat`, `witness`, `economy`, `progression`, `notebook`, `debug` |

### Verb-ID grammar

Format: `<domain>.<noun_or_subject>.<action>`

| Domain | Examples |
|---|---|
| `care.*` | `care.observe.mother`, `care.water.use`, `care.bread.offer`, `care.tincture.administer`, `care.bind` |
| `craft.*` | `craft.tincture.prepare`, `craft.compress.pack` |
| `combat.*` | `combat.attack.resolve`, `combat.damage.apply`, `combat.wolf.death_or_flee`, `combat.threat.target_shift` |
| `presence.*` | `presence.sit_near`, `presence.speak_name`, `presence.hold_hand`, `presence.pray`, `presence.keep_watch` |
| `iconographic.*` | `iconographic.notice`, `iconographic.arrange`, `iconographic.trace_sign`, `iconographic.threshold` |
| `witness.*` | `witness.kalev`, `death.mother`, `death.wolf` |
| `economy.*` | `loot.wolf.material`, `item.bread.inspect`, `item.bread.consume` |
| `progression.*` | `progression.protection`, `progression.recollection_seed`, `progression.path_apothecary` |
| `notebook.*` | `notebook.write_name`, `notebook.ordinary_mercy`, `notebook.aftermath`, `notebook.mark_image` |
| `debug.*` | `debug.encounter_start`, `debug.fixture_loaded` |

## Resource paths (always with `res://` prefix)

In code:

```csharp
var sheet = GD.Load<Texture2D>("res://art/characters/kalev/sheets/kalev_locomotion_64x96.png");
var frames = GD.Load<SpriteFrames>("res://data/sprite_frames/kalev_frames.tres");
var bread = GD.Load<ItemDef>("res://data/items/bread_loaf.tres");
var encounter = GD.Load<EncounterDef>("res://data/encounters/opening.wolves_road.tres");
var tremor = GD.Load<Shader>("res://shaders/tremor.gdshader");
```

In `.tscn` / `.tres` files: same paths, same convention. Never use absolute filesystem paths. Never use relative paths from a script's directory — always `res://`-rooted.

## Blocked legacy patterns

These names appear in older v0.8.1 docs or earlier intake; do not introduce them in new code or assets. If you encounter them in legacy material, replace silently when touching adjacent code.

| Blocked legacy form | Replacement | Source of legacy form |
|---|---|---|
| `nora_field` | `nora_finch` | v0.8.1 errata |
| `bitterleaf` | (not in v0.9 active scope) | v0.8.1 errata |
| `dr_bell` | `dr_amos_bell` | v0.8.1 errata |
| `JetBrainsMono` | `IBMPlexMono` | v0.8.1 type lock |
| `ember_slot_8` | `ember_slot_16` | v0.8.1 pouch lock |
| `quest_log` | `notebook` | v0.8.1 UI lock; carries forward in v0.9 |
| `Pastoral` (as active path name) | `Hesychasm` | ADR 0004; Pastoral is historical alias only |
| `porridge` (as active Act 2 beat) | `bread` | ADR 0006; porridge is older source wording |
| `combat_engine`, `combat_resolver` (as separate from `OutcomeResolver`) | `OutcomeResolver` + `OutcomeTable` data | Pillar 02 — one resolver family |
| `care_engine`, `care_simulator` | substrate primitives + `OutcomeResolver` | Pillar 01 — one event truth |
| `XP`, `level`, `unlock`, `quest`, `achievement` (in **player-facing** care surface copy) | `Recollection`, `Vocation`, `path points`, `notebook entry` | Drift gate scoped to player-facing care; allowed as internal/debug identifiers |

## v0.9 active rules

- Use **`SimEvent`** as the authoritative record for every consequential action. No domain owns its own outcome state.
- Use **one `OutcomeResolver`** family. Combat tables are resolver data, not a parallel engine.
- Use **`Hesychasm`** as the active path name. Pastoral is historical alias.
- Use **`bread`** as the active Act 2 beat. Porridge is older source wording.
- Use **`paths`** (Apothecary / Hesychasm / Iconographic) for growth disciplines. Voice registers (folk / sanctioned / sacred) are surface tone.
- Use **`Bethany payoff = recognition / presence`**. Corrected recipe is subordinate Apothecary learning.
- Combat is **first-class**; combat / damage / threat / aggro / loot / loot table / quality / rarity are sanctioned terms in active docs and debug. Player-facing care surfaces stay tactile.
- Use **dotted snake_case** for verb IDs, encounter IDs, aura IDs.
- Use **PascalCase** for C# classes, methods, public fields/properties, node names, custom node types.
- Use **snake_case** for Godot signals, animation keys, item IDs, actor IDs, path IDs.
- Always `res://`-rooted resource paths.

## Validation

Pre-commit pattern check (project root):

```bash
# blocked legacy patterns in tracked files
grep -rE "(nora_field|bitterleaf|\bdr_bell\b|JetBrainsMono|ember_slot_8|quest_log)" \
  --include="*.cs" --include="*.tscn" --include="*.tres" --include="*.gd" \
  --include="*.md" --exclude-dir=v0_8_1 --exclude-dir=_archive --exclude-dir=source \
  . && echo "BLOCKED LEGACY PATTERNS FOUND" || echo "naming check: clean."
```

Animation-key check (within `*.tres` SpriteFrames files):

```bash
# verify no animation key contains uppercase
grep -E '"animations/[^/]*[A-Z]' --include="*.tres" -r data/ \
  && echo "ANIMATION KEYS NOT SNAKE_CASE" || echo "animation casing: clean."
```

C# class-naming check (filenames match class declarations):

```bash
# verify each .cs filename matches a `class FileName` declaration inside it
for f in $(find scripts/ -name "*.cs" 2>/dev/null); do
  base=$(basename "$f" .cs)
  grep -qE "^(public |internal |sealed )?(partial )?class $base\b" "$f" \
    || echo "MISMATCH: $f does not declare class $base"
done
```

## Acceptance

This slice is accepted when:

- Every artifact added under `res://` follows the patterns in this doc.
- No new code or asset uses a blocked legacy pattern.
- The validation grep above runs clean on the active tree (excluding `v0_8_1`, `_archive`, `source`).
- Future agents can name a new artifact without consulting an external source by using `prompts/06-name-an-artifact.md`.
