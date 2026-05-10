---
name: tincture-of-mercy-design-system
description: Brand and design system for Tincture of Mercy — a 2D top-down mercy RPG built in Godot 4.6. Use whenever you are designing in-game UI, marketing artifacts, or documentation for this project. The system carries three theme regimes (Ironwood / Wittehaven / Paradise) that re-theme the same components.
---

# Tincture of Mercy — Design System

A damaged sacred manuscript rendered in cold Michigan light. Most surfaces are muted; **gold and red are earned**.

## When to use this

- Mocking any in-game surface (pouch, Tincture Wheel, patient panel, notebook, Kalev state overlay, combat/debug overlays when scoped).
- Building marketing or pitch material for *Tincture of Mercy*.
- Authoring devlogs, design packets, store-page copy.
- Making documentation that should match the game's voice.

If you are designing for a different project, do not use this system — its voice and palette are specific to this game.

## Read these first

- `../CONTEXT.md` — active glossary and resolved language conflicts.
- `../docs/adr/` — accepted routing and design decisions.
- `v0_9_mercy_rpg_substrate/INDEX.md` — active packet hub.
- `v0_9_mercy_rpg_substrate/PRD.md` — active product/engineering requirements.
- `v0_9_mercy_rpg_substrate/ISSUE_SLICES.md` — active issue dependencies and substrate-before-opening gate.
- `v0_9_mercy_rpg_substrate/06-canon-surface-registry.md` — authority labels for active/support/provenance/source surfaces.
- `README.md` — full brand context, content rules, visual foundations, iconography.
- `colors_and_type.css` — every color, type, spacing, shadow, and animation token. Import it; do not reinvent values.
- `ui_kits/game/README.md` and `ui_kits/game/index.html` — the in-game UI kit, demonstrating all three regimes on the same DOM.
- `v0_8_1/INDEX.md` — provenance and scoped P0 packet; use for tone, names, visual language, and Godot/C# scaffold constraints where not contradicted by v0.9.
- `../docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md` — historical lore/translation source; active packet and ADRs win on conflicts.

## How to apply

1. **Import the tokens.** Every HTML artifact starts with `<link rel="stylesheet" href="colors_and_type.css">`.
2. **Pick a regime.** Add `class="regime-ironwood"` (default), `regime-wittehaven`, or `regime-paradise` to the root container. Tokens cascade automatically.
3. **Use semantic classes.** `.tom-display`, `.tom-h1`, `.tom-body`, `.tom-hand`, `.tom-witte`, `.tom-quote`, `.tom-dropcap`. Do not hand-style type.
4. **Reach for the UI kit.** Lift component patterns from `ui_kits/game/index.html` rather than building from scratch.
5. **Honor the polyphonic naming.** Folk / Sanctioned / Mystical registers for the same thing. Pick the register that matches the surface; avoid blending registers within one panel.

## Project-wide presentation invariants

- **No emoji.** Anywhere.
- **No exclamation points.** The world is too tired for them.
- **No SaaS gradients.** A single soft text-protection gradient is the only allowed gradient.
- **Gold and ember-red are sacred.** Use them as earned marks, not decorative fills.
- **Avoid pills, glossy buttons, cartoon icons, drop-shadow extrusion, and animated icon pings.** They break the manuscript/pilgrimage surface.

## Scoped care-surface copy cautions

The v0.8.1 P0 care and notebook surfaces avoided overt RPG/combat vocabulary such as heal, buff, stat, XP, loot, boss, and enemy. Treat that as a scoped care-surface rule, not a project-wide rule.

For active v0.9 combat, economy, progression, and debug surfaces, use the vocabulary sanctioned in `v0_9_mercy_rpg_substrate/07-anti-drift-vocabulary.md`. Combat is first-class; normal RPG risk/reward can be presented clearly where the surface calls for it. Bedside, notebook, and contemplative care surfaces should still prefer tactile/person-specific language over generic reward or power-fantasy phrasing.

## Substitutions to flag for replacement

- Type families are licensed Google Fonts (IM Fell English, EB Garamond, Cinzel, Caveat, IBM Plex Mono). Swap for bespoke if/when commissioned.
- Icon set is Lucide via CDN. Swap for the production pixel-art folk + sanctioned glyph sheets when delivered.
- Wordmark is a placeholder set in IM Fell English with an ember-red diamond. Replace when a finished mark exists.
- Pageau reference images (`assets/reference/`) inform principle — they are not ship assets.
- `../concept_packet.html` is generated review, not canon. `_archive/**` is provenance only.

## Quick links

- Colors: see `:root` in `colors_and_type.css`. Anchor on vellum / ink / lake; earned accents are `--icon-gold`, `--ember-red`, `--dragon-red`.
- Type scale: `--t-display` → `--t-overline`. Manuscript proportions, generous leading.
- Spacing: `--s-1` (4px) → `--s-9` (96px). 8-pt rhythm.
- Radii: 4px default; 0px under Wittehaven; avoid pills.
- Shadows: `--shadow-paper`, `--shadow-card`, `--shadow-witte`, `--shadow-ember`, `--shadow-halo`.
- Animation: 260ms / `--ease-quiet` default; 160ms / `--ease-witte` under Wittehaven; 1800ms breath loop for candles and idle Ember.
