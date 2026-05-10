# In-game UI Kit

A working reference for the prototype's in-game surfaces — pouch, Tincture Wheel, patient panel, notebook, and Kalev's state overlay — rendered in all three regimes (Ironwood / Wittehaven / Paradise) so you can see how the same components invert as the player moves through the world.

Open `index.html` to view the kit. All styles draw from `../../colors_and_type.css`; nothing is hard-coded.

## What's in here

| Surface | Where | Notes |
|---|---|---|
| **Kalev state overlay** | top-left, max 280×72 | Burden / Pressure / Numbness as named states, never as numbers. |
| **Pouch** | bottom-left | Cedar-leather grid. Cedar dog is locked (always carried). slot 16 holds the Ember vial and glows only as the last slot. |
| **Tincture Wheel** | center on craft | Four axes — Relief · Warmth · Stability · Risk. Player shapes a polygon; quality words read out tactile, not numeric. |
| **Patient panel** | center on Sit | Symptoms in folk register. Actions are short verbs: Sit, Observe, Warm, Administer, Write. |
| **Notebook** | bottom-right toggle | Page · Line · Name · note. Always Caveat hand on lined vellum. |
| **Iron Ledger (Wittehaven)** | replaces patient panel under Wittehaven theme | Same data, sanctioned register: case ID, outcome code, dose label. |

## Component contracts

- Components read from CSS custom properties only. To switch regime, set `class="regime-ironwood"` (or `regime-wittehaven` / `regime-paradise`) on the root container — the same DOM re-themes itself.
- **No numbers leak to the player.** All quantitative state is rendered through `RegisterLookup.tactile(field_id, value, regime_id)` returning words. The design-review demo may hold sample numbers in JS; the production UI never exposes raw floats.
- **Halos are a class, not a sprite.** `.halo-active` adds `box-shadow: var(--shadow-halo)`; only Paradise beats activate it. Folk never has a halo.
- **Ember is a single intense glyph.** Never a fill. The pouch slot-16 mark may use the Ember token, but Ember remains a small glyph plus `var(--shadow-ember)`, never a broad fill.
- **Hand-tremor** when Pressure is high: add `.tremor` to the cursor-tracking element. Defined as a 90ms ±0.5px translateX keyframe in `index.html`.
- **Numbness blur**: add `.numb-blur` to patient names; case labels stay crisp. The player's perceptual debuff is expressed in CSS, not in copy.

## Regime switching

The kit demonstrates the three regimes side-by-side in one page so the inversion is legible. In production, switch the `regime-*` class on a high-level container at scene transitions and let CSS variables cascade.

```html
<main class="regime-ironwood">…</main>      <!-- default, hand, vellum -->
<main class="regime-wittehaven">…</main>    <!-- clinical, blue-white, mono -->
<main class="regime-paradise">…</main>      <!-- candle-white, gold halos -->
```

## Lucide as substitution

Icons in this kit use Lucide via CDN (`https://unpkg.com/lucide@latest/dist/umd/lucide.js`) at 1.5px stroke. **This is a substitution.** When the pixel artist ships final folk glyphs (24×24 hand-drawn) and sanctioned glyphs (16×16 monolinear), swap by replacing `<i data-lucide="…">` with `<img class="folk-glyph" src="…">` or an SVG sprite — the surrounding layout doesn't change.

## Production translation (Godot 4.6)

This kit is HTML for design review, not a runtime. When porting to Godot:

- Each surface becomes a `Control` scene with a corresponding `ThemeOverride` per regime.
- Color tokens map 1:1 to a `Theme` resource (`ink`, `vellum-warm`, `lake-deep`, `icon-gold`, `ember-red`).
- Type tokens map to `FontVariation` resources (display = IM Fell English, body = EB Garamond, hand = Caveat, mono = IBM Plex Mono, sacred = Cinzel).
- `RegisterLookup.tactile(field_id, value, regime_id)` becomes the C#/.NET autoload API for UI strings — never expose raw floats to the UI layer.
- `regime-*` classes correspond to Godot `Theme` swaps on the root `CanvasLayer`.
