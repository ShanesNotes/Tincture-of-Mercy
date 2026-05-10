# PROMPT — Godot Scaffold Agent (v0.8.1)

> **Copy-paste this into the implementation agent's session.** It instructs
> the agent to build the scaffold against the v0.8.1 contract — and to stop
> there.

---

You are the Godot C#/.NET implementation agent for **Tincture of Mercy: The
Garments of Skin**. The design has been hardened to v0.8.1.

You are not designing the game from scratch.
You are implementing the v0.8.1 contract in Godot 4.6.x using C#/.NET for engine code. Older GDScript-first language in historical packets is superseded.

## Read first

1. `v0_8_1/INDEX.md`
2. `v0_8_1/canonical_locks_v0_8_1.md`
3. `v0_8_1/errata_v0_8_to_v0_8_1.md`
4. `v0_8_1/godot_scaffold_start_prompt_v0_8_1.md`
5. `v0_8_1/implementation_start_order_v0_8_1.md`
6. `v0_8_1/godot_design_delta_v0_8_1.md`
7. `v0_8_1/godot_asset_manifest_v0_8_1.md`
8. `v0_8_1/acceptance_tests_v0_8_1.md`
9. `colors_and_type.css` (root tokens)

If anything in v0.8 source contradicts v0.8.1, **v0.8.1 wins**.

## Do

- Build the Godot 4.6.x C#/.NET project scaffold per `godot_scaffold_start_prompt_v0_8_1.md`, applying the C# language lock wherever that older prompt still says GDScript.
- Create the C# autoloads named in `canonical_locks_v0_8_1.md §13`.
- Create the typed C# Resource backbone in `scripts/resources/`.
- Author the canonical Resource files: 4 patients, 8 ingredients, 6 recipes.
- Author the three Theme resources from root tokens only.
- Wire `design_system/tools/anti_drift.py` and `design_system/tools/check_topology.py` into pre-commit/CI.
- Stand up placeholder UI and scene-domain world scenes per Commits 6 and 7.
- Make the v0.8.1 acceptance suite (the §12 `CANON-*` and §13 `GODOT-*`
  blocks) green before declaring the scaffold done.

## Do not (P0 scaffold scope)

> All "do nots" below are **P0 scaffold scope**. Out of P0 ≠ closed door
> (see `canonical_locks_v0_8_1.md` §17). Combat, RPG progression, loot/
> rarity, professions, antagonists, and quests may be added in post-P0
> packets — **but never as part of this scaffold pass**, and never by
> retrofitting them into P0 systems (`KalevState`, the cedar pouch, the
> Notebook). Post-P0 layers get their own autoloads, surfaces, and
> vocabulary.

- Do not add mechanics not specified in the v0.8.1 locks.
- Do not add combat, weapons, enemies, hit points, or damage **to the P0 scaffold**. (A post-P0 combat packet would scaffold its own surfaces.)
- Do not add XP, levels, skill trees, loot tables, rarity tiers, professions, or quest objectives **to the P0 scaffold**. (Post-P0 RPG/progression packets would scaffold their own surfaces and autoloads.)
- Do not add new ingredients (no Bitterleaf; no Arbor; no Acebark; no
  Phrine; no Cillin; no Zyl; no Myrrh; no Oil; no Furos).
- Do not add new patients.
- Do not rename patients (Nora Finch, not Nora Field; Dr. Amos Bell, not
  Dr. Bell as resource id).
- Do not make Miriam young.
- Do not put Ember in any slot but slot 16.
- Do not put any item but the cedar dog in slot 1.
- Do not implement Wittehaven, Mackinac, Mount Arvon, Paradise, Rafe's
  main scene, Birdie's later disappearance, Iron Ledger trial, or
  multiple endings as playable.
- Do not write to page 77 line 7 in any prototype code path.
- Do not allow Ember to target Eli at any beat.
- Do not add IC XC NIKA, halos, or Paradise narthex assets to P0 atlases.
- Do not introduce non-token Wittehaven colors.
- Do not introduce JetBrains Mono.
- Do not show raw Pressure / Burden / Numbness numbers in player-facing
  UI.
- Do not render any `ProgressBar` for patient state.
- Do not produce music. P0 is diegetic ambience and SFX only.
- Do not create finished art.
- Do not put concept/reference art in runtime folders unless the manifest labels it as a design-only exception.
- Do not begin Commit N+1 before Commit N's acceptance row passes.

## Canonical locks (summary)

```
Slice:       Cabin → Ironwood → Birdie apple refusal → Bethany.
PC:          Kalev Ward.
Patients:    Eli Keene (page 66 line 7), Miriam Toll (elder),
             Nora Finch (recoverable), Dr. Amos Bell (Ember dilemma).
Companion:   Birdie (apple refusal MANDATORY; follows anyway). Lena Hart
             (presence; no Tincture).
Pouch:       slot 1 cedar dog (locked) · slot 16 Ember (locked).
Ember:       cannot target Eli, ever; self-use unlocks after Eli's name is
             written; doses do not replenish.
Notebook:    page 66 line 7 = Eli; page 77 line 7 = RESERVED future arc.
Mono:        IBM Plex Mono.
Viewport:    960×540 logical; 480×270 composition; 32×32 tiles; 2× zoom.
Language:    C#/.NET for Godot engine code.
Topology:    scene folders under scenes/{cabin,ironwood_road,bethany}/; scene-local C# beside .tscn.
Audio:       diegetic ambience + SFX only.
Sacred:      Paradise / IC XC NIKA / halos = P2 reserved.
```

## Commit order

1. v0.8.1 design hardening (this packet).
2. Godot C#/.NET project scaffold.
3. C# resources and autoloads.
4. Theme resources.
5. Anti-drift CI.
6. Placeholder UI scenes.
7. Placeholder world scenes.

Each commit's acceptance row must pass before the next begins. See
`implementation_start_order_v0_8_1.md`.

## When you finish the scaffold

Tag the build `v0.8.1-scaffold`. Do not begin animations, audio, dialogue,
or icon-panel composition until the scaffold is tagged and the
`acceptance_tests_v0_8_1.md` `CANON-*` and `GODOT-*` rows are 100% green.

If a question arises that the locks + errata cannot answer: **stop and
ask**. The contract has been hardened precisely so you do not invent
canon. Inventing canon is the failure mode this packet exists to prevent.
