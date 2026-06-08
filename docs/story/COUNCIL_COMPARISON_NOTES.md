# Council Comparison Notes — Storyboard Ultragoal

Status: audit + comparison handoff  
Owner lane: narrative/storyboard + council synthesis  
Created: 2026-05-13

## Produced artifacts

- `docs/story/SOURCE_ORE_MAP.md` — maps active canon, older lore, source intake, art, environment, audio, and autobiographical source transmutation.
- `docs/story/STORYBOARD_BIBLE.md` — reframes the project for narrative storyboard and AI video production.
- `docs/story/NARRATIVE_STORYBOARD_DECK_V0_1.md` — ten production-ready scene cards plus candidate Eli prologue with image/video/VO/sound prompts.
- `docs/story/AI_PRODUCTION_PIPELINE.md` — repeatable prompt and review pipeline for stills, video, and voice-over.

## Main choices in this pass

| Choice | Decision | Why |
|---|---|---|
| Opening frame | Start in the active Ironwood cabin, with Eli Keene as optional precedent prologue. | Existing active opening remains Anna/Iiro; v0.7/v0.8.1 Eli/page 66 adds useful baseline if chosen. |
| Lived source | Mythic transmutation by default. | Respects the user's lived wound without turning real people into content. |
| Child identity | Active `Iiro` in storyboard; older `Eli Keene` only as provenance. | Follows active v0.9 direction while preserving v0.7 comparison option. |
| Opening spine | Candidate prologue → Bedside → Water → Bread → Tincture → Anna death cross-cut with wolf pressure → Iiro flight/combat → Borrowed Mercy. | Keeps active beats while adopting the report's stronger overlap and notebook-prologue option. |
| Institution | Wittehaven first appears as relief. | Preserves the project's non-cartoon institutional critique. |
| Addiction/despair | Ember/Borrowed Mercy carries it first; charcoal cross beside Kalev's own name makes moral accounting visible. | Keeps the substance effective and costly without melodrama. |
| Ending | Paradise/notebook returned; recognition and names. | Keeps payoff as recognition/presence, not cure or recipe victory. |
| Visual strategy | Pixel-art continuity anchors + higher-detail icon-panel cinematic concepts; concept paintings seed video, pixel sheets lock silhouettes. | Uses the existing 2D project fully while enabling AI video/storyboard production. |

## Adopted from the external council report

- Candidate **Eli Keene prologue** at page 66 line 7, with active-canon caveat.
- **HOLD** field and disclosure envelope on scene cards.
- **Named lights** as production vocabulary.
- **Komboskini/prayer rope** as visible Hesychasm prop after Bethany.
- **Notebook insert shots** as visual connective tissue.
- **Wolf gaze as moral spotlight** and protection line as body-as-door.
- **Numbness desaturation / flattened eyes** for Ember self-use.
- **Concept-art PNGs as video seeds**; pixel sheets as silhouette/pose references.

## Deferred or qualified from the external report

- Eli is not treated as a replacement for active `Iiro`; he is a candidate prologue/provenance thread.
- Anna death overlapping wolf combat is adopted as a storyboard cross-cut option, not a hard active-doc rewrite.
- Exact graybox coordinates guide staging but are not made story law.
- Musical motif IDs remain proposed unless an audio canon pass locks them.

## Compare with the other council agent on these axes

1. **Literal vs mythic:** Did they lead with literal Corewell/COVID, or transmute it into Wittehaven/cabin imagery?
2. **Opening:** Did they start at cabin, hospital, road, Wittehaven, or Paradise?
3. **Addiction framing:** Did they make Ember symbolic, explicit, moralized, medicalized, or avoided?
4. **Institutional critique:** Did Wittehaven feel useful before dangerous?
5. **Scene usefulness:** Are cards directly promptable for still image/video/VO?
6. **Canon drift:** Did they preserve Hesychasm, bread, gravity encounter, wolf combat, recognition/presence?
7. **Game feedback loop:** Does the storyboard strengthen the pixel-art game, or replace it with generic cinematic fantasy?

## Verification evidence

Commands run:

```bash
find docs/story -maxdepth 1 -type f -print | sort
grep -RInE 'Pastoral|porridge|recipe victory|salvific|combat is off-limits|care-only prototype|Eli Keene|Nora Field' docs/story || true
python3 design_system/tools/anti_drift.py --mode all --root design_system
```

Results:

- Story files present: `AI_PRODUCTION_PIPELINE.md`, `COUNCIL_COMPARISON_NOTES.md`, `NARRATIVE_STORYBOARD_DECK_V0_1.md`, `SOURCE_ORE_MAP.md`, `STORYBOARD_BIBLE.md`.
- `anti_drift: clean.`
- Drift grep hits are intentional historical/provenance/comparison mentions:
  - Pastoral appears only as historical/source language or provenance note.
  - Porridge appears only in a warning that active v0.9 uses bread.
  - Recipe victory appears only as something to avoid.
  - Eli Keene appears as a candidate prologue/provenance thread; active opening default remains Iiro.

## Remaining open questions

- Should Corewell/Grand Rapids appear by name in a later memoir-facing version, or remain transmuted into Wittehaven?
- Should Borrowed Mercy explicitly name addiction in VO, or let Ember carry it visually until later?
- Should the first production batch be six key stills including Eli, five key stills without Eli, a 10-card PDF, or a 60–90 second animatic?
- Should the opening child remain Iiro permanently, or should council comparison revisit Eli Keene for sound/name reasons?

## Recommended next step after comparison

Run a synthesis pass:

1. Merge strongest ordering choices from both council outputs.
2. Lock one first-production batch: five cards without Eli or six with Eli.
3. Generate three still concepts each for cards 00, 01, 05, 07, 08, and 10, then decide whether Eli belongs in the public cut.
4. Build a contact sheet comparing AI output to existing pixel-art references.
5. Record scratch VO and assemble a 60–90 second animatic.
