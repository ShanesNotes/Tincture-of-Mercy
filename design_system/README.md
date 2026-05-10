# Tincture of Mercy — Design System

> *A named person is fading. You have limited time, limited medicine, a shaking hand, and a vial that works. What do you make, what do you spend, what do you write, and what does that make of you?*

This is the brand & design system for **Tincture of Mercy: The Garments of Skin** — a 2D top-down narrative survival-care pilgrimage game built in Godot 4.6.x with C#/.NET as the canonical engine language. The visual target is **Orthodox-apocalyptic Michigan pixel iconography**: a top-down post-Turn pilgrimage rendered as a damaged sacred manuscript, with hand-lettered names, leather notebooks, patterned water, reserved sacred disclosure, and a cold lake-light palette.

This system supports three design surfaces:
1. **In-game UI** — pouch, Tincture Wheel, patient panel, notebook, state overlays.
2. **Marketing & narrative artifacts** — pitch decks, store pages, devlogs, manuscript-styled slides.
3. **Documentation & handoff** — design packets, dev wikis, asset registers.

---

## Canon spine

When conflicts arise, the active direction and accepted ADRs win over older lore packets, generated review pages, and archive material. Read in this order for design-system work:

| Surface | Path / Link | Status |
|---|---|---|
| Project glossary | `../CONTEXT.md` | Active language and resolved ambiguity. |
| Decision records | `../docs/adr/` | Accepted routing/design decisions. |
| v0.9 mercy RPG substrate | `v0_9_mercy_rpg_substrate/INDEX.md` | Active packet hub; read PRD, acceptance, issue slices, and registry from this packet. |
| v0.8.1 packet index | `v0_8_1/INDEX.md` | Provenance and scoped P0 packet; not the active combat-capable slice. |
| Source intake | `../docs/source/` | Raw handoff/source evidence; not active implementation authority. |
| Canonical locks | `v0_8_1/canonical_locks_v0_8_1.md` | Binding only where not superseded by active direction or later ADRs. |
| Errata | `v0_8_1/errata_v0_8_to_v0_8_1.md` | Conflict arbiter from v0.8 to v0.8.1. |
| Implementation order | `v0_8_1/implementation_start_order_v0_8_1.md` | C#/.NET scaffold contract. |
| v0.7 Godot Gameplay + 2D Asset Design Handoff | `../docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md` | Lore/translation source; historical where it conflicts with v0.8.1. |
| v0.6 Unified Prototype Design Packet | `../docs/lore/tincture_of_mercy_packet_v0_6.md` | Lore source and prototype rationale. |
| v0.3 Working Document | `../docs/lore/tincture_of_mercy_v0_3.md` | Deep lore source: cast, symbolic grammar, four-phase pilgrimage. |
| Generated concept packet | `../concept_packet.html` | Generated review surface only; not independent canon. |
| Archive and uploads | `../_archive/superseded/` | Provenance only; not implementation authority. |
| Pageau references | `assets/reference/*.jpg` | Composition/icon-panel reference; not ship assets. |

---

## Project context

**Tincture of Mercy** is a narrative-first apothecary game set in post-Turn Michigan. The player is **Kalev Ward** — a burdened healer-apothecary, 33, formerly a critical-care nurse — who carries a leather notebook of names, a cedar dog his son carved, and a glass vial of **Ember**.

The core loop is **Move → observe → gather → craft → triage → treat → bear consequence → write name/outcome → rest → move north.** The first playable slice is **Cabin / Ironwood Road / Bethany**, ending with the road bending toward Wittehaven.

### Six non-negotiable pillars
1. **Names over metrics.** The notebook records persons; the Iron Ledger records cases.
2. **Medicine works but cannot redeem.** The falsehood is worshipping treatment as salvation.
3. **Ember must be tempting.** If the player does not want to use it, the design has failed.
4. **Wittehaven must first feel like relief.** Critique only works when relief is felt.
5. **The enemy is first not flesh and blood.** v0.8.1 trained discernment before hostile bodies; the active v0.9 direction brings combat into the opening slice while keeping discernment central.
6. **Crafting is care before optimization.** Therapeutic things made for named people under pressure; RPG/progression layers must serve attention, names, and care rather than displacing them.

### Three regimes, one design system
The system is designed to **invert** between three visual regimes the player passes through:

- **Ironwood** — hand-drawn, smudged graphite, vellum, tactile. Default tone.
- **Wittehaven** — clean, blue-white, mono-spaced case IDs, sanctioned readability. *Seductive.*
- **Paradise** — icon-still, candle-white, explicit sacred register. Reserved for P2/future scenes, not P0 UI.

The same crafting wheel, patient panel, and notebook **change typography, color, and rule weights** as the regime changes. The design system carries all three as theme classes (`regime-ironwood`, `regime-wittehaven`, `regime-paradise`).

---

## Index

```
/ (root)
├── README.md                  ← you are here
├── SKILL.md                   ← portable skill manifest for agents
├── v0_9_mercy_rpg_substrate/  ← active packet; INDEX.md then PRD/ISSUE_SLICES
├── v0_8_1/                    ← provenance + scoped P0 packet
├── colors_and_type.css        ← all color & type tokens; regime overrides
├── assets/
│   ├── reference/             ← Pageau iconographic references
│   ├── imagery/               ← (placeholder) brand imagery
│   └── icons/                 ← Lucide CDN substitution; see ICONOGRAPHY
├── fonts/                     ← (using Google Fonts via @import; no local files)
├── preview/                   ← Design System tab cards (registered assets)
└── ui_kits/
    └── game/                  ← in-game UI kit (pouch, wheel, patient, notebook)
```

### Files at root
- **`README.md`** — this file. Brand context, content fundamentals, visual foundations, iconography.
- **`SKILL.md`** — Agent-Skills compatible manifest so this can be downloaded and used in Claude Code.
- **`colors_and_type.css`** — full color palette, font stacks, type scale, semantic tokens, regime overrides, semantic element classes (`.tom-h1`, `.tom-hand`, `.tom-witte`, etc.).

### UI Kits
- **`ui_kits/game/`** — In-game prototype UI: pouch panel, Tincture Wheel, patient panel, notebook, Kalev state overlay. See `ui_kits/game/README.md`.

### Preview cards
The `preview/` folder contains small HTML cards (700×~150px) that populate the Design System tab. Each is registered with a group: **Type**, **Colors**, **Spacing**, **Components**, **Brand**.

---

## Content fundamentals

### Voice
Spare, embodied, theological without lecturing. Practical first; meaning underneath. The text says what is in the room, what is in the hand, what is on the page. It does not tell the reader what to feel.

### Three registers — the polyphonic naming system
The same thing has three names depending on who speaks. **This is the central content tool.**

| Thing | Folk / Kalev | Wittehaven / Sanctioned | Church / Mystical |
|---|---|---|---|
| The plague | The Turn | Respiratory Affective Decline; a Continuance Event | The Withering |
| Ember | Ember | Stabilizer; E-7; sanctioned analgesic | Strange Fire |
| Trauma burden | The Grey Stone | Stress load; impairment score | The Weight; the Passion |
| Death | Loss | Outcome failure | Falling asleep; being received |
| Patient | Soul; name | Case; body; outcome | Person commemorated |
| Pulseleaf | Pulseleaf | LOL | (no church name) |

**Rule:** when copy is in Kalev's voice, use folk register. When copy is on a Wittehaven surface (chart, case ID, dose label), use sanctioned shorthand. The contrast between them is half the storytelling.

### Tone & casing
- **Sentence case for body.** Title case for headers when they belong to the world (Bethany, the Mackinac, the Iron Ledger). Lowercase for ambient ("clean dressing", "salt wash").
- **Wittehaven uses ALL CAPS sparingly** for case codes (`E-7`, `LOL`, `CASE 0044-B`). Outside of charts, avoid caps — they read as institutional aggression.
- **No exclamation points.** Ever. The world is too tired for them.
- **First person is rare and earned.** Kalev's interiority appears in italic interior lines (`*Just to balance the ledger,* he reasoned.`). Player-facing copy is second person ("Sit. Wash. Write his name.") or imperative.
- **No emoji.** Anywhere. P0 runtime iconography is folk or institutional; explicit sacred marks (halos, IC XC, NIKA) are reserved for P2/future or generated-review surfaces.

### Examples — the same beat in three registers

> **Folk (Kalev's notebook):**
> *Page 66, line 7. Eli Keene. The breath left before the name did.*

> **Sanctioned (Wittehaven chart):**
> *CASE 0044-B. Pediatric, M, 11. Outcome: failure. RAD progression terminal. E-7 not administered.*

> **Mystical (Paradise register):**
> *Eli, son of Mara. Received.*

### UI copy
- **Verbs are short and human.** `Observe`, `Sit`, `Wash`, `Warm`, `Write`, `Leave bedside`. Prefer in-world verbs over generic prompts like `[INTERACT]`.
- **Quality words are tactile, not numeric.** `cloudy`, `clean`, `warm`, `too sharp`, `steady`, `bitter but clear`, `rough`, `sound`, `excellent`. Players never see raw numbers.
- **State words are bodily.** Burden: *light · carried · heavy · crushing · breaking*. Pressure: *calm · tight · shaking · impaired · near panic*. Numbness: *fully present · slight distance · efficient, cool · names blur · case-language dominates*.
- **Time is felt, not displayed.** No clocks. "The light is going." "She is fading." "The fire is low."

### Scoped v0.8.1 care-surface copy cautions
The older v0.8.1 P0 care surfaces avoided overt RPG/combat vocabulary such as "heal", "buff", "stat", "XP", "loot", "boss", and "enemy". Treat that as a scoped care-surface rule, not a project-wide ban.

For the active v0.9 mercy RPG substrate direction, combat and RPG surfaces may use sanctioned vocabulary once the PRD defines the terms and presentation. Care, notebook, and bedside surfaces should still prefer tactile/person-specific language over generic reward or power fantasy phrasing.

Avoid generic medical instructions ("apply antibiotic") unless a sanctioned/register-specific surface calls for them. The world uses *folk*, *sanctioned*, or *church* registers rather than neutral modern clinical English by default.

---

## Visual foundations

### The visual thesis
A cold Michigan pilgrimage rendered as a damaged sacred manuscript. **Most surfaces are muted and cold. Gold and red are earned.** P0 interface should look like graphite on damp vellum until an earned ember-red glint or stillness mark appears — and never as decoration. Explicit halos and icon-panel gold remain P2/future or generated-review material.

### Palette
Anchor on the **vellum / ink / lake** triad:

- **Vellum bone** `#e8dfc9` and **Vellum warm** `#efe6d0` — paper, walls, panels.
- **Ink** `#1a1612` and **Ink-soft** `#2b2520` — type, contour, rules.
- **Lake slate** `#5b6770` and **Lake deep** `#2c3540` — water, sky, cold.

Earned accents (small, exact, never decorative):

- **Icon gold** `#c79a3a` — sacred disclosure and reserved future icon-panel marks. Never a P0 page-77 underline.
- **Ember red** `#c63e1f` — the vial. Use as a single mark, never as fill.
- **Dragon red** `#8a2018` — accusation, the Iron Ledger, danger overlays.
- **Pale healing green** `#7a8c5e` — herbs, Lena's accents, Bethany.
- **Cedar brown** `#6b4a2c` — the dog, leather, beams, presence.
- **Verdigris** `#6e8a7c` — aged copper, hospital tint, spiritual unease.

Wittehaven swaps to:
- **Witte white** `#f4f6f7`, **Witte blue** `#d5dee4`, **Witte cool** `#8fa3b0`, **Lake deep** as text.

### Type
- **Display** — `IM Fell English` (manuscript serif). Used for chapter openers, location plates, page titles. **Substitution:** authentic 17th-c. Fell types are inaccessible to the public; IM Fell English on Google Fonts is the freely-licensed reference revival. ✦ *Flagged: if a stronger licensed manuscript revival becomes available, swap.*
- **Body** — `EB Garamond`. Generous leading. Old-style figures.
- **Sacred icon display** — `Cinzel`. For `IC XC`, `NIKA`, Paradise plates. Wide tracking.
- **Hand / notebook** — `Caveat`. For Kalev's notebook entries, marginalia, dialogue thoughts. Used sparingly — graphite, not handwriting font cosplay.
- **Wittehaven mono** — `IBM Plex Mono`. Case IDs, dose labels, sanctioned charts. Uppercase, wide-tracked.

> **Substitution flag:** all five families are Google Fonts. If the user has bespoke fonts in mind (a custom manuscript hand for Paradise, a custom mono for Wittehaven), please share files and we'll swap. The current selections are licensed substitutes chosen for closest fit to the manuscript / icon / chart triad.

### Backgrounds
- **Default** — flat vellum (`--bg`), occasionally with a faint paper-grain noise (1–3% opacity).
- **Hand-drawn ornament** — manuscript marginalia (small thorny vines, faint icon borders) appear at the edges of major panels — not as decorative backgrounds. Treat margins like a Coptic icon: contained.
- **Patterned water** — for thresholds (Bethany arrival → road north, Mackinac), use the patterned-water motif from Pageau: stylized waves drawn in `--lake-deep` on `--lake-slate`. Never photographic water.
- **No gradients except as protection.** A single soft gradient may protect text over a busy panel — `linear-gradient(to top, var(--bg) 0%, transparent 100%)`. Never decorative gradients. Especially never blue→purple SaaS gradients.
- **Full-bleed icon panels** appear at story beats (cabin death, Bethany triage outcome, Mackinac crossing). Not in normal play.

### Animation
- **Slow, like pencil and breath.** Default duration 260ms; "settling" easing (`--ease-quiet`).
- **Wittehaven snaps** — Wittehaven UI uses 160ms / `--ease-witte`. The clinical regime is *more* responsive, deliberately seductive.
- **No bounces. No spring overshoots.** Nothing in this world celebrates motion.
- **Breath loop** — 1800ms, sinusoidal opacity 0.85↔1.0. Used on the dying-boy sprite, candles, the Ember vial idle.
- **Ember flash** — 220ms warm-flash followed by 600ms desaturation/cool-clarity. Only on Ember self-use.
- **Hand tremor** — when Pressure is high, an inner translateX(±0.5px) wobble at 90ms intervals on cursor and craft-wheel pointer.

### Hover & press states
- **Hover** — slight darkening (`filter: brightness(0.96)`) plus a 1px increase in rule weight. **Not** a colour-shift; the world doesn't sparkle.
- **Press** — `filter: brightness(0.92)` plus `transform: translateY(0.5px)` — the press of a thumb on damp paper, not a button bounce.
- **Disabled** — 36% opacity, no pointer change. Disabled buttons in this world are the way the player *cannot* act because they don't have the supplies — surface that, don't hide it.
- **Focus** — 2px solid `var(--icon-gold)` outline at 2px offset. Sacred focus.

### Borders & rules
- **Default rule** — 1px solid `rgba(26,22,18,0.18)`. Never pure black; never lighter than 0.12.
- **Strong rule** — 1px solid `rgba(26,22,18,0.45)` — for panel edges and notebook lines.
- **Icon-panel border** — 2px solid `--ink`, with a 1px inner rule at 8px inset (the manuscript double-frame).
- **Wittehaven** — 1px solid `--witte-cool`. Sharper, cooler.

### Shadows
- **Paper shadow** — soft, low, cold. Never warm yellow shadows. `0 1px 0 rgba(26,22,18,0.08), 0 2px 6px rgba(26,22,18,0.06)`.
- **Card shadow** — `0 2px 0 rgba(26,22,18,0.06), 0 6px 18px rgba(26,22,18,0.10)`.
- **Inset paper** — slight top-light inset for engraved-into-page feel.
- **Halo** — `0 0 36px rgba(199,154,58,0.45)` — Paradise/sacred only.
- **Ember glow** — `0 0 24px rgba(226,106,58,0.35)` plus `0 0 4px rgba(198,62,31,0.55)` — Ember vial only.

### Transparency & blur
- **Transparency** — used for *fading*, not *frosted glass*. Faces of fading patients reduce to 60% opacity. Notebook entries from rough crafts appear at 78%.
- **Blur** — only for **Numbness**. When Kalev's Numbness is high, patient names render at `filter: blur(0.6px)` and case-labels render crisp. Numbness is a perceptual debuff, expressed in CSS.

### Corner radii
- **Default** 4px (`--r-md`). Slightly soft, like a wax-sealed jar.
- **Wittehaven overrides to 0** — clinical rectangles.
- **Paradise** keeps 4px but increases stroke contrast.
- **No pill-shaped buttons.** Pills imply a round-ended app; this is paper.

### Cards
A "card" in this world is a piece of paper.
- **Background** `--bg-elevated` (candle white).
- **Border** `--border-rule` (`rgba(26,22,18,0.45)` 1px).
- **Shadow** `--shadow-card`.
- **Radius** 4px.
- **Inner padding** 24px (`--s-5`).
- **No left-border accent stripes.** Ever.

### Layout rules
- **Margins are wide.** Manuscript proportions; never edge-to-edge text.
- **Two columns max** for body content, with a margin glossary column (the manuscript marginalia).
- **Fixed elements**: the Kalev state overlay sits at top-left at 16px offset, never larger than 280×72px. The pouch sits bottom-left. The notebook button sits bottom-right. Never centered. Never floating.
- **Symmetry is sacred** — when symbolic content appears (patient panel during Sit, Tincture Wheel mid-craft), center symmetrically. Otherwise prefer left-aligned, ragged-right, manuscript-block.

### Imagery vibe
- Cold, damp, late-fall Michigan. Wet wool, iodine, rotting pine. Lake light.
- Imagery is **flat, contoured, symbolic** — not painterly, not photoreal.
- Pageau-style references show: strong contour line, flat fields of color, patterned water, contained marginalia, and reserved disclosure marks. Use them as principle, not P0 runtime assets.
- For placeholders, use the three reference images at 35–55% opacity with a vellum overlay. Never ship them as final assets — they belong to Jonathan Pageau and inform principle, not imitation.

---

## Iconography

### Approach
Tincture of Mercy uses **two parallel icon systems** that mirror its naming polyphony:

1. **Folk icons** — small, hand-drawn, contour-only line marks. Used in Ironwood/folk contexts: pouch, Tincture Wheel, patient panel.
2. **Sanctioned icons** — geometric, monolinear, `--witte-cool`. Used in Wittehaven contexts: charts, case stamps, dose labels.

Sacred typographic marks (`IC XC`, `NIKA`, the cross-as-logo, halos) are **not** icons in the UI sense. In P0 they are excluded from runtime UI and atlases; they may appear only in generated review/marketing or future icon-panel beats. Never in nav bars.

### Current implementation
Until the production pixel-art pass lands, this system uses the **Lucide** open-source icon set as a CDN substitution for both folk and sanctioned UI glyphs:

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
```

Reasoning: Lucide's stroke weight (1.5px) and rounded line caps approximate the contour-only feel we want for folk icons, and at smaller sizes with stripped fills it doubles as a sanctioned chart glyph. **This is a substitution.** When the pixel artist delivers final glyphs (24×24 pixel-art folk; 16×16 monolinear sanctioned), swap.

### Specific glyph assignments (current)

| Use | Lucide glyph | Notes |
|---|---|---|
| Pouch / inventory | `pocket-knife` then `package` | Folk register; 1.5px stroke. |
| Tincture Wheel | `flask-conical` | Stroked, no fill. |
| Patient panel | `heart-pulse` | At 60% opacity for resting state. |
| Notebook | `book-open-text` | Always paired with `--hand-script` typography. |
| Cedar dog | `paw-print` (placeholder) | **FLAGGED** — replace with custom cedar-dog mark. |
| Ember vial | `flame` | Tinted `--ember-red`; never animated outside Ember beats. |
| Burden / Pressure / Numbness | `weight` / `activity` / `cloud-fog` | Sit in margin column, not main HUD bar. |
| Wittehaven case stamp | `square-check` (mono) | Uppercase + `--mono-witte`. |
| Map / road | `route` | Used on rest screen and road-north hook. |
| Sacred / halo (future/review only) | `circle` (gold ring, no glyph) | P2/generated-review only; not P0 runtime UI. |

### Emoji & Unicode
- **No emoji.** Anywhere. The only character substitutions allowed are ✝ (only in church register, only at Paradise scale) and the manuscript em-dash and ornamental § when typesetting calls for them.
- **Unicode `IC XC NIKA`** text (`IC̅ XC̅ NIKA`) is reserved for P2/future or generated-review surfaces, typeset in `--serif-icon` (Cinzel) at wide tracking. Do not place it in P0 runtime UI.

### Logos
- The game does not have a finished logo. The current wordmark is `Tincture of Mercy` set in `IM Fell English` regular, with a small dot (`·`) before "Mercy" at 0.6em — placeholder. **Flagged for replacement.**
- For development & social, a single ember-red glyph (`◆` rotated 45°, in `--ember-red` on `--vellum-warm`) can serve as a temporary mark. **Flagged for replacement.**

### What we never use
- Filled, glossy, gradient, or extruded icons.
- Cartoon mascots.
- Flag/award/trophy/coin icons.
- Skull-and-crossbones for danger (we use `--dragon-red` typographic accents and a red rule).
- Animated icon "pings" (sparkles, hearts).

---

## Subsequent sections to author
- See `ui_kits/game/README.md` for in-game UI components.
- See `preview/` for the Design System tab cards.
- See `SKILL.md` for portable Agent-Skills usage.
