<!-- STATUS: historical/source packet. Current implementation language is C#/.NET per README and design_system/v0_8_1/canonical_locks_v0_8_1.md; any GDScript-first guidance below is superseded. -->

# TINCTURE OF MERCY: THE GARMENTS OF SKIN

## Godot Gameplay + 2D Asset Design Handoff v0.7

**Status:** CLEARED FOR DESIGN HANDOFF  
**Primary audience:** game designer, systems designer, UI/UX designer, 2D pixel artist, technical artist, Godot implementer  
**Engine target:** Godot 4.6.x stable branch; do not build the prototype on release candidates or 4.7 beta snapshots without a formal upgrade note  
**Prototype target:** Cabin / Ironwood Road / Bethany vertical slice  
**Supersedes:** v0.6 Unified Prototype Design Packet for prototype handoff language  
**Preserves:** v0.3 deep-lore foundation and v0.6 core loop/pillars  
**Document purpose:** Convert the narrative/gameplay thesis into a buildable Godot 4.x gameplay specification and a concrete 2D top-down asset request list.

\---

## 0\. Clearance note

This version is cleared to send to design. It closes the remaining prototype questions that blocked production and translates the playable experience into Godot scenes, resources, signals, UI surfaces, and art/audio asset requirements.

The design team should not treat this as a mood document. It is the foundational production spec for the first playable build. Mood, story, and symbolic grammar are included only where they directly control gameplay, scene composition, interface behavior, or asset requirements.

### The locked prototype statement

> \*\*Tincture of Mercy\*\* is a 2D top-down narrative survival-care pilgrimage game about a burdened healer-apothecary in post-Turn Michigan who forages, scavenges, crafts therapeutics, treats named people, manages Pressure and Numbness, and learns that medicine works but cannot redeem.

### The locked vertical slice

The first playable prototype begins with Kalev in the cabin beside a dying boy and ends after Bethany’s three-patient triage sequence, with Birdie and Lena established and the road turning toward Wittehaven.

### The locked gameplay thesis

The prototype must prove this loop:

> \*\*Move → observe → gather → craft → triage → treat → bear consequence → write name/outcome → rest → move north.\*\*

The player is not playing a combatant, farmer, hospital manager, or puzzle-solver. The player is playing a healer whose core verb is **attention under scarcity**.

\---

## 1\. Source hierarchy and design law

### 1.1 Source hierarchy

1. **v0.7 Godot Gameplay + 2D Asset Design Handoff** — current production handoff for the first playable prototype.
2. **v0.6 Unified Prototype Design Packet** — preserved for overall structure, pillars, loop, and Godot translation layer.
3. **v0.3 Working Document** — canonical deep-lore foundation, narrative architecture, cast, symbolic grammar, and four-phase pilgrimage.

When documents conflict, this v0.7 controls the prototype. v0.3 controls deep lore. v0.6 remains valid where v0.7 does not override it.

### 1.2 Non-negotiable pillars

Every prototype feature must preserve these pillars:

1. **Names over metrics.** The notebook records persons, not outcomes. Wittehaven later records cases, not persons.
2. **Medicine works but cannot redeem.** Crafting must be genuinely useful. The falsehood is not medicine; the falsehood is worshipping treatment as salvation.
3. **Ember must be tempting.** If the player does not want to use Ember, the system has failed.
4. **Wittehaven must first feel like relief.** The prototype only foreshadows Wittehaven, but that foreshadow must sound attractive: clean beds, warm food, sanctioned supplies, locked doors.
5. **The enemy is not flesh and blood.** No cartoon villains. No zombie plague. No combat-first structure.
6. **Crafting is care, not loot optimization.** The player crafts therapeutic things for named people under time, fatigue, material, and moral pressure.

### 1.3 Prototype mantra

> \*\*Small map. Few ingredients. Few patients. Real consequence. Strong atmosphere. Crafting first. Names carried, not collected.\*\*

\---

## 2\. Design decisions locked for v0.7

The following decisions close v0.6 open questions and are now production locks.

|Topic|Locked decision|Rationale|
|-|-|-|
|Engine|Godot 4.6.x stable|Current stable Godot branch with mature 2D tools; avoid beta/RC churn.|
|Language|Historical v0.7 note: GDScript first|Superseded by current canon: C#/.NET is the engine implementation language.|
|Visual format|2D top-down pixel art|Human-scale exploration, small maps, clear interaction.|
|Tile size|32×32 base tiles|Common readable top-down scale; supports 32×48 tall characters.|
|Base viewport|960×540 logical 16:9|Shows roughly 30×16 tiles at native camera zoom; scales cleanly to 1080p at 2×.|
|Pixel scaling|Nearest filtering; integer scaling preferred|Avoid blurry pixel art; design all assets around crisp edges.|
|Camera|Camera2D, no dramatic zoom in normal play|Keep navigation readable; icon panels handle sacred emphasis.|
|Prototype craftables|5: Salt Wash, Clean Dressing, Pulseleaf Draught, Cedar-Wool Compress, Ember Dose/Dilution|Enough variety to prove system without overbuilding.|
|Recipe quality|Three levels: Rough / Sound / Excellent|Gives consequence without complex simulation.|
|Crafting time|Modal crafting pauses real-time movement but advances scene-time after completion|No twitch crafting; still costs patient urgency.|
|Triage time|Soft urgency timers per patient in Bethany|Player feels time pressure without reflex challenge.|
|Ember availability|2 doses in prototype|One obvious self-use temptation; one patient-use dilemma.|
|Ember use|Usable on Kalev and on Bethany doctor|Must prove both Strange Fire and possible mercy.|
|Tincture Wheel|Literal prototype UI, simplified|Central mechanic must be visible early.|
|Notebook|Records names/outcomes; also rest/autosave metaphor|Present but not dominant.|
|Cabin boy name|Eli Keene|Short, pronounceable, human; page 66 line 7.|
|Bethany patients|Miriam Toll, Nora Finch, Dr. Amos Bell|Three distinct care problems: death-with-presence, treatable illness, Ember dilemma.|
|Unavoidable death|Miriam Toll cannot biologically recover|Prototype proves that “patient dies” is not always “player failed.”|
|Birdie timing|Appears after first forage, before Bethany|She reframes gathering and attention before triage.|
|Lena timing|Appears during Bethany triage, before doctor resolution|She must change gameplay, not merely comment after it.|
|Wittehaven foreshadow|Rumor + road sign + resident testimony|Future relief must be desired before it is judged.|
|Combat|None|Conflict is care, scarcity, pressure, apathy, and systems.|

\---

## 3\. Research basis translated into design constraints

This handoff uses current Godot 4.6 documentation and contemporary pixel-art setup guidance. The design implications are below.

### 3.1 Godot 4.6.x stable branch

Godot’s public site currently presents 4.6.2 as the latest download while also showing 4.6.3 as a release candidate and 4.7 as beta/dev. The prototype should pin a 4.6.x stable editor binary and should not move to 4.7 until the prototype is already stable or a technical need appears.

**Production rule:** record the exact Godot version in `README.md` and in the first commit message. Example: `Godot 4.6.2.stable`.

### 3.2 TileMapLayer, not deprecated TileMap

Godot’s current tilemap workflow uses `TileMapLayer` nodes and reusable `TileSet` resources. `TileMapLayer` is one layer; multiple layers compose the level. Therefore every map in this prototype uses separate tile layers for floor, walls, decor, foreground, and optional navigation/collision metadata.

**Production rule:** do not create legacy `TileMap` scenes. Use `TileMapLayer` throughout.

### 3.3 CharacterBody2D for controllable characters

Godot’s `CharacterBody2D` is designed for user-controlled 2D characters with collision and movement helpers. Kalev, Birdie, Lena, and any moving NPCs use `CharacterBody2D`. Bedridden patients use `StaticBody2D` or `Node2D` plus `Area2D` interaction because they do not need movement logic.

**Production rule:** never attach heavy patient logic to the player. Patients are separate scene instances with their own `PatientController`.

### 3.4 AnimatedSprite2D + SpriteFrames for pixel characters

Godot’s `AnimatedSprite2D` uses `SpriteFrames` resources. Character sheets should be imported as PNG and sliced into named animations.

**Production rule:** every player/NPC animation must have a stable animation name: `idle\_down`, `walk\_down`, `interact\_down`, `kneel\_down`, etc.

### 3.5 Resources for authored gameplay data

Godot `Resource` files are data containers saved as `.tres`. Ingredients, recipes, patients, notebook entries, dialogue fragments, and scene metadata should be authored as resources. This keeps design content outside code and lets the design team edit data safely.

**Production rule:** if a designer should tune it, it belongs in a Resource, not hard-coded in a scene script.

### 3.6 Signals for low-coupling systems

Godot signals allow nodes to react to events without direct references. This project should use a global `GameEvents` autoload as a signal bus for recipe crafted, patient treated, name written, Ember used, and state changed.

**Production rule:** UI listens. Systems emit. Avoid UI directly modifying patient internals except through service methods.

### 3.7 CanvasLayer + Control for UI

All gameplay UI — pouch, notebook, patient panel, Tincture Wheel, dialogue, Kalev state icons — lives in a persistent HUD `CanvasLayer` using `Control`-based scenes.

**Production rule:** no gameplay UI should be placed inside individual world scenes unless it is a diegetic marker. World scenes should instantiate or reveal HUD panels.

### 3.8 Pixel-art import and display

Pixel art must use nearest-neighbor filtering and a deliberate base resolution/scale mode. The production target is 960×540 logical 16:9, scaling cleanly to 1920×1080. Nearest filtering is required globally and on imported textures.

**Production rule:** every PNG import must be checked for blur before acceptance.

\---

## 4\. Player verbs and gameplay grammar

### 4.1 Primary player verbs

|Verb|Godot interaction|Gameplay purpose|Moral pressure|
|-|-|-|-|
|Move|`CharacterBody2D` movement|Traverse small spaces|What do you pass by?|
|Observe|Interact with person/object|Reveal name, symptom, context, hidden need|Attention costs time.|
|Gather|`Area2D` forage/scavenge|Add materials to pouch|Quick harvest vs clean harvest.|
|Craft|Tincture Wheel modal|Convert materials into therapeutics|Medicine works but consumes time.|
|Treat|Patient panel action|Apply care, medicine, warmth, Ember|Are you helping or controlling?|
|Sit|Patient action|Presence without procedure|Burden rises; Pressure may settle.|
|Write|Notebook UI|Record name/outcome|Names over metrics.|
|Rest|Camp/bed/notebook checkpoint|Save and review consequence|What has been carried?|
|Leave|Scene transition|Continue pilgrimage|Leaving is sometimes necessary, never neutral.|

### 4.2 Secondary verbs

These are not full systems yet but appear as actions in dialogue or patient care:

* **Wash** — prepare body, hands, cloth, or wound.
* **Warm** — blanket, compress, fire, presence.
* **Dilute** — reduce Ember/agent risk.
* **Ask name** — may be direct, indirect, or impossible.
* **Listen** — may reveal hidden need or personal memory.
* **Give apple** — failed bribe; Birdie refuses.

### 4.3 Negative verbs intentionally excluded

The prototype does not include attack, dodge, loot corpse, sell, build base, upgrade weapon, romance, farm, fish, or manage a hospital.

\---

## 5\. Core systems overview

The game is a small set of interlocking systems. None should become large alone.

```
Movement / Interaction
    ↓
Observation
    ↓
Foraging + Scavenging → Inventory / Pouch
    ↓                      ↓
Crafting / Tincture Wheel ← Ingredient + Recipe Resources
    ↓
Patient Triage / Treatment ← Patient Resources + Patient Controllers
    ↓
Burden / Pressure / Numbness + Ember
    ↓
Notebook + Consequence Flags
    ↓
Rest / Autosave / Road North
```

### 5.1 System priorities

1. **Treatment gameplay must feel meaningful before art is final.** Placeholder art is acceptable; shallow care is not.
2. **Crafting must produce patient-relevant decisions.** It cannot be an isolated menu.
3. **Ember must solve a real problem.** Its danger is only persuasive if its benefit is real.
4. **Names must affect UI and memory.** A named patient is not just a renamed case.
5. **The prototype must end with consequence, not victory.** The player should wonder what kind of healer they are becoming.

\---

## 6\. Godot project architecture

### 6.1 Folder structure

```text
tincture\_of\_mercy/
├── project.godot
├── README.md
├── addons/
│   ├── gdunit4/                         # optional but recommended for tests
│   └── dialogic/                        # optional; only if adopted formally
├── assets/
│   ├── sprites/
│   │   ├── characters/
│   │   ├── patients/
│   │   ├── residents/
│   │   ├── items/
│   │   ├── props/
│   │   ├── effects/
│   │   ├── ui/
│   │   └── tilesets/
│   ├── icon\_panels/
│   ├── fonts/
│   ├── audio/
│   │   ├── sfx/
│   │   ├── ambient/
│   │   └── music/
│   └── shaders/
├── assets\_src/
│   ├── aseprite/
│   ├── reference/
│   └── notes/
├── data/
│   ├── ingredients/
│   ├── recipes/
│   ├── patients/
│   ├── dialogue/
│   ├── notebook/
│   ├── scenes/
│   └── tilesets/
├── scenes/
│   ├── main.tscn
│   ├── world/
│   │   ├── cabin.tscn
│   │   ├── ironwood\_road.tscn
│   │   └── bethany\_clinic.tscn
│   ├── characters/
│   │   ├── player.tscn
│   │   ├── birdie.tscn
│   │   └── lena.tscn
│   ├── patients/
│   │   ├── patient\_bed.tscn
│   │   ├── cabin\_eli\_keene.tscn
│   │   ├── bethany\_miriam\_toll.tscn
│   │   ├── bethany\_nora\_finch.tscn
│   │   └── bethany\_dr\_amos\_bell.tscn
│   ├── interactables/
│   │   ├── forage\_node.tscn
│   │   ├── salvage\_node.tscn
│   │   ├── cedar\_dog.tscn
│   │   ├── ember\_vial.tscn
│   │   ├── notebook\_world.tscn
│   │   ├── door\_transition.tscn
│   │   └── rest\_marker.tscn
│   └── ui/
│       ├── hud\_root.tscn
│       ├── dialogue\_box.tscn
│       ├── pouch\_panel.tscn
│       ├── tincture\_wheel.tscn
│       ├── patient\_panel.tscn
│       ├── notebook\_panel.tscn
│       ├── state\_overlay.tscn
│       └── consequence\_summary.tscn
├── scripts/
│   ├── autoloads/
│   ├── components/
│   ├── resources/
│   ├── controllers/
│   ├── ui/
│   └── util/
└── tests/
    ├── unit/
    └── slice/
```

### 6.2 Project settings

|Setting|Value|Note|
|-|-|-|
|Window width|960|Logical base width.|
|Window height|540|Logical base height.|
|Stretch mode|`canvas\_items` or `viewport` after art test|Start with `canvas\_items` for smoother camera/UI; test `viewport` if stricter retro look desired.|
|Stretch aspect|`expand` or `keep` after UX test|`keep` preserves aspect with bars; `expand` uses wider screens.|
|Scale mode|integer where possible|Preserve square pixels.|
|Texture default filter|nearest|Required for pixel art.|
|Texture repeat|disabled|Required for sprites/UI unless specific tiling texture.|
|Physics ticks|default|No twitch systems requiring special tick rate.|
|Input map|see Section 6.8|Must be rebindable.|

### 6.3 Main scene tree

```text
Main (Node)
├── CurrentScene (Node2D)                 # active world scene instanced by SceneRouter
├── HUDRoot (CanvasLayer)
│   ├── StateOverlay (Control)
│   ├── DialogueBox (Control, hidden)
│   ├── PouchPanel (Control, hidden)
│   ├── TinctureWheel (Control, hidden)
│   ├── PatientPanel (Control, hidden)
│   ├── NotebookPanel (Control, hidden)
│   └── ConsequenceSummary (Control, hidden)
└── FadeOverlay (CanvasLayer)
    └── ColorRect
```

### 6.4 Autoloads

|Autoload|Type|Responsibility|
|-|-|-|
|`GameEvents`|Node|Global signal bus.|
|`GameState`|Node/Resource wrapper|Run-level state: Pressure, Burden, Numbness, Ember count, flags.|
|`Inventory`|Node|Pouch contents; add/remove/query materials and craftables.|
|`NotebookState`|Node|Notebook entries, page/line cursor, known names, autosave marker.|
|`SceneRouter`|Node|Scene transitions, fade, spawn marker selection.|
|`RecipeBook`|Node|Loads `RecipeResource` files; returns craftable options.|
|`IngredientCatalog`|Node|Loads `IngredientResource` files; supports UI names/icons.|
|`PatientRegistry`|Node|Tracks patient runtime outcomes and ledger seeds.|
|`AudioManager`|Node|Ambient loops, SFX, sparse music cues.|
|`DialogueManager`|Node|Runs dialogue resources or wraps selected dialogue plugin.|
|`TriageClock`|Node|Advances scene-time and informs patient urgency.|

### 6.5 Global signals

```gdscript
# GameEvents.gd
signal scene\_changed(from\_scene: StringName, to\_scene: StringName)
signal interactable\_focused(interactable\_id: StringName)
signal ingredient\_gathered(ingredient\_id: StringName, quantity: int, quality: int)
signal item\_added(item\_id: StringName, quantity: int)
signal recipe\_crafted(recipe\_id: StringName, quality: int, time\_cost: float)
signal craft\_failed(recipe\_id: StringName, reason: String)
signal patient\_observed(patient\_id: StringName, observation\_id: StringName)
signal patient\_treated(patient\_id: StringName, treatment\_id: StringName, outcome\_delta: Dictionary)
signal patient\_outcome\_locked(patient\_id: StringName, outcome\_id: StringName)
signal name\_learned(patient\_id: StringName, person\_name: String)
signal name\_recorded(person\_name: String, page: int, line: int)
signal notebook\_entry\_added(entry\_id: StringName)
signal ember\_self\_used(remaining: int)
signal ember\_patient\_used(patient\_id: StringName, remaining: int)
signal burden\_changed(value: float)
signal pressure\_changed(value: float)
signal numbness\_changed(value: float)
signal companion\_trust\_changed(companion\_id: StringName, value: float)
signal triage\_time\_advanced(seconds: float)
signal rest\_completed(rest\_id: StringName)
```

### 6.6 Resource classes

#### IngredientResource

```gdscript
class\_name IngredientResource
extends Resource

@export var id: StringName
@export var folk\_name: String
@export var sanctioned\_name: String
@export var icon: Texture2D
@export var category: StringName            # herb, cloth, mineral, carrier, rare, salvage
@export var potency: float = 1.0
@export var stability: float = 1.0
@export var purity: float = 1.0
@export var warmth: float = 0.0
@export var risk: float = 0.0
@export var can\_spoil: bool = false
@export var description\_folk: String
@export var description\_sanctioned: String
```

#### RecipeResource

```gdscript
class\_name RecipeResource
extends Resource

@export var id: StringName
@export var display\_name: String
@export var therapeutic\_form: StringName    # wash, dressing, draught, compress, ember
@export var required\_ingredients: Dictionary # ingredient\_id -> quantity
@export var optional\_ingredients: Dictionary
@export var required\_operations: Array\[StringName]
@export var optional\_operations: Array\[StringName]
@export var base\_relief: float
@export var base\_stability: float
@export var base\_warmth: float
@export var base\_risk: float
@export var time\_cost: float
@export var primary\_use: String
@export var secondary\_effect: String
@export var narrative\_note: String
@export var prototype\_enabled: bool = true
```

#### CraftedItemResource

```gdscript
class\_name CraftedItemResource
extends Resource

@export var id: StringName
@export var recipe\_id: StringName
@export var display\_name: String
@export var quality: int                     # 0 rough, 1 sound, 2 excellent
@export var relief: float
@export var stability: float
@export var warmth: float
@export var risk: float
@export var remaining\_uses: int = 1
@export var created\_scene\_time: float
@export var note: String
```

#### PatientResource

```gdscript
class\_name PatientResource
extends Resource

@export var id: StringName
@export var person\_name: String
@export var case\_label: String
@export var initial\_name\_known: bool = false
@export var primary\_condition: StringName
@export var visible\_symptoms: Array\[String]
@export var hidden\_need: String
@export var trust\_initial: float
@export var urgency\_initial: float
@export var death\_risk\_initial: float
@export var warmth\_response: float
@export var recipe\_responses: Dictionary     # recipe\_id -> effect dictionary
@export var ember\_response: Dictionary
@export var outcome\_rules: Array\[Resource]
@export var notebook\_prompt: String
```

#### NotebookEntryResource

```gdscript
class\_name NotebookEntryResource
extends Resource

@export var id: StringName
@export var page\_number: int
@export var line\_number: int
@export var person\_name: String
@export var patient\_id: StringName
@export var outcome: StringName
@export var care\_summary: String
@export var pressure\_at\_entry: float
@export var numbness\_at\_entry: float
@export var scene\_id: StringName
```

#### DialogueLineResource

```gdscript
class\_name DialogueLineResource
extends Resource

@export var id: StringName
@export var speaker\_id: StringName
@export var display\_name: String
@export var text: String
@export var conditions: Dictionary
@export var effects: Dictionary
@export var next\_lines: Array\[StringName]
```

### 6.7 Input map

|Action|Default keyboard|Controller|Notes|
|-|-|-|-|
|Move up/down/left/right|WASD + arrows|Left stick / D-pad|4-direction movement; diagonal allowed but normalized.|
|Interact / confirm|E / Enter / Space|A|Used for observe, talk, gather, door, patient.|
|Cancel / back|Esc / Backspace|B|Close UI panels.|
|Open pouch|I / Tab|Y|Inventory surface.|
|Open notebook|N|View/Back|Only fully useful at rest; can inspect anytime.|
|Open craft wheel|C|X|Requires craft context or available pouch.|
|Quick observe|Q|Left bumper|Re-read focused interactable.|
|Pause/options|Esc|Menu|Settings/rebinds.|

### 6.8 Scene loading pattern

Scenes do not call `change\_scene\_to\_file()` directly. They request transitions:

```gdscript
SceneRouter.request\_transition(
    from\_scene\_id,
    to\_scene\_id,
    spawn\_marker\_id,
    transition\_reason
)
```

`SceneRouter` fades out, saves lightweight state, swaps the world scene under `CurrentScene`, places the player at the spawn marker, starts ambient audio, fades in, and emits `scene\_changed`.

\---

## 7\. Movement, camera, collision, and interaction

### 7.1 Movement feel

Movement is quiet, grounded, and human. Kalev should not sprint like an action hero.

|Parameter|Prototype value|Notes|
|-|-:|-|
|Walk speed|88 px/sec|About 2.75 tiles/sec; deliberate but not sluggish.|
|Slow/interior speed|72 px/sec|Used in cabin and patient rooms.|
|Diagonal movement|normalized|Prevent faster diagonal movement.|
|Acceleration|optional simple smoothing|Snappy enough for 2D readability.|
|Player collision|foot rectangle \~12×8 px|Prevent coat from snagging on walls.|
|Interaction range|20–28 px forward|Small; attention requires proximity.|

### 7.2 Camera

* `Camera2D` is a child of `Player`.
* Camera smoothing enabled, subtle.
* Camera limits set per map.
* Default camera zoom is `Vector2(1, 1)` with project scaling handling pixel size.
* No cinematic camera in the prototype except brief icon-panel cut-ins.

### 7.3 Interaction priority

When multiple interactables overlap, priority is:

1. Patient currently in crisis.
2. Focused NPC/dialogue target.
3. Story-critical object: notebook, cedar dog, Ember vial.
4. Door/transition.
5. Forage/salvage node.
6. Ambient examine text.

### 7.4 Interaction prompts

Interaction prompts should be small and diegetic where possible:

* A small hand/eye icon above object.
* Text prompt in bottom corner: `Observe`, `Gather`, `Open`, `Sit`, `Write`.
* Do not show gamey labels like `Press E to loot`.

### 7.5 Collision and Y-sorting

* Walls and furniture collision live in TileSet physics layers.
* Entities container uses Y-sort where needed.
* Foreground TileMapLayer draws above player for doorframes, tree canopies, hanging cloth.
* Patient beds should not require full collision if it blocks bedside interaction; use small collision rectangles.

\---

## 8\. Vertical slice scene-by-scene specification

### Scene 1 — Cabin: Eli Keene

**Scene file:** `res://scenes/world/cabin.tscn`  
**Map size:** 20×14 tiles interior, plus optional 4-tile exterior threshold  
**Tone:** still, damp, close, no timer  
**Purpose:** establish death, name, notebook, cedar dog, Ember temptation, and the Grey Stone.

#### Required nodes

```text
Cabin (Node2D)
├── Floor (TileMapLayer)
├── Walls (TileMapLayer)
├── Decor (TileMapLayer)
├── Foreground (TileMapLayer)
├── Entities (Node2D, y\_sort\_enabled = true)
│   ├── EliKeenePatient (StaticBody2D / PatientController)
│   ├── CedarDog (Area2D)
│   ├── NotebookWorld (Area2D)
│   ├── EmberVial (Area2D)
│   └── DoorNorth (Area2D)
├── CabinLight (CanvasModulate + PointLight2D candle)
├── AmbientSound (AudioStreamPlayer)
└── SpawnMarkers (Node2D)
    ├── Start
    └── Exit
```

#### Gameplay flow

1. Player begins kneeling or standing near Eli’s bed.
2. The UI prompts `Observe`.
3. Observing reveals: labored breath, fading eyes, damp cloth, family absent, a name fragment.
4. Player may perform one care action: `Adjust cloth`, `Sit`, or `Check breath`. None saves Eli.
5. Eli dies. This is not a fail state.
6. Pressure rises sharply. Burden rises moderately.
7. Notebook prompt opens automatically: `Write his name.`
8. The entry writes `Eli Keene` on page 66, line 7.
9. The cedar dog interaction becomes active.
10. Ember temptation appears. Player can self-use or pocket the vial.
11. Door unlocks to Ironwood Road.

#### Player choices

|Choice|Mechanical result|Narrative result|
|-|-|-|
|Sit before writing|Pressure -5, Burden +8|Eli dies attended.|
|Check breath repeatedly|Pressure +5|Kalev clings to procedure.|
|Write immediately|Notebook entry clean|Efficient, but less presence.|
|Touch cedar dog before Ember|Pressure +3, Burden +5, memory line|Humanizes temptation.|
|Self-use Ember|Ember -1, Pressure -35, Numbness +25, temporary craft steadiness|Relief feels real.|
|Refuse Ember|Pressure remains high, Numbness unchanged|Harder first forage/craft.|

#### Art requirements

* Cabin floor/wall tiles.
* Bed with dying boy sprite, 3-frame breath loop and still death frame.
* Candle/light source.
* Cedar dog object sprite.
* Small Ember vial object sprite with one red glint frame.
* Notebook object sprite.
* Damp window, coat peg, wash basin, stool, blanket, rough boards.
* Optional icon-panel still: Eli’s name written in notebook.

#### Audio requirements

* Cabin room tone: wind through boards, faint cloth movement.
* Breath loop, stops after death.
* Pencil on paper.
* Glass vial click.
* Low Pressure pulse sting.

\---

### Scene 2 — Ironwood Road: first forage

**Scene file:** `res://scenes/world/ironwood\_road.tscn`  
**Map size:** 60×32 tiles, linear but with small side pockets  
**Tone:** wet pines, rot, watched forest, first agency after death  
**Purpose:** teach gathering, material quality, quick vs clean harvest, and road navigation.

#### Required nodes

```text
IronwoodRoad (Node2D)
├── Ground (TileMapLayer)
├── Path (TileMapLayer)
├── WaterMud (TileMapLayer)
├── Decor (TileMapLayer)
├── ForegroundCanopy (TileMapLayer)
├── Entities (Node2D)
│   ├── PulseleafPatchA (ForageNode)
│   ├── PulseleafPatchB (ForageNode, optional hidden)
│   ├── WoolSnagSalvage (SalvageNode)
│   ├── CottonScrapSalvage (SalvageNode)
│   ├── BirdieTrigger (Area2D)
│   └── ExitToBethany (DoorTransition)
├── AmbientSound
└── SpawnMarkers
```

#### Forage tutorial

The first Pulseleaf patch offers two choices:

|Option|Time cost|Yield|Quality|Consequence|
|-|-:|-:|-:|-|
|Clean harvest|8 scene-sec|3 Pulseleaf|sound|Pressure +1; teaches care.|
|Quick cut|3 scene-sec|2 Pulseleaf|rough|Pressure -1 now; purity penalty.|
|Leave|0|0|—|Forces later scarcity.|

If Numbness is high from Ember self-use, the UI initially highlights `Quick cut`; if Pressure is high, cursor tremor makes `Clean harvest` take longer. This is the first playable expression that state affects care.

#### Birdie entrance

After the first successful harvest, Birdie appears near the edge of the path. She does not introduce herself. She watches Kalev gather and says one practical, inconvenient line.

Example dialogue beats:

* Birdie: `You cut the good part.`
* Kalev: `You following me?`
* Birdie: `Road goes north whether I do or not.`
* Kalev may offer the apple.
* Birdie refuses: `Names are for people who know where they came from. Apples are for people who know where they sleep.`

Birdie then follows at a distance. She can point out one optional salvage node if the player uses `Observe` near her.

#### Required gatherables

* Pulseleaf ×3–6 possible.
* Wool snag ×1.
* Cotton scrap ×1.
* Optional clean water marker at a spring or rain barrel, if map pacing needs it.

#### Art requirements

* Ironwood tileset: mud, pine duff, roots, damp leaves, path, puddles, rotted logs, stones, small water edge, sparse snow flecks.
* Foreground branches and trunk occluders.
* Pulseleaf patch sprite: readable medicinal green accent.
* Salvage nodes: cloth caught on branch, abandoned satchel, broken fence cloth.
* Birdie character sprite.
* Apple item icon.
* Optional environmental serpent/root motif in terrain patterning; not a literal enemy.

#### Audio requirements

* Wind through pines.
* Wet footstep variants.
* Distant crow or gull.
* Forage cut/snare sounds.
* Birdie appearance small sting, not magical sparkle.

\---

### Scene 3 — Bethany arrival

**Scene file:** can be exterior portion of `bethany\_clinic.tscn` or short transition panel  
**Map size:** 30×20 if playable exterior; otherwise icon-panel + dialogue  
**Tone:** small settlement under strain; not cozy, not hostile  
**Purpose:** introduce three patients, treatment order, limited resources, Wittehaven rumor.

#### Arrival information

The player learns:

* Three are sick.
* One is the village doctor, Dr. Amos Bell.
* Supplies are thin.
* Wittehaven has clean beds, working stores, sanctioned stabilizer, and people who “still know how to keep records.”
* Lena Hart is already somewhere nearby, helping with hands and presence rather than a vial.

#### Treatment order choice

On arrival, the player sees three patient markers:

1. Miriam Toll — elder, quiet, likely dying.
2. Nora Finch — fevered and wounded, treatable.
3. Dr. Amos Bell — doctor, unstable, high urgency.

The player can choose order. The system must not tell the player an optimal order. The resident only says enough to create pressure.

#### Wittehaven foreshadow lines

* Resident: `If we had gone west, they say Wittehaven has sheets boiled white.`
* Another: `They have numbers for the sick there. That means someone is counting.`
* Birdie, if present: `Counting is not the same as looking.`

\---

### Scene 4 — Bethany Clinic: triage core

**Scene file:** `res://scenes/world/bethany\_clinic.tscn`  
**Map size:** 42×28 tiles interior  
**Tone:** warm but strained; improvised care; first full systems test  
**Purpose:** prove the craft → treat → observe → consequence loop with three distinct patients.

#### Required nodes

```text
BethanyClinic (Node2D)
├── Floor (TileMapLayer)
├── Walls (TileMapLayer)
├── Decor (TileMapLayer)
├── Foreground (TileMapLayer)
├── Entities (Node2D, y\_sort\_enabled = true)
│   ├── MiriamTollPatient (PatientController)
│   ├── NoraFinchPatient (PatientController)
│   ├── AmosBellPatient (PatientController)
│   ├── Lena (CharacterBody2D)
│   ├── Birdie (CharacterBody2D)
│   ├── ResidentA (NPC)
│   └── ResidentB (NPC)
├── CareStations (Node2D)
│   ├── CookingFire (CraftStation: Warm)
│   ├── WashBasin (CraftStation: Wash/Clean)
│   ├── HerbRack (CraftStation: Seal)
│   └── WorkTable (CraftStation: Craft)
├── Exits
├── AmbientSound
└── SpawnMarkers
```

#### Triage model

Each patient has:

* `urgency`: decreases with scene-time.
* `trust`: changes with Observe/Sit/harsh procedure.
* `relief`: symptom relief from medicine.
* `warmth`: comfort/presence state.
* `risk`: accumulated intervention risk.
* `name\_known`: whether UI shows name or vague label.
* `outcome\_locked`: final state once certain thresholds or scenes pass.

#### Scene-time

* Player movement is real-time.
* Opening pouch/notebook pauses action.
* Crafting opens modal; on completion, `TriageClock.advance(time\_cost)` applies urgency loss to active patients.
* Patient interactions such as `Sit`, `Wash`, `Administer`, and `Observe` also advance small amounts of scene-time.

#### Patient order must matter

The order changes tone and outcome, but no order should feel like the only “correct puzzle answer.” Example:

* Treating Dr. Amos first may save him but lets Miriam die less attended.
* Treating Miriam first may make her death peaceful but increases Amos’s urgency.
* Treating Nora first is efficient and medically obvious, but may be a way to avoid harder cases.

\---

## 9\. Patient designs

### 9.1 Eli Keene — cabin boy

**Scene:** Cabin  
**State:** already beyond biological recovery  
**Purpose:** teach that care is not always cure  
**Name status:** learned through notebook prompt  
**Outcome:** dies in all branches; manner and state consequences differ

|Variable|Initial|
|-|-:|
|Trust|20|
|Urgency|0 / already terminal|
|Death risk|locked|
|Hidden need|Not to be made into a failure.|

Important rule: Eli must not become a tutorial failure. The player is not asked to “save him.” The action is to attend and write.

### 9.2 Miriam Toll — elder, unavoidable death

**Scene:** Bethany  
**State:** Withering advanced; weak breath; intermittently responsive  
**Purpose:** teach peaceful death vs over-treatment  
**Name status:** known if player observes or resident introduces her  
**Outcome:** death unavoidable; quality of death changes

|Variable|Initial|
|-|-:|
|Trust|35|
|Urgency|45|
|Death risk|95|
|Hidden need|Warmth and recognition, not rescue.|

#### Useful actions

* `Observe` reveals cold hands and a name fragment.
* `Sit` increases warmth/trust and Burden.
* `Cedar-Wool Compress` improves warmth and trust.
* `Pulseleaf Draught` may ease restlessness but does not save her.
* Ember is a poor use here unless framed as easing terror; it may increase Numbness if used to avoid sitting with her.

#### Outcomes

|Outcome|Condition|Consequence|
|-|-|-|
|Peaceful death|Warmth ≥ 50 and name recorded|Burden +10, Pressure -10, Notebook entry: received/at rest.|
|Clinical death|Relief actions but warmth < 30|Pressure +8, Numbness +5 if Ember/procedure-heavy.|
|Alone death|Player neglects until urgency collapse|Pressure +15, Birdie trust -10, Lena line changes.|
|Over-treated death|High risk, repeated interventions|Pressure +20, ledger seed: over-treatment.|

### 9.3 Nora Finch — fevered and wounded, recoverable

**Scene:** Bethany  
**State:** fever, infected cut, thirsty, scared but responsive  
**Purpose:** prove that crafted medicine works  
**Name status:** can be learned through resident or by asking directly  
**Outcome:** recoverable; worsens if neglected

|Variable|Initial|
|-|-:|
|Trust|45|
|Urgency|65|
|Death risk|40|
|Hidden need|Thirst and fear of being sent to Wittehaven.|

#### Useful actions

* `Salt Wash` before dressing improves purity and lowers risk.
* `Clean Dressing` addresses wound.
* `Pulseleaf Draught` lowers fever/restlessness.
* `Honey` optional improves trust/warmth if used in draught.
* `Sit` after treatment reveals Wittehaven fear.

#### Outcomes

|Outcome|Condition|Consequence|
|-|-|-|
|Clear recovery|Sound/excellent dressing + draught, urgency > 20|Supplies spent, trust +20, Wittehaven rumor unlocked.|
|Partial recovery|One correct treatment, urgency > 0|Survives but remains fevered; Pressure +5.|
|Worsened|Neglect or rough contaminated treatment|Death risk rises; may survive with cost.|
|Avoidable death|Severe neglect plus rough care|Strong failure; not default.|

### 9.4 Dr. Amos Bell — doctor, Ember dilemma

**Scene:** Bethany  
**State:** acute breath crisis, exhausted, ashamed; he knows enough to know he may die  
**Purpose:** force the strongest prototype decision: use Ember on patient, save for self, or attempt difficult care without it  
**Name status:** known on arrival  
**Outcome:** can survive, die peacefully, or die after over-treatment

|Variable|Initial|
|-|-:|
|Trust|30|
|Urgency|35|
|Death risk|70|
|Hidden need|To stop being only “the doctor.”|

#### Useful actions

* `Observe` reveals he is calculating his own decline.
* `Cedar-Wool Compress` lowers panic and supports breath.
* `Pulseleaf Draught` may calm but is insufficient alone.
* `Ember Dose/Dilution` can stabilize crisis.
* Lena’s presence can make non-Ember care viable if the player has not alienated her and has prepared sound care.
* Repeated procedure without warmth worsens trust.

#### Ember branch

|Player action|Effect|
|-|-|
|Uses Ember on Amos|Urgency +35, death risk -25, Ember -1, Pressure -5, Burden +5. If direct/undiluted while Numbness high, later risk +10.|
|Refuses Ember and uses excellent care + Lena help|Amos may survive barely; Burden +15, Pressure +10; strongest “medicine plus presence” branch.|
|Refuses Ember without preparation|Amos likely dies; can still die named and attended.|
|Self-used both Ember doses|Amos cannot receive Ember; Lena notices; Birdie trust decreases if Amos dies.|

#### Outcomes

|Outcome|Condition|Consequence|
|-|-|-|
|Stabilized by Ember|Patient Ember used before urgency collapse|Demonstrates Ember can be mercy. Opens later ledger seed: sanctioned/unsanctioned dose.|
|Stabilized without Ember|Excellent compress/draught + Lena + time|Rare, costly, high Burden; validates presence/craft.|
|Peaceful death|Warmth/trust high, name recorded|Not a “win,” but not failure.|
|Panic death|Low warmth, urgency collapse|Pressure +20, Nora/Birdie dialogue darkens.|
|Over-treated death|Repeated high-risk interventions|Strong Wittehaven ledger seed.|

\---

## 10\. Crafting system design

### 10.1 Design thesis

Crafting is the playable expression of the title. A tincture is a worldview in a bottle: extraction, concentration, preservation, and the attempt to make mercy portable.

The system should make the player feel these differences:

* careful preparation vs anxious optimization;
* medicine vs magical thinking;
* relief vs redemption;
* treatment vs presence;
* using Ember as mercy vs using Ember as escape.

### 10.2 Prototype ingredients

The full lore pouch list is larger, but the prototype actively uses only eight material types.

|ID|Folk name|Sanctioned future name|Category|Starting qty|Found qty|Role|
|-|-|-|-|-:|-:|-|
|`pulseleaf`|Pulseleaf|LOL|herb|0|3–6|Draught, fever/pulse calm.|
|`cotton`|Cotton|COT|cloth|2|1|Dressing base.|
|`wool`|Wool|WOL|cloth/warmth|1|1|Compress/warmth.|
|`salt`|Salt|SAL|mineral|1|1|Wash/purity.|
|`water\_clean`|Clean Water|H2O|carrier|1|2|Wash/draught/compress.|
|`honey`|Honey|HNY|binder/comfort|1|0|Optional warmth/trust.|
|`cedar`|Cedar Shaving|CDR|memory/warmth|1|0|Compress focus/warmth.|
|`ember`|Ember|E-7|rare|2 doses|0|Pressure bypass / stabilizer.|

Future ingredients like Cillin, Phrine, Myrrh, Oil, Furos, Acebark, Arbor, and Zyl stay out of the active prototype unless needed for dialogue or flavor.

### 10.3 Crafting operations

|Operation|Input|Output effect|Time cost|Prototype note|
|-|-|-|-:|-|
|Clean|cloth/herb/water|+purity, -risk|5–8 sec|First care gesture.|
|Grind|herb/cedar|+potency, slight -stability|4 sec|Optional for draught.|
|Steep|herb + water|creates draught|12 sec|Medium time pressure.|
|Bind|cloth + wash/oil/honey|creates dressing/poultice|8 sec|Dressing operation.|
|Warm|water/wool/cedar|+warmth|10 sec|Requires fire/stove/body heat.|
|Seal|crafted item + wrap/jar|+stability|6 sec|Mostly future; optional in slice.|
|Dilute|Ember + water|-risk, lower intensity|5 sec|Key for Amos.|
|Administer|crafted item to patient|applies effect|2–6 sec|Through PatientPanel.|

### 10.4 Tincture Wheel UI

The Tincture Wheel is a radial crafting UI with four visible axes:

1. **Relief** — symptom help.
2. **Stability** — duration/safety.
3. **Warmth** — comfort/trust/presence.
4. **Risk** — side effect, rebound, contamination, or spiritual/relational cost.

#### Layout

```text
                 Relief
                   ▲
                   │
        Warmth ◄───┼───► Risk
                   │
                   ▼
                Stability
```

In Ironwood/Bethany, it looks hand-drawn: graphite, cloth labels, uneven wedge edges. In Wittehaven later, the same geometry becomes a clean compliance dashboard.

#### Prototype interaction

1. Player opens Craft with `C` near a care station or from pouch.
2. UI shows craftable recipes based on inventory.
3. Player selects recipe.
4. Wheel shows predicted Relief/Stability/Warmth/Risk.
5. Player can choose optional operation if resources allow.
6. UI shows time cost and likely quality.
7. Player confirms.
8. World remains paused during UI, then `TriageClock.advance(time\_cost)` fires on completion.

### 10.5 Quality calculation

Prototype quality uses simple three-level scoring.

```text
quality\_score = base\_recipe\_score
              + ingredient\_quality\_score
              + required\_operations\_completed
              + optional\_operation\_bonus
              + care\_context\_bonus
              - pressure\_penalty
              - numbness\_warmth\_penalty
              - contamination\_penalty
              - rushed\_penalty
```

|Score|Quality|Meaning|
|-:|-|-|
|0–2|Rough|Works partially or with risk.|
|3–5|Sound|Expected therapeutic effect.|
|6+|Excellent|Strong effect or extra trust/warmth.|

The player should not see raw numbers. They see `rough`, `sound`, or `excellent`, plus tactile language: `cloudy`, `clean`, `warm`, `too sharp`, `steady`, `bitter but clear`.

### 10.6 Prototype recipes

#### Recipe 1 — Salt Wash

|Field|Value|
|-|-|
|ID|`salt\_wash`|
|Form|Wash|
|Ingredients|Clean Water ×1, Salt ×1|
|Operations|Clean / Dissolve|
|Time|8 sec|
|Relief|low|
|Stability|medium|
|Warmth|low|
|Risk|very low|
|Primary use|Prepares wound/body/cloth; lowers contamination risk.|
|Best patient|Nora Finch; any dignity/wash action.|
|Narrative note|The least heroic care action; therefore essential.|

#### Recipe 2 — Clean Dressing

|Field|Value|
|-|-|
|ID|`clean\_dressing`|
|Form|Dressing|
|Ingredients|Cotton ×1, Salt Wash ×1 or Clean Water ×1|
|Optional|Honey ×1 for comfort/trust|
|Operations|Clean → Bind|
|Time|10 sec|
|Relief|medium|
|Stability|medium|
|Warmth|low/medium with Honey|
|Risk|low if washed, medium if rough|
|Primary use|Wound care; dignity; lowers Nora’s death risk.|
|Best patient|Nora Finch|
|Narrative note|Medicine works. This recipe should visibly help.|

#### Recipe 3 — Pulseleaf Draught

|Field|Value|
|-|-|
|ID|`pulseleaf\_draught`|
|Form|Draught|
|Ingredients|Pulseleaf ×2, Clean Water ×1|
|Optional|Honey ×1|
|Operations|Clean → Steep|
|Time|14 sec|
|Relief|medium/high for fever/restlessness|
|Stability|low/medium|
|Warmth|medium with Honey|
|Risk|low if clean, medium if rough|
|Primary use|Fever support, calming, patient dialogue clarity.|
|Best patient|Nora, Amos secondary|
|Narrative note|First recipe that makes the player believe in crafting.|

#### Recipe 4 — Cedar-Wool Compress

|Field|Value|
|-|-|
|ID|`cedar\_wool\_compress`|
|Form|Compress|
|Ingredients|Wool ×1, Clean Water ×1, Cedar ×1|
|Operations|Warm → Bind|
|Time|12 sec|
|Relief|low/medium|
|Stability|low|
|Warmth|high|
|Risk|very low|
|Primary use|Fear, tremor, cold hands, breath panic.|
|Best patient|Miriam and Amos|
|Narrative note|Care closest to presence; Lena respects this.|

#### Recipe 5 — Ember Dose / Dilution

|Field|Value|
|-|-|
|ID|`ember\_dose` / `ember\_dilution`|
|Form|Rare stabilizer|
|Ingredients|Ember ×1; optional Clean Water ×1 for dilution|
|Operations|Direct Administer or Dilute → Administer|
|Time|0 sec direct / 5 sec diluted|
|Relief|very high immediate|
|Stability|medium direct / higher diluted|
|Warmth|none by default|
|Risk|high direct / medium diluted|
|Primary use|Pressure bypass on Kalev or acute crisis stabilization in Amos.|
|Best patient|Amos, not Miriam, not Nora unless extreme branch.|
|Narrative note|It works. That is why it is dangerous.|

### 10.7 Crafting and state modifiers

|State|Effect on crafting|
|-|-|
|Pressure 0–39|No penalty; perception normal.|
|Pressure 40–59|Minor tremor; crafting copy changes; no mechanical penalty yet.|
|Pressure 60–79|Time cost +10%; optional operation prompts may feel urgent.|
|Pressure 80–100|Time cost +20%; one quality penalty unless player slows down.|
|Numbness 0–29|No penalty.|
|Numbness 30–59|Warmth bonus reduced by 25%; patient cues less vivid.|
|Numbness 60+|Warmth bonus reduced by 50%; names/cues blur until deliberate Observe.|
|Burden 20–60|Hidden needs easier to perceive after Observe.|
|Burden 80+|Converts into Pressure unless player rests, sits, or writes.|

\---

## 11\. Burden, Pressure, Numbness, and Ember

### 11.1 State definitions

**Burden** is the true weight of love, grief, and responsibility. It is not evil and cannot be “cured.” Bearing it is part of Kalev’s work.

**Pressure** is dangerous overload. It impairs hands, attention, patience, and sleep.

**Numbness** is Ember-induced bypass. It makes performance easier while narrowing attention to names, warmth, and relational cues.

### 11.2 State ranges

All three are stored as floats from 0 to 100.

|Range|Burden|Pressure|Numbness|
|-:|-|-|-|
|0–19|Light|Calm|Fully present|
|20–39|Carried|Tight|Slight distance|
|40–59|Heavy|Shaking|Efficient, cool|
|60–79|Crushing|Impaired|Names blur|
|80–100|Breaking|Near panic|Case-language dominates|

### 11.3 State events

|Event|Burden|Pressure|Numbness|
|-|-:|-:|-:|
|Eli dies|+8|+25|0|
|Write Eli’s name|+6|-5|0|
|Touch cedar dog|+5|+3 then -3|0|
|Self-use Ember|0|-35|+25|
|Clean harvest|+1|+1|0|
|Quick harvest|0|-1|+1 if recent Ember|
|Sit with Miriam|+8|-8|-2 if Numbness < 40|
|Miriam dies alone|+4|+20|+5|
|Nora recovers|+2|-8|0|
|Amos stabilized with Ember|+5|-5|+0 to +10 by context|
|Amos dies in panic|+8|+20|+5|
|Rest at end|Burden persists|Pressure -15|Numbness -10|

### 11.4 Ember design rules

1. Ember must have immediate, visible benefit.
2. Ember must never be labeled “evil” by the UI.
3. Self-use converts Pressure into Numbness; it does not remove Burden.
4. Patient-use can be mercy, especially for Amos.
5. Repeated self-use makes the UI cleaner, faster, and less human.
6. The player should discover the cost by noticing missing cues, not by reading a morality warning.

### 11.5 Ember presentation

* Ember icon is small red/orange glass, not a giant power-up.
* Self-use audio: glass click, burn, Pressure pulse stops abruptly.
* Screen response: subtle red-gold flash, then desaturation/cool clarity.
* UI response: craft wheel steadies; patient names become less emphasized if Numbness rises.

\---

## 12\. Patient interaction and treatment UI

### 12.1 Patient panel layout

```text
┌────────────────────────────────────┐
│ Miriam Toll                         │  or Unknown Elder before name learned
│ breath: thin       hands: cold      │
│ fear: quiet        urgency: fading  │
├────────────────────────────────────┤
│ Observe                             │
│ Sit                                 │
│ Administer...                       │
│ Wash / Warm                         │
│ Write name                          │
│ Leave bedside                       │
└────────────────────────────────────┘
```

The panel begins as human-facing observation, not a medical chart. In Wittehaven later, the same panel becomes case-facing.

### 12.2 Patient panel modes

|Mode|Trigger|UI content|
|-|-|-|
|Initial observe|First interaction|limited symptoms, name unknown/known.|
|Care decision|After observe|actions: sit, treat, wash, warm, administer.|
|Administer item|Selecting administer|crafted items with human language.|
|Outcome|threshold reached|final result, notebook prompt.|
|Revisit|after treatment|changed lines, trust, recovery/decline.|

### 12.3 Hidden needs

Hidden needs are not puzzle answers. They are patient truths revealed by attention.

|Patient|Hidden need|Revealed by|
|-|-|-|
|Eli|Not to be treated as a failure.|Death + notebook.|
|Miriam|Warmth and recognition.|Observe hands, Sit, Lena hint.|
|Nora|Fear of Wittehaven classification.|Recovery + Sit/Ask.|
|Amos|To stop being only “the doctor.”|Observe twice or Lena scene.|

### 12.4 Treatment verbs

|Verb|Cost|Main effect|Risk|
|-|-:|-|-|
|Observe|2 sec|Reveals symptoms/cues/name fragments|Time cost.|
|Sit|10 sec|Warmth/trust; changes death quality|Burden rises; other patients worsen.|
|Administer|2–6 sec|Applies item effects|Wrong/rough item can add risk.|
|Wash|8 sec|Lowers contamination, increases dignity|Time cost.|
|Warm|8–12 sec|Warmth, breath calm, trust|Time cost.|
|Pray|special/contextual|Non-optimizable attention|Must not be a buff button.|
|Write|3 sec|Notebook entry/outcome|Commits memory.|
|Leave|0|Exit bedside|Sometimes necessary.|

### 12.5 Prayer rule

Prayer appears rarely and contextually. It is not a generic healing buff. It may change Kalev, the language of the notebook, or the manner of death. It should not become an optimization layer.

\---

## 13\. Notebook system

### 13.1 Prototype function

The notebook does five things in the prototype:

1. Records Eli Keene on page 66, line 7.
2. Records Bethany patient outcomes.
3. Shows whether a patient was known by name or treated as a role.
4. Serves as rest/autosave metaphor.
5. Seeds future Iron Ledger accusations without exposing that system yet.

### 13.2 Notebook UI

Visual language:

* wet leather cover;
* warped paper;
* graphite lines;
* short entries;
* no spreadsheet grid;
* entries appear by hand, not typed.

### 13.3 Entry format

```text
Page 66, line 7
Eli Keene
The breath left before the name did.
```

Bethany entries should be even shorter:

```text
Miriam Toll — warmed, received.
Nora Finch — fever eased.
Amos Bell — steadied by Ember.
```

If Numbness is high, entries may initially appear flatter:

```text
Miriam Toll — outcome recorded.
```

At rest, Kalev may revise a flat entry if he has learned the name or sat with the person. This is not a score; it is a recognition mechanic.

### 13.4 Ledger seeds

The notebook should quietly store flags that later enable Halloway’s Iron Ledger trial. Prototype does not show the trial, but it must record the data.

|Seed|Trigger|
|-|-|
|`undocumented\_ember\_self`|Self-use Ember without notebook reflection.|
|`patient\_ember\_amos`|Use Ember on Amos.|
|`over\_treatment\_miriam`|Repeated intervention on terminal Miriam.|
|`missed\_name`|Outcome locked before name learned.|
|`avoidable\_death\_nora`|Nora dies through neglect/rough care.|
|`left\_patient\_alone`|Miriam or Amos reaches death outcome while unattended.|
|`case\_language\_choice`|Player chooses efficient/case-like dialogue under Numbness.|

\---

## 14\. Companions

### 14.1 Birdie / Ruth

Birdie is not a pet, mascot, or quest marker. She is an inconvenient witness.

#### Prototype behavior

* Appears after first forage.
* Follows at distance using simple path-follow or teleport catch-up.
* Does not block movement.
* Has 3–5 contextual lines in Bethany.
* Notices one optional material if player observes near her.
* Reacts to Miriam being ignored or Amos losing Ember opportunity.

#### Birdie trust

Birdie trust is not a visible meter. Store it internally.

|Event|Trust delta|
|-|-:|
|Player offers apple|+0; she refuses; unlocks line.|
|Player listens after refusal|+5|
|Player quick-harvests after she warns|-3|
|Miriam dies alone|-10|
|Nora recovers and player asks name|+5|
|Self-use both Ember doses before Amos|-8|

### 14.2 Lena Hart

Lena is the playable contrast to bypass. She is not anti-medicine. She is anti-worship-of-medicine.

#### Prototype behavior

* Appears in Bethany during triage, ideally when player has visited one patient or when Amos worsens.
* Can teach or improve Cedar-Wool Compress.
* Can make non-Ember Amos survival possible if player prepared carefully.
* Comments through action: washing hands, repairing gloves, holding a patient’s wrist, warming cloth.

#### Lena trust

Internal only.

|Event|Trust delta|
|-|-:|
|Player washes before treating Nora|+5|
|Player sits with Miriam|+8|
|Player self-used Ember but admits it in dialogue|+2|
|Player hides Ember after she asks|-5|
|Player over-treats Miriam|-8|
|Player uses Ember on Amos with dilution/presence|+3|

\---

## 15\. UI/UX specification

### 15.1 UI surfaces

|UI|Scene|Opened by|Purpose|
|-|-|-|-|
|State Overlay|`state\_overlay.tscn`|always visible|Shows Burden/Pressure/Numbness as symbols.|
|Dialogue Box|`dialogue\_box.tscn`|NPC/object interact|Sparse dialogue and choices.|
|Pouch Panel|`pouch\_panel.tscn`|`I` / `Tab`|Inventory and crafted items.|
|Tincture Wheel|`tincture\_wheel.tscn`|`C` / craft station|Craft therapeutics.|
|Patient Panel|`patient\_panel.tscn`|patient interact|Observe/treat/sit/write.|
|Notebook Panel|`notebook\_panel.tscn`|`N` / rest|Names/outcomes/save.|
|Consequence Summary|`consequence\_summary.tscn`|end of slice|Review outcomes without scoring.|

### 15.2 State overlay

No health bar. No XP. No morality meter.

Use three small margin symbols:

|State|Icon direction|Behavior|
|-|-|-|
|Burden|small grey stone|darkens/heavies as burden rises.|
|Pressure|hairline crack / pulse mark|trembles/pulses at high values.|
|Numbness|pale smoke veil|desaturates/fades names as it rises.|

Tooltips can show words: `Burden`, `Pressure`, `Numbness`, but the main interface should feel bodily.

### 15.3 Pouch panel

Layout: leather/cloth grid with item icons and quantities.

Groups:

1. Herbs.
2. Cloth/warmth.
3. Wash/carriers.
4. Crafted therapeutics.
5. Rare/locked items: cedar dog, Ember vial.

The cedar dog appears as locked item, never consumed.

### 15.4 Tincture Wheel accessibility

The wheel cannot rely on color alone. Each axis has:

* text label;
* icon;
* wedge length/shape;
* tooltip text.

Recipe quality must be shown by label: `Rough`, `Sound`, `Excellent`.

### 15.5 Dialogue style

* Short lines.
* No lore lectures.
* Kalev uses hospital fragments when afraid.
* Birdie is practical and odd.
* Lena acts before she explains.
* Residents are strained, not exposition machines.

### 15.6 Accessibility minimums

* Rebindable controls.
* Text speed setting.
* Instant text option.
* Scalable UI font size.
* Colorblind-safe cues: icon + text + shape.
* Subtitle/caption for important ambient audio cues if used.
* No rapid flashing Ember effects.

\---

## 16\. 2D top-down asset specification

### 16.1 Art direction lock

The prototype art direction is:

> \*\*Michigan icon-manuscript pixel art.\*\*

The attached visual references should inform principles, not imitation. Extract flat symbolic composition, strong contour, icon-gold restraint, patterned water/chaos, manuscript borders, halos as rare disclosure, serpents/beasts as symbolic pressure, and dense sacred geography. Do not copy a living artist’s style.

### 16.2 Pixel grid and file format

|Asset type|Size|Format|Notes|
|-|-:|-|-|
|Base tile|32×32|PNG|All maps align to this.|
|Character standard frame|32×32|PNG sheet|Birdie/residents.|
|Character tall frame|32×48|PNG sheet|Kalev/Lena/adults with coats. Feet in bottom 16 px.|
|Bedridden patient frame|32×48 or 48×48|PNG sheet|Bed/body may be prop + patient overlay.|
|Item icon|24×24 or 32×32|PNG|32×32 preferred for grid consistency.|
|UI symbol|16×16 / 24×24 / 32×32|PNG|State icons and buttons.|
|Nine-patch frame|16–64 px segments|PNG|Use `StyleBoxTexture`.|
|Icon panel|640×360 or 640×400|PNG|16:9 or manuscript ratio; displayed as panel.|
|Light texture|64×64 / 128×128|PNG|Greyscale/soft mask.|
|VFX sprite|32×32 / 64×64|PNG sheet|Ember, breath, candle, pressure.|

### 16.3 Import settings checklist

Every pixel-art PNG:

* texture filter: nearest;
* repeat: disabled;
* mipmaps: off unless specifically tested;
* compression: lossless or VRAM mode that preserves pixel edges;
* no automatic smoothing;
* pivot/origin documented for characters and props.

Every spritesheet:

* one-pixel-perfect frame grid;
* no inconsistent transparent gutters unless documented;
* frame dimensions included in filename or metadata note;
* named `SpriteFrames` animations in Godot.

### 16.4 Character animation requirements

#### Kalev Ward

**Frame size:** 32×48  
**Collision:** 12×8 foot rectangle  
**Priority:** P0

|Animation|Directions|Frames|Notes|
|-|-:|-:|-|
|`idle\_down/left/up/right`|4|4 each|Subtle coat/breath.|
|`walk\_down/left/up/right`|4|4 each|Wet, weighted walk.|
|`interact\_down/left/up/right`|4|2 each|Hand reach/check.|
|`kneel\_down/left/right`|3|3 each|Bedside care; up optional.|
|`harvest\_down/left/up/right`|4|3 each|Cut/gather.|
|`administer\_down/left/right`|3|3 each|Give draught/dressing.|
|`write\_down`|1|3|Notebook.|
|`ember\_self`|1|4|Vial use; overlay handles glow.|

Minimum playable build can ship idle/walk/interact/kneel only; final vertical slice needs all above.

#### Birdie

**Frame size:** 32×32  
**Priority:** P0

|Animation|Directions|Frames|Notes|
|-|-:|-:|-|
|idle|4|3 each|Alert, not cute bounce.|
|walk|4|4 each|Quick but restrained.|
|point/crouch|2–4|2 each|Points at salvage/plant.|
|refuse\_apple|1|3|Small head/hand motion.|

#### Lena Hart

**Frame size:** 32×48  
**Priority:** P0 for Bethany

|Animation|Directions|Frames|Notes|
|-|-:|-:|-|
|idle|4|4 each|Still, grounded.|
|walk|4|4 each|Practical.|
|kneel|3|3 each|Patient care.|
|warm\_cloth|1–2|3|Compress action.|
|stitch\_glove|1|4|Character-defining idle.|

#### Patients

Patients are mostly bed sprites plus subtle animation.

|Patient|Frame size|Required frames|
|-|-:|-|
|Eli Keene|48×48|breath loop ×3, death still ×1|
|Miriam Toll|48×48|breath loop ×3, rest/death still ×1, warmed variant optional|
|Nora Finch|48×48|fever loop ×3, treated/recovering ×1, worsened ×1|
|Dr. Amos Bell|48×48|panic breath ×3, stabilized ×1, death/rest ×1|

#### Residents

Minimum 2 resident sprites:

* adult resident A, 32×48, idle/walk.
* adult resident B, 32×48, idle/walk.

Optional: one seated resident silhouette.

### 16.5 Tileset requirements

#### Shared tile rules

* Every tileset uses 32×32 cells.
* Each location has an external `TileSet` resource in `data/tilesets/`.
* Build with `TileMapLayer` nodes: Floor, Walls, Decor, Foreground.
* TileSet physics layer handles wall/furniture collisions.
* TileSet custom data layer may include `footstep\_type`, `forage\_hint`, `blocks\_line\_of\_sight`, `material\_chance`.

#### Cabin tileset — P0

|Category|Tiles needed|
|-|-|
|Floor|rough planks A/B/C, damp plank, threshold plank|
|Walls|log wall horizontal/vertical, corner, window wall, cracked wall|
|Furniture|bed base, small table, stool, shelf, wash basin, coat peg|
|Decor|blanket, cloth, cup, candle, paper scrap, old medical bag|
|Foreground|top wall lip, doorframe, hanging cloth|
|Collision|wall, bed, table, basin|

Minimum tile count: 40–60.

#### Ironwood road tileset — P0

|Category|Tiles needed|
|-|-|
|Ground|mud, pine duff, leaf rot, root tangle, sparse snow, stone|
|Path|trampled dirt straight/corners, rut, puddle overlay|
|Water/mud|shallow water, puddle, bank edge, patterned ripple edge|
|Vegetation|pine trunk base, brush, dead fern, cedar trunk, canopy shadow|
|Props|rotted log, broken fence, stone marker, abandoned cloth snag|
|Foreground|branch canopy, tall trunk top, hanging moss|
|Collision|trunks, rocks, log walls|

Minimum tile count: 80–120.

#### Bethany clinic tileset — P0

|Category|Tiles needed|
|-|-|
|Floor|worn boards, patched boards, rug edge, hearth stones|
|Walls|plaster/wood wall, corner, window, interior divider|
|Furniture|bed, cot, table, stool, shelf, washstand, herb rack|
|Care stations|cooking fire, basin, work table, drying rack|
|Decor|folded cloth, jars, bowls, candle, patched curtain, glove/mending detail|
|Foreground|doorframe, hanging cloth, shelf top, rafters|
|Collision|walls, beds, tables, fire|

Minimum tile count: 90–140.

### 16.6 Props and interactables

|Asset|Size|Priority|Notes|
|-|-:|-|-|
|Cedar dog world sprite|32×32|P0|Must read as carved toy.|
|Cedar dog inventory icon|32×32|P0|Locked keepsake slot.|
|Ember vial world sprite|16×16 or 32×32|P0|Red glint; small.|
|Ember vial icon|32×32|P0|Count/dose overlay.|
|Notebook world sprite|32×32|P0|Leather book.|
|Notebook UI pages|640×360 or Control textures|P0|Wet paper, lines.|
|Pulseleaf patch|32×32 / 64×32|P0|Readable green accent.|
|Wool snag|32×32|P0|Salvage node.|
|Cotton scrap|32×32|P0|Salvage node.|
|Apple icon/world sprite|16×16 / 32×32|P0|Birdie refusal.|
|Wash basin|32×32 / 64×32|P0|Craft station.|
|Cooking fire|32×32 / 64×64|P0|Warm operation; animated.|
|Work table|64×32|P0|Craft station.|
|Herb rack|64×32|P1|Seal/dry operation.|
|Wittehaven sign/rumor marker|64×32|P1|End hook.|

### 16.7 Ingredient and crafted item icons

P0 icons:

* Pulseleaf.
* Cotton.
* Wool.
* Salt.
* Clean Water.
* Honey.
* Cedar shaving.
* Ember.
* Salt Wash.
* Clean Dressing.
* Pulseleaf Draught.
* Cedar-Wool Compress.
* Ember Dilution.
* Apple.
* Water

Icon style: flat, readable silhouette, manuscript linework, no glossy mobile-game finish.

### 16.8 UI assets

#### P0 UI

|UI asset|Required pieces|
|-|-|
|Dialogue box|parchment/leather panel, nameplate, choice selector, arrow/continue glyph|
|Pouch panel|background cloth/leather, grid slots, selected slot frame, category tabs/icons|
|Tincture Wheel|hand-drawn circular base, axis icons, wedge fill/outline, operation buttons, quality label frame|
|Patient panel|paper panel, symptom row icons, action buttons, urgency/warmth/trust indicators|
|Notebook|cover, open pages, ruled lines, page tabs, pencil mark animation or texture|
|State overlay|Burden stone icon, Pressure crack/pulse icon, Numbness smoke icon, high-state variants|
|Consequence summary|notebook/rest panel, no score badge, outcome rows|
|Tooltips|small parchment boxes, readable text frame|

#### UI visual contrast rule

Ironwood/Bethany UI is handmade and attentive. Wittehaven UI later becomes clean, efficient, institutional. Build UI scenes so themes can be swapped later.

### 16.9 Icon panels

Icon panels are illustrated/pixel stills used for sacred or threshold beats. Prototype requires one and should aim for three.

|Panel|Priority|Suggested size|Purpose|
|-|-|-:|-|
|Eli name written|P0|640×360|Establish notebook/name grammar.|
|Ember self-use|P1|640×360|Show relief as seductive.|
|Birdie apple refusal|P1|640×360|Establish Birdie.|
|Bethany triage outcome|P1|640×360|End slice consequence.|
|Road bends toward Wittehaven|P2|640×360|Hook future relief.|

Icon panel style should use manuscript borders, strong contours, limited gold/red, and symbolic geometry. It should not imitate the reference artist’s exact hand.

### 16.10 VFX and shader assets

|Effect|Asset type|Priority|Notes|
|-|-|-|-|
|Candle flicker|light texture + AnimationPlayer|P0|Cabin/Bethany.|
|Breath fade|small translucent sprite sheet|P0|Patients.|
|Pressure pulse|UI overlay / shader|P0|Margin or subtle screen pulse.|
|Numbness veil|CanvasLayer shader/ColorRect|P1|Desaturation/pale smoke.|
|Ember glint|16×16/32×32 sprite sheet|P0|Vial and dose.|
|Warm compress steam|32×32 sprite sheet|P1|Bethany care.|
|Patterned water/ripple|tile animation or shader|P1|Ironwood puddles, future Mackinac.|
|Paper wet edge|UI shader/texture|P2|Notebook polish.|

### 16.11 Audio assets

#### SFX P0

* Wet footsteps: wood, mud, interior plank variants.
* Door open/close.
* Cloth rustle.
* Bedside breath loop and stop.
* Pencil on paper.
* Notebook open/close.
* Glass vial clink/uncork.
* Ember burn small sting.
* Forage cut.
* Water pour/wash.
* Fire/candle small loop.
* Compress cloth/warm water.
* UI soft select/confirm/cancel.
* Pressure pulse.

#### Ambience P0

* Cabin wind through boards.
* Ironwood wet forest wind.
* Bethany hearth/interior murmur.

#### Music P1

Sparse cues only:

* Cabin death/name cue.
* Birdie apple refusal cue.
* Bethany outcome/rest cue.

No constant soundtrack in the first playable. Silence and ambience carry the tone.

### 16.12 Fonts and text assets

Use two font roles:

1. **Readable UI font** for dialogue and menus.
2. **Manuscript/accent font** for notebook headings or icon-panel titles.

Font license must be checked before import. Do not use a font only because it looks ecclesial or medieval; readability and licensing come first.

### 16.13 Asset naming conventions

```text
characters/kalev/kalev\_walk\_down\_32x48.png
characters/birdie/birdie\_idle\_down\_32x32.png
patients/eli\_keene/eli\_keene\_breath\_48x48.png
items/pulseleaf\_icon\_32.png
items/ember\_vial\_icon\_32.png
tilesets/ironwood\_road\_tiles\_32.png
ui/notebook/notebook\_page\_open\_640x360.png
audio/sfx/sfx\_notebook\_write\_01.wav
audio/ambient/amb\_ironwood\_wind\_loop.ogg
icon\_panels/panel\_eli\_name\_written\_640x360.png
```

### 16.14 Asset acceptance tests

An asset is accepted only if:

* it imports in Godot with nearest filtering and no blur;
* it aligns to the 32×32 tile grid where applicable;
* character feet line up with collision and Y-sort expectations;
* the silhouette reads at 2× scale;
* icons are readable at 32×32;
* UI remains readable at 960×540 logical resolution;
* palette does not become cozy-bright or hospital-neon unless deliberately Wittehaven;
* no asset copies a living artist’s style or direct composition;
* license/source is documented.

\---

## 17\. Scene asset checklists

### 17.1 Cabin P0 checklist

**Characters/patients**

* Kalev base animations.
* Eli patient bed sprite.

**Environment**

* Cabin tileset.
* Bed, basin, stool, table, candle, window, door.

**Interactables**

* Cedar dog.
* Notebook.
* Ember vial.
* Door transition.

**UI**

* Dialogue box.
* Notebook panel.
* State overlay.
* Ember choice prompt.

**Audio**

* Cabin ambience.
* Eli breath.
* Notebook write.
* Vial clink.
* Pressure pulse.

### 17.2 Ironwood Road P0 checklist

**Characters**

* Kalev walk/harvest.
* Birdie idle/walk/refuse apple.

**Environment**

* Ironwood tileset.
* Trees/roots/puddles/foreground canopy.

**Interactables**

* Pulseleaf patch.
* Wool snag.
* Cotton scrap.
* Exit transition.

**UI**

* Forage choice panel.
* Pouch panel.
* First craft prompt if crafting unlocked on road.

**Audio**

* Forest ambience.
* Wet footsteps.
* Forage sound.

### 17.3 Bethany P0 checklist

**Characters/patients**

* Miriam patient sprite.
* Nora patient sprite.
* Amos patient sprite.
* Lena animations.
* Birdie follow/idle.
* 2 residents.

**Environment**

* Bethany clinic tileset.
* Beds, wash basin, work table, fire, herb rack, curtains, shelves.

**Interactables**

* Care stations.
* Patient beds.
* Rest marker.
* Wittehaven rumor/sign marker.

**UI**

* Patient panel.
* Tincture Wheel.
* Pouch panel.
* Notebook panel.
* Consequence summary.

**Audio**

* Bethany ambience.
* Fire/candle.
* Cloth/wash/craft SFX.
* Patient breath/cough.
* Outcome cue.

\---

## 18\. Godot scene composition details

### 18.1 Player.tscn

```text
Player (CharacterBody2D)
├── AnimatedSprite2D
├── CollisionShape2D
├── InteractionArea (Area2D)
│   └── CollisionShape2D
├── InteractionRay (RayCast2D, optional)
├── Camera2D
└── StateEffects (Node2D)
```

**Script responsibilities:**

* read input;
* normalize velocity;
* move via `move\_and\_slide()`;
* update facing direction;
* play animation;
* detect focused interactable;
* emit interact request.

Do not store inventory or notebook data on the player.

### 18.2 ForageNode.tscn

```text
ForageNode (Area2D)
├── Sprite2D
├── CollisionShape2D
├── PromptMarker (Node2D)
└── ForageController.gd
```

Properties:

* `ingredient\_id`
* `base\_quantity`
* `clean\_harvest\_time`
* `quick\_harvest\_time`
* `clean\_quality`
* `quick\_quality`
* `depleted\_sprite`

### 18.3 PatientBed.tscn base

```text
PatientBed (StaticBody2D)
├── BedSprite (Sprite2D)
├── PatientSprite (AnimatedSprite2D)
├── CollisionShape2D
├── InteractArea (Area2D)
├── BreathAudio (AudioStreamPlayer2D)
└── PatientController.gd
```

`PatientController` loads a `PatientResource` and owns runtime variables.

### 18.4 CraftStation.tscn

```text
CraftStation (Area2D)
├── Sprite2D
├── CollisionShape2D
└── CraftStation.gd
```

Properties:

* `station\_id`
* `allowed\_operations`
* `display\_name`
* `requires\_fire`
* `requires\_water`

### 18.5 HUDRoot.tscn

HUDRoot is loaded once in Main and persists through scene changes.

```text
HUDRoot (CanvasLayer)
├── StateOverlay
├── DialogueBox
├── PouchPanel
├── TinctureWheel
├── PatientPanel
├── NotebookPanel
└── ConsequenceSummary
```

HUD scenes listen to `GameEvents`. They do not store final game state.

\---

## 19\. Data authoring plan

### 19.1 Ingredients to author first

Create `.tres` files:

```text
data/ingredients/pulseleaf.tres
data/ingredients/cotton.tres
data/ingredients/wool.tres
data/ingredients/salt.tres
data/ingredients/water\_clean.tres
data/ingredients/honey.tres
data/ingredients/cedar.tres
data/ingredients/ember.tres
```

### 19.2 Recipes to author first

```text
data/recipes/salt\_wash.tres
data/recipes/clean\_dressing.tres
data/recipes/pulseleaf\_draught.tres
data/recipes/cedar\_wool\_compress.tres
data/recipes/ember\_dose.tres
data/recipes/ember\_dilution.tres
```

`ember\_dose` and `ember\_dilution` can share most data, but they should be separate resources for UI clarity.

### 19.3 Patients to author first

```text
data/patients/eli\_keene.tres
data/patients/miriam\_toll.tres
data/patients/nora\_finch.tres
data/patients/dr\_amos\_bell.tres
```

### 19.4 Dialogue resources to author first

```text
data/dialogue/cabin\_eli\_intro.tres
data/dialogue/cabin\_ember\_choice.tres
data/dialogue/ironwood\_birdie\_apple.tres
data/dialogue/bethany\_arrival.tres
data/dialogue/bethany\_miriam.tres
data/dialogue/bethany\_nora.tres
data/dialogue/bethany\_amos.tres
data/dialogue/lena\_intro.tres
data/dialogue/bethany\_rest\_summary.tres
```

\---

## 20\. Consequence summary

The slice ends at rest, after Bethany. The summary is not a scorecard. It is a notebook-like review.

### 20.1 Displayed elements

* Names learned.
* Names written.
* Patients recovered / received / left uncertain.
* Ember remaining.
* Pressure/Numbness state in words, not numbers.
* One Wittehaven hook line.

### 20.2 Example summaries

#### Attentive, costly branch

```text
Eli Keene — written.
Miriam Toll — warmed, received.
Nora Finch — fever eased.
Amos Bell — breathing, barely.

One dose of Ember remains.
Your hands still shake.
The road north is wet.
They say Wittehaven has clean sheets.
```

#### Efficient, numb branch

```text
Eli Keene — written.
Miriam Toll — outcome recorded.
Nora Finch — stable.
Amos Bell — stabilized by Ember.

No Ember remains.
Your hands are steady.
Birdie waits outside.
They say Wittehaven keeps better records.
```

#### Hard failure branch

```text
Eli Keene — written.
Miriam Toll — alone.
Nora Finch — fever worsened.
Amos Bell — name written late.

The vial is empty.
Your hands are steady enough.
The road to Wittehaven is marked in white.
```

\---

## 21\. Backlog and build order

### Milestone 0 — Repository and project scaffold

|Ticket|Acceptance|
|-|-|
|Create Godot 4.6.x project|Opens in pinned editor version; README records version.|
|Add folder structure|Matches Section 6.1.|
|Configure project settings|960×540, nearest filtering, input map.|
|Add autoloads|GameEvents, GameState, Inventory, NotebookState, SceneRouter load without errors.|
|Add placeholder HUDRoot|All UI panels hidden/visible via debug keys.|

### Milestone 1 — Movement and interaction

|Ticket|Acceptance|
|-|-|
|Build Player.tscn|Moves in 4/8 directions, collides, animates placeholder.|
|Build interaction focus|Prompt appears on interactables; priority works.|
|Build scene transition|Cabin → Ironwood works with fade and spawn markers.|
|Build inventory add/remove|Debug pickup updates pouch.|

### Milestone 2 — Cabin playable

|Ticket|Acceptance|
|-|-|
|Build Cabin tilemap with placeholder art|Player can walk around; bed/door/collision work.|
|Add Eli patient interaction|Observe → death → notebook prompt works.|
|Add notebook entry|Eli written page 66 line 7.|
|Add Ember choice|Self-use affects Pressure/Numbness/Ember count.|
|Add cedar dog interaction|Memory line triggers.|

### Milestone 3 — Forage and Birdie

|Ticket|Acceptance|
|-|-|
|Build Ironwood Road placeholder map|Walkable path, collisions, exit.|
|Add ForageNode|Clean/quick harvest changes inventory and quality.|
|Add salvage nodes|Wool/Cotton pickups.|
|Add PouchPanel|Shows quantities and icons/placeholders.|
|Add Birdie apple scene|Apple offered/refused; Birdie follows.|

### Milestone 4 — Crafting

|Ticket|Acceptance|
|-|-|
|Create IngredientResource data|All 8 prototype ingredients load.|
|Create RecipeResource data|5 recipes load and show craftability.|
|Build Tincture Wheel UI|Shows axes, recipe quality, time cost.|
|Implement crafting result|CraftedItemResource added to inventory.|
|Implement time cost|TriageClock advances after craft.|

### Milestone 5 — Bethany triage

|Ticket|Acceptance|
|-|-|
|Build Bethany Clinic placeholder map|Three patient beds, stations, Lena/Birdie positions.|
|Implement PatientController|urgency/trust/warmth/risk/outcome rules.|
|Build PatientPanel|Observe/Sit/Administer/Wash/Warm/Write actions.|
|Implement Miriam|Unavoidable death with manner changes.|
|Implement Nora|Recovery branch via dressing/draught.|
|Implement Amos|Ember dilemma branch.|
|Add Lena intervention|Can improve compress/non-Ember branch.|

### Milestone 6 — End summary and test pass

|Ticket|Acceptance|
|-|-|
|Add rest marker|Opens notebook/consequence summary; autosaves.|
|Add Wittehaven hook|Rumor/sign appears in summary or scene.|
|Add manual playtest checklist|Can test all success criteria.|
|Add unit tests|Recipe quality, Ember state, notebook entry.|
|Add slice playthrough script|Cabin → forage → Bethany → rest path.|

\---

## 22\. Testing and playtest criteria

### 22.1 Unit tests

Test these with GdUnit4 or equivalent:

* Ingredient catalog loads all prototype ingredients.
* RecipeBook returns craftable recipes based on inventory.
* Crafting consumes correct ingredients.
* Crafting produces Rough/Sound/Excellent quality correctly.
* Self-use Ember reduces Pressure and increases Numbness.
* Patient-use Ember reduces Amos death risk/urgency correctly.
* Notebook writes Eli to page 66 line 7.
* Patient outcomes lock once thresholds are reached.
* Scene-time advances patient urgency after crafting.

### 22.2 Manual playtest script

A tester should complete these branches:

1. Cabin: refuse Ember, clean-harvest Pulseleaf, save Nora, sit with Miriam, attempt Amos without Ember.
2. Cabin: self-use Ember, quick-harvest, use Ember on Amos, neglect Miriam.
3. Cabin: self-use Ember, withhold Ember from Amos, over-treat Miriam.
4. Bethany: treat Nora first, Miriam second, Amos third.
5. Bethany: treat Amos first, Nora second, Miriam third.

### 22.3 Slice success criteria

The prototype is successful when a tester can say:

* I understood that crafting medicine is central.
* I wanted to use Ember.
* I understood why Ember might be dangerous without the UI telling me it is evil.
* I cared about at least one patient by name.
* I felt time, supplies, and attention were scarce.
* I understood that this is not a combat game.
* I saw that medicine worked.
* I saw that medicine did not solve everything.
* I wanted to see Wittehaven because it sounded like relief.

\---

## 23\. Design risks and mitigations

|Risk|Symptom|Mitigation|
|-|-|-|
|Crafting feels like generic survival|Players optimize ingredients without caring about patients|Tie every recipe to a named patient need; keep quantities scarce.|
|Ember feels obviously bad|Players avoid it and feel morally superior|Make Pressure penalties real; make Amos stabilization persuasive.|
|Patient death feels like failure|Players reload whenever someone dies|Make Miriam’s death unavoidable and judge manner, not survival.|
|UI becomes spreadsheet|Players see variables, not people|Use human observation language; hide raw numbers.|
|Birdie becomes cute mascot|Players read her as companion pet|Give practical, inconvenient lines; no bounce/sparkle animation.|
|Lena becomes lecture device|Player feels scolded|Have her act first; improve care through practice.|
|Art drifts cozy|Palette too bright/sweet|Use damp ash, cedar, slate, muted green; reserve gold/red.|
|Godot scope creep|Too many plugins/systems early|Build with simple resources/signals first; plugins optional.|
|Asset overload|Artists cannot start|Produce P0 placeholder list first; icon panels after gameplay reads.|

\---

## 24\. Design-team assignment packet

### 24.1 Systems designer tasks

1. Create exact `IngredientResource` values for prototype ingredients.
2. Create exact `RecipeResource` values for five recipes.
3. Tune quality thresholds.
4. Tune PatientResource response dictionaries.
5. Produce first pass of outcome rules for Miriam, Nora, Amos.
6. Validate that no branch becomes a single perfect puzzle path.

### 24.2 Narrative designer tasks

1. Write cabin interaction lines for Eli.
2. Write Ember temptation text with no explicit moralizing.
3. Write Birdie apple refusal scene.
4. Write Bethany arrival rumor lines.
5. Write patient observations and hidden need lines.
6. Write Lena action-first dialogue.
7. Write end summaries for 5–8 likely branches.

### 24.3 UI/UX designer tasks

1. Wireframe pouch panel.
2. Wireframe Tincture Wheel.
3. Wireframe patient panel.
4. Wireframe notebook panel.
5. Wireframe consequence summary.
6. Design state overlay icons.
7. Test readability at 960×540.

### 24.4 Pixel artist tasks

1. Produce palette sheet for Ironwood/Bethany/Cabin.
2. Produce Kalev silhouette and walk test.
3. Produce Pulseleaf and pouch icon test.
4. Produce cabin tileset rough pass.
5. Produce one patient bed sprite test.
6. Produce Tincture Wheel UI texture test.
7. Produce one icon-panel concept: Eli name written.

### 24.5 Technical artist tasks

1. Define import preset checklist.
2. Configure TileSet physics/custom data layers.
3. Build StyleBoxTexture/nine-patch UI frames.
4. Test CanvasModulate + PointLight2D in cabin.
5. Test Numbness overlay without making text unreadable.
6. Confirm all assets remain crisp at target scale.

### 24.6 Godot implementer tasks

1. Scaffold project and autoloads.
2. Build Player movement and interaction.
3. Build Cabin scene with placeholder assets.
4. Build data resource loading.
5. Build crafting UI and logic.
6. Build patient controller.
7. Build Bethany triage.
8. Add tests and debug panels.

\---

## 25\. Handoff prompt for design team

Use this prompt when handing the project to a design/art implementation agent or collaborator:

```text
You are designing the first playable prototype of Tincture of Mercy: The Garments of Skin.

Use v0.7 Godot Gameplay + 2D Asset Design Handoff as the source of truth for prototype design. v0.6 remains supporting structure and v0.3 remains deep lore.

Do not expand scope beyond the Cabin / Ironwood Road / Bethany slice.

The prototype must prove therapeutic crafting, patient triage, Ember temptation, Burden/Pressure/Numbness, names/notebook, Birdie, Lena, and Wittehaven-as-future-relief.

Engine target: Godot 4.6.x stable.
Visual target: 2D top-down Michigan icon-manuscript pixel art.
Core asset scale: 32×32 tiles, 32×48 adult characters, 960×540 logical viewport.

Your first deliverables:
1. a greybox scene map for Cabin, Ironwood Road, and Bethany Clinic;
2. a first-pass data table for ingredients, recipes, and patients;
3. a P0 asset board using the lists in Sections 16–17;
4. a UI wireframe for Pouch, Tincture Wheel, Patient Panel, and Notebook;
5. a build backlog mapped to Milestones 0–6.

Preserve the pillars: names over metrics; medicine works but cannot redeem; Ember must be tempting; Wittehaven must feel like relief; the enemy is not flesh and blood; crafting is care, not loot optimization.
```

\---

## 26\. Final clearance checklist

The design can proceed when the team acknowledges these locks:

* \[ ] Godot 4.6.x stable selected and recorded.
* \[ ] 32×32 tile grid accepted.
* \[ ] 960×540 logical viewport accepted.
* \[ ] Cabin / Ironwood Road / Bethany only for first prototype.
* \[ ] Five prototype recipes accepted.
* \[ ] Two Ember doses accepted.
* \[ ] Eli Keene, Miriam Toll, Nora Finch, Dr. Amos Bell accepted.
* \[ ] Miriam’s death is unavoidable but meaningful.
* \[ ] Amos is the Ember dilemma.
* \[ ] Tincture Wheel is a real prototype UI.
* \[ ] Notebook records names/outcomes but does not dominate gameplay.
* \[ ] No combat, no farming, no hospital management.
* \[ ] P0 asset list approved.
* \[ ] Placeholder art allowed before final pixel art.
* \[ ] Reference images are principles, not style-copy targets.

\---

## 27\. Closing production statement

This v0.7 handoff is ready for design. The prototype should now move from conceptual refinement into greyboxing, data authoring, UI wireframing, and placeholder Godot implementation.

The first playable build should not try to prove the whole pilgrimage. It should prove one thing with force:

> A named person is fading. You have limited time, limited medicine, a shaking hand, and a vial that works. What do you make, what do you spend, what do you write, and what does that make of you?

