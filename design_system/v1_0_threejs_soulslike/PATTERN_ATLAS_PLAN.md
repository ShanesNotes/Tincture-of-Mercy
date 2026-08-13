# v1.0 Pattern Atlas Plan — one atlas per biome, Ironwood first

Status: binding production plan for the pattern-atlas system. Authority: L6 (pattern over texture; one pattern atlas per biome), L2 (palette covenant), L3 (stepped ramps), L5 (quantized depth bands). Companion: `ART_BIBLE.md` (rule IDs cited below). Governs TSL materials in `game/`; WebGPU primary, WebGL2 fallback reads the same atlas (D1).

The plan in one line: **the atlas stores pattern; the palette stores color; the material binds the two.** Pattern cells are authored grayscale line/density work; palette tokens and declared value ramps are applied in TSL at material bind time. No pattern ships pre-colored.

## 1. Atlas law

PA1. One atlas per biome (L6). Ironwood ships exactly one: `atlas_ironwood`. A second pattern set for the same biome requires an ADR.
PA2. `atlas_ironwood` is 4096×4096, a 4×4 grid of 1024² cells, each cell power-of-two sub-tileable. Cells are enumerated in §2 and addressed by index; empty cells are reserved, never repurposed silently.
PA3. Cells are authored grayscale, value-first: line-work and density only, readable in pure value before any token is bound (gate A4 grayscale survival starts inside the atlas).
PA4. Channel packing per cell: R = line-work density, G = stipple/secondary grain, B = region mask where a cell carries two interleaved patterns. Single-pattern cells use R only; G and B stay zero (auditable).
PA5. No bitmap normal maps, no photoreal sources, no scanned texture (L6; AD8, AD13). Relief is read from hatch direction and stepped value, never from a normal channel.
PA6. Every pattern derives from the four licensed families — hatch, scroll-filigree, mosaic band, stipple-grain (plate pattern law; ART_BIBLE AD13). A proposed cell outside the four families is rejected at PR.
PA7. Texel density is locked per cell (§3) so pattern scale is a biome constant; artists never re-scale pattern UVs per-asset to taste.
PA8. Adding or changing a cell is a PR against this file with judging-plate evidence (rapunzel-019, rapunzel-023, snow-white-014, snow-white-030) showing the family precedent. The CI material audit (PA15) enforces the enumeration.

## 2. Cell enumeration — `atlas_ironwood`

| Idx | Cell | Family | Used by |
|---|---|---|---|
| 0 | pine bark — vertical hatch + spiral grain knots | hatch | trunk colonnade, logs (EN1, EN2) |
| 1 | pine canopy — repeating needle-scale fill | stipple-grain | canopy masses, far tree walls (EN2) |
| 2 | needle floor — directional hatch bands | hatch | forest ground planes (EN3) |
| 3 | damp stipple + snow-that-does-not-stay patches | stipple-grain | north faces, branch tops, damp stone (EN4) |
| 4 | granite — engraved grain + stone stipple | stipple-grain | rock, hearth stone ring, road stone (EN13) |
| 5 | woodgrain plank — long grain + log-end spiral rings | hatch | cabin walls, gable, furniture (EN5, EN6) |
| 6 | wool weave | hatch | garments, Anna's blanket, Iiro's coat (AN2, II2) |
| 7 | linen weave | hatch | nightgown, bandage, page edges (AN2) |
| 8 | fern / undergrowth cutout cluster | stipple-grain | ground cover cards (EN3) |
| 9 | thistle / berry sprig — red-carrier stamp | scroll-filigree | the one licensed scene red accent (EN3, L8) |
| 10 | water — woodcut wave curls + ink crest strip | scroll-filigree | Gerstner surface styling (EN12, R9) |
| 11 | scroll / vine filigree | scroll-filigree | HUD border ornament, carved lintel (HB2, HB11) |
| 12 | mosaic bands — zigzag / chevron / brick | mosaic band | carved threshold trim, hearth arch (EN5, HB2) |
| 13 | damask swirl — far-field fill | scroll-filigree | depth bands 2–3 ground/canopy fill (EN10) |
| 14 | scallop-scale hill — backdrop far plane | mosaic band | painted backdrop band 4 (EN11) |
| 15 | Wither mote speckle — sparse ink motes | stipple-grain | off-path Wither band, Turn states (EN14) |

## 3. Palette-token bindings

Each cell declares which of the 7 tokens (`#f8f1e5` parchment, `#211b17` ink, `#7e2531` oxblood, `#a87a2e` gold, `#365a49` green, `#263d5e` blue, `#b07a83` rose) and which ramp steps it may resolve to. Bindings are declared in the material, not painted in the cell.

| Idx | Line token (R) | Field ramp | Notes |
|---|---|---|---|
| 0 | ink | green ramp, 2 stops | trunks darken toward ink at depth bands |
| 1 | ink | green ramp, 2 stops | canopy silhouette fill |
| 2 | ink | muted `#6b6156` ramp, 2 stops | needle floor over damp earth |
| 3 | parchment | none (sparse overlay) | snow stipple ≤ patch coverage, melting edges (EN4) |
| 4 | ink | blue `#263d5e` ramp, 2 stops | cold stone |
| 5 | ink | cedar-family muted ramp, 2 stops | damp cedar, never warm orange |
| 6 | ink-soft (ink 60%) | garment token per character sheet | wool reads at arm's length, not close-up noise |
| 7 | ink-soft | parchment ramp | linen stays in the mercy field |
| 8 | ink | green ramp, 1 stop | flat cutout clusters |
| 9 | oxblood `#7e2531` | none — flat carrier | ≤ the scene's named-carrier red budget (L8, EN3) |
| 10 | ink crests | blue ramp + declared jewel override | Gerstner curl styling; no foam spray (EN12) |
| 11 | ink / gold per verdict state | parchment field | gold only on licensed border states (HB9) |
| 12 | ink | parchment or muted ramp | threshold trim |
| 13 | ink | blue-desaturated ramp, 1 stop | flatter + more patterned with distance (L5) |
| 14 | ink | parchment/teal temperature zone | painted backdrop, no physical sky (EN11) |
| 15 | ink | none — sparse overlay | motes only; never fog (EN14) |

PA9. Gold `#a87a2e` appears in this atlas only as a runtime-bound token on named carriers (lantern metal, hearth ray-fan, licensed border states); no cell ships gold pixels baked in (L9; ART_BIBLE KA4).
PA10. Oxblood `#7e2531` appears only in cell 9 and the vial's glass material; both are named carriers with coverage budgets (L8; ART_BIBLE PR6).
PA11. Depth-band desaturation is a material-level ramp shift toward blue `#263d5e`, applied per band, quantized — never a continuous haze pass (L5; EN10).

## 4. TSL material reference

PA12. Materials reference cells by index constant (e.g. `ATLAS.PINE_BARK = 0`), never by hardcoded UV rect; the constants table is generated from §2 so this file and the code cannot drift.
PA13. Trunks and terrain sample triplanar; props and garments use authored mesh UVs with the cell as tile unit. Pattern scale follows the texel-density lock (PA7): trunks 1 tile / 2m, ground 1 tile / 1m, garments 1 tile / 0.5m.
PA14. The stepped ramp (2–3 stops, L3) is quantized in the shader; the pattern channel selects which stop applies — pattern modulates value steps, never a continuous blend.
PA15. The build-time material audit (D4) is extended: every material in `game/` must resolve to an atlas cell + declared ramp binding; an unbound or out-of-atlas material fails CI.
PA16. The HUD border renders from cells 11–12 with the same tokens as the world (HB11) — one workshop, world and apparatus.
PA17. WebGL2 fallback samples the same atlas with identical bindings; no WebGPU-only sampling features in pattern reads (D1).
PA18. The atlas is loaded once per biome and disposed deterministically on zone unload (R9 disposal); streaming never swaps individual cells at runtime.
