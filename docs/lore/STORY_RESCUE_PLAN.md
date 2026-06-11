# Story rescue plan

Status: accepted direction, awaiting execution
Date: 2026-06-11
Method: five parallel review passes (narrative surfaces, design-system ore, governance/ADRs, code+data, bloat/archive), synthesized by the architect session
Owner lane: narrative rescue — extraction of the pure story/lore/worldbuilding from the game-development attempt

## Verdict

The narrative survived the project. Of ~452MB of repository, the story corpus is
roughly 5MB, and its best material is fully realized: the cabin opening prose and
the Paradise finale in `tincture_of_mercy_v0_3.md`, the symbolic architecture
(Caleb/Cain, Tobit frame, Strange Fire, Burden/Pressure/Numbness), and the
register system. The lore consolidation (phases 1–9, complete 2026-06-11) already
mapped the corpus; this plan is about extraction and continuation.

The bloat diagnosis: the nine story ADRs were decided in a single ~32-minute
session; the months that followed produced substrate engineering, sprite
pipelines, and governance machinery for a game with no playable encounter,
dialogue, or Bethany scene. The engineering was competent — and two of its
outputs are narrative ore in their own right (see Tier 1) — but the gap in the
story is authorial, not organizational: Phases II–IV have scene cards and no
prose.

## Direction (recommended and accepted for follow-up)

**Freeze the game build. Finish the story as prose. Treat any future game as an
adaptation of a finished work.** The story's strengths — interior voice,
theological density, held ambiguity, the slow capture by case language — are
prose strengths, and the v0.3 chapter draft proves the quality bar is reachable.

## Tier 1 — irreplaceable files (carry verbatim into any extraction)

| File | Why |
|---|---|
| `docs/lore/tincture_of_mercy_v0_3.md` | Drafted prose (§VII cabin, §IX Paradise), Caleb/Cain spine, Tobit frame, Ember theology |
| `docs/lore/CONSOLIDATED_LORE_SURFACE.md` | Navigational hub: arc, themes, iteration ledger, open questions |
| `docs/lore/CAST_BIBLE.md` | Name locks (Birdie=Ruth, page 66/77, Anna, Iiro) |
| `docs/story/STORYBOARD_BIBLE.md` | Authorial intent, voice-over register, transmutation table |
| `docs/story/NARRATIVE_STORYBOARD_DECK_V0_2_LONG_ARC.md` | Only scene-by-scene outline of the full pilgrimage (cards 11–22) |
| `design_system/v0_8_1/aesthetic_bible_v0_8_1.md` | "Orthodox service book dropped in a Michigan ditch"; moral geography; color law |
| `design_system/v0_8_1/micro_symbol_register_v0_8_1.md` | Symbolic codex: page 66 line 7, cedar dog's uneven ear, Strange Fire |
| `design_system/v0_8_1/scene_composition_bible_v0_8_1.md` | Beat-level scene theology; apple/bread line; Bethany patients in folk register |
| `Tincture.AiMock/Characters/FatherIlarion/` + `Tincture.AiMock/WorldRules.md` | Finished character bible entry; six lines of dense world law |
| `data/opening/opening_act_cabin_prologue_events.json` | Complete opening act as authored event timeline with inline copy text |

Also preserve: the 13 commissioned music tracks in `audio/music/runtime/`
(liturgically titled, narratively specific) and the hand-authored storyboard
beats in `art/storyboard/v0_1/`.

## Tier 2 — distill, don't copy

1. **Canon decisions one-pager** replacing the 16 ADRs for narrative purposes:
   the five binding story decisions (ADR 0004 Hesychasm, 0006 bread, 0007 gravity
   encounter, 0008 wolf violence is real and lootable, 0005 registers ≠ paths)
   plus the locked vocabulary (Strange Fire, The Turn, The Iron Ledger,
   Burden/Pressure/Numbness, Folk/Sanctioned/Sacred, page 66/77 reservations).
2. **"Mechanics as theology" document**, newly written: translate the
   load-bearing type vocabulary (`LatentPath`, `VoiceRegister`,
   `RecognitionSeedKind`, `ProgressionTrack`, `DeathFrictionKind`,
   `MortalityState`, `ResourceKey`, `SimDomain`), the receptivity model, and the
   register-match design into worldbuilding prose. This rescues the substrate's
   meaning and lets the implementation rest.
3. **Archive recovery commit**: `_archive/superseded/` (26MB, including the v0.3
   original upload, the v0.6 packet's notebook-demotion correction rationale, and
   the v0.8 symbol register) is gitignored — it exists only on this disk.
   Version it or copy it into the rescue corpus before anything else.

## Leave behind

Substrate/engine code, acceptance matrices, asset manifests, sprite prompt
packs, pipeline plans, probe candidate trees, governance/anti-drift tooling, and
the 108MB of MP4 music masters (move to external storage; runtime OGGs stay).

## Known risks

- **`_archive/superseded/` is unversioned.** Single-disk provenance. Highest
  priority in execution.
- The anti-drift gate still enforces v0.8.1 P0 vocabulary scope; it is
  provenance-era tooling and should not constrain the prose rescue.
- Untracked probe logs accumulate under `art/characters/kalev/preview/candidates/`;
  add a `.gitignore` pattern (e.g. `art/**/candidates/**/*.log`) during cleanup.

## Open narrative questions (decide before drafting)

Carried from `CONSOLIDATED_LORE_SURFACE.md` open questions:

- Anna's last line; the notebook line after her death; Bethany recognition wording; Iiro recognition timing.
- Birdie/Ruth's off-screen arc between Wittehaven and Paradise ("the reader does not know what. The author should.").
- Lena Hart's path past Wittehaven (stays / crosses / dies / departs).
- Whether the wife's name on page 77 line 7 is ever legible (author note favors ink only, never on page).
- The Pivotal Ember Choice at the Straits: the dying official is the man who took Kalev's children — undrafted, no right branch.

## Execution checklist (follow-up)

- [ ] **Rescue**: create the canon corpus (recommended: new repository
      `tincture-of-mercy-canon`; alternative: self-contained `canon/` root here);
      copy Tier 1 verbatim; version `_archive/superseded/`.
- [ ] **Distill**: write the Tier 2 canon one-pager and mechanics-as-theology doc.
- [ ] **Decide**: working session to close the open narrative questions above.
- [ ] **Draft Phases II–IV** scene by scene against the long-arc deck, with the
      voice-over register of `STORYBOARD_BIBLE.md` §6 as the quality bar.
      Suggested order: Iron Ledger trial (keystone, inverse of the seed scene) →
      Pivotal Ember Choice → Mackinac crossing → Birdie's return.
- [ ] **Then choose the artifact**: novella, illustrated lore book (storyboard
      art + music already half-build this), or a narrative-first slice rebuilt
      small on top of the finished text.
