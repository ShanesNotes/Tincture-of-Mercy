# Errata — v0.8 → v0.8.1

This document is the contract-hardening ledger between the v0.8 packet and the v0.8.1
implementation contract. Each entry identifies a drift introduced (or left unresolved)
in v0.8 against earlier locks (v0.7 / v0.6 / v0.3), the corrected v0.8.1 wording or
behavior, and the affected tests.

The rule for this ledger: **every entry resolves to a concrete patch.** No "future
review" placeholders; no soft language. If a true product decision remains, it is
moved to §18 *Human decision list* with a single yes/no question.

---

## 1. Nora — name drift

- **Issue.** v0.7 locks the recoverable Bethany patient as `Nora Finch`. v0.8 uses
  `Nora Field` in the scene composition bible, the asset manifest, and several
  prompt-pack and backlog references.
- **Affected files.**
  - `v0_8/scene_composition_bible_v0_8.md` (sickroom table; per-bed beats)
  - `v0_8/godot_asset_manifest_v0_8.md` (`art/characters/nora.png` row)
  - `v0_8/icon_panel_prompt_pack_v0_8.md` (sprite briefs)
  - `v0_8/backlog_visual_gameplay_v0_8.md` (Bethany task lines)
  - `v0_8/acceptance_tests_v0_8.md` (S-01 cast; SC-tests)
- **Current v0.8 wording.** "Nora Field (older woman)" / `nora.png` / "bitterleaf +
  Pulseleaf craft = recovery."
- **Corrected v0.8.1 wording.** `Nora Finch` everywhere. Canonical resource path:
  `data/patients/nora_finch.tres`. Sprite path: `art/characters/nora_finch.png`.
- **Reason.** v0.7 is the production handoff lock; v0.8 introduced the `Field` form
  by drift, not by approved canon change.
- **Acceptance tests impacted.** `CANON-01`, `S-01`, `SC-06`, `GODOT-03`, `AD-10`.
- **Human decision required.** No.

## 2. Miriam — identity drift

- **Issue.** v0.7 locks Miriam Toll as **elder, unavoidable death; manner of dying
  changes through care.** v0.8's scene composition bible labels Miriam "young
  woman" in the Bethany sickroom table.
- **Affected files.**
  - `v0_8/scene_composition_bible_v0_8.md` §7.2 (sickroom table)
  - `v0_8/icon_panel_prompt_pack_v0_8.md` (Miriam sprite briefs, if present)
  - `v0_8/godot_asset_manifest_v0_8.md` (Miriam sprite row)
- **Current v0.8 wording.** "Miriam Toll (young woman)".
- **Corrected v0.8.1 wording.** "Miriam Toll (elder; unavoidable death; the manner
  of her dying changes with care)."
- **Reason.** Miriam's age is part of the symbolic load — the unavoidable-death
  patient cannot be conflated with the recoverable patient. Making her young
  collapses two distinct beats.
- **Acceptance tests impacted.** `CANON-02`, `S-01`, `SC-08`.
- **Human decision required.** No.

## 3. Cabin Ember rule — contradiction

- **Issue.** Earlier documents establish the Cabin as Ember's **first temptation
  beat**: the player should not be able to use Ember on Eli, but after Eli's name
  is written, Kalev may self-use Ember. v0.8's `SC-01` reads "Ember slot disabled
  throughout Cabin scene," which over-disables it.
- **Affected files.**
  - `v0_8/acceptance_tests_v0_8.md` §6 SC-01, §9 CE-04
  - `v0_8/scene_composition_bible_v0_8.md` §5 (Cabin beats)
  - `v0_8/ui_regime_system_v0_8.md` §3 (pouch states)
  - `v0_8/godot_design_delta_v0_8.md` (Ember signal flow)
- **Current v0.8 wording.** "Ember slot disabled throughout Cabin scene."
- **Corrected v0.8.1 wording.**
  - During Eli's care (Beats 1–3): Ember **cannot target Eli**. The patient-panel
    Ember verb is greyed when Eli is the target.
  - After Eli's name is written (Beat 4): the **self-use** Ember verb becomes
    available. Targeting Eli (now `still`) remains forbidden.
- **Reason.** Pillar 3: Ember must be tempting. Disabling Ember entirely in the
  Cabin removes the first temptation beat. The temptation is *self-use after the
  name is written* — relief offered to the one who watched.
- **Acceptance tests impacted.** `SC-01` (rewritten), `CE-04` (rewritten),
  `CANON-05`, `CANON-06`.
- **Human decision required.** No.

## 4. Bitterleaf — scope creep

- **Issue.** v0.8 introduces a new herb, `Bitterleaf`, in the Cabin verbs and the
  Nora-recovery recipe. The prototype ingredient set was already locked without
  it.
- **Affected files.**
  - `v0_8/scene_composition_bible_v0_8.md` §5 (Cabin verbs), §7 (Nora recipe)
  - `v0_8/godot_asset_manifest_v0_8.md` (any bitterleaf icon row)
  - `v0_8/backlog_visual_gameplay_v0_8.md` (any bitterleaf craft task)
- **Current v0.8 wording.** "Administer… (bitterleaf, water, salt)" / "Bitterleaf
  + Pulseleaf craft = recovery."
- **Corrected v0.8.1 wording.**
  - Cabin verbs: "Administer… (pulseleaf-water, salt-wash, honey-water)."
  - Nora recovery path: **Pulseleaf Draught + Cedar-Wool Compress + warm + sit**.
    She is recoverable through already-locked materials.
- **Reason.** Pillar 6 (crafting is care, not loot optimization): adding a herb to
  solve a patient is loot logic. Solve through attentive sequencing of locked
  craftables.
- **Prototype ingredient set (locked).**
  Pulseleaf · Cotton · Wool · Salt · Clean Water · Cedar · Honey (optional · limited) · Ember.
- **Prototype craftable set (locked).**
  Salt Wash · Clean Dressing · Pulseleaf Draught · Cedar-Wool Compress ·
  Ember Dose / Dilution.
- **Acceptance tests impacted.** `CANON-07`, `AD-12`, `GODOT-03`.
- **Human decision required.** No.

## 5. Mono font — IBM Plex Mono vs JetBrains Mono

- **Issue.** Root design tokens (`colors_and_type.css`) use `IBM Plex Mono` for
  Wittehaven / sanctioned typography. v0.8's `godot_asset_manifest_v0_8.md` lists
  `res://fonts/JetBrainsMono.ttf`.
- **Affected files.** `v0_8/godot_asset_manifest_v0_8.md` (fonts table).
- **Corrected v0.8.1 wording.**
  - `res://fonts/IBMPlexMono.ttf` (Google Fonts; placeholder for `--mono-witte`).
  - All `Theme` resources pin the mono family to `IBM Plex Mono`.
- **Reason.** Mixed mono assumptions silently break the regime contract: the
  Wittehaven seduction depends on a specific weight/letterform. The root tokens
  govern.
- **Acceptance tests impacted.** `CANON-08`, `AD-13` (new — no JetBrains Mono).
- **Human decision required.** No.

## 6. Page 77 — prototype misuse

- **Issue.** Page 77, line 7 is reserved for the final wife-name arc. It must not
  appear as a prototype notebook write, a UI demo line, or a decorative
  underrule label.
- **Affected files.**
  - `v0_8/icon_panel_prompt_pack_v0_8.md` §6.4 (notebook brief)
  - `v0_8/ui_regime_system_v0_8.md` §6 (notebook spine)
  - `v0_8/acceptance_tests_v0_8.md` `N-03` (Page-77 underrule semantics)
- **Current v0.8 wording.** Notebook brief includes the literal header *"PAGE 66 ·
  LINE 7"* — correct — but `N-03` describes a "page-77 underrule on dead patients
  only," which conflates the **wife-name** marker with the dead-patient
  bibliographic style.
- **Corrected v0.8.1 wording.**
  - Allowed prototype notebook anchors: page 66 line 7 (Eli Keene); ordinary later
    pages (Bethany names and outcomes); page 77 line 7 **reserved, never written
    in prototype.**
  - The visual marker for a name written on a still patient is a **graphite
    underrule** — same drawing primitive, different name. Other allowed
    stillness markers: *damp paper pause · unfilled line · margin stone mark*.
  - `N-03` becomes: "Graphite underrule on still patients only."
- **Reason.** The Notebook is the most load-bearing object in the game. Its
  semantics must not depend on a future-arc anchor.
- **Acceptance tests impacted.** `CANON-03`, `N-03` (renamed/clarified),
  `GODOT-08`, `GODOT-09`, `AD-11`.
- **Human decision required.** No.

## 7. Pouch slot mismatch — Ember slot 8 vs slot 16

- **Issue.** `ui_regime_system_v0_8.md` §3.1 says **Slot 1 cedar dog · Slot 16
  Ember**. `micro_symbol_register_v0_8.md` §1.8 says **"Pouch slot 8 (always
  last)"**. The UI kit sample also drifts.
- **Affected files.**
  - `v0_8/micro_symbol_register_v0_8.md` §1.8 (Ember vial)
  - `ui_kits/game/index.html` (pouch sample)
- **Corrected v0.8.1 wording.**
  - Slot 1 = cedar dog (locked).
  - Slot 16 = Ember vial (locked / dangerous; always last).
  - Any reference to "slot 8" as Ember is corrected to slot 16.
- **Reason.** Implementation needs one slot map. Players do too — the pouch reads
  left-to-right; Ember must be unmistakably last.
- **Acceptance tests impacted.** `CANON-09`, `U-03`, `CE-03`, `GODOT-06`.
- **Human decision required.** No.

## 8. IC XC NIKA / Paradise — reserved-asset leak

- **Issue.** Paradise and explicit sacred inscription systems are future / P2.
  v0.8's manifest pulls `IC XC NIKA` into the P0 manuscript-UI tile atlas, and
  the prompt pack assumes IC XC NIKA renders inside the prototype slice.
- **Affected files.**
  - `v0_8/godot_asset_manifest_v0_8.md` (manuscript_ui.png line includes IC XC
    NIKA plate)
  - `v0_8/icon_panel_prompt_pack_v0_8.md` §2.6 (Paradise narthex)
  - `v0_8/art_direction_v0_8.md` §6 references
- **Corrected v0.8.1 wording.**
  - P0 manuscript UI atlas contains: margin tiles, page edge, lined ruling,
    marginalia motifs (thorny vine, cedar twig, small bird, small dog),
    graphite underrule glyph, margin stone mark.
  - Explicit `IC XC NIKA` lettering, halo rings, and Paradise narthex assets
    move to **P2 / reserved** under `art/environment/paradise_reserved/`.
  - `R-03` (Paradise narthex) remains a reservation only; do not wire it into
    Ironwood UI.
- **Reason.** Sacred signage cannot be recruited as decoration. Pillar 9: the
  sacred layer is structural, not decorative.
- **Acceptance tests impacted.** `R-03`, `AD-09`, `GODOT-05` (no IC XC NIKA in
  loaded P0 atlases).
- **Human decision required.** No.

## 9. Birdie — apple beat drift

- **Issue.** v0.8 treats Birdie's icon panel as *conditional* and leaves the
  apple-refusal beat described but not load-bearing. v0.3 / v0.6 lock Birdie's
  defining first gesture as **the apple refusal**.
- **Affected files.**
  - `v0_8/scene_composition_bible_v0_8.md` §6 (Ironwood Road beats)
  - `v0_8/acceptance_tests_v0_8.md` `SC-04` (Birdie present at segment B)
  - `v0_8/micro_symbol_register_v0_8.md` Birdie entries
- **Corrected v0.8.1 wording (mandatory beat).**
  - Beat: **Kalev offers an apple. Birdie refuses it. She follows anyway.**
  - This beat is *required* in the Ironwood Road scene. It cannot be skipped,
    routed around, or made conditional on player choice.
  - Other Birdie offerings may exist *only after* the refusal, and must not
    replace it.
- **Reason.** Birdie's first gesture defines the rest of the relationship. If she
  accepts the apple, she becomes a transactional companion. The refusal is the
  whole character.
- **Acceptance tests impacted.** `CANON-04`, `SC-04` (rewritten), `AD-07`.
- **Human decision required.** No.

## 10. Scene-intercut contradiction — required panels

- **Issue.** v0.8 says manuscript intercuts close each scene, but treats the
  Birdie icon panel as conditional. With #9 making the apple refusal mandatory,
  the prototype slice has three required panels.
- **Corrected v0.8.1 wording.**
  - **Required prototype icon-panel intercuts (3):**
    1. Cabin death / name written.
    2. Birdie apple refusal.
    3. Bethany triage consequence.
  - Each held ≥ 4 s; bed-only audio for ≥ 600 ms inside the panel.
- **Reason.** The intercut grammar is the spine of the scene language. Counts
  matter. Panels are not optional.
- **Acceptance tests impacted.** `SC-09`, `SC-11`, new `CANON-04` (apple panel
  exists).
- **Human decision required.** No.

## 11. Wittehaven — palette drift

- **Issue.** Some v0.8 prompt-pack and asset-manifest language drifts toward
  saturated blue walls / "sci-fi hospital" tones for Wittehaven placeholders.
  Root tokens specify the witte triad: `--witte-white #f4f6f7`, `--witte-blue
  #d5dee4`, `--witte-cool #8fa3b0`, with `--lake-deep` as text.
- **Affected files.**
  - `v0_8/icon_panel_prompt_pack_v0_8.md` §4.5 (Wittehaven placeholder)
  - `v0_8/godot_asset_manifest_v0_8.md` (`wittehaven_placeholder.png`)
- **Corrected v0.8.1 wording.** All Wittehaven placeholder colors come from
  `colors_and_type.css`. No new blue. No saturation > 0.05 for Wittehaven walls.
  Wittehaven feels like clean *relief*, not a sci-fi hospital.
- **Acceptance tests impacted.** `AD-05` (no cartoon-villain Wittehaven),
  `GODOT-05` (Theme uses only token colors).
- **Human decision required.** No.

## 12. Radius / style-token mismatch

- **Issue.** The root design system specifies 4 px default radius (Wittehaven
  overrides to 0). If any v0.8 surface or implementation note lists 6 px or 2 px,
  it is drift.
- **Corrected v0.8.1 wording.** All `StyleBoxFlat` corner radii in the Ironwood
  and Paradise themes resolve to **4 px** (`--r-md`); Wittehaven resolves to
  **0 px**. No exceptions in the prototype.
- **Acceptance tests impacted.** `U-02` (theme coverage parity), `GODOT-05`.
- **Human decision required.** No.

## 13. RegisterTable / tactile architecture → RegisterLexicon / RegisterLookup

- **Issue.** v0.8 §13 of the UI regime system gives two contradictory contracts:
  *"`RegisterTable` holds three Dictionary keys"* and *"`tactile()` is a static
  function on `Patient` and `Player` resources."* These are not the same
  architecture.
- **Corrected v0.8.1 architecture.**
  - **`RegisterLexiconResource` resources** carry the per-regime register dictionaries
    (`folk` / `sanctioned` / `sacred`). One per data domain (patient, item,
    state, action).
  - **`RegisterLookup` autoload** is the only API UI ever calls:
    `RegisterLookup.tactile(field_id, value, regime_id) -> String`.
  - `PatientResource` and `KalevState` expose **state**, not strings. UI never
    reads raw numeric state except where explicitly tagged for debug or
    `@allow_numeric` quantity display.
- **Reason.** A single source of UI strings. No two surfaces should compute their
  own register.
- **Acceptance tests impacted.** `GODOT-04`, `U-05`, `U-07`, `U-09`, `TL-01..06`.
- **Human decision required.** No.

## 14. Dr. Amos Bell — naming

- **Issue.** v0.8 alternates between `Dr. Bell` and `Dr. Amos Bell`. Resource
  paths use `dr_bell.png` / `dr_bell.tres`.
- **Corrected v0.8.1 wording.**
  - Canonical display: **Dr. Amos Bell**.
  - Short display (UI panels with limited width): *Dr. Bell*.
  - Canonical resource: `data/patients/dr_amos_bell.tres`.
  - Sprite: `art/characters/dr_amos_bell.png`.
  - `dr_bell` is **not** a resource ID. It may be an alias only via documented
    `RegisterLookup` short-form rendering backed by register lexicons.
- **Acceptance tests impacted.** `CANON-10`, `GODOT-03`, `S-01`.
- **Human decision required.** No.

## 15. 480×270 vs 960×540 — canvas rule

- **Issue.** v0.8 documents use both 480×270 (composition canvas) and 960×540
  (logical viewport) without explicitly disambiguating. Some panels are
  authored at 480×300.
- **Corrected v0.8.1 wording.**
  - **Logical viewport (Godot project setting):** `960×540`.
  - **Composition reference grid (mockups, scene composition bible):** `480×270`
    (half-scale; ×2 to viewport).
  - **Icon-panel canvas:** `480×300` (16:10) at composition scale; renders ×2
    inside the 960×540 viewport with letterbox bands.
  - Camera zoom target: `2×` for 32×32 art.
- **Acceptance tests impacted.** `GODOT-01` (project boots at 960×540), `S-04`.
- **Human decision required.** No.

## 16. Numeric anti-drift

- **Issue.** v0.8 forbids numeric leak in player-facing UI but does not specify
  the exception annotation. Without one, every `@allow_numeric` exception is a
  silent precedent.
- **Corrected v0.8.1 wording.**
  - Forbidden as raw numbers in player-facing UI: Pressure, Burden, Numbness,
    patient condition, compliance, success, morality, trust, attention.
  - Allowed as numbers (with the annotation `# @allow_numeric` adjacent to the
    binding *and* an entry in `design_system/tools/anti_drift_allowlist.json`):
    - Pouch slot quantity glyphs (e.g. `salt ×2`).
    - Wittehaven sanctioned chart props (case IDs, dose labels).
    - Debug overlay (developer-only, never shipped).
  - The anti-drift CI fails on any digit in a `Label` text or template that is
    not annotated.
- **Acceptance tests impacted.** `AD-02`, `U-09`, `U-10`.
- **Human decision required.** No.

## 17. No-music prototype rule

- **Issue.** v0.8 strengthens prior "sparse music" language to "no music in
  prototype." This is correct, but the contract was not made explicit.
- **Corrected v0.8.1 wording.**
  - **P0 uses diegetic ambience and SFX only. No non-diegetic score.**
  - No `audio/music/` directory. No `Music` autoload. No `AudioStreamPlayer`
    bound to a `music` bus.
  - Sparse music may return as P1/P2 after the slice proves itself.
- **Acceptance tests impacted.** `AD-04`, `A-04`.
- **Human decision required.** No.

---

## 18. Human decision list

This list is the only place where a true product decision still blocks
implementation. It is intentionally minimal.

> *(empty — all v0.8 → v0.8.1 corrections are derivable from prior locks.)*

If a future drift forces a real decision (e.g. swapping the Cabin's Ember
temptation off self-use), it is added here as a single yes/no question, never
as a paragraph.

---

## 19. Summary

| # | Drift | Severity | Status |
|---|---|---|---|
| 1 | Nora Field → Nora Finch | high (canon) | resolved |
| 2 | Miriam young → elder | high (canon) | resolved |
| 3 | Cabin Ember off → Ember off-on-Eli, on-self-after | high (pillar) | resolved |
| 4 | Bitterleaf scope creep | medium (scope) | resolved |
| 5 | JetBrains Mono → IBM Plex Mono | medium (tokens) | resolved |
| 6 | Page-77 prototype misuse | high (canon) | resolved |
| 7 | Ember slot 8 vs slot 16 | medium (impl) | resolved (slot 16) |
| 8 | IC XC NIKA in P0 | medium (sacred) | resolved (P2) |
| 9 | Birdie apple refusal optional | high (canon) | resolved (mandatory) |
| 10 | Required intercut count | medium (scene) | resolved (3 panels) |
| 11 | Wittehaven palette drift | medium (visual) | resolved (token-only) |
| 12 | Radius mismatch | low (token) | resolved (4 px / 0 px) |
| 13 | RegisterTable architecture | high (impl) | resolved (`RegisterLexiconResource` + `RegisterLookup`) |
| 14 | Dr. Bell naming | medium (canon) | resolved (Dr. Amos Bell) |
| 15 | 480×270 vs 960×540 | low (impl) | resolved (clarified) |
| 16 | Numeric anti-drift annotation | medium (impl) | resolved (`@allow_numeric`) |
| 17 | No-music P0 | low (impl) | resolved |

The errata closes. v0.8.1 is the new contract.
