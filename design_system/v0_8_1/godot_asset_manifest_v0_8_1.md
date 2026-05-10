# Godot Asset Manifest — v0.8.1

The full list of art, audio, font, shader, and data assets required for the **prototype slice** (Cabin / Ironwood Road / Bethany Triage) plus the placeholder shells for Wittehaven foreshadow and Paradise reservation. Each entry carries: path, source, format, dimensions/duration, import settings, dependencies, status, and acceptance gate.

**v0.8.1 character-scale revision (applied):** runtime character art uses **premium large-pixel sprites** (Kalev / principal adults 64×96; Birdie 48×64; minor adults 48×72; bedside patients 96×48 or 128×64). Environment tiles remain 32×32. Logical viewport remains 960×540. Sprites are authored at native canvas size with nearest-neighbor presentation; never a downscale of concept art.

Reads after `art_direction_v0_8_1.md`, `scene_composition_bible_v0_8_1.md`, and the canonical Kalev concept at `res://art/characters/kalev/kalev_design_asset.png`. Authoritative for Godot 4.6 project structure until superseded.

---

## 1. Project structure

```
res://
├── art/
│   ├── characters/      # runtime sprites plus documented design-only concept exceptions
│   ├── environment/     # 32×32 tiles/backgrounds per location
│   ├── props/           # standalone props (vial, kettle, paint can, ribbon, apple)
│   ├── ui/              # pouch, wheel, panel, notebook, overlay
│   ├── icon_panels/     # manuscript still panels
│   ├── vfx/             # cold breath, hearth, candle, hum
│   └── reference/       # concept/reference only; .gdignore
├── audio/
│   ├── bed/             # ambient sustains
│   ├── mark/            # discrete events
│   └── ui/              # ui marks (notebook page-turn, panel open)
├── fonts/
├── shaders/
├── themes/              # theme_ironwood.tres, theme_wittehaven.tres, theme_paradise.tres
├── data/
│   ├── ingredients/     # ingredient resources
│   ├── recipes/         # current recipe-resource topology; semantics deferred to Tincture ADR
│   ├── register_lexicons/ # folk / sanctioned / sacred register dictionaries
│   ├── patients/        # patient resources
│   ├── tincture/        # wheel_axes.tres and future tincture-system resources
│   └── captions.tres    # single caption table
├── scenes/
│   ├── main.tscn
│   ├── cabin/
│   ├── ironwood_road/
│   ├── bethany/
│   ├── characters/
│   └── ui/
└── scripts/
    ├── autoloads/
    ├── resources/
    └── components/
```

Scene-local C# scripts live beside their scenes (`CabinScene.cs` next to
`cabin.tscn`, etc.). Global/reusable scripts live under `scripts/`. Docs,
design-system references, and `art/reference/` are non-runtime surfaces hidden
from Godot imports with `.gdignore`.

---

## 2. Status legend

| Glyph | Meaning |
|---|---|
| ✅ | Already present in this project under source art/audio/font folders or `colors_and_type.css`; copy to the listed `res://` path. |
| 🟨 | Specified in this manifest; **needs production**. |
| 🟧 | Placeholder acceptable for v0.8.1; final art deferred to v0.9. |
| 🔒 | Reserved; do not produce in v0.8. |

---

## 3. Character-fidelity upgrade locks

This manifest formally adopts the higher-fidelity character direction prompted by the Kalev foundation concept.

### What changes

- Kalev runtime sprite target changes from 32×48 to **64×96**.
- Lena, as the principal adult counter-presence, also targets **64×96**.
- Birdie changes from 32×32 to **48×64**.
- Named bedridden patients use **96×48** or **128×64** bedside canvases.
- Minor adults may use **48×72** to control production cost.
- Environment tiles remain **32×32**.
- Icon panels and portraits remain separate high-fidelity assets, not substitutes for runtime sprites.

### Why it changes

The 32×48 placeholder scale proved useful for movement tests but too small for Kalev's canonical identity: notebook, pouch, cedar dog, Ember vial, heavy coat, tired face, clinical memory, and burdened posture. The game can remain pixel art while adopting a larger native sprite canvas. This is a medium art-scope increase, not a genre change.

### Runtime camera implication

Keep the logical viewport at **960×540** and the 32×32 tile grid. Use a slightly closer, more intimate camera framing for character-care scenes. Do not scale the 64×96 art down in-engine as a default; author it at intended runtime size and use nearest-neighbor presentation.

## 4. Fonts

| Path | Source | Status | Notes |
|---|---|---|---|
| `res://fonts/IM_FELL_English.ttf` | Google Fonts (placeholder for bespoke serif) | ✅ | Body display; named-character header. Filter set: **Disabled** (we want crisp pixel-edge). |
| `res://fonts/EBGaramond-Italic.ttf` | Google Fonts | ✅ | Body italic. |
| `res://fonts/Cinzel.ttf` | Google Fonts | ✅ | Caps overline; chart labels. |
| `res://fonts/Caveat.ttf` | Google Fonts (placeholder for hand-script) | ✅ | Notebook hand. |
| `res://fonts/IBMPlexMono.ttf` | Google Fonts / root token `--mono-witte` | ✅ | Wittehaven sanctioned register; quantities. Do not use JetBrains Mono unless the root token system is revised. |

Import: TTF → DynamicFont; `subpixel_positioning = Disabled`; `hinting = None`; `multichannel_signed_distance_field = false`. Pixel-fidelity over smoothness.

---

## 5. Themes

| Path | Status | Carries |
|---|---|---|
| `res://themes/theme_ironwood.tres` | 🟨 | Default colors (`--ink`, `--vellum-warm`, etc.); fonts (IM Fell, EB Garamond, Caveat); panel stylebox (1px `--rule-strong`, vellum-warm fill, 6px radius); button stylebox (vellum-warm fill, 1px ink rule, no radius). |
| `res://themes/theme_wittehaven.tres` | 🟨 | `--lake-deep` background; `--mono-witte` font; 0px radius; `--shadow-witte`; tighter padding. |
| `res://themes/theme_paradise.tres` | 🟨 | `--vellum-bone` + `.halo-active` glow stylebox; IM Fell only; cedar dog halo enabled. |

Each theme also overrides `Label` font and color, `Button` press/hover modulate, `Panel` stylebox, and `LineEdit` for the notebook.

---

## 6. Shaders

| Path | Purpose | Status | Notes |
|---|---|---|---|
| `res://shaders/tremor.gdshader` | Cursor / hand-sprite tremor at high Pressure | 🟨 | Vertex offset ±0.5px at 90ms cycle; amplitude bound to `pressure_state` int 0–4. |
| `res://shaders/numb_blur.gdshader` | Patient-name blur at high Numbness | 🟨 | 0.6px gaussian on text-only; bypassed in Wittehaven panel. |
| `res://shaders/vellum_noise.gdshader` | 1–3% noise on UI panels | 🟨 | Static offset; never animated. Only on `Panel` nodes tagged `vellum`. |
| `res://shaders/halo.gdshader` | `.halo-active` ring | 🟨 | 1px `--icon-gold` ring at 12px outer offset; rendered only when `regime == paradise`. |
| `res://shaders/water_pattern.gdshader` | Patterned water on icon panels | 🟨 | 4-frame cycle; `--lake-slate` waves on vellum. |

All shaders use `canvas_item` mode and respect `TIME` scaled by `engine.time_scale`. None modify color hue at runtime.

---

## 7. Sprites — Characters

Runtime character art now uses **premium large-pixel sprites**. The environmental tile grid remains 32×32, but player/NPC sprites are larger so the gameplay view can carry the same identity as the Kalev foundation concept: coat weight, scarf/collar, medicine pouch, notebook, cedar dog charm, Ember vial, tired face, gloves, and burdened posture.

### 6.1 Scale policy

| Character class | Native canvas | Use | Notes |
|---|---:|---|---|
| Kalev Ward | **64×96** | Player runtime sprite | Canonical high-fidelity target. Never downscale the concept sheet directly; redraw at this native size. |
| Principal adults | **64×96** | Lena Hart; any named adult who appears beside Kalev for extended scenes | Same anatomical scale as Kalev, with fewer accessories. |
| Minor adults | **48×72** | Bethany residents and low-interaction adults | Production economy tier. Must still read clearly at 1× and 2×. |
| Birdie / Ruth | **48×64** | Child companion | Smaller silhouette; oversized coat and one raised shoulder remain identity locks. |
| Bedridden patients | **96×48** or **128×64** | Eli, Miriam, Nora, Dr. Amos Bell | Larger bedside sprites are allowed because patients are focal care objects, not moving characters. |

### 6.2 Character sprite manifest

| Path | Subject | Canvas | Frames per anim | Status | Notes |
|---|---|---:|---|---|---|
| `res://art/characters/kalev/kalev_full_sheet_64x96.png` | Kalev Ward | 64×96 | idle 4×4dir / walk 4×4dir / sit 2 / wash 4 / warm 3 / administer-folk 4 / administer-ember 5 / write 3 / kneel 3 | 🟨 | Pouch on right hip; notebook readable in left hand on idle; cedar dog charm and Ember vial visible but restrained. **Tremor shader applies to administer-ember frames at high Pressure.** |
| `res://art/characters/kalev/kalev_design_asset.png` | Kalev design reference (canonical concept) | concept sheet | — | ✅ | Design-only reference. The latest standalone concept iteration. Do not use directly in `AnimatedSprite2D`; the runtime sheet must be redrawn at 64×96. |
| `res://art/characters/lena/lena_full_sheet_64x96.png` | Lena Hart | 64×96 | idle 4×4dir / walk 4×4dir / sit 2 / hand-on-shoulder 3 / prep-table-work 4 / stitch-glove 4 | 🟨 | Stitched gloves with fingertip cut. `--pale-heal-deep` shawl. Practical posture; no Tincture. |
| `res://art/characters/birdie/birdie_full_sheet_48x64.png` | Birdie / Ruth | 48×64 | idle 4×4dir / walk 4×4dir / refuse-apple 3 / follow 4 / carry-water 4 | 🟨 | Coat too large; one shoulder slightly raised. **Apple refusal is mandatory; do not label as accept.** |
| `res://art/characters/patients/eli_keene_bed_96x48.png` | Eli Keene, in bed | 96×48 | breath 2 / breath-thinning 2 / still 1 | 🟨 | Bedside focal object; no Ember-target frames. |
| `res://art/characters/patients/miriam_toll_bed_96x48.png` | Miriam Toll | 96×48 | breath 2 / breath-thinning 2 / still 1 | 🟨 | Elder; unavoidable death; manner of dying changes. `--lake-slate` blanket. |
| `res://art/characters/patients/nora_finch_bed_96x48.png` | Nora Finch | 96×48 | breath 2 / cough 3 / settled 2 | 🟨 | Recoverable through attentive care with locked prototype materials. `--cedar-brown` blanket. |
| `res://art/characters/patients/dr_amos_bell_bed_96x48.png` | Dr. Amos Bell | 96×48 | breath 2 / murmur 3 / settled 2 / ember-dilemma 2 | 🟨 | Village doctor; Ember dilemma. `--verdigris` blanket; reading glasses. |
| `res://art/characters/residents/bethany_residents_48x72.png` | Generic residents (3 palette variants) | 48×72 | walk 4×4dir / carry 4 / sit 2 | 🟧 | Background population. Placeholder palette swap acceptable. |

### 6.3 Import and animation rules

Import: PNG → CompressedTexture2D; **Filter: Nearest**; **Mipmaps: off**; `flags_repeat = Disabled`. Sprite sheets use `SpriteFrames` resources with explicit frame regions. Do not use automatic downscaling from concept art for runtime sprites; redraw at native canvas size.

Animation priority: fewer, better frames. Kalev's first production milestone is **front idle + 4-direction walk + write-name + administer-ember**, not a full animation library.

---

## 8. Sprites — Tiles

All tilesets: **32×32 native**. Each tileset is one PNG atlas + one `.tres` `TileSet` resource. Custom data fields per `art_direction_v0_8_1.md` §3.4: `walkable: bool`, `audio_class: enum`, `regime_lock: enum`, `wear_index: int`.

| Path | Tileset | Tile count (min) | Status |
|---|---|---|---|
| `res://art/environment/cabin_tiles.png` + `.tres` | Cabin interior | 24 (floor 3-wear, walls 4 + 4 corners, door, window, hearth, bed, table, chair, shelf, occluder beam) | 🟨 |
| `res://art/environment/ironwood_road_tiles.png` + `.tres` | Ironwood road | 28 (road 3-wear, mud, snow, pine canopy occluder, cedar trunk, salvage, Pulseleaf, fence post, crossroads barricade) | 🟨 |
| `res://art/environment/bethany_tiles.png` + `.tres` | Bethany sickroom | 26 (floor 3-wear, walls 4 + 4 corners, door, window, hearth, sickbed 3-variant, prep table, water basin, jar shelf, candle) | 🟨 |
| `res://art/environment/manuscript_ui_tiles.png` + `.tres` | Shared UI manuscript | 12 (margin tiles, page edge, lined ruling, 5 marginalia motifs, reserved blank sacred-inscription plate) | 🟨 |
| `res://art/environment/wittehaven_placeholder_tiles.png` + `.tres` | Wittehaven (foreshadow only) | 6 (floor 1, walls 2, door, sign post, paint can) | 🟧 |
| `res://art/environment/paradise_reserved/` | Paradise narthex | — | 🔒 v0.9+ |

---

## 9. Sprites — Props

Standalone scene props. PNG; some animated.

| Path | Subject | Dimensions | Status | Notes |
|---|---|---|---|---|
| `res://art/props/cedar_dog.png` | Cedar dog | 14×14 | 🟨 | Pouch icon; never enlarged. |
| `res://art/props/notebook.png` | Notebook (closed/open) | 64×48 | 🟨 | Closed sprite + open-page sprite for inspection state. |
| `res://art/props/pouch.png` | Medicine pouch | 32×24 | 🟨 | Cedar leather. |
| `res://art/props/vial_ember.png` | Ember vial (sealed/uncorked/empty) | 16×24 | 🟨 | Ember is the only sustained `--ember-red` glint in the game. |
| `res://art/props/kettle.png` | Kettle (cold/hot/whistling) | 24×24 | 🟨 | Whistling sprite is 4-frame loop. |
| `res://art/props/pulseleaf.png` | Pulseleaf cluster | 32×24 | 🟨 | 2-frame breath shimmer. |
| `res://art/props/apple_red.png` | Birdie's apple | 12×12 | 🟨 | One pixel of `--ember-red` core; rest of frame `--rot-brown`. |
| `res://art/props/paint_can.png` | Wittehaven paint can | 16×24 | 🟨 | `--witte-white` can with `--witte-cool` rim. |
| `res://art/props/torn_ribbon.png` | Torn ribbon | 32×16 | 🟨 | 3-frame flutter (240ms). |
| `res://art/props/candle.png` | Candle on tin saucer | 12×16 | 🟨 | 3-frame flicker, 600ms breath-synced. |
| `res://art/props/hearth_fire.png` | Hearth fire | 32×24 | 🟨 | 4-frame, 480ms. |
| `res://art/props/water_basin.png` | Water basin | 24×16 | 🟨 | Static. |
| `res://art/props/cup_tin.png` | Tin cup (Birdie's water-bringing) | 12×12 | 🟨 | Static. |
| `res://art/props/iron_ledger.png` | Iron Ledger card | 320×200 | 🔒 v0.9+ |
| `res://art/props/ic_xc_nika_plate.png` | IC XC NIKA plate | 96×64 | 🔒 v0.9+ |

---

## 10. Sprites — UI

UI atoms. Each is a `Control` scene + texture(s). All use vellum noise shader where indicated.

| Path | Component | Dimensions | Status | Notes |
|---|---|---|---|---|
| `res://art/ui/pouch_grid.png` | Pouch slot grid (8×2) | 256×64 | 🟨 | Cedar leather backplate; vellum slot tiles. |
| `res://art/ui/wheel_base.png` | Tincture Wheel guide rings | 320×320 | 🟨 | Three concentric rings (rough/sound/excellent). |
| `res://art/ui/wheel_polygon.png` | Wheel quality polygon overlay | 320×320 | 🟨 | Drawn at runtime via `Polygon2D`; texture used as fill pattern only. |
| `res://art/ui/patient_panel_frame.png` | Patient panel manuscript frame | 420×320 | 🟨 | Vellum-warm with 1px ink rule; double-frame for icon-panel reuse. |
| `res://art/ui/notebook_frame.png` | Notebook open layout | 480×420 | 🟨 | Lined gradient, graphite underrule, damp paper pause. **No page 77 prototype overlay.** Page 77 remains future-only. |
| `res://art/ui/state_overlay_frame.png` | Burden/Pressure/Numbness overlay | 280×72 | 🟨 | Vellum-warm card. |
| `res://art/ui/dialogue_band.png` | Dialogue bottom band | 1920×120 | 🟨 | Manuscript ragged-right block. |
| `res://art/ui/iron_ledger_card.png` | Iron Ledger case card | 320×200 | 🔒 v0.9+ |
| `res://art/ui/halo_ring.png` | Halo ring overlay | 96×96 | 🟨 | Used by `halo.gdshader` mask. Paradise only. |
| `res://art/ui/focus_outline.png` | Focus outline (gold/cool variants) | 9-slice 16×16 | 🟨 | 2px solid gold (Ironwood/Paradise) and 1px witte-cool (Wittehaven). |

---

## 11. Icon panels (still manuscript intercuts)

Composed once, rendered as 480×300 stills inside the manuscript double-frame.

| Path | Panel | Status | Trigger |
|---|---|---|---|
| `res://art/icon_panels/cabin_death.png` | Cabin death | 🟨 | Beat 4 of Cabin scene; mandatory. |
| `res://art/icon_panels/birdie_apple_refusal.png` | Birdie apple refusal | 🟨 | Beat 2 of Ironwood scene; **mandatory.** Kalev offers an apple; Birdie refuses; she follows anyway. |
| `res://art/icon_panels/bethany_triage.png` | Bethany triage outcome | 🟨 | Beat 6 of Bethany scene; mandatory. |
| `res://art/icon_panels/mackinac_threshold.png` | Mackinac crossing | 🔒 v0.9+ |
| `res://art/icon_panels/wittehaven_block_0044.png` | Block 0044 introduction | 🔒 v0.9+ |
| `res://art/icon_panels/paradise_narthex.png` | Paradise narthex | 🔒 v0.9+ |

Composition rules per `scene_composition_bible_v0_8_1.md` §11. Earned-color marks budgeted per panel.

---

## 12. VFX

| Path | Effect | Status | Notes |
|---|---|---|---|
| `res://art/vfx/cold_breath.tscn` | Cold breath particles | 🟨 | `GPUParticles2D`; 1–2px `--vellum-bone` at 24% opacity; lifetime 1.4s; emit on idle in cold scenes. |
| `res://art/vfx/hearth_glow.tscn` | Hearth ambient light | 🟨 | `PointLight2D` with warm color; 18% dim during Cabin Beat 3. |
| `res://art/vfx/candle_glow.tscn` | Candle ambient light | 🟨 | `PointLight2D`; flicker amplitude tied to `candle.gdshader`. |
| `res://art/vfx/window_cool_zone.tscn` | Bethany window cool zone | 🟨 | `PointLight2D` with `--lake-slate`; never blends with candle zone. |
| `res://art/vfx/fluorescent_hum_rim.tscn` | Wittehaven cold rim | 🟨 | 4px-wide `--witte-cool` rim on paint cans; fades 1.5s on Kalev passage. |
| `res://art/vfx/ember_local_flash.tscn` | Local Ember flash on patient panel | 🟨 | 220ms; bound to patient panel only; never screen-wide. |
| `res://art/vfx/page_turn_dust.tscn` | Notebook page-turn dust | 🟨 | 6 particles, 320ms; only on notebook open/close. |

---

## 13. Audio — Bed (ambient sustains)

OGG Vorbis, mono, –20 LUFS, looping unless noted.

| Path | Bed | Status | Notes |
|---|---|---|---|
| `res://audio/bed/cabin_hearth.ogg` | Cabin hearth crackle | 🟨 | 30s loop; –22 LUFS during Beat 3. |
| `res://audio/bed/cabin_hearth_dim.ogg` | Cabin hearth (dimmer) | 🟨 | 30s loop; for Beat 3 cease. |
| `res://audio/bed/wind_pines.ogg` | Wind in pines | 🟨 | 60s loop. |
| `res://audio/bed/sickroom_murmur.ogg` | Bethany sickroom murmur + 3 candles | 🟨 | 60s loop. Three candles audible at distinct pan positions. |
| `res://audio/bed/pencil_scratch.ogg` | Notebook pencil bed | 🟨 | 8s loop; only during notebook write beats. |

---

## 14. Audio — Mark (discrete events)

OGG Vorbis, mono, –12 LUFS, single-shot.

| Path | Mark | Status | Notes |
|---|---|---|---|
| `res://audio/mark/door_close.ogg` | Cabin door close | 🟨 | 240ms. |
| `res://audio/mark/kettle_whistle.ogg` | Kettle whistle on sound-quality | 🟨 | 1.2s. |
| `res://audio/mark/vial_uncork.ogg` | Vial uncork | 🟨 | 220ms. |
| `res://audio/mark/breath_cease.ogg` | Patient breath cease | 🟨 | 240ms. **Captioned: *"the breath stilled."*** |
| `res://audio/mark/cedar_dog_click.ogg` | Cedar dog rattle in pouch | 🟨 | 120ms. |
| `res://audio/mark/snow_crunch.ogg` | Footstep on snow | 🟨 | 240ms × 4 variants. |
| `res://audio/mark/wood_step.ogg` | Footstep on wood | 🟨 | 200ms × 4 variants. |
| `res://audio/mark/fluorescent_hum.ogg` | Wittehaven hum | 🟨 | 1.5s; fades. |
| `res://audio/mark/cup_placed.ogg` | Birdie's cup on table | 🟨 | 320ms. |
| `res://audio/mark/notebook_open.ogg` | Notebook open | 🟨 | 320ms. |
| `res://audio/mark/notebook_close.ogg` | Notebook close | 🟨 | 280ms. |
| `res://audio/mark/page_turn.ogg` | Notebook page turn | 🟨 | 320ms. |
| `res://audio/mark/pencil_stroke.ogg` | Pencil-on-vellum write | 🟨 | 320ms; layered per name written. |
| `res://audio/mark/lena_hand_cloth.ogg` | Lena's hand on shoulder cloth | 🟨 | 600ms; soft. |

### Caption file
`res://data/captions.tres` — Dictionary mapping audio mark path → caption string. Captions render via `CaptionLayer` autoload (low-contrast vellum text, bottom of frame, 1.6s fade).

---

## 15. Audio — UI

| Path | Mark | Status | Notes |
|---|---|---|---|
| `res://audio/ui/panel_open.ogg` | Patient panel open | 🟨 | 240ms; soft cloth-and-paper. |
| `res://audio/ui/panel_close.ogg` | Patient panel close | 🟨 | 200ms. |
| `res://audio/ui/wheel_engage.ogg` | Tincture Wheel engage | 🟨 | 320ms. |
| `res://audio/ui/wheel_quality_sound.ogg` | Quality reaches *sound* | 🟨 | 240ms; **never celebratory.** |

No sound for *excellent* quality. No sound for "level up." No achievement chimes anywhere.

---

## 16. Data resources

Custom Godot 4.6 C# `Resource` types with `[Export]` properties. Authored as `.tres` and edited in the inspector.

### 16.1 RegisterLexicon
`res://scripts/resources/RegisterLexiconResource.cs` + three instances:

| Path | Regime |
|---|---|
| `res://data/register_lexicons/folk.tres` | Ironwood |
| `res://data/register_lexicons/sanctioned.tres` | Wittehaven |
| `res://data/register_lexicons/sacred.tres` | Paradise |

Each holds dictionaries keyed by data field (`patient.name`, `patient.place`, `patient.symptom_breath`, etc.) → string template. The `tactile()` mapping for symptoms lives here, not in script.

### 16.2 Patient
`res://scripts/resources/PatientResource.cs` + instances:

| Path | Patient | Internal state |
|---|---|---|
| `res://data/patients/eli_keene.tres` | Eli | terminal; Ember locked |
| `res://data/patients/miriam_toll.tres` | Miriam | terminal; Ember unlocks hospital-fragment |
| `res://data/patients/nora_finch.tres` | Nora Finch | recoverable through attentive care with locked prototype materials; no Bitterleaf required |
| `res://data/patients/dr_amos_bell.tres` | Dr. Amos Bell | village doctor; Ember dilemma; sit+warm+held quiet can matter |

Each carries `name`, `place`, internal symptom floats, `regime_locked_actions`, and a `notebook_template` per outcome.

### 16.3 Ingredient
`res://scripts/resources/IngredientResource.cs` + P0 instances:

| Path | Ingredient |
|---|---|
| `res://data/ingredients/pulseleaf.tres` | Pulseleaf |
| `res://data/ingredients/cotton.tres` | Cotton |
| `res://data/ingredients/wool.tres` | Wool |
| `res://data/ingredients/salt.tres` | Salt |
| `res://data/ingredients/clean_water.tres` | Clean Water |
| `res://data/ingredients/cedar.tres` | Cedar |
| `res://data/ingredients/honey.tres` | Honey (optional, limited) |
| `res://data/ingredients/ember.tres` | Ember; scarce and not craftable |

### 16.4 Recipe
`res://scripts/resources/RecipeResource.cs` + current P0 instances. Recipe semantics remain a named follow-up for the Tincture Practice ADR; this section only fixes topology.

| Path | Recipe |
|---|---|
| `res://data/recipes/salt_wash.tres` | Salt Wash |
| `res://data/recipes/clean_dressing.tres` | Clean Dressing |
| `res://data/recipes/pulseleaf_draught.tres` | Pulseleaf Draught |
| `res://data/recipes/cedar_wool_compress.tres` | Cedar-Wool Compress |
| `res://data/recipes/ember_dose.tres` | Ember Dose |
| `res://data/recipes/ember_dilution.tres` | Ember Dilution |

### 16.5 Tincture
| Path | Resource |
|---|---|
| `res://data/tincture/wheel_axes.tres` | Four axes (Relief/Warmth/Stability/Risk); guide-ring thresholds. |

### 16.4 Player state
`res://scripts/autoloads/KalevState.cs` (autoload `KalevState`):

- `burden: int 0–4` → state-word
- `pressure: int 0–4` → state-word
- `numbness: int 0–4` → state-word
- `regime: enum {ironwood, wittehaven, paradise}`
- `ember_recent_use: enum {none, self, patient}`
- `lena_nearby: bool`
- `birdie_nearby: bool`

Signals: `state_changed(field, old, new)`. Never exposes raw floats to UI; UI binds to state-word strings via `RegisterLookup.tactile(...)` backed by register lexicons.

---

## 17. Scenes (Godot scenes, not narrative)

| Path | Scene | Status | Notes |
|---|---|---|---|
| `res://scenes/cabin/cabin.tscn` | Cabin interior | 🟨 | Ties `Cabin` tilemap, `Eli` sprite, hearth/candle VFX, four-beat sequencer. |
| `res://scenes/ironwood_road/ironwood_road.tscn` | Ironwood Road | 🟨 | Three-segment horizontal corridor; Birdie encounter; crossroads barricade with Wittehaven foreshadow. |
| `res://scenes/bethany/bethany.tscn` | Bethany sickroom | 🟨 | Three beds; Lena at prep table; six-beat sequencer; Birdie water-bringing trigger. |
| `res://scenes/ui/pouch.tscn` | Pouch HUD | 🟨 | Bottom-left; persistent. |
| `res://scenes/ui/tincture_wheel.tscn` | Tincture Wheel | 🟨 | Mid-craft popup. |
| `res://scenes/ui/patient_panel.tscn` | Patient panel | 🟨 | Center stage when active. |
| `res://scenes/ui/notebook.tscn` | Notebook | 🟨 | Bottom-right toggle; full panel on open. |
| `res://scenes/ui/kalev_state_overlay.tscn` | Burden/Pressure/Numbness overlay | 🟨 | Top-left. |
| `res://scenes/ui/dialogue_box.tscn` | Dialogue bottom band | 🟨 | Bottom of screen. |
| `res://scenes/ui/manuscript_intercut.tscn` | Icon-panel intercut handler | 🟨 | Loads icon-panel texture, holds for ≥4s, fades. |
| `res://scenes/ui/iron_ledger.tscn` | Iron Ledger panel | 🔒 v0.9+ |

---

## 18. Autoloads

| Name | Script | Status | Purpose |
|---|---|---|---|
| `GameEvents` | `res://scripts/autoloads/GameEvents.cs` | 🟨 | Global C# signal bus. |
| `KalevState` | `res://scripts/autoloads/KalevState.cs` | 🟨 | Player-state singleton: Burden, Pressure, Numbness, Ember use, proximity flags. |
| `GameState` | `res://scripts/autoloads/GameState.cs` | ⬜ optional | Scene/run/session flags only; omit if unused rather than folding into `KalevState`. |
| `RegimeManager` | `res://scripts/autoloads/RegimeManager.cs` | 🟨 | Holds current regime; swaps `Theme` resources on root `CanvasLayer`. |
| `RegisterLookup` | `res://scripts/autoloads/RegisterLookup.cs` | 🟨 | `tactile(field_id, value, regime_id)` → string per current regime. |
| `Beat` | `res://scripts/autoloads/Beat.cs` | 🟨 | Scene-beat sequencer; tracks held-frame timing, mark/disclosure pairs, manuscript intercuts. |
| `Notebook` | `res://scripts/autoloads/Notebook.cs` | 🟨 | Persistent notebook record (saves to `user://notebook.dat`). |
| `CaptionLayer` | `res://scripts/autoloads/CaptionLayer.cs` | 🟨 | Renders captions for audio marks. |
| `Inventory` | `res://scripts/autoloads/Inventory.cs` | 🟨 | Pouch state; slot 1 cedar dog and slot 16 Ember locks. |
| `RecipeBook` | `res://scripts/autoloads/RecipeBook.cs` | 🟨 | Known craftables and recipe discovery. |
| `IngredientCatalog` | `res://scripts/autoloads/IngredientCatalog.cs` | 🟨 | P0 ingredient registry. |
| `SceneRouter` | `res://scripts/autoloads/SceneRouter.cs` | 🟨 | Scene transitions; pause-safe and Godot-native. |
| `AudioManager` | `res://scripts/autoloads/AudioManager.cs` | 🟨 | Ambient beds, marks, and caption coordination; no music bus in P0. |
| `DialogueManager` | `res://scripts/autoloads/DialogueManager.cs` | 🟨 | Line dispatch and register-aware dialogue selection. |

---

## 19. Save data

| Path | Contents |
|---|---|
| `user://kalev_state.dat` | Burden, Pressure, Numbness; regime; ember-recent-use. |
| `user://notebook.dat` | Append-only list of `(name, place, line, page, timestamp, page_77_underline: bool)`. |
| `user://settings.cfg` | Tremor amplitude, numbness blur opt-out, audio levels, caption visibility. |

The notebook is **append-only**. Players cannot delete entries. The game does not offer a way to "undo a name." This is a structural feature.

---

## 20. Production priorities (prototype slice)

**P0 — must ship in v0.8.1:**
- Themes (all three)
- Sprites: Kalev Ward 64×96, Lena Hart 64×96, Birdie/Ruth 48×64, Eli Keene bed 96×48, Miriam Toll bed 96×48, Nora Finch bed 96×48, Dr. Amos Bell bed 96×48
- Tilesets: Cabin, Ironwood Road, Bethany
- Props: cedar dog, notebook, pouch, vial_ember, kettle, Pulseleaf, apple, candle, hearth_fire
- All UI sprites + scenes
- Three icon panels (Cabin death, Birdie apple refusal, Bethany triage)
- All shaders
- All audio bed + mark + UI
- Data resources (register lexicons, patients, tincture)
- All P0 scenes

**P1 — placeholder acceptable in v0.8.1, polish in v0.9:**
- Bethany resident generic sprites
- Wittehaven placeholder tileset
- Paint can + ribbon props (functional, art polish later)

**P2 — reserved, do not produce in v0.8.1:**
- Iron Ledger card and scene
- IC XC NIKA plate
- Mackinac, Wittehaven Block 0044, Paradise narthex icon panels and scenes
- All Paradise reservations

---

## 21. Acceptance gate (per asset)

Before any asset is checked into the Godot project, it must pass:

1. **Path matches manifest.** No floating files outside the structure in §1.
2. **Import settings match.** Filter Nearest, mipmaps off, fonts non-MSDF.
3. **Custom data complete.** Tile resources have all four fields populated.
4. **Status legend updated.** 🟨 → ✅ in this manifest the same commit.
5. **No filename leaks register.** No `res://art/ui/healthbar.png`, no `res://audio/mark/success.ogg`. Ever.
6. **Forbidden words absent in filenames and resource string fields.** (See `ui_regime_system_v0_8_1.md` §12.)
7. **Caption present** for any audio mark that affects gameplay.
8. **Acceptance gates from `art_direction_v0_8_1.md` §11** pass for the asset's category.


## 22. v0.8.1 character-scale acceptance additions

1. **Kalev reads as Kalev at 1×.** A reviewer can identify notebook, pouch, coat mass, tired face/posture, and right-hip kit without zooming.
2. **Kalev reads as Kalev at 2×.** Cedar dog charm and Ember vial become legible but do not dominate the silhouette.
3. **No concept-sheet downscale.** Runtime sprites are redrawn at native canvas size; source concept art may be sampled but not used as a crushed sprite.
4. **Tile/sprite compatibility.** 64×96 Kalev stands believably on a 32×32 tile grid with feet anchored to one tile row and coat occupying upper visual space.
5. **Animation economy preserved.** The first Kalev production milestone ships idle, walk, write-name, and administer-ember before lower-priority animations.
6. **No hero drift in Kalev's silhouette.** Kalev's identity is *burdened healer-apothecary*, not warrior / rogue / paladin / action protagonist. His runtime sprite carries no weapons and no combat silhouette. *(This is a Kalev character lock; it is not a game-wide combat closure. Post-P0 antagonist NPCs and any combat layer would use other silhouettes designed for that purpose — see `canonical_locks_v0_8_1.md` §17.)*
7. **Care verbs remain Kalev's primary animations.** The most polished early Kalev animations are write, wash, warm, sit, and administer. Combat-style verbs are not added to Kalev's animation set in P0; if a post-P0 combat layer ever needs them on Kalev, that's a deliberate design decision in that packet, not a default.
8. **Canon names stable.** Nora Finch, Miriam Toll, Dr. Amos Bell, Eli Keene, Lena Hart, Birdie/Ruth, and Kalev Ward use the canonical display/resource names above.
9. **No unapproved P0 ingredients.** Bitterleaf is not a P0 ingredient/resource.
10. **No reserved sacred signage in P0.** IC XC NIKA remains reserved for future/Paradise-facing work, not ordinary P0 UI decoration.
