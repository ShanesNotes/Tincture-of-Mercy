# UI Regime System — v0.8.1

How a single set of UI components — pouch, Tincture Wheel, patient panel, notebook, Kalev state overlay, dialogue box, consequence summary — re-themes across **Ironwood / Wittehaven / Paradise** by switching one regime class on the root container. The grammar inverts; the geometry holds.

The component spine and tokens are already defined in `colors_and_type.css` and demonstrated in `ui_kits/game/index.html`. This document specifies the **behavior, copy, accessibility, and inversions per surface**.

---

## 1. Switching mechanism

```html
<main class="regime-ironwood">…</main>     <!-- default -->
<main class="regime-wittehaven">…</main>   <!-- sanctioned -->
<main class="regime-paradise">…</main>     <!-- sacred -->
```

Switching the class **must not re-mount components**. Tokens cascade; copy and registers swap through `RegisterLookup.tactile(field_id, value, regime_id)` keyed by the same data fields. In Godot this is a `Theme` swap on the root `CanvasLayer` plus per-regime `RegisterLexiconResource` data.

**Cross-regime contamination is a bug.** Wittehaven's `--mono-witte` font appearing in an Ironwood scene is a defect, not a flourish — except for the sanctioned Kalev-fragment effect (see §4.6).

---

## 2. Common contracts (all surfaces, all regimes)

- **No numbers leak to the player.** All quantitative state passes through `tactile()` mapping → words.
- **Color is never the only cue.** Every signal carries a shape, position, or typographic register.
- **Hit targets ≥ 32px** at native scale; ≥ 44px at 2× scale.
- **Focus outline.** 2px solid `--icon-gold` at 2px offset (Ironwood/Paradise) or `--witte-cool` 1px solid (Wittehaven).
- **Disabled = 36% opacity, no pointer change.** Show *why* not, don't hide.
- **Hover.** `filter: brightness(0.96)` + 1px rule-weight increase. No color shift.
- **Press.** `filter: brightness(0.92)` + `translateY(0.5px)`. No bounce.
- **Motion.** 260ms / `--ease-quiet` (Ironwood), 160ms / `--ease-witte` (Wittehaven), 520ms / `--ease-quiet` (Paradise).

---

## 3. Medicine pouch

### 3.1 Spine (all regimes)
- 8×2 slot grid, fixed bottom-left.
- Slot 1: **Cedar dog (locked)**. Slot 16: **Ember (always last)**. Slots 2–7: ingredients/craftables. Slots 8–15: empty by default.
- Drag-to-Tincture-Wheel; right-click for inspect.
- Slot pixel size: 32×32 base (1× scale).

### 3.2 Ironwood
- Background `--cedar-brown` leather; slot tile `--vellum-warm` with 1px `--ink` rule.
- Slot label: tiny Caveat hand at 11px, sentence case (*"pulseleaf"*, *"salt"*, *"honey"*).
- Quantity: `--mono-witte` 8px bottom-right (the *only* mono in Ironwood — quantities are sanctioned by their nature).
- Ember slot glows on hover with `--shadow-ember`.

### 3.3 Wittehaven
- Background `--lake-deep`; slots `--witte-white`, 0px radius.
- Slot label: `--mono-witte` 9px, ALL CAPS (*"PULSELEAF"*, *"NaCl"*, *"E-7"*).
- Quantity: same mono; now reads as inventory level not weight.
- Ember slot loses glow; reads as drug stock.

### 3.4 Paradise
- Pouch demoted: smaller, 6×1, only items relevant to the moment (*cedar dog, salt, water, pencil, name, Ember*).
- Cedar dog gains `.halo-active`.
- Ember is dimmed by 40%.

---

## 4. Tincture Wheel

The Tincture Wheel is the project's worldview made interactive. It must read three ways: as crafting interface, as attention-vs-control, and as player-state mirror.

### 4.1 Geometry
- Square 200×200 in HUD; 320×320 mid-craft.
- Four axes: **Relief** (top), **Warmth** (left), **Stability** (bottom), **Risk** (right).
- Three concentric guide rings: *rough* (28% radius), *sound* (60%), *excellent* (90%).
- Player-shaped polygon overlays, fill `--pale-heal` 55% / stroke `--pale-heal-deep` 1.4px.

### 4.2 Quality reads (never numbers)
| Internal value | Player read | Visual |
|---|---|---|
| 0–34% | *rough · cloudy* | polygon stays inside *rough* ring; bitter audio undertone |
| 35–69% | *sound · bitter but clear* | polygon at *sound* ring; clean kettle audio |
| 70–100% | *excellent · sound and warm* | polygon touches *excellent* ring; quiet audio, no flourish |

No celebration sound on *excellent*. Quality is its own reward.

### 4.3 Regime by player state

| State combination | Wheel inflection |
|---|---|
| Low Pressure / low Numbness | Wheel hand-drawn, slight warmth at center, accurate. |
| **High Pressure** | Pointer carries `.tremor` (90ms ±0.5px). Wheel itself is steady. Quality threshold lines wobble by ±2% (visual only — gameplay threshold unchanged). |
| **Recent Ember self-use** | Wheel becomes *cleaner* — guide rings sharper, color cooler by ~6% saturation. Numbness is *visible as clarity*. |
| **Patient-focused Ember use** | Brief 220ms warm flash; then returns. Notebook auto-flags pending *Strange Fire?* line. |
| **Lena nearby** | Tremor wobble drops one step. No UI cue; player notices over time. |
| **Birdie nearby** | One hidden ingredient need surfaces as a faint Caveat-hand label on the patient panel ("she likes it bitter") — once. |
| **Wittehaven future regime** | Wheel becomes a chart: same data, sanctioned readout. Optimization affordances appear (*projected outcome confidence: 82%*). Tempting. |

### 4.4 Ironwood wheel
- Hand-drawn rings, 1px contour, slight wobble.
- Axis labels in Cinzel 9px, wide tracking.
- Quality readout in Caveat 22px, sentence case: *"sound — bitter but clear"*.

### 4.5 Wittehaven wheel
- Sharp rings, even-weight monolinear.
- Axis labels in `--mono-witte` 10px.
- Quality readout in mono ALL CAPS: *"BATCH 0044-B · STABILITY 72%"*.
- A "predicted outcome" mini-bar appears (cool `--witte-cool` fill). It is wrong on average, but compelling.

### 4.6 Hospital-language fragment
When Pressure ≥ "shaking" *and* Numbness ≥ "slight distance" in Ironwood, a single quality readout briefly renders in `--mono-witte` for ~1s before reverting to Caveat. Audio dips. No celebration. Implements §1.12 of the symbol register.

---

## 5. Patient panel

### 5.1 Spine
- Centered when active (Sit, Observe, Administer, Write).
- Header: name + place; symptom grid (2×2 minimum); action bar.
- Width 420px (50% of stage).

### 5.2 Ironwood patient panel
- Name in IM Fell English 28px, `--ink`.
- Place in `--mono-witte` 9px, `--fg3` (the only mono — placement is sanctioned).
- Symptoms in EB Garamond italic 14px, tactile words (*thin, cold, quiet, fading*).
- Actions: **Sit · Observe · Warm · Administer… · Ember · Write the name**. Sentence case.
- Verbs are short and human. Never `[INTERACT]`, never `Press E`.

### 5.3 Wittehaven patient panel — same data, sanctioned register
- Name becomes case ID: *"CASE 0044-B"* in `--mono-witte` 14px ALL CAPS.
- Place becomes *"STAGE III · RAD"*.
- Symptoms become readouts: *"RESP. THIN · 6 BPM"*, *"PERIPH. COLD · 32°C"*.
- Actions become: **ADMINISTER E-7 · CHART OBS · WARM PACK · DOSE PROTOCOL · FILE OUTCOME**.
- Radius drops to 0; shadow becomes `--shadow-witte`.
- Numbers are visible *here*. Wittehaven's seduction is the relief of legibility.

### 5.4 Paradise patient panel
- Name becomes: *"Miriam, daughter of Toll"* in IM Fell English 28px.
- Place: *"Bethany · received"*.
- Symptoms in folk register, but tense changes: *"breath quieting · hands warm at last · fear gone · light enough"*.
- Actions reduce to two: **Sit · Write the name**. Ember is no longer offered.
- Panel acquires `.halo-active`.

### 5.5 Numbness blur
When Numbness ≥ "names blur", the patient name renders at `filter: blur(0.6px)` in Ironwood. Case labels (place row) stay crisp. **The Wittehaven panel never blurs** — that's the seduction.

### 5.6 Three-register polyphony at one bedside
When Lena enters during Wittehaven future scenes, her dialogue refers to the patient by **folk name**, even when the panel shows the **case ID**. Players see the contradiction without it being narrated.

---

## 6. Notebook

### 6.1 Spine
- Bottom-right toggle; opens to full panel (480×420px).
- Persistent across regimes — the notebook is Kalev's, not the world's.
- Page-turn 320ms; pencil-stroke 320ms when writing.

### 6.2 Ironwood notebook
- Vellum-bone background with lined `repeating-linear-gradient` at 20px.
- Entries in Caveat 26px (name) + Caveat italic 16px (note).
- Page header in `--serif-icon` 9px wide-tracked: *"PAGE 66 · LINE 7"*.

### 6.3 Wittehaven view of the notebook
- The notebook is **not re-themed**. It remains vellum.
- A new affordance appears in Wittehaven scenes: a *"FILE TO LEDGER"* button beside the notebook, in `--mono-witte`.
- Filing a name to the Iron Ledger writes it in case-form on a separate card; the notebook entry stays. The world records both.

### 6.4 Paradise notebook
- Page edges show faint `--icon-gold` rule.
- Page-77 line gains a single gold underrule.
- Pencil writing is replaced by a one-stroke gold mark — the only gold-as-fill in the whole UI system, and it appears once.

### 6.5 Iron Ledger (Wittehaven future companion)
- Separate panel, **not** the notebook.
- Background `--witte-white`; cards 0px radius; `--mono-witte` throughout.
- Each case card: ID, outcome code, dose label, signature stamp slot.
- The Ledger reads as efficient. That's the point.

---

## 7. Kalev state overlay

### 7.1 Spine
- Top-left, ≤ 280×72px.
- Three rows: **Burden · Pressure · Numbness**. Each: label · meter · state-word.
- States never numeric. State-words from the controlled vocabulary:

| Meter | States (low → high) |
|---|---|
| Burden | *light · carried · heavy · crushing · breaking* |
| Pressure | *calm · tight · shaking · impaired · near panic* |
| Numbness | *fully present · slight distance · efficient, cool · names blur · case-language dominates* |

### 7.2 Ironwood overlay
- Vellum-warm card; `--rule-strong` border.
- Label in Cinzel 9px wide-tracked; state-word in EB Garamond italic 11px.
- Meter is a thin `--vellum-bone` rail with tinted fill (Burden: `--cedar-brown`; Pressure: `--dragon-red`; Numbness: `--lake-slate`).

### 7.3 Wittehaven overlay
- Same geometry; `--mono-witte` font for label and state.
- State-words become sanctioned shorthand: *"PRESS. III · IMPAIRMENT MARKER"*, *"NUMB. STABLE"*. They sound more controllable.
- Radius 0; shadow `--shadow-witte`.

### 7.4 Paradise overlay
- Burden meter persists; Pressure and Numbness fade out.
- Burden state shows `*carried*` regardless of internal value. The state of being carried *is* Paradise's meter.
- `.halo-active` on the card.

### 7.5 Perceptual rules (not health bars)

These three meters are **never** the only signal. Each high state has a perceptual consequence elsewhere:

- **Burden high** → notebook page turns slower; names render slightly heavier weight; deeper sound bed.
- **Pressure high** → cursor tremor; harder to land *sound* quality; dialogue edges (some lines briefly cut off and resume).
- **Numbness high** → cleaner UI but colder; faces less distinct (1px contour fade); names blur; sanctioned shorthand more tempting.

If the meters were removed entirely, the player would still feel state. The overlay is a confirmation, not the experience.

---

## 8. Dialogue box

### 8.1 Spine
- Bottom band, full-width minus pouch and notebook.
- Speaker name in caps-overline (Cinzel) above body.
- Body in EB Garamond 16px Ironwood; `--mono-witte` 12px Wittehaven; EB Garamond 18px Paradise (slightly larger, more breath).

### 8.2 Inflection by regime
- **Ironwood:** ragged-right, manuscript-block, sentence-case.
- **Wittehaven:** justified, ALL CAPS for sanctioned NPCs only. Folk NPCs in Wittehaven retain Ironwood register — the contrast is the message.
- **Paradise:** centered, generous leading (1.72), italic on every other line.

### 8.3 Forbidden
- No portrait avatars; speaker is named in text.
- No `…` cliffhangers.
- No `>>` continue arrows; tap anywhere.
- No "press X to skip" — players can fast-forward but never skip.

---

## 9. Consequence summary

After a triage scene resolves (Bethany scene-end), a brief consequence summary appears.

### 9.1 Ironwood
- Vellum panel; reads as a written reflection.
- Header: *"After Bethany"* in IM Fell English.
- Body: 2–4 lines of folk register noting outcomes by name (*"Miriam Toll. Her hands warmed before they cooled. Her name is on page 67."*).
- One verb available: **Continue**.

### 9.2 Wittehaven future
- Witte-white card; reads as a discharge summary.
- Header: *"CASE SUMMARY · BLOCK 0044"*.
- Body: outcome codes by case ID. Same data; sanctioned register.

### 9.3 Paradise
- Vellum-bone with halo; reads as commemoration.
- Header: *"Those received"*.
- Body: names in Cinzel wide-tracked. No verbs. Tap to leave.

---

## 10. Accessibility minimums

- **Color-independent.** Every state-word renders with its meter shape; every regime distinguishable in monochrome.
- **Type minimum 14px** at native; 11px allowed only for chart labels and quantities, never for body.
- **Caveat hand-script must remain legible.** Use Caveat 16+; pair with EB Garamond text alternative for screen reader announcement.
- **Tremor opt-out.** Player can reduce tremor amplitude to 0 in settings without losing the gameplay signal — pressure is also indicated by audio and by symptom labels reordering.
- **Numbness blur opt-out.** Replaced by 24% opacity fade on patient name. Same gameplay signal.
- **Captions on all diegetic audio.** Foley cues that affect gameplay (kettle whistle, breath change) caption with low-contrast vellum text.
- **Hit targets ≥ 32px** native; ≥ 44px at 2× scale.
- **No flashing > 3Hz.** Ember flash is 220ms, single instance — under threshold.

---

## 11. Copy register lexicons

### 11.1 Pouch
| Slot | Folk | Sanctioned | Sacred |
|---|---|---|---|
| Cedar dog | *cedar dog* | *PERSONAL ITEM* | *the dog he carved* |
| Pulseleaf | *pulseleaf* | *PULSELEAF · ARB* | *the leaf that steadies* |
| Salt | *salt* | *NaCl* | *salt* |
| Ember | *ember* | *E-7 · STABILIZER* | *Strange Fire* (after misuse) |

### 11.2 Tincture Wheel
| Read | Folk | Sanctioned |
|---|---|---|
| 0–34% | *rough · cloudy* | *BATCH SUBSTANDARD* |
| 35–69% | *sound · bitter but clear* | *BATCH NOMINAL* |
| 70–100% | *excellent · sound and warm* | *BATCH OPTIMAL · 92%* |

### 11.3 Patient panel actions
| Folk | Sanctioned | Sacred |
|---|---|---|
| Sit | CHART OBS | Sit |
| Observe | DIAGNOSTIC | (omitted) |
| Warm | WARM PACK | (omitted) |
| Administer… | DOSE PROTOCOL | (omitted) |
| Ember | ADMINISTER E-7 | (omitted) |
| Write the name | FILE OUTCOME | Write the name |

### 11.4 Notebook header
| Folk | Sanctioned | Sacred |
|---|---|---|
| Page 66 · Line 7 | CASE 0044-B · LINE 07 | Page 66 · Line 7 |
| Eli Keene | TOLL, M. | Miriam, daughter of Toll |
| *The breath left before the name did.* | *OUTCOME: PENDING. E-7 NOT ADMINISTERED.* | *Received.* |

---

## 12. Forbidden UI words (all regimes)

`heal`, `buff`, `debuff`, `stat`, `level up`, `XP`, `unlock`, `achievement`, `loot`, `skill tree`, `boss`, `enemy`, `quest`, `objective`, `morality`, `score`, `success`, `fail` (as ledger), `respawn`, `inventory`, `equip`, `craft success`, `crit`, `tier`, `legendary`, `epic`, `rare`.

If a developer's instinct reaches for one of these, the design has not yet metabolized the brief.

---

## 13. Implementation note (Godot 4.6)

- Each surface is a `Control` scene plus per-regime `RegisterLexiconResource` data consumed by the `RegisterLookup` autoload.
- `RegisterLexiconResource` instances live under `res://data/register_lexicons/` (`folk.tres`, `sanctioned.tres`, `sacred.tres`). Each maps a data field → string template.
- **The only API UI ever calls is `RegisterLookup.tactile(field_id, value, regime_id) -> String`** — an autoload that resolves through the active `RegisterLexiconResource` for the current regime. *(v0.8.1: clarified for C#/.NET. UI never reads raw numeric state. `PatientResource` and `KalevState` expose state, not strings.)*
- `Theme` resources per regime (`theme_ironwood.tres`, `theme_wittehaven.tres`, `theme_paradise.tres`) carry colors, fonts, and stylebox overrides. Switching regime is a single `theme = preload(…)` swap on the root `CanvasLayer` and **must not re-mount UI scenes**.
- The `tremor` and `numb_blur` effects ride on the `Theme` as `Shader` overrides toggled by `KalevState` signals on the root.
- `tactile(field_id, value, regime_id)` lives only on the `RegisterLookup` autoload — never as a static function on patient/player resources, and never expose floats to UI.
