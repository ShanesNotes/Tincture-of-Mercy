# Art Direction — v0.8.1

Production rules. Sprite, tile, icon-panel, UI, and palette laws for **Michigan icon-manuscript pixel art**. Reads after `aesthetic_bible_v0_8_1.md`; expands its laws into briefable specs.

---

## 1. Visual principles extracted from references (principle, not imitation)

The three reference images (cosmic crucifixion, Noah's flood, St. George) inform **principle only**. Do not copy line, palette, or composition directly. Translate into:

| Principle | Source | Translation in *Tincture of Mercy* |
|---|---|---|
| **Strong contour line** | All three | 1px `--ink` outline on every sprite at 1× scale; slight wobble in Ironwood, monolinear in Wittehaven. |
| **Flat symbolic color** | All three | No gradients on sprites; flat fills only. Vellum and noise carry texture, not the figures. |
| **Framed sacred action** | Crucifixion, St. George | Icon-panel beats use the manuscript double-frame (2px ink + 1px inner rule at 8px inset). |
| **Patterned water as chaos / threshold** | Flood image | Stylized waves at the bottom of major panels and at scene thresholds. Never photographic. |
| **Serpents / dragons as symbolic pressure** | St. George | The Iron Ledger card carries a dragon-red contour serpent at margin. **Never as a combat enemy.** |
| **Halos as metaphysical disclosure** | All three | A gold ring (no glyph) added via `.halo-active`. Paradise only; appears once per beat. |
| **Manuscript borders** | All three | Marginalia (thorny vines, faint icon borders) at edges of major panels. Contained, never decorative fill. |
| **Stacked cosmological composition** | Crucifixion | Major beats use vertical layering: sky / world / underworld bands. Bethany triage uses the hierarchy upward (patient bed center, Lena above, Kalev below). |
| **Small human figures under vast invisible order** | All three | Camera framing at icon-panel beats keeps Kalev small relative to room; he is not the focal vertical. |
| **Icon gold used sparingly** | All three | One gold mark per scene maximum in Paradise. Zero in Ironwood except still-patient graphite underrules; page 77 line 7 is reserved outside P0. |
| **Text marks as visual theology** | All three | IC XC NIKA in Cinzel wide-tracked. Reserved for post-P0 Paradise sacred disclosure only. |
| **Beasts and waters at map edges** | Flood image | Patterned water at map perimeter; the unseen at the edges of sight. |

### Forbidden imitations
- Do not copy any artist's specific line style.
- Do not copy compositions one-to-one.
- Do not overuse halos.
- Do not make every screen look like an illustration.
- Do not lose top-down gameplay clarity for the sake of icon resemblance.
- Do not use sacred imagery as decoration.
- Do not turn the game into medieval fantasy.
- Do not turn Michigan into a generic mythic map.

---

## 2. Sprite rules

### 2.1 Canvas sizes (v0.8.1 high-fidelity)
| Subject | Canvas | Notes |
|---|---|---|
| Kalev Ward | 64×96 | Canonical high-fidelity target; carries coat, pouch, notebook, cedar dog, Ember vial, burdened posture. |
| Principal adult (Lena Hart) | 64×96 | Same anatomical scale as Kalev with fewer accessories. |
| Minor adults (Bethany residents) | 48×72 | Production economy tier; must read at 1× and 2×. |
| Child (Birdie / Ruth) | 48×64 | Smaller silhouette; oversized coat and one raised shoulder are identity locks. |
| Patient in bed (Eli, Miriam, Nora, Dr. Amos Bell) | 96×48 (or 128×64) | Bedside focal object; larger canvas allowed because patients do not move. |
| Cedar dog | 14×14 | Pouch icon scale; never enlarges. |
| Generic bedside-care frame | 128×96 | Two characters in bedside frame for Sit/Warm/Administer animations; sized for the new Kalev canvas. |

Sprites are authored at native size with nearest-neighbor presentation. Do not downscale the concept sheet into a runtime sprite — redraw at the target canvas. See `godot_asset_manifest_v0_8_1.md` §3 and §7 for the full scale policy.

### 2.2 Frame counts (restraint is the rule)
| Action | Frames | Duration |
|---|---|---|
| Idle | 2 | 1800ms breath loop |
| Walk (4 directions) | 4 per direction | 240ms per frame |
| Sit | 2 (sit-down, settle) | 320ms total |
| Wash | 4 | 280ms per frame |
| Warm | 3 (reach, hold, withdraw) | 480ms total |
| Administer (folk) | 4 | 320ms per frame |
| Administer (Ember) | 5 (uncork, pour, brace, pour, withdraw) | 400ms per frame |
| Write | 3 (open, scratch loop, close) | 320ms per frame |

**Animation must never exceed 6 frames per action.** If a beat needs more, break it into two beats.

### 2.3 Silhouette laws
Each named character must be identifiable in pure silhouette at 1× scale.

| Character | Silhouette feature |
|---|---|
| Kalev | Pouch on right hip; notebook in left hand on idle |
| Lena | Stitched gloves with fingertip cut; no pouch |
| Birdie | Smaller; coat too large; one shoulder slightly raised |
| Miriam | Bedridden; hair down (others have it tied) |
| Nora | Bedridden; arm out (others have arms in) |
| Dr. Amos Bell | Bedridden; reading glasses; sleeves rolled |
| Bethany resident | Apron and bucket / cradle / cup — varies |
| Eli | Bedridden child silhouette; smaller bed sprite |

### 2.4 Palette per character
Every character receives a **3-color** restricted palette (skin/hair excluded). Add cold accent only if narratively earned.

| Character | Garment | Accent | Notes |
|---|---|---|---|
| Kalev | `--cedar-brown` coat, `--damp-ash` trousers | `--rot-brown` pouch, single `--ember-red` glint on vial when out | He is a brown-on-brown silhouette except for what he carries. |
| Lena | `--pale-heal-deep` shawl, `--vellum-warm` apron | iodine amber on fingers | Healing-green is hers in Ironwood. |
| Birdie | Oversized `--rot-brown` coat, `--vellum-bone` collar | (none) | She is colorless until Paradise. |
| Miriam | `--vellum-warm` linen | `--lake-slate` blanket | Cold blanket reads from across the room. |
| Nora | `--vellum-warm` linen | `--cedar-brown` blanket | Warmer; recoverable. |
| Dr. Amos Bell | `--vellum-warm` linen | `--verdigris` blanket | Spiritual unease tint. |
| Bethany resident (loop) | Three palette variants | (none) | No two on screen wear identical accent. |

### 2.5 What sprites must never do
- No idle bobbing beyond breath loop.
- No sparkles, hit-flashes, or impact frames.
- No Z-jumps. No hops. No anime-style overshoot.
- No portrait avatars in dialogue.
- No exaggerated facial features at native scale (face = 4×4 area; eyes = single pixel each).

---

## 3. Tileset rules

### 3.1 Base tile size
- **32×32 native.**
- Tiles are designed for top-down or slight three-quarter top-down, never side-scroll.
- Foreground occluders (tree canopy, beam) drawn at 32×96 (one tile wide × character height); rendered with 50% opacity overlay when player is behind.

### 3.2 Tile authoring
- Single 1px `--ink` contour at tile edges that meet collision boundaries; soft `--rule-strong` interior dividers.
- **Connect every interior tile to at least one neighbor with shared edge palette.** No checkerboard floor variance.
- **Variance via three "wear" tiles per surface** (clean, scuffed, broken). Use to break repetition without color shift.

### 3.3 Required tilesets (prototype slice)
| Tileset | Primary palette | Tiles required |
|---|---|---|
| **Cabin interior** | `--cedar-brown`, `--damp-ash`, `--vellum-warm` | floor (3 wear), wall (4 + 4 corners), door, window, hearth, bed, table, chair, shelf, occluder beam |
| **Ironwood road** | `--rot-brown`, `--pine-shadow`, `--lake-slate` | road (3 wear), mud, snow patch, pine canopy occluder, cedar trunk, salvage prop tile, Pulseleaf cluster, fence post |
| **Bethany sickroom / clinic** | `--vellum-warm`, `--cedar-brown`, `--pale-heal-deep` | floor (3), wall (4 + 4 corners), door, window, hearth, sickbed (3 variants for three patients), work table, water basin, jar shelf, candle |
| **Shared UI/manuscript** | `--vellum-bone`, `--ink`, `--icon-gold` | manuscript margin tiles, page edge, lined ruling, margin marginalia (5 small motifs) |
| **Wittehaven (placeholder, future)** | `--witte-white`, `--witte-blue`, `--witte-cool` | floor grid (1), wall (2), door, sign post, paint can — placeholder only; do not develop further in P0 |

### 3.4 Custom data needs (Godot `TileMapLayer`)
Each tile carries:
- `walkable: bool`
- `audio_class: enum {wood, stone, soil, snow, vellum, cloth}`
- `regime_lock: enum {none, ironwood, wittehaven, paradise}`
- `wear_index: int`

### 3.5 Animated tiles
Restraint applies. Allowed:
- Hearth fire (4-frame, 480ms loop)
- Candle flicker (3-frame, 600ms loop, breath-synced)
- Pulseleaf shimmer (2-frame, 1800ms breath loop, very subtle)
- Patterned water (4-frame, 720ms cycle)

Forbidden: animated grass, sparkles on props, weather particles other than cold breath.

---

## 4. Icon-panel rules

Icon panels are **still images** at story beats. Not playable.

### 4.1 Triggers (prototype slice)
- **Cabin death** — single panel after Kalev sits with Eli's body.
- **Birdie's apple refusal** — panel on first encounter.
- **Bethany triage outcome** — panel after the third bed resolves.
- (Future) Mackinac crossing.

### 4.2 Composition
- 16:10 frame, 480×300 native.
- Manuscript double-frame: 2px `--ink` outer + 1px `--ink` inner at 8px inset.
- Marginalia in corners (4 motifs, never identical).
- Stacked composition: sky band (top 25%), world band (middle 50%), underworld/water band (bottom 25%) when applicable.
- Small human figures under vast invisible order — Kalev never larger than his runtime canvas (64×96) in panel.
- One earned color mark per panel: a gold halo (Paradise), a single ember-red glint (Cabin death, Bethany Bell), or a dragon-red contour (Bethany Miriam).

### 4.3 What icon panels must never become
- A cutscene with motion.
- A reward unlock.
- A diary entry illustration.
- A loading screen.

---

## 5. UI / manuscript rules

Already specified in `ui_regime_system_v0_8_1.md`. Two rules carry forward to art:

### 5.1 Vellum is texture; not a frame
- All manuscript surfaces carry a 1–3% noise texture (`--vellum-warm` base + sparse `--ink` 1px noise).
- Edges of vellum panels are slightly irregular (4 corner motifs sampled randomly per render).

### 5.2 The notebook is hand-made
- Lined ruling at 20px is `repeating-linear-gradient` in code; in art reference, it is graphite pencil on damp paper.
- Each notebook page receives one micro-detail: a coffee ring, a fingerprint, a pencil-drag smudge. Drawn once per page; reused across saves.

---

## 6. Wittehaven contrast rules (foreshadow only)

In the prototype slice, Wittehaven appears via:
- **One paint-can prop** at the Bethany road exit (white sanctioned cans).
- **One torn ribbon** on the road north (witte-white cloth, partial *Faith over Fear* lettering).
- **One sound beat** when Kalev passes the road exit: a faint fluorescent hum, 1.5s, fades.

Do not build the Wittehaven tileset beyond the placeholder. Do not show the Iron Ledger card. Do not voice Halloway. The contrast is *less* visual material, *more* atmospheric weight.

---

## 7. Paradise future-anchor rules (no implementation)

Reserved. Document this once now; do not develop further until v0.9+:

- Old wood; candle-pure backgrounds; smoke-dark icon panels.
- Single gold mark per panel.
- IC XC NIKA plate is hidden in P0; it appears only in post-P0 Paradise reserved panels.
- The cedar dog gains `.halo-active` only here.
- No sanctioned shorthand. No Wittehaven props. No Iron Ledger.

---

## 8. Palette application table

Every surface category receives a **dominant** color and **earned** accents. Numbers are approximate fill share.

| Surface | Dominant ~70% | Secondary ~20% | Earned ~5% | Forbidden |
|---|---|---|---|---|
| Cabin interior | `--cedar-brown`, `--vellum-warm` | `--damp-ash` | `--ember-red` (vial only), one `--icon-gold` candle highlight | `--witte-*` |
| Ironwood road | `--rot-brown`, `--pine-shadow` | `--damp-ash`, `--lake-slate` | `--pale-heal` (Pulseleaf), `--ember-red` (apple, single pixel) | `--icon-gold`, `--witte-*` |
| Bethany sickroom | `--vellum-warm`, `--cedar-brown` | `--damp-ash`, `--pale-heal-deep` (Lena) | `--ember-red` (vial), `--dragon-red` (Miriam-blanket only at terminal beat) | `--witte-*` (until road exit) |
| Manuscript UI (Ironwood) | `--vellum-bone`, `--ink` | `--damp-ash` | `--icon-gold` (sacred focus only; notebook stillness uses graphite, not page-77 gold) | gradients |
| Patient panel (Ironwood) | `--bg-elevated`, `--ink` | `--rule-strong`, `--ink-soft` | `--ember-red` (Ember verb), `--pale-heal` (Lena-present subtle tint) | `--mono-witte` font (except brief fragments) |
| Wittehaven prop (foreshadow) | `--witte-white` | `--witte-cool` | (none) | `--cedar-*`, `--vellum-warm` |
| Icon panel (Cabin death) | `--vellum-bone` | `--ink`, `--cedar-brown` | one `--ember-red` glint | gradients |
| Icon panel (Bethany triage) | `--vellum-warm` | `--ink`, `--damp-ash` | one earned color per outcome | gradients |

---

## 9. Mood-board search language (style-safe)

Use these phrases when sourcing references. **Avoid** "in the style of [living artist]."

- *Orthodox manuscript illumination, damaged*
- *Folk woodcut religious printmaking, contoured, flat color*
- *Medieval triage iconography*
- *Apocalyptic manuscript marginalia, restrained*
- *Top-down 32-pixel narrative game, manuscript UI, cold palette*
- *Damp post-Turn Michigan, lake-effect, rusted truss, cedar*
- *Iconic composition under fluorescent contrast (Wittehaven only)*
- *Candle-white narthex, smoke-dark icons (Paradise only)*

---

## 10. Asset examples (canonical references for the team)

| Prop / Surface | Canonical reference inside this project |
|---|---|
| Vellum + ink palette | `colors_and_type.css` `:root` block + `preview/colors-vellum.html` |
| Hand-script | `preview/notebook-entry.html` |
| Icon-panel double-frame | `ui_kits/game/index.html` (Paradise IC XC plate) |
| Patterned water | `ui_kits/game/index.html` (`<svg class="water">` block) |
| Patient panel inversion | `ui_kits/game/index.html` (regime tabs) |
| Pouch (cedar leather) | `preview/pouch.html` |
| Tincture Wheel | `preview/tincture-wheel.html` |
| State meters (perceptual) | `preview/state-meters.html` |

When asked *"what does this surface look like?"*, the answer is one of the above. Do not invent new visual language without first showing it can come out of these tokens.

---

## 11. Acceptance gates (art-direction-level)

Before a sprite, tile, or panel ships into the prototype, it must pass:

1. **Silhouette test.** Identifiable at 1× pure black-on-white.
2. **Inversion test.** Same component renders coherent under all three regimes.
3. **No-numbers test.** No quantities visible on the surface (except sanctioned chart props).
4. **Restraint test.** Animation ≤ 6 frames; gold ≤ 1 mark; ember-red ≤ 32px area.
5. **Cold-majority test.** Most pixels in any non-Wittehaven scene are vellum / ink / lake / cedar / ash.
6. **Forbidden-words test.** No UI string contains forbidden vocabulary (see `ui_regime_system_v0_8_1.md` §12).
