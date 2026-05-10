# Slice 4 — Latent Paths and Receptivity

Status: active slice spec
Owner lane: systems design + narrative design
Authority level: active for Apothecary/Hesychasm/Iconographic path architecture and receptivity resolver hooks
Dependencies: `02-substrate-primitives.md`, `03-opening-act-bible.md`, `CONTEXT.md`
Maximum intended scope: path/receptivity mechanics for the substrate and opening-slice proof; not a full campaign progression bible
Source references: `docs/source/2026-05-09-tincture-codex-handoff/primary_sources/three_registers.md` and active tie-breakers in `CONTEXT.md`
Validation gate: path names, data contracts, examples, Bethany payoff, and resolver hooks are specified

## Core distinction

**Voice registers** are copy-language modes.
**Latent paths** are gameplay growth and attention disciplines.

| Concept | Active set | What it controls | What it is not |
|---|---|---|---|
| Voice registers | folk, sanctioned, sacred | words, surface tone, institutional or sacred framing | character growth paths |
| Latent paths | Apothecary, Hesychasm, Iconographic | what Kalev notices, which verbs fit, receptivity, costs, risks, recognition hooks | a simple power ladder |

**Hesychasm** is the active name for prayerful attention, watchfulness, and presence. **Pastoral** is a historical/source alias when older material is cited.

## Design principles

1. **Paths teach reading the room.** A path should help the player notice what kind of attention a person can receive.
2. **No replacement ladder.** Apothecary remains viable. Hesychasm and Iconographic practice expand recognition and reach; they do not make bodily care obsolete.
3. **Receptivity matters.** An action fits differently depending on person, state, fear, hunger, language, symbols, timing, and prior events.
4. **Payoff is recognition/presence.** Bethany remembers presence, not only technical success.
5. **Path effects become events.** Path-specific reads, costs, modifiers, and progression are recorded in `SimEvent` and projected by presenters.

## Path overview

| Path | Core attention | Typical verbs | Costs/risks | Event outputs |
|---|---|---|---|---|
| Apothecary | Bodies, ingredients, dosing, pressure, practical sequence. | observe symptoms, wash, warm, prepare tincture, administer, bind, ration. | technical tunnel vision, resource pressure, over-trusting treatment, missed presence cue. | care events, craft quality, dose result, corrected-recipe learning, bodily state reads. |
| Hesychasm | Watchfulness, prayerful presence, breath, fear, bearing witness. | sit near, keep watch, speak name, pray, wait for breath, hold hand, witness. | time cost, Spirit cost, carried Burden, vulnerability during danger. | presence fit, Witness/Recollection, lower panic, recognition seed, burden event. |
| Iconographic | Image, pattern, symbol, composition, sacred disclosure through matter. | notice image, arrange object, trace sign, read room pattern, mark page, recognize threshold. | misreading symbol, distraction from bodily need, over-interpretation. | image-read event, threshold tag, sacred-register cue, recognition/recollection hook. |

## Path progression shape

Path growth is event-derived. It should not require an explicit player-facing tree in the opening slice. Internally, the substrate can track path points, thresholds, or state witnesses.

| Progression layer | Meaning | Data shape |
|---|---|---|
| Exposure | Kalev performs or witnesses path-relevant acts. | event tags: `path.apothecary`, `path.hesychasm`, `path.iconographic` |
| Recognition | The player receives a new reading or action fit. | `path_read_id`, `unlocked_by_event_ids`, `surface_key` |
| Vocation/path points | Durable growth accounting. | `path_id`, `delta`, `source_event`, `cap_or_tuning_rule` |
| Cross-path synergy | One path makes another more precise. | modifier ids such as `apothecary_with_hesychasm_presence` |

### Example progression beats

- Water and bread create Apothecary exposure through bodily care and resource attention.
- Sitting with mother during the gravity encounter creates Hesychasm exposure through presence under loss.
- Noticing the cabin icon/object arrangement or recording a sign creates Iconographic exposure.
- Protecting the boy can create Apothecary/Combat and Hesychasm/Witness overlap: bodily protection and carried consequence.

## ReceptivityProfile contract

`ReceptivityProfile` describes what kind of care, speech, timing, and register a person can receive at a given moment. It is data passed into resolver modifiers and presenters.

Illustrative shape:

```csharp
public readonly record struct ReceptivityProfile(
    string Id,
    string ActorId,
    IReadOnlyList<string> NeedTags,
    IReadOnlyList<string> FearTags,
    IReadOnlyList<string> ComfortTags,
    IReadOnlyDictionary<string, int> PathFit,
    IReadOnlyDictionary<string, int> RegisterFit,
    IReadOnlyList<string> RefusalTriggers,
    IReadOnlyList<string> RecognitionHooks
);
```

Minimum fields:

| Field | Purpose | Example |
|---|---|---|
| `id` | Stable profile row. | `child.after_bread_fearful` |
| `actor_id` | Person or actor this profile belongs to. | `eli_keene` |
| `need_tags` | Bodily/social needs. | `hungry`, `cold`, `afraid`, `short_breath` |
| `fear_tags` | What makes a verb/register fit worse. | `stranger`, `sharp_voice`, `blood`, `wolf_howl` |
| `comfort_tags` | What improves fit. | `warmth`, `bread`, `name_spoken`, `quiet_presence` |
| `path_fit` | Base fit by path. | `apothecary: +1`, `hesychasm: +2` |
| `register_fit` | Base fit by copy/speech register. | `folk: +2`, `sanctioned: -1`, `sacred: 0` |
| `refusal_triggers` | Conditions that block or degrade an action. | `too_fast`, `hands_shaking`, `case_language` |
| `recognition_hooks` | Later memory/payoff seeds. | `bread_received`, `name_spoken`, `protected_on_road` |

## register_match_modifier

`register_match_modifier` is the resolver-facing score derived from action register, target receptivity, path state, and context. It can affect fit, risk, cost, or available readings.

Inputs:

- `voice_register`: `folk`, `sanctioned`, or `sacred`.
- `path_id`: `apothecary`, `hesychasm`, or `iconographic`.
- `receptivity_profile_id`.
- `actor_state`: Pressure, Burden, Numbness, Steady, Spirit.
- `scene_tags`: e.g. `bedside`, `wolves_near`, `mother_dying`, `child_hungry`.
- `prior_event_tags`: e.g. `bread_received`, `spoke_name`, `self_administered`.

Outputs:

- `modifier_value` for resolver.
- `fit_tags` for event and debug.
- Optional `presenter_key` for in-world feedback.
- Optional `recognition_hook` for later Bethany payoff.

Illustrative resolver event fields:

```json
{
  "domain": "Care",
  "verb_id": "care.bread.offer",
  "path_id": "apothecary",
  "voice_register": "folk",
  "receptivity_profile_id": "child.after_water_fearful",
  "register_match_modifier": 2,
  "fit_tags": ["hungry", "quiet", "ordinary_mercy"],
  "recognition_hooks": ["bread_received"]
}
```

## Test examples

| Scenario | Inputs | Expected modifier | Event/projection |
|---|---|---|---|
| Child is hungry and afraid; Kalev quietly offers bread. | `path=apothecary`, `register=folk`, tags `hungry`, `afraid` | positive fit | `bread_received`, trust seed, lower fear. |
| Mother is fading; Kalev speaks in case language after self-use. | `path=apothecary`, `register=sanctioned`, tags `numbness_high` | lower fit | comfort may improve technically, presence hook weaker. |
| Kalev sits and speaks the mother's name. | `path=hesychasm`, `register=folk` or sacred when fitting | positive presence fit | Witness/Recollection seed, burden event. |
| Kalev notices a threshold image before leaving. | `path=iconographic`, `register=sacred`, tags `threshold` | unlocks reading | image-read event, later recognition/recollection hook. |
| Wolves threaten the child; Kalev draws threat. | combat/protection with Hesychasm overlap | protection fit, high cost | boy safety hook, burden/progression event. |

## Path-specific verbs

### Apothecary verbs

| Verb | Cost | Risk | Events |
|---|---|---|---|
| `ObserveSymptoms` | time, attention | technical tunnel vision under high Pressure | `care.observe.*`, state-read tags |
| `PrepareTincture` | item, time, Steady | rough preparation, self-use temptation | `craft.tincture.prepare`, resolver metadata |
| `AdministerDose` | dose, timing | worsened state, diminished effect | `care.tincture.administer`, aura/result |
| `BreakBread` / `OfferBread` | food, time | poor timing, refusal | `care.bread.*`, receptivity shift |
| `BindWound` | cloth/herb, time | exposure during combat aftermath | `care.bind`, Health/Pressure delta |

### Hesychasm verbs

| Verb | Cost | Risk | Events |
|---|---|---|---|
| `SitNear` | time, vulnerability | danger advances while waiting | `presence.sit_near`, Pressure/Spirit delta |
| `SpeakName` | attention, prior knowledge | wrong timing or Numbness blunts fit | `presence.speak_name`, recognition hook |
| `KeepWatch` | Spirit, time | Burden increases through witness | `witness.keep_watch`, Recollection seed |
| `Pray` | Spirit, stillness | may not fit every person/register | `presence.pray`, register match metadata |
| `HoldHand` | proximity, vulnerability | combat/flight risk if misused | `presence.hold_hand`, comfort tag |

### Iconographic verbs

| Verb | Cost | Risk | Events |
|---|---|---|---|
| `NoticeImage` | attention | symbol over body if mistimed | `iconographic.notice`, scene tag read |
| `ArrangeObject` | time, item | misfit or distraction | `iconographic.arrange`, comfort/recognition tag |
| `TraceSign` | Spirit, timing | sacred register may not fit target | `iconographic.trace_sign`, register metadata |
| `MarkPage` | time, notebook focus | danger advances | `notebook.mark_image`, recollection hook |
| `ReadThreshold` | attention | over-interpretation | `iconographic.threshold`, route/scene tag |

## Bethany payoff

Bethany payoff follows recognition/presence.

- The child recognizes Kalev because Kalev was present, protective, and remembered as a person in earlier events.
- A corrected recipe can be recorded as Apothecary learning.
- The corrected recipe must not become the salvific cause of recognition.
- Recognition is event-derived from seeds such as bread received, name spoken, mother witnessed, protected on the road, and notebook/person records.

Illustrative recognition projection:

```json
{
  "projection": "bethany.recognition",
  "source_events": [
    "care.bread.offer",
    "presence.speak_name",
    "witness.kalev",
    "progression.protection",
    "notebook.aftermath"
  ],
  "payoff_kind": "presence_recognized",
  "apothecary_learning": ["corrected_recipe_optional"]
}
```

## Data validation rules

- Every path data row has a stable id and event tags.
- Every receptivity profile declares at least one need tag and one register fit value.
- Every resolver call that uses receptivity records `receptivity_profile_id` and `register_match_modifier`.
- A profile can improve, degrade, or refuse an action; refusal is data, not scene-local branching only.
- Path progression and recognition hooks derive from events.

## Acceptance

This slice is accepted when:

- Apothecary, Hesychasm, and Iconographic are the active path names.
- Voice registers and latent paths are distinct.
- ReceptivityProfile and register_match_modifier fields are clear enough for substrate implementation.
- Bethany payoff is recognition/presence with corrected recipe as subordinate Apothecary learning.
- Path-specific verbs include costs, risks, and event outputs.
