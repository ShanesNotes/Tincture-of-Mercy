# Archive Recovery Report — `_archive/superseded/`

Status: Phase 5 complete (local recovery)  
Created: 2026-06-11  
Companion: [`CONSOLIDATED_LORE_SURFACE.md`](CONSOLIDATED_LORE_SURFACE.md) § Complete source index

## Summary

`_archive/` is **present and readable on disk** but **gitignored** — not in version control. Phase 5 recovered narrative-relevant deltas from superseded material without treating archive as active canon.

## Top-level inventory

| Path | Contents |
|---|---|
| `_archive/README.md` | Quarantine policy — provenance only |
| `_archive/Tincture of Mercy Design System.zip` | ~14 MB bundled design system snapshot |
| `_archive/superseded/v0_8/` | Full v0.8 design packet (10 docs) — predates v0.8.1 errata |
| `_archive/superseded/kalev_concept_iterations/` | v0.2/v0.3 Kalev concept PNGs |
| `_archive/superseded/kalev_v2_high_res_chroma_source/` | High-res locomotion source (pre-64×96) |
| `_archive/superseded/uploads/` | Intake bundles: v0.6 packet copy, Kalev v0.2 intake, asset manifest upgrades, reference images |

## Narrative-relevant archive deltas

### v0.8 → v0.8.1 (superseded packet vs live)

The live packet is `design_system/v0_8_1/` with `errata_v0_8_to_v0_8_1.md`. Archived `v0_8/` is the **pre-errata** contract:

| Topic | v0.8 (archive) | v0.8.1 (live) |
|---|---|---|
| Nora | Nora Field drift possible | **Nora Finch** locked |
| Miriam | Young drift possible | **Miriam elder** locked |
| Ember on Eli | Less explicit | Off-on-Eli; self-after-name |
| Page 77 | Less explicit reservation | **Reserved**; stillness ≠ page 77 |
| Birdie apple | Implied | **Mandatory** refusal |
| Combat | Post-P0 clause in later docs | Out of P0 scope (historical) |

**Narrative impact:** v0.8 archive explains *why* errata exists; do not quote v0.8 cast locks over v0.8.1.

### Kalev concept iterations (archive art)

| Asset | Era | Narrative note |
|---|---|---|
| `kalev_concept_foundation_v0_2.md` | v0.2 intake | Burdened healer silhouette law — still matches live concept |
| `kalev_concept_foundation_v0_3.png` | v0.3 | Superseded by `art/characters/kalev/kalev_design_asset.png` |
| 32×48 placeholders | v0.2 Godot scaffold | **Deprecated** — 64×96 native required |

**Narrative impact:** Visual identity stable; scale decision is production not story.

### Uploaded v0.6 packet copy (`uploads/tincture_of_mercy_packet_v0_6.md`)

Duplicate of `docs/lore/tincture_of_mercy_packet_v0_6.md` — no unique narrative content detected in spot check. Use `docs/lore/` copy as indexed surface.

### Reference uploads (Pageau-era art)

- `st-george-killing-the-dragon-jonathan-pageau.jpg`
- `noah-and-the-cosmic-flood-in-color-jonathan-pageau.jpg`

**Narrative impact:** Icon-panel reference ore only; Rafe Carver replaced Pageau easter egg in v0.3.

## What archive does NOT contain (referenced but missing locally)

| Referenced path | Status |
|---|---|
| User scratchpad `tincture-of-mercy-v0.7` downloads | Not found — repo has `docs/lore/tincture_of_mercy_godot_design_handoff_v0_7.md` |
| Full v0.8 playable build | Design packet only |

## Iteration ledger additions from archive

| Date/era | Finding | Action taken |
|---|---|---|
| v0.8 packet | Pre-errata prototype bible archived | Cross-linked in `CONSOLIDATED_LORE_SURFACE.md` iteration ledger |
| Kalev v0.2→v0.3 | Concept scale 32×48 → 64×96 | Documented in asset boundary; not lore change |
| Pageau → Rafe | Easter egg retired | In cast bible and v0.3 §VI |

## Recommendations

1. **Do not git-track** `_archive/` — keep gitignored; this report is the index.
2. If remounting archive on another machine, re-run: `find _archive -name '*.md' | sort`
3. Before quoting archived v0.8 prose, diff against live `v0_8_1/` + errata.
4. Optional: extract `Tincture of Mercy Design System.zip` only if zip differs from live `design_system/` (not done in this pass — large binary).

## Files read in Phase 5

- `_archive/README.md`
- `_archive/superseded/v0_8/INDEX.md`
- `_archive/superseded/uploads/kalev_design_asset_intake_v0_2/design_assets/characters/kalev/kalev_concept_foundation_v0_2.md`
- Directory listings: `v0_8/`, `kalev_concept_iterations/`, `uploads/`