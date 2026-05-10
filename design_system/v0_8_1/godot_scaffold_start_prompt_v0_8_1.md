# Godot Scaffold Start Prompt — v0.8.1

This file is the exact prompt for the Godot implementation agent. It is the
companion to `PROMPT_GODOT_SCAFFOLD_AGENT_v0_8_1.md` (which is the
copy-paste-ready cover prompt). Together they specify the scaffold gate.

---

## 1. Engine + language

- **Engine.** Godot **4.6.x** (latest stable patch).
- **Language.** C#/.NET is canonical for Godot implementation. Do not start new
  gameplay, UI, Resource, or autoload code in GDScript.
- **Pattern.** Composition over inheritance. Small scenes; small C# scripts;
  custom `Resource` classes; autoloads; signals. Use `TileMapLayer`,
  `CharacterBody2D`, `AnimatedSprite2D`, `CanvasLayer`, `Control`, and
  `Theme` resources.

## 2. Project settings

```
display/window/size/viewport_width        = 960
display/window/size/viewport_height       = 540
display/window/stretch/mode               = "viewport"
display/window/stretch/aspect             = "keep"
rendering/textures/canvas_textures/default_texture_filter = "nearest"
rendering/2d/snap/snap_2d_transforms_to_pixel             = true
rendering/2d/snap/snap_2d_vertices_to_pixel               = true
```

```
Logical viewport:        960 × 540
Composition grid:        480 × 270  (half-scale; ×2 to viewport)
Icon-panel canvas:       480 × 300
Camera zoom target:      2× for 32×32 art
Tile size:               32 × 32
Kalev/principal adults:  64 × 96
Minor adult canvas:      48 × 72
Birdie/Ruth canvas:      48 × 64
Bedside patients:        96 × 48 or 128 × 64
```

Pixel art: nearest-neighbor; mipmaps off; subpixel positioning disabled on
fonts.

## 3. Folder structure

Use Godot-friendly `snake_case` folders/files. C# script files/classes are the
exception: use PascalCase and keep each file name matched to its public partial
class. Scene-specific C# scripts live beside their `.tscn` files; reusable or
global code lives under `scripts/`.

```
art/
  characters/
    kalev/
    lena/
    birdie/
    patients/
    residents/
  environment/
  props/
  ui/
  icon_panels/
  vfx/
  reference/        # concept/reference only; .gdignore

audio/
  bed/
  mark/
  ui/

fonts/
shaders/

data/
  ingredients/
  recipes/
  patients/
  register_lexicons/
  tincture/
    wheel_axes.tres
  captions.tres
  tilesets/

scenes/
  main.tscn
  characters/
    kalev.tscn
    birdie.tscn
    lena.tscn
  cabin/
    cabin.tscn
    CabinScene.cs
  ironwood_road/
    ironwood_road.tscn
    IronwoodRoadScene.cs
  bethany/
    bethany.tscn
    BethanyScene.cs
  ui/
    pouch.tscn
    tincture_wheel.tscn
    notebook.tscn
    patient_panel.tscn
    kalev_state_overlay.tscn
    dialogue_box.tscn
    manuscript_intercut.tscn

scripts/
  autoloads/
  resources/
  components/

themes/
  theme_ironwood.tres
  theme_wittehaven.tres
  theme_paradise.tres

design_system/tools/
  anti_drift.py
  check_topology.py
  anti_drift_allowlist.json

tests/
```

Non-runtime repository folders (`docs/`, `design_system/`, `art/reference/`) are
hidden from Godot imports with `.gdignore`. `_archive/` is gitignored
provenance. Existing canonical concept images under `art/characters/**` are
design-only exceptions until an art migration; do not use them as runtime
`AnimatedSprite2D` sheets.

## 4. Autoloads

Register exactly these names. Do not rename, do not collapse.

```
GameEvents              — global signal bus.
KalevState              — Burden / Pressure / Numbness / Ember use / body-state.
GameState               — scene/run/session flags. (Omit if not needed in v0.8.1.)
RegimeManager           — current regime + theme swap on root CanvasLayer.
RegisterLookup          — tactile() string API; reads from RegisterLexicon resources.
Beat                    — beat-event signals (started/ended/disclosure).
Notebook                — append-only; persists to user://notebook.dat.
CaptionLayer            — caption rendering for diegetic marks.
Inventory               — pouch state; locked slots 1 and 16.
RecipeBook              — known craftables.
IngredientCatalog       — known ingredients (P0 only).
SceneRouter             — scene transitions; no browser/DOM APIs; respects pause.
AudioManager            — bed + mark + caption coordination; no music bus.
DialogueManager         — line dispatch and register selection.
```

`KalevState` ≠ `GameState`. The distinction:

```
KalevState  — body and mind state (changes minute-to-minute).
GameState   — scene flags and beat completion (changes scene-to-scene).
```

If `GameState` is not yet needed, do not invent its API. Add it later.

## 5. Resource scripts

Create the typed-Resource backbone:

```
scripts/resources/IngredientResource.cs
scripts/resources/RecipeResource.cs
scripts/resources/PatientResource.cs
scripts/resources/NotebookEntryResource.cs
scripts/resources/RegisterLexiconResource.cs
scripts/resources/TinctureAxesResource.cs
scripts/resources/CaptionResource.cs
```

Each is a C# `Resource` class (`partial class`, `[GlobalClass]` where it must
be creatable in the inspector) with `[Export]` properties matching the spec in
`godot_design_delta_v0_8_1.md`. UI never reads raw state; UI reads
`RegisterLookup.tactile(field_id, value, regime_id)` only.

## 6. Required Resource files

### Patients

```
data/patients/eli_keene.tres
data/patients/miriam_toll.tres        # age_band: elder
data/patients/nora_finch.tres         # NOT nora_field
data/patients/dr_amos_bell.tres       # NOT dr_bell
```

### Ingredients

```
data/ingredients/pulseleaf.tres
data/ingredients/cotton.tres
data/ingredients/wool.tres
data/ingredients/salt.tres
data/ingredients/clean_water.tres
data/ingredients/cedar.tres
data/ingredients/honey.tres
data/ingredients/ember.tres
```

Do **not** create `bitterleaf.tres` (P0).

### Recipes

```
data/recipes/salt_wash.tres
data/recipes/clean_dressing.tres
data/recipes/pulseleaf_draught.tres
data/recipes/cedar_wool_compress.tres
data/recipes/ember_dose.tres
data/recipes/ember_dilution.tres
```

## 7. Theme resources

```
themes/theme_ironwood.tres
themes/theme_wittehaven.tres
themes/theme_paradise.tres
```

Theme rules:

- Every color appears in `colors_and_type.css`. No new colors invented in
  Theme files. The `--tokens` mode of `design_system/tools/anti_drift.py` enforces this.
- Mono font slot resolves to `IBM Plex Mono` in all themes.
- Default radius 4 px (`--r-md`); Wittehaven overrides to 0 px.
- No saturated Wittehaven blues. Wittehaven feels like clean *relief*.
- IC XC NIKA, halos, and Paradise narthex assets do not appear in any P0
  Theme.

## 8. Placeholder scenes

Build skeletal placeholders only. The first scaffold milestone is
architecture and contract enforcement, not visual polish.

```
scenes/main.tscn
scenes/characters/kalev.tscn
scenes/cabin/cabin.tscn
scenes/ironwood_road/ironwood_road.tscn
scenes/bethany/bethany.tscn
scenes/ui/pouch.tscn
scenes/ui/tincture_wheel.tscn
scenes/ui/notebook.tscn
scenes/ui/patient_panel.tscn
scenes/ui/kalev_state_overlay.tscn
scenes/ui/dialogue_box.tscn
scenes/ui/manuscript_intercut.tscn
```

Use flat placeholder art (single-color rectangles labeled with their
purpose). Do not block on art delivery.

## 9. Anti-drift CI

Wire `design_system/tools/anti_drift.py` into the project pre-commit and CI hooks. The
anti-drift gate must run before any meaningful scene work.

Acceptance: see `acceptance_tests_v0_8_1.md` §1 (`AD-10..13`) and §3
(`GODOT-01..10`).

## 10. What this scaffold is not

- It is not a vertical slice. No content; no audio beds; no animations
  beyond placeholder.
- It is not the place to add new mechanics, ingredients, patients, or
  scenes.
- It is not the place to build the Iron Ledger, Wittehaven playable scene,
  or Paradise narthex.
- It is not the place to invent register strings outside the RegisterLexicon
  resources.

If a question arises that cannot be answered from `canonical_locks_v0_8_1.md`
+ `errata_v0_8_to_v0_8_1.md`, **stop and ask**. The contract has been
hardened so the implementation does not invent canon.
