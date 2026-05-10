# v0.8.1 Design Packet — Index

> **Status note, 2026-05-09:** v0.8.1 is retained as provenance and scoped
> P0 history. The active implementation direction for the next PRD and issue
> slicing is `../v0_9_mercy_rpg_substrate/INDEX.md`. Do not generalize v0.8.1
> care-only / combat-deferred language into a project-wide rule.

The contract-hardening release between v0.8 and the Godot C#/.NET scaffold gate.

v0.8 introduced beautiful documents that contained small canon and
implementation drifts. v0.8.1 closes those drifts before scaffold work
begins, so beautiful documents do not become contradictory production
instructions. This index is the canon hub: locks and errata arbitrate conflicts; generated review and archive material never override them.

---

## What changed from v0.8

| # | Drift | Resolved by |
|---|---|---|
| 1 | Nora Field → **Nora Finch** | errata §1 |
| 2 | Miriam young → **elder** | errata §2 |
| 3 | Cabin Ember off → **off-on-Eli, on-self-after-name** | errata §3 |
| 4 | **Bitterleaf** scope creep removed | errata §4 |
| 5 | JetBrains Mono → **IBM Plex Mono** | errata §5 |
| 6 | Page 77 prototype misuse → **graphite underrule** | errata §6 |
| 7 | Ember slot 8 → **slot 16** | errata §7 |
| 8 | IC XC NIKA in P0 → **P2 reserved** | errata §8 |
| 9 | Birdie apple refusal optional → **mandatory** | errata §9 |
| 10 | Required intercut panels → **3 (Cabin, Birdie, Bethany)** | errata §10 |
| 11 | Wittehaven palette → **token-only** | errata §11 |
| 12 | Radius mismatch → **4 px / 0 px (Wittehaven) / 4 px (Paradise)** | errata §12 |
| 13 | RegisterTable/static-lookup drift → **`RegisterLexiconResource` + `RegisterLookup.tactile(...)`** | errata §13 |
| 14 | Dr. Bell → **Dr. Amos Bell** (resource: `dr_amos_bell.tres`) | errata §14 |
| 15 | 480×270 vs 960×540 → **clarified** | errata §15 |
| 16 | Numeric anti-drift annotation → **`@allow_numeric`** | errata §16 |
| 17 | No-music P0 → **explicit lock** | errata §17 |
| 18 | 32×48 economy sprites → **64×96 high-fidelity Kalev / principal adults** (etc.) | manifest §3, §7 |
| 19 | Absolute prohibitions ("never combat", "no XP ever", "forbidden") → **scoped to P0** with explicit post-P0 expansion clauses | locks §14, §16, §17 |

> The v0.8 packet has been archived to `../../_archive/superseded/v0_8/`. The
> v0.8.1 manifest folds in the high-fidelity character-scale revision that
> was previously a draft under `../../_archive/superseded/uploads/asset_manifest_upgrade_v0_8_1/`.
>
> **Item 19 — open doors (v0.8.1 late revision).** All "never / forbidden /
> removed" closures in the v0.8 canon have been reframed as **P0-scoped
> restrictions**. Combat, RPG progression (skills / attributes / leveling),
> loot tables and rarity tiers, crafting professions, quests, and
> antagonists are **open for later layering** as deliberate post-P0
> packets. The contemplative care core remains the foundation; later
> packets extend it rather than replace it. The full open-door list lives
> in `canonical_locks_v0_8_1.md` §17.

---

## Files in this packet

### Foundation

1. **[INDEX.md](INDEX.md)** — this file; canon hub and read path.
2. **[errata_v0_8_to_v0_8_1.md](errata_v0_8_to_v0_8_1.md)** — every drift, with patch; conflict arbiter.
3. **[canonical_locks_v0_8_1.md](canonical_locks_v0_8_1.md)** — short, strict, implementation-facing canon lock.

### Surface labels

| Label | Meaning | Examples |
|---|---|---|
| Canon lock | Binding current P0 rule. | `canonical_locks_v0_8_1.md`, `errata_v0_8_to_v0_8_1.md`. |
| Implementation contract | Godot/data/UI/art handoff that must obey locks. | `implementation_start_order_v0_8_1.md`, scaffold prompts, asset manifest, acceptance tests. |
| Lore source | Rich source material for voice and symbolism; locks arbitrate conflicts. | `../../docs/lore/*.md`. |
| Generated review surface | Human review/display generated from canon; not independent authority. | `../../concept_packet.html`, visual prototype HTML. |
| Archive/provenance | Superseded intake/history. | `../../_archive/superseded/**`. |

### Patched v0.8 docs (now v0.8.1)

4. **[aesthetic_bible_v0_8_1.md](aesthetic_bible_v0_8_1.md)** — north-star thesis, three regimes, manifesto.
5. **[micro_symbol_register_v0_8_1.md](micro_symbol_register_v0_8_1.md)** — every detail; Ember slot corrected.
6. **[ui_regime_system_v0_8_1.md](ui_regime_system_v0_8_1.md)** — pouch/wheel/panel/notebook; `RegisterLookup` clarified.
7. **[art_direction_v0_8_1.md](art_direction_v0_8_1.md)** — sprite/tile/icon-panel laws.
8. **[scene_composition_bible_v0_8_1.md](scene_composition_bible_v0_8_1.md)** — Cabin / Ironwood / Bethany; Bitterleaf removed; Miriam elder; Nora Finch.
9. **[icon_panel_prompt_pack_v0_8_1.md](icon_panel_prompt_pack_v0_8_1.md)** — style-safe prompts.
10. **[godot_asset_manifest_v0_8_1.md](godot_asset_manifest_v0_8_1.md)** — full asset list; IBM Plex Mono; Nora Finch sprite; Dr. Amos Bell sprite. **High-fidelity character-scale revision applied**: Kalev / principal adults 64×96, Birdie 48×64, minor adults 48×72, bedside patients 96×48 / 128×64. Tiles remain 32×32. (Canonical concept reference: `res://art/characters/kalev/kalev_design_asset.png`.)
11. **[godot_design_delta_v0_8_1.md](godot_design_delta_v0_8_1.md)** — node renames, autoload changes, signal flow.
12. **[backlog_visual_gameplay_v0_8_1.md](backlog_visual_gameplay_v0_8_1.md)** — priority tasks with deps.

### Execution & verification

13. **[acceptance_tests_v0_8_1.md](acceptance_tests_v0_8_1.md)** — 113 tests (84 v0.8 + 4 anti-drift + 10 canon + 10 godot + 5 manual).
14. **[implementation_start_order_v0_8_1.md](implementation_start_order_v0_8_1.md)** — seven commits; gate sequence.
15. **[godot_scaffold_start_prompt_v0_8_1.md](godot_scaffold_start_prompt_v0_8_1.md)** — C#/.NET engine + project + folder + resource spec.
16. **[PROMPT_GODOT_SCAFFOLD_AGENT_v0_8_1.md](PROMPT_GODOT_SCAFFOLD_AGENT_v0_8_1.md)** — copy-paste cover prompt for the Godot C# implementation agent.

### Lore / review / provenance outside this packet

- **`../../docs/lore/tincture_of_mercy_v0_3.md`** — lore source; preserves symbolic grammar and cast depth.
- **`../../docs/lore/tincture_of_mercy_packet_v0_6.md`** — lore/prototype rationale source.
- **`../../docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md`** — historical handoff; v0.8.1 wins where it differs.
- **`../../concept_packet.html`** — generated review surface, not canon.
- **`../../_archive/superseded/**`** — archive/provenance only.

### Tooling (project root)

- **[../tools/anti_drift.py](../tools/anti_drift.py)** — CI gate.
- **[../tools/anti_drift_allowlist.json](../tools/anti_drift_allowlist.json)** — documented exceptions.

---

## Use-by-role guide

| Role | Read |
|---|---|
| **Designer** | 4 → 5 → 8 → 6, then re-read 2, 3 weekly. |
| **Engineer** | 3, 2, 11, 10, 14, 15, 16, then 6 constantly. |
| **Pixel artist** | 7, 9, 10. |
| **Audio** | 8 §10, 10, 12. |
| **QA / build** | 13. The suite is the gate. |
| **Writer / narrative reviewer** | 4, 5, 13 §14 manual review. |
| **Anyone implementing in Godot** | 16 first, then 15, 11, 10, 13. |

---

## Canonical locks (high-water marks)

```
Slice:       Cabin → Ironwood → Birdie apple refusal → Bethany.
Patients:    Eli Keene · Miriam Toll (elder) · Nora Finch · Dr. Amos Bell.
Pouch:       Slot 1 cedar dog (locked) · Slot 16 Ember (locked).
Ember:       Cannot target Eli; self-use after Eli's name is written; scarce.
Notebook:    Page 66 line 7 = Eli; page 77 line 7 = RESERVED.
Birdie:      Apple refusal mandatory.
Mono:        IBM Plex Mono.
Viewport:    960×540 logical; 480×270 composition; 32×32 tiles; 2× zoom.
Audio:       Diegetic only.
Language:    C#/.NET for Godot engine code.
Sacred:      Paradise / IC XC NIKA / halos = P2 reserved.
```

For the full set, see `canonical_locks_v0_8_1.md`.

---

## Implementation start order

1. v0.8.1 design hardening (this packet).
2. Godot C#/.NET project scaffold.
3. C# resources and autoloads.
4. Theme resources.
5. Anti-drift CI.
6. Placeholder UI scenes.
7. Placeholder world scenes.

Each commit's acceptance row must pass before the next begins. See
`implementation_start_order_v0_8_1.md`.

---

## Test-gate order

```
1.  AD-10..13       (no canon-name drift; no Bitterleaf; no JetBrains Mono).
2.  CANON-01..10    (canon stable).
3.  GODOT-01..03    (project, autoloads, resources).
4.  GODOT-04..05    (RegisterLookup; Theme tokens).
5.  GODOT-06..10    (UI placeholders).
6.  v0.8 SC/U/CE/N  (rewritten where applicable).
7.  M-01..M-05      (manual review; final gate).
```

---

## Human decision list

> *(empty — all v0.8 → v0.8.1 corrections are derivable from prior locks.)*

If a future drift forces a real product decision, it is added here as a
single yes/no question.

---

## The state v0.8.1 leaves the project in

> The design is no longer merely evocative. It is enforceable. The world
> has laws. The build must now obey them.
