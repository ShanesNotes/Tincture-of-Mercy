# Acceptance Tests — v0.8.1

This is the active v0.8.1 acceptance surface. Earlier v0.8 rows are provenance
only unless they have been rewritten into this file; no implementation gate
should import `acceptance_tests_v0_8.md` by reference.

A test fails closed: ambiguous = failing. Tests are grouped by gate phase.
The order in `INDEX.md` is the order they should pass during scaffold.

Symbols:

```
[CANON]  canonical-name and reservation gate.
[AD]     anti-drift CI gate.
[GODOT]  Godot scaffold structural gate.
[U]      UI gate.
[SC]     scene-gameplay gate.
[CE]     Cabin/Ember gate.
[N]      notebook gate.
[A]      audio gate.
[V]      visual gate.
[M]      manual review gate.
```

---

## 1. Anti-drift CI (`AD-10..14`) — must pass first

| ID | Test | Pass condition |
|---|---|---|
| AD-10 | `python3 design_system/tools/anti_drift.py` runs to completion | exit code present; never hangs |
| AD-11 | Clean tree → exit 0 | with v0.8.1 packet only, gate is green |
| AD-12 | Inject `nora_field` into a non-meta file | gate exits 1, lists `canon-rename` violation |
| AD-13 | Inject `bitterleaf` into a non-meta file | gate exits 1, lists `canon-rename` violation |
| AD-14 | `python3 design_system/tools/check_topology.py` runs on live scaffold docs | exit 0 on canonical topology; stale scene/UI/data paths exit 1 |

---

## 2. Canon (`CANON-01..10`) — second gate

| ID | Test | Pass condition |
|---|---|---|
| CANON-01 | Repo-wide search for `Nora Field`/`nora_field` | zero hits outside meta files |
| CANON-02 | Miriam age band | every Miriam asset/dialog flagged `elder` |
| CANON-03 | Repo-wide search for `Bitterleaf`/`bitterleaf` | zero hits outside meta files |
| CANON-04 | Pouch slot 1 contents | only `cedar_dog_locked` |
| CANON-05 | Pouch slot 16 contents | only `ember_locked` |
| CANON-06 | Ember Eli-target rule | gameplay code rejects target == Eli at every beat |
| CANON-07 | Repo-wide search for `JetBrains Mono` | zero hits outside meta files |
| CANON-08 | Theme mono font slot | resolves to `IBM Plex Mono` in all three themes |
| CANON-09 | Notebook write to page-77 line-7 | API rejects in P0 |
| CANON-10 | Repo-wide search for `IC XC NIKA`, `narthex`, `halo` | zero hits in player-facing dirs |

---

## 3. Godot scaffold (`GODOT-01..10`)

| ID | Test | Pass condition |
|---|---|---|
| GODOT-01 | Project opens in Godot 4.6.x with .NET enabled | no startup errors, no missing dependencies, C# assembly loads |
| GODOT-02 | All canonical autoloads register | every required name in `canonical_locks_v0_8_1.md` §13 is present with C# scripts (`GameState` may be omitted if unused, per lock) |
| GODOT-03 | C# Resource files load | 4 patients, 8 ingredients, 6 recipes, 1 axes, ≥1 register lexicon — all `.tres` instances parse against C# `Resource` classes |
| GODOT-04 | UI string indirection | every UI label in `res://scenes/ui/*.tscn` reads via `RegisterLookup.tactile(...)`; zero hard-coded patient state strings |
| GODOT-05 | Theme tokens contained | every Theme color exists in `colors_and_type.css` |
| GODOT-06 | Pouch scene | 16 slots; slot 1 cedar dog locked; slot 16 Ember locked |
| GODOT-07 | Notebook scene | page-66 line-7 path implemented; page-77 line-7 rejected |
| GODOT-08 | Patient panel | no `ProgressBar`; uses `RegisterLookup.tactile` for all readouts |
| GODOT-09 | Tincture wheel | quality readout pulls from `RegisterLookup`; never displays raw axis values |
| GODOT-10 | Kalev state overlay | reads `KalevState`; never reads `GameState` for body data |

---

## 4. UI regime (`U-01..U-14`) — rewritten where canon shifted

| ID | Test | Pass condition |
|---|---|---|
| U-01 | Regime swap | swaps theme on root CanvasLayer; no scene re-mount |
| U-02 | Theme tokens | no hex used outside Themes/CSS tokens |
| U-03 | Pouch row count | exactly 8×2 = 16 |
| U-04 | Pouch slot 1 | cedar dog, locked, can't be swapped |
| U-05 | Pouch slot 16 | Ember vial, locked, can't be moved or used outside Ember verb |
| U-06 | Wittehaven mono | rendered in `IBM Plex Mono` |
| U-07 | Notebook persistence | writes survive reload |
| U-08 | Patient panel labels | `RegisterLookup.tactile` resolves every label |
| U-09 | No raw numbers in UI | spot-check Pressure/Burden/Numbness — none visible |
| U-10 | No morality meter in P0 UI | absent in UI tree under P0 scope (post-P0 reputation/alignment systems would scaffold their own surface) |
| U-11 | No XP / level / unlock in P0 UI | absent in UI tree under P0 scope (post-P0 RPG progression would scaffold its own character-sheet surface) |
| U-12 | No quest log in P0 UI | notebook present; no objectives panel in P0 (post-P0 quest systems would scaffold their own `QuestLog` autoload — never collapse into `Notebook`) |
| U-13 | Hit targets | ≥ 32 px native; ≥ 44 px at 2× |
| U-14 | Regime mono fallback | Ironwood/Paradise serif/manuscript fonts unaffected |

---

## 5. Cabin & Ember (`CE-01..CE-08`) — rewritten

| ID | Test | Pass condition |
|---|---|---|
| CE-01 | Ember verb on Eli | grayed out, with tactile reason string |
| CE-02 | Self-use lock | unavailable until Beat 4 (Eli's name written) |
| CE-03 | Self-use effect | Pressure → Numbness one step; reflected in tactile UI |
| CE-04 | Doses | scarcity respected; no replenishment in P0 |
| CE-05 | Cabin Beat 4 trigger | name-write event fires on the page-66 line-7 path only |
| CE-06 | Required panel #1 | Cabin death/name-written panel held ≥ 4 s; bed-only audio ≥ 600 ms |
| CE-07 | Captions | every gameplay-affecting Cabin SFX is captioned |
| CE-08 | Cedar dog | present in Cabin scene; readable from UI |

---

## 6. Notebook (`N-01..N-06`)

| ID | Test | Pass condition |
|---|---|---|
| N-01 | Page 66 line 7 write | exactly Eli's name, on triggered beat |
| N-02 | Page 77 line 7 | rejected in P0; logged silently |
| N-03 | Append-only | no edit / delete API |
| N-04 | Persists | survives reload |
| N-05 | Stillness markers | underrule / damp-paper / unfilled / stone are reachable patterns |
| N-06 | Bethany names | written exactly when triage outcomes are known |

---

## 7. Scene & gameplay (`SC-01..SC-12`) — rewritten where canon shifted

| ID | Test | Pass condition |
|---|---|---|
| SC-01 | Slice scope | only Cabin / Ironwood / Bethany scenes are reachable |
| SC-02 | Birdie apple refusal | **mandatory**; refusal beat triggers unconditionally on the apple offer |
| SC-03 | Birdie follows anyway | refusal does not gate following |
| SC-04 | Bethany triage | three patients (Miriam elder, Nora Finch, Dr. Amos Bell) |
| SC-05 | Miriam unavoidable | death is unavoidable; manner of dying changes with care |
| SC-06 | Nora Finch | recoverable through attentive care |
| SC-07 | Dr. Amos Bell | Ember dilemma exposed; Ember verb on him is enabled |
| SC-08 | Lena | enters during triage; provides presence; no Tincture verb |
| SC-09 | No Wittehaven | no playable Wittehaven scene; sanctioned-fragment intrusion ≤ 1 s |
| SC-10 | Required panel #2 | Birdie apple refusal panel held ≥ 4 s |
| SC-11 | Required panel #3 | Bethany triage manuscript intercut held ≥ 4 s |
| SC-12 | Manuscript intercut scene-close copy | uses `RegisterLookup.tactile`; no success/failure terms |

---

## 8. Audio (`A-01..A-10`)

| ID | Test | Pass condition |
|---|---|---|
| A-01 | No music | no `music_*` files imported |
| A-02 | One bed at a time | AudioManager refuses overlapping beds |
| A-03 | Bed-only inside intercut panels | ≥ 600 ms inside each required panel |
| A-04 | Captions on all marks | every gameplay-affecting SFX has a Caption resource |
| A-05 | No celebration sounds | no chimes/stingers on quality, recovery, completion |
| A-06 | No screen-flash on Ember | flash is bound to patient-panel rect only |
| A-07 | Diegetic sources only | no global stinger bus |
| A-08 | Cabin ambience | runs continuously through Cabin scene |
| A-09 | Ironwood ambience | replaces Cabin bed on transition |
| A-10 | Bethany ambience | distinct bed; runs through triage |

---

## 9. Visuals (`V-01..V-12`)

| ID | Test | Pass condition |
|---|---|---|
| V-01 | Tile size | 32×32 throughout |
| V-02 | Kalev / principal-adult sprite canvas | 64×96 (v0.8.1 high-fidelity) |
| V-02b | Minor-adult sprite canvas | 48×72 |
| V-02c | Bedside-patient sprite canvas | 96×48 (or 128×64) |
| V-03 | Birdie / Ruth canvas | 48×64 |
| V-04 | Logical viewport | 960×540 |
| V-05 | Composition grid | 480×270 |
| V-06 | Camera zoom | 2× |
| V-07 | Filter | nearest; mipmaps off |
| V-08 | Wittehaven palette | only root tokens used |
| V-09 | Gold/red use | reserved for earned moments — spot-check Cabin & Bethany |
| V-10 | Paradise sacred register | absent from P0 |
| V-11 | Icon-panel canvas | 480×300 |
| V-12 | Icon-panel composition | per icon_panel_prompt_pack rules |

---

## 10. Retired v0.8 inheritance

No test inherits live behavior from `acceptance_tests_v0_8.md`. If an older
`MISC-*` row is still useful, rewrite it here against v0.8.1 canon, C#/.NET
paths, and the current resource/autoload contract before treating it as a gate.

---

## 11. Manual review (`M-01..M-05`) — final gate

These tests cannot be automated. A human reviewer signs off.

| ID | Test | Pass condition |
|---|---|---|
| M-01 | Tonal review of Cabin scene | "names over metrics" reads as care, not optimization |
| M-02 | Birdie apple refusal | refusal lands as character truth, not as a tutorial beat |
| M-03 | Bethany triage | Miriam's death feels different across "good" / "tired" / "rushed" runs |
| M-04 | Ember Dr. Amos Bell dilemma | tempting, not a min-max decision |
| M-05 | Wittehaven sanctioned fragment | feels like an intrusion, not a tease for content the prototype lacks |

---

## 12. Test order

```
1. AD-10..14       (anti-drift + topology; must pass first)
2. CANON-01..10    (canon stable)
3. GODOT-01..03    (project, autoloads, resources)
4. GODOT-04..05    (RegisterLookup; Theme tokens)
5. GODOT-06..10    (UI placeholders)
6. U / N / CE      (UI + notebook + Cabin/Ember)
7. SC              (scene-gameplay)
8. A / V           (audio + visual)
9. M-01..M-05      (manual review; final gate)
```

If a row in §6 fails because §3–§5 were not tight, fix §3–§5 first. Do not
patch §6 around a structural defect.
