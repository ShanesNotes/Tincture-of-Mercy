# Godot Design Delta — v0.7/v0.8 → v0.8.1

What changes between earlier v0.7/v0.8 design assumptions and the v0.8.1 design, expressed in concrete Godot 4.6 C#/.NET terms — node renames, resource swaps, signal changes, scene restructures, deletions. Reads after the rest of the v0.8.1 packet.

This document is the migration guide for an existing v0.7 prototype. If no v0.7 prototype exists yet (the GitHub repo `ShanesNotes/Tincture-of-Mercy` was empty at intake), treat the **"v0.8.1 target"** column as the spec to build against directly.

---

## 1. Top-level intent shift

| Dimension | v0.7/v0.8 (assumed/inferred) | v0.8.1 target |
|---|---|---|
| Genre framing | Top-down apothecary RPG with triage moments | **Top-down icon-manuscript game about practice, witness, and the cost of legibility.** |
| Player verbs | Craft, dispense, fight, explore | **Sit · Observe · Warm · Administer · Write the name · (Ember, late and reluctant)** |
| Core meter | Health / patient HP | **Burden / Pressure / Numbness — Kalev's interior, never the patient's HP.** |
| Numbers exposed | Stats, inventory counts, batch %, dose mg | **Tactile words only. Quantities visible only in the pouch quantity glyph and (Wittehaven only) sanctioned chart props.** |
| Combat | Possible / present | **Out of P0 scope.** No combat in the prototype. Combat layer is open for post-P0 packets — when added, it must extend the moral grammar (see `canonical_locks_v0_8_1.md` §17). |
| Reward loop | Items, XP, unlocks | **Out of P0 scope.** In P0, the notebook is the only ledger; care is its own reward. RPG progression / loot / unlocks may layer in post-P0 as deliberate extensions of the contemplative core. |
| World logic | One regime — folk-medieval | **Three regimes (Ironwood / Wittehaven / Paradise) on the same DOM. Theme swap on root CanvasLayer.** |
| Visual register | Single style | **Single component spine that inverts under three theme resources. Inversion is the design.** |
| Audio | Music + SFX | **Bed + Mark + Disclosure. No music in prototype slice.** |
| Scenes shipped | Multiple ambitious | **Three only: Cabin, Ironwood Road, Bethany. Reservations only for Mackinac, Wittehaven Block 0044, Paradise narthex.** |

---

## 2. Node tree restructure

### 2.1 Root

**v0.7 (inferred):**
```
Main
├── World (Node2D)
├── Player (CharacterBody2D)
├── HUD (CanvasLayer)
└── Music (AudioStreamPlayer)
```

**v0.8.1 target:**
```
Main
├── World (Node2D)
│   ├── Scene (loaded scene root: Cabin, Ironwood, Bethany)
│   └── Camera2D (witness camera — fixed scale, no shake, no zoom)
├── Kalev (CharacterBody2D)               # renamed from Player
├── UI (CanvasLayer — root for theme swap)
│   ├── Pouch
│   ├── TinctureWheel
│   ├── PatientPanel
│   ├── Notebook
│   ├── StateOverlay
│   ├── DialogueBand
│   └── ManuscriptIntercut
├── VFX (CanvasLayer)
│   ├── ColdBreath
│   └── EmberLocalFlash                    # bound to PatientPanel only
├── Audio
│   ├── Bed (AudioStreamPlayer)            # one bed at a time
│   └── Marks (AudioStreamPlayer × 4 pool) # one-shots
└── CaptionLayer (CanvasLayer — top z-index)
```

**Deletions:** `Music` node. No music plays in the prototype slice.

**Renames:** `Player` → `Kalev`. Every reference to "player" in code becomes either `Kalev` (the body) or `KalevState` (the autoload). The word *player* survives only in input-mapping and accessibility code.

---

## 3. Autoloads

| v0.7/v0.8 (inferred) | v0.8.1 | Action |
|---|---|---|
| — | `GameEvents` | **Add.** Global C# signal bus. |
| — | `KalevState` | **Add.** Burden/Pressure/Numbness, regime, Ember-recent-use, Lena-nearby, Birdie-nearby. |
| `GameState` | `GameState` optional | **Keep only if needed** for scene/run/session flags. Do not collapse into `KalevState`. |
| — | `RegimeManager` | **Add.** Holds current regime; swaps `Theme` on UI root. |
| — | `RegisterLookup` | **Add.** `tactile(field_id, value, regime_id)` → string per current regime. |
| — | `Beat` | **Add.** Scene-beat sequencer. |
| — | `Notebook` | **Add.** Append-only persistent notebook record. |
| — | `CaptionLayer` | **Add.** Renders captions for audio marks. |
| `Inventory` | `Inventory` | **Keep.** Owns pouch state and slot locks; reads/writes through C# signals, not directly from UI. |
| — | `RecipeBook` | **Add.** Known craftables and recipe discovery. |
| — | `IngredientCatalog` | **Add.** P0 ingredient registry. |
| — | `SceneRouter` | **Add.** Scene transitions. |
| — | `AudioManager` | **Add.** Bed + mark + caption coordination; no music bus. |
| — | `DialogueManager` | **Add.** Line dispatch and register selection. |
| `QuestLog` | — | **Delete from P0 autoloads.** There are no quests in P0. The notebook replaces it but is **not** a quest log. A post-P0 packet that introduces quests would scaffold its own autoload — never collapse it into `Notebook`. |
| `Score` / `Stats` | — | **Delete from P0 autoloads.** No score in P0. Post-P0 RPG progression would scaffold its own state autoload (e.g., `KalevProgression`) — never collapse it into `KalevState`, which models interior body-state, not power. |

---

## 4. Resource type changes

### 4.1 New custom Resource types

```csharp
// scripts/resources/RegisterLexiconResource.cs
using Godot;

[GlobalClass]
public partial class RegisterLexiconResource : Resource
{
    [Export] public Godot.Collections.Dictionary<StringName, string> Entries { get; set; } = new(); // field_id → string template
}
```

```csharp
// scripts/resources/PatientResource.cs
using Godot;

[GlobalClass]
public partial class PatientResource : Resource
{
    [Export] public string NameFolk { get; set; } = string.Empty;
    [Export] public string NameSanctioned { get; set; } = string.Empty; // case ID
    [Export] public string NameSacred { get; set; } = string.Empty;     // folk-with-lineage
    [Export] public string Place { get; set; } = string.Empty;
    [Export] public Godot.Collections.Dictionary<StringName, float> Symptoms { get; set; } = new();
    [Export] public Godot.Collections.Array<StringName> RegimeLockedActions { get; set; } = new();
    [Export] public Godot.Collections.Dictionary<StringName, string> NotebookTemplates { get; set; } = new();
    [Export] public bool EmberLocked { get; set; } = false; // Eli only in prototype slice
}
```

```csharp
// scripts/resources/IngredientResource.cs
using Godot;

[GlobalClass]
public partial class IngredientResource : Resource
{
    [Export] public string NameFolk { get; set; } = string.Empty;
    [Export] public string NameSanctioned { get; set; } = string.Empty;
    [Export] public Vector4 Contribution { get; set; } // Relief / Warmth / Stability / Risk
    [Export] public bool CannotCombineWithOthers { get; set; } = false; // Ember only
}
```

### 4.2 Deletions

| v0.7 resource (inferred) | Reason for removal |
|---|---|
| `Item.cs` (with `value`, `rarity`, `tier`) | Items are not currency. Replaced by `Ingredient` and prop scenes. |
| `Stats.cs` | No stats. `KalevState` carries state-words, not floats-as-stats. |
| `QuestData.cs` | No quests. |
| `Achievement.cs` | No achievements. |
| `Recipe.cs` (with success/fail) | Replaced by `TinctureAxes` + per-ingredient `Ingredient` resources; quality reads tactile. |

---

## 5. Signal changes

### 5.1 New signals on `KalevState`

```csharp
// scripts/autoloads/KalevState.cs
[Signal] public delegate void StateChangedEventHandler(StringName field, Variant oldValue, Variant newValue);
[Signal] public delegate void RegimeChangedEventHandler(int oldRegime, int newRegime);
[Signal] public delegate void EmberUsedEventHandler(StringName target); // "self" or patient NameFolk
[Signal] public delegate void LenaProximityChangedEventHandler(bool near);
[Signal] public delegate void BirdieProximityChangedEventHandler(bool near);
```

### 5.2 New signals on `Beat`

```csharp
// scripts/autoloads/Beat.cs
[Signal] public delegate void BeatStartedEventHandler(StringName scene, int beatIndex);
[Signal] public delegate void BeatHeldFrameCompleteEventHandler(int beatIndex, float duration);
[Signal] public delegate void BeatDisclosureStartedEventHandler(int beatIndex);
[Signal] public delegate void BeatDisclosureEndedEventHandler(int beatIndex);
[Signal] public delegate void BeatCompletedEventHandler(int beatIndex);
[Signal] public delegate void SceneCompletedEventHandler(StringName scene);
[Signal] public delegate void ManuscriptIntercutStartedEventHandler(StringName panelId);
[Signal] public delegate void ManuscriptIntercutEndedEventHandler(StringName panelId);
```

### 5.3 New signals on `Notebook`

```csharp
// scripts/autoloads/Notebook.cs
[Signal] public delegate void NameWrittenEventHandler(string name, int page, int line, StringName stillnessMarker);
```

### 5.4 Removed signals (v0.7 → delete)

| Signal | Reason |
|---|---|
| `Player.health_changed` | Kalev's interior is Burden/Pressure/Numbness; no health. |
| `Player.died` | Kalev does not die in the prototype slice. |
| `Inventory.item_added` / `item_removed` | Pouch reads `KalevState.pouch_contents`. |
| `Quest.completed` | No quests. |
| `Recipe.crafted_success` / `crafted_fail` | Quality is tactile, not pass/fail. |

---

## 6. Theme + style

### 6.1 New

- `themes/theme_ironwood.tres` (default)
- `themes/theme_wittehaven.tres`
- `themes/theme_paradise.tres`

`RegimeManager.set_regime(regime)` calls `UI.theme = preload(...)` plus emits `regime_changed`.

### 6.2 Stylebox specs (concrete)

**Panel (Ironwood):** `StyleBoxFlat`, bg `--bg-elevated` (#FAF6EC), border 1px `--rule-strong` (#7F7468), corner radius 6px, content margins 16px.

**Panel (Wittehaven):** `StyleBoxFlat`, bg `--witte-white` (#F4F6F8), border 0px, corner radius 0px, shadow `--shadow-witte` (drop 0 1 2 rgba(15 23 42 / 0.08)), content margins 12px.

**Panel (Paradise):** `StyleBoxFlat`, bg `--vellum-bone` (#F2EFE6), border 1px `--icon-gold` (#C9A557), corner radius 6px, plus `halo.gdshader` overlay.

**Button (Ironwood):** vellum-warm fill, 1px ink rule, no radius, hover `filter: brightness(0.96)` + 1px rule weight increase, press `translateY(0.5px)`.

**Button (Wittehaven):** witte-white fill, 0px radius, mono-witte font ALL CAPS, hover `filter: brightness(0.96)` only.

**Button (Paradise):** vellum-bone fill, 1px ink rule, IM Fell English font sentence case, hover `filter: brightness(0.96)`.

---

## 7. Scene-level changes

### 7.1 Cabin

| v0.7/v0.8 (inferred) | v0.8.1 |
|---|---|
| Cabin scene allows Ember administration on Eli. | **Ember slot is greyed and disabled in this scene.** Eli cannot be saved. The label reads *"ember — for later."* |
| Eli might recover. | **Eli always dies.** The scene composes around the loss. |
| Free-roam time-pressure. | **Four composed beats** (Arriving / Practice / Cease / Notebook) per `scene_composition_bible_v0_8_1.md` §5. |
| HP bar visible. | Removed. |
| Crafting feedback shows percentages. | Replaced by Tincture Wheel polygon at *rough* / *sound* / *excellent* rings. |
| Scene exits with a "scene complete" card. | **Replaced by manuscript intercut** (Cabin death icon panel, held 4s, vellum-bone fade). |

### 7.2 Ironwood Road

| v0.7/v0.8 (inferred) | v0.8.1 |
|---|---|
| Possibly enemies on the road. | **No enemies.** No combat tilemap collisions for hostiles. |
| Birdie may not exist or is a quest-giver. | **Birdie is a small encounter beat, not a quest-giver.** She exchanges nothing transactional. The notebook records her, the player doesn't "complete" her. |
| The east fork might lead to Wittehaven. | **East fork is barriered with a manuscript-rule barrier.** Wittehaven appears only as foreshadow: paint cans, ribbon, fluorescent hum. |
| Apple is a regular item. | **Apple is a one-pixel ember-red prop with a worm hole.** Picking it up is not the affordance — Birdie's response is. |

### 7.3 Bethany

| v0.7/v0.8 (inferred) | v0.8.1 |
|---|---|
| Triage might gate by score / time / outcome. | **Triage gates by writing names.** Beat 6 is mandatory. Outcomes do not gate the next scene. |
| Three patients identified by case data. | **Three patients identified by name** (Miriam Toll, Nora Finch, Dr. Amos Bell). Case-language only appears in §4.6 fragment moments. |
| Lena is a vendor / merchant. | **Lena is the older healer.** She holds the line. Her line in Beat 1 is fixed and cannot be changed by player choice. |
| Birdie does not appear here. | **Birdie enters in Beat 4 carrying water.** She places the cup beside Bell (always Bell, regardless of player attention order). She does not speak. |
| Ember administration is a tactical choice with a damage number. | **Ember administration triggers diegetic consequences only.** Miriam: hospital-language fragment for ~1s. Nora: she goes quiet, then worse by morning. Bell: he sleeps; recovers; does not look at Kalev. **No numbers. No "Ember -1 dose." No combat-stat readout.** |

---

## 8. Input changes

| v0.7/v0.8 (inferred) | v0.8.1 |
|---|---|
| `inventory_open` | **`pouch_open`** (renamed; opens pouch, not inventory) |
| `pause` | **Same.** Pause is allowed; it simply holds Kalev's eye-line. |
| `attack` / `interact_attack` | **Deleted.** No attack. |
| `interact` | **`act`** — context-sensitive: *Sit · Observe · Warm · Administer · Write the name*. |
| `craft` | **`tincture`** — opens Tincture Wheel at the prep table. |
| `quest_log` | **`notebook`** — opens the notebook. The notebook is **not** a quest log. |
| `skip_dialogue` | **Deleted.** Players can fast-forward (hold `act`) but never skip. |

---

## 9. Save data changes

| v0.7/v0.8 (inferred) | v0.8.1 |
|---|---|
| `save.dat` with player state, inventory, quest progress, score | **Three files:** `kalev_state.dat`, `notebook.dat`, `settings.cfg`. |
| Inventory editable. | Pouch contents follow narrative; player cannot drop the cedar dog or the vial when locked. |
| Quest log editable. | Notebook is **append-only**. No deletion. No editing. **Structural feature, not oversight.** |
| Score persists. | No score persists because no score exists. |

---

## 10. Code-level renames (find/replace)

| v0.7/v0.8 symbol | v0.8.1 symbol |
|---|---|
| `Player` | `Kalev` (body) / `KalevState` (autoload) |
| `health` | `burden` / `pressure` / `numbness` (per context) |
| `health_max` | — (delete; meters cap at state-word "breaking" / "near panic" / "case-language dominates") |
| `take_damage(amount)` | `add_pressure(step)` or `add_burden(step)` (only ever step ±1 toward neighbor state-word) |
| `inventory` | `pouch` |
| `add_item(item)` | `pouch.add_ingredient(ingredient)` |
| `craft(recipe)` | `tincture.attempt(axes_vector)` |
| `quest_log` | `notebook` |
| `score` | — (delete) |
| `xp` | — (delete) |
| `achievement_unlocked` | — (delete) |
| `enemy` | — (delete from class names; the only legitimate use remaining is test name `_no_enemies_test`) |

---

## 11. Animation tree changes

`AnimationTree` per character. Notable additions:

- **Kalev administer-ember 5-frame** with `tremor` shader bound to frame 3 ("brace") at high Pressure.
- **Patient breath** state machine with `breath / breath-thinning / still` transitions driven by `Patient.symptoms.breath` thresholds.
- **Notebook open/close** as `AnimationPlayer` on `Notebook` UI scene, 320ms each, with `page_turn_dust` particle hook.

Removed:

- **Combat hit-flash** animations.
- **Death animations** (player; characters' "still" frame is the breath-state terminus, not a death anim).
- **Item pickup pop** animation.

---

## 12. Migration checklist (concrete)

If migrating an existing v0.7 prototype, run this list in order:

1. Delete `Music` node plus obsolete `Score` / `Stats` / `QuestLog` autoloads. If an old `Inventory` autoload exists, replace it with the canonical C# `Inventory` from step 2 rather than deleting pouch ownership entirely.
2. Add canonical autoloads from `canonical_locks_v0_8_1.md` §13: `GameEvents`, `KalevState`, optional `GameState`, `RegimeManager`, `RegisterLookup`, `Beat`, `Notebook`, `CaptionLayer`, `Inventory`, `RecipeBook`, `IngredientCatalog`, `SceneRouter`, `AudioManager`, `DialogueManager`.
3. Rename `Player` → `Kalev` everywhere; introduce `KalevState` autoload for state.
4. Replace `Item` resources with `Ingredient` resources where appropriate; delete the rest.
5. Replace `Recipe` resources with `TinctureAxes` + per-ingredient contributions; delete success/fail.
6. Replace `QuestData` with `Beat` sequences; delete quest scenes.
7. Author three `Theme` resources; wire `RegimeManager.set_regime()`.
8. Author three `RegisterLexiconResource` resources; wire `RegisterLookup.tactile(field_id, value, regime_id)`.
9. Author four `PatientResource` resources (Eli Keene, Miriam Toll, Nora Finch, Dr. Amos Bell).
10. Replace combat input action with `act`; remove `attack` / `skip_dialogue`.
11. Author Cabin / Ironwood Road / Bethany scenes per `scene_composition_bible_v0_8_1.md`.
12. Author three icon panels (Cabin death, Birdie offering, Bethany triage).
13. Wire `ManuscriptIntercut` scene to `Beat.scene_completed`.
14. Wire `Notebook.name_written` to UI write beats.
15. Wire `KalevState.ember_used("self")` → temporary numb-blur ramp; `ember_used(patient_name)` → temporary §4.6 hospital-language fragment.
16. Run all acceptance gates from `acceptance_tests_v0_8_1.md` (next document).
17. P0 vocabulary gate (`design_system/tools/anti_drift.py --mode p0-vocabulary`) on the entire project — fail the build if any restricted P0 word appears in user-facing strings. Scope expands when post-P0 packets register sanctioned vocabulary.

---

## 13. What survives v0.7/v0.8 → v0.8.1

This list exists so the v0.7 work isn't discarded — only re-aimed.

- **Top-down 32-pixel framing.** Kept.
- **Cedar / damp Michigan palette intent.** Kept; refined to the v0.8.1 token set.
- **Apothecary craft mechanic.** Kept; transformed from recipe-success into Tincture Wheel quality.
- **The notebook concept.** Kept; promoted to the central ledger of the game.
- **The cedar dog.** Kept; its symbolic weight is the same.
- **Lena's role as elder healer.** Kept; her dialogue is now fixed at key beats.
- **Bethany as a place.** Kept; deepened.

What does not survive: combat, score, quests, items-as-currency, music, hp bars, generic medieval-fantasy framing.

---

## 14. Anti-drift safeguards (build-time)

Add these to the project's CI / pre-commit:

1. **Forbidden-word grep** on `*.tscn`, `*.cs`, `*.tres`, and exported strings. The list is `ui_regime_system_v0_8_1.md` §12.
2. **Numeric-leak grep** on UI labels: any `Label` text containing `%` or a digit must be tagged `@allow_numeric` (only quantities and Wittehaven panels qualify).
3. **Combat-symbol grep** on class names: any class named `*Enemy*`, `*Damage*`, `*Hit*`, `*Combat*`, `*Boss*` fails the build.
4. **Theme-coverage check.** All three theme `.tres` files must define the same set of style overrides; missing keys fail the build.
5. **Notebook append-only check.** A unit test attempts `notebook.delete_entry(0)` and expects it to fail.
6. **Caption coverage check.** Every audio mark in `audio/mark/` must have a matching key in `data/captions.tres`.

These exist because the design's main failure mode is *drift toward legibility* — and legibility is precisely what Wittehaven represents. The build itself enforces the world's contract.
