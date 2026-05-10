# Canonical Locks — v0.8.1

Short, strict, implementation-facing. If implementation contradicts a lock, the
implementation is wrong. If a lock contradicts a future product decision, the
product decision is documented in `errata_v0_8_to_v0_8_1.md` §18 first, then
the lock is updated — never the other way around.

---

## 1. Slice content

```
Cabin → Ironwood Road → Birdie apple refusal → Bethany arrival →
Bethany triage → Lena introduction → rest / notebook / road north.

NOT in prototype:
  Wittehaven (playable)         — reservation only.
  Mackinac (playable)           — reservation only.
  Mount Arvon                   — reservation only.
  Paradise (playable)           — reservation only.
  Rafe's main scene             — reservation only.
  Birdie's later disappearance  — reservation only.
  Iron Ledger trial             — reservation only.
  Multiple endings / choices    — out of P0 scope.
  Combat                        — out of P0 scope.
  Farming                       — out of P0 scope.
  Hospital-management sim       — out of P0 scope.
  RPG progression (XP / level)  — out of P0 scope.
  Loot tables / rarity tiers    — out of P0 scope.
  Crafting professions          — out of P0 scope.
  Quests / objectives panel     — out of P0 scope.
  Antagonists / bosses          — out of P0 scope.

(See §17 — out of P0 scope ≠ closed door.)
```

## 2. Characters

| Name | Role | Lock |
|---|---|---|
| Kalev Ward | Player. Burdened healer-apothecary, 33. | Sole PC. |
| Eli Keene | Cabin boy. Dying / dead seed scene. | Page 66 line 7. |
| Birdie / Ruth | Companion-child. Apple refusal. Follows anyway. | True name future-only. |
| Lena Hart | Enters during Bethany triage. Repaired gloves; presence; no Tincture. | Not a lecturer. |
| Miriam Toll | **Elder.** Unavoidable death; the manner of dying changes with care. | Not young. |
| Nora Finch | Recoverable through attentive care. | Not Nora Field. |
| Dr. Amos Bell | Village doctor. Ember dilemma. | Resource: `data/patients/dr_amos_bell.tres`. |

## 3. Crafting (P0 only)

```
Salt Wash
Clean Dressing
Pulseleaf Draught
Cedar-Wool Compress
Ember Dose / Dilution
```

No new craftables. No quality tiers. No rarity. No bonus stats.

## 4. Ingredients (P0 only)

```
Pulseleaf
Cotton
Wool
Salt
Clean Water
Cedar
Honey      (optional · limited)
Ember      (scarce; not craftable)
```

**Not in P0 (do not author resources):**
Bitterleaf, Arbor, Acebark, Phrine, Cillin, Zyl, Myrrh, Oil, Furos.

If a P1/P2 placeholder file is needed, it must live under `data/ingredients/_reserved/`
and be excluded from the autoload catalog.

## 5. Notebook

```
Page 66, line 7   — Eli Keene seed; Cabin scene write.
Ordinary later    — Bethany names and outcomes.
Page 77, line 7   — RESERVED. Future wife-name arc only. No prototype write.
```

The notebook records names and outcomes. It is not a card collection. It is not
a quest log. It is append-only. It persists across sessions.

Stillness markers (graphite underrule, damp-paper pause, unfilled line, margin
stone mark) replace any prior "page 77 underrule" usage.

## 6. Ember

```
Ember works.
Ember is scarce.
Ember is NOT craftable in prototype.
Ember CANNOT target Eli Keene (during Cabin care AND after his name is written).
Ember self-use unlocks AFTER Eli's name is written (Cabin Beat 4 onward).
Ember may be used or withheld in the Dr. Amos Bell dilemma (Bethany).
Self-use converts Pressure → Numbness one step.
Patient-use may stabilize, never automatically "right."
Doses do not replenish in P0.
```

## 7. UI

```
Pouch:        8 × 2 = 16 slots.
Slot 1:       cedar dog (locked).
Slot 16:      Ember vial (locked / dangerous; always last).
No morality meter.
No XP / level / unlock.
No quest log / objectives.
No success / failure panel.
No patient health bar.
No raw Pressure / Burden / Numbness numbers in player-facing UI.
No Wittehaven case IDs in Ironwood UI except as a 1 s sanctioned-fragment intrusion (§4.6 of UI regime).
Hit targets ≥ 32 px native; ≥ 44 px at 2× scale.
```

## 8. Visuals

```
Style phrase:        Michigan icon-manuscript pixel art.
Tile size:           32 × 32.
Sprite canvas:       Kalev / principal adults 64×96; minor adults 48×72;
                     Birdie / Ruth 48×64; bedside patients 96×48 (or 128×64).
Logical viewport:    960 × 540.
Composition grid:    480 × 270 (half-scale; ×2 to viewport).
Icon-panel canvas:   480 × 300 (×2 to viewport with letterbox).
Camera zoom:         2× for 32×32 art.
Filter:              nearest-neighbor; mipmaps off.
Gold and red are EARNED. They are never decoration.
Wittehaven uses ONLY root-token witte colors. No new blue.
Paradise explicit sacred register (IC XC NIKA, halos, narthex) is RESERVED.
```

## 9. Type

```
Display:           IM Fell English
Body:              EB Garamond
Sacred icon:       Cinzel  (P2 / reserved scenes only)
Hand / notebook:   Caveat
Wittehaven mono:   IBM Plex Mono   (NOT JetBrains Mono)
```

All five are licensed Google Fonts placeholders. Swap when bespoke is delivered.

## 10. Required intercut panels (3)

```
1. Cabin death / name written.
2. Birdie apple refusal.
3. Bethany triage consequence.
```

Each held ≥ 4 s; bed-only audio for ≥ 600 ms inside the panel; no input prompts.

## 11. Audio (P0)

```
Diegetic ambience and SFX only.
No non-diegetic score.
No celebration sounds (excellent quality, recovery, scene completion).
No screen-wide flash on Ember; flash bound to patient-panel rect.
One bed audio at a time.
Captions for every gameplay-affecting mark.
```

## 12. Architecture

```
Engine:           Godot 4.6.x.
Language:         C#/.NET for engine code. Older GDScript-first guidance is historical only.
Composition:      over inheritance.
Scenes:           small.
Scripts:          small.
Resources:        custom C# Resources (Ingredient / Recipe / Patient / NotebookEntry / RegisterLexicon / TinctureAxes / Caption).
Autoloads:        named per §13 below.
UI string API:    RegisterLookup.tactile(field_id, value, regime_id). No static tactile helper.
Theme swap:       on root CanvasLayer; never re-mounts UI scenes.
```

### Project topology and naming lock

Godot folder/file names use `snake_case`, except C# script files/classes use
PascalCase and match the public partial class name (`CabinScene.cs` →
`public partial class CabinScene`). Node names in scenes use PascalCase.

Canonical P0 runtime scene paths:

```
res://scenes/main.tscn
res://scenes/cabin/cabin.tscn
res://scenes/ironwood_road/ironwood_road.tscn
res://scenes/bethany/bethany.tscn
res://scenes/characters/kalev.tscn
res://scenes/characters/birdie.tscn
res://scenes/characters/lena.tscn
res://scenes/ui/kalev_state_overlay.tscn
res://scenes/ui/dialogue_box.tscn
res://scenes/ui/manuscript_intercut.tscn
```

Scene-specific C# scripts live beside their `.tscn` files. Global/reusable C#
code lives under `scripts/autoloads/`, `scripts/resources/`, or
`scripts/components/`. `[GlobalClass]` is reserved for resources/nodes that
must be editor-creatable or typed in exported properties.

Canonical P0 data paths are `data/ingredients/*.tres`, `data/recipes/*.tres`,
`data/patients/*.tres`, `data/register_lexicons/*.tres`,
`data/tincture/wheel_axes.tres`, and `data/captions.tres`. Ingredient
resources do **not** live under `data/tincture/`.

Runtime art stays under `art/characters/`, `art/environment/`, `art/props/`,
`art/ui/`, `art/icon_panels/`, and `art/vfx/`. Future concept/reference art
lives under `art/reference/` and is hidden from Godot imports with `.gdignore`.
Existing canonical concept images under `art/characters/**`, especially
`res://art/characters/kalev/kalev_design_asset.png`, are design-only exceptions
until a dedicated art migration; do not use them directly as `AnimatedSprite2D`
runtime sheets.

Non-runtime folders `docs/`, `design_system/`, and `art/reference/` carry
`.gdignore`. `_archive/` remains gitignored provenance.

### `.uid` sidecar policy

Godot 4.4+ writes `<file>.uid` sidecars next to every `.cs` and `.tscn`
artifact on editor open so scripts and scenes can be relocated without
breaking `ext_resource` references in `.tscn` / `.tres`. **`.uid`
sidecars are committed.** They are part of the project topology, not
build artifacts. Do not gitignore `*.uid`. If a `.uid` is deleted, the
editor will rewrite it on next open with a *new* UID — which silently
breaks any `ext_resource` that referenced the old one.

## 13. Autoload names (canonical)

```
GameEvents
KalevState         — Burden / Pressure / Numbness / Ember use / body-state.
GameState          — scene/run/session flags (only if needed).
RegimeManager
RegisterLookup
Beat
Notebook
CaptionLayer
Inventory
RecipeBook
IngredientCatalog
SceneRouter
AudioManager
DialogueManager
```

`KalevState` and `GameState` are **distinct**. Do not collapse them. If session
flags are not needed at v0.8.1, omit `GameState` entirely rather than fold it
into `KalevState`.

## 14. Restricted in P0 player-facing strings

```
heal · buff · debuff · stat · level up · XP · unlock · achievement · loot ·
skill tree · boss · enemy · quest · objective · morality · score · success ·
fail (as ledger label) · respawn · inventory (label) · equip · craft success ·
crit · tier · legendary · epic · rare · combo · damage · attack · weapon
```

These strings are restricted in **P0** player-facing copy because the
prototype must read as care, not as Diablo / WoW / Stardew. They remain
available as:

- **Developer code identifiers** in any phase.
- **Player-facing copy in post-P0 systems** (combat layer, RPG progression,
  professions, tiered crafting, quest log, antagonist surfaces) — designed
  in deliberately rather than leaking into P0 by accident.

The `design_system/tools/anti_drift.py` gate enforces this list under the `p0-vocabulary`
rule. Post-P0 packets may add their own allowlist entries when they introduce
sanctioned vocabulary surfaces.

## 15. Forbidden as resource IDs

```
nora_field      → use nora_finch
bitterleaf      → not in P0
dr_bell         → use dr_amos_bell
JetBrainsMono   → use IBMPlexMono
ember_slot_8    → use ember_slot_16 (or simply slot_16)
quest_log       → use notebook
```

## 16. The pillars (v0.8.1 — scoped wording)

```
1.  Names over metrics.
2.  Medicine works but cannot redeem.
3.  Ember must be tempting.
4.  Wittehaven must first feel like relief.
5.  The enemy is FIRST not flesh and blood (the prototype trains discernment
    of spirits, systems, fears, false mercies before any hostile body
    appears). Combat / antagonists may layer in post-P0.
6.  In P0, crafting is care, not loot optimization. Tiered crafting,
    professions, rarity, and recipe progression may layer in post-P0 — they
    are not the foundation.
7.  The prototype remains Cabin / Ironwood Road / Bethany only.
8.  The prototype fantasy is attention under pressure. RPG progression
    (skills, attributes, leveling) is open for later phases as a deliberate
    extension of the contemplative core.
9.  The sacred layer is structural, not decorative.
10. Godot implementation must remain small, readable, data-driven, and
    buildable.
```

If a proposed feature contradicts a pillar **within P0 scope**, it is not
built into P0. Pillars 5, 6, and 8 carry explicit post-P0 expansion clauses;
the others are perpetual. The pillars are the ceiling for P0 design; they
are the floor under any post-P0 packet.

## 17. Scope of these locks

All restrictions in this document are scoped to the **P0 prototype** (Cabin /
Ironwood Road / Bethany). Their purpose is to ensure the prototype reads as a
contemplative care-pilgrimage rather than as Diablo, WoW, or Stardew. The
contemplative core comes first because it is the hardest thing to model in
games and the most easily lost when other mechanics layer in.

**Out of P0 scope ≠ closed door.** The following are *not closed* and may be
designed in for later phases as deliberate extensions of the contemplative
core:

- **Combat layer.** Hostile humans, animals, or institutional enforcers —
  built so combat extends the moral grammar rather than replacing it.
- **RPG progression.** Skills, attributes, leveling — modeled on classic
  WoW pacing (timing, XP scaling, ability gating).
- **Loot &amp; rarity.** Tiered loot tables with rarity grades for found
  materials, prepared therapeutics, salvaged tools.
- **Crafting professions.** Apothecary, herbalist, scavenger as practiced
  disciplines that deepen with use.
- **Quests.** Named, optional, scoped — never the spine, but a legitimate
  surface for side encounters.
- **Antagonists.** Specific human or institutional enemies (Wittehaven
  enforcers, Iron Ledger inquisitors, scavenger crews).

When any of these is committed to design, it gets its own packet
(`design_system/v0_9_<layer>/`) with its own scope, vocabulary surface, and
acceptance gates. The P0 vocabulary restriction in §14 then expands to honor
that packet's sanctioned vocabulary.

The test for any post-P0 layer is the same: every layered system must still
serve attention, names, and care — even when it dresses itself in combat or
progression clothes.
