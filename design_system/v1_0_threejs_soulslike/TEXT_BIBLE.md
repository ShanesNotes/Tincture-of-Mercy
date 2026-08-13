# v1.0 Text Bible — the polyphonic string set for the Ironwood slice

Discharges **PRD R14** (polyphonic text system) and the text half of **D6** (lore naming) and **D6/Ember** (Numbness as register degradation). Authority: this file sits below `DECISIONS.md` and `docs/adr/`, and above any string written in `game/`.

Machine form: [`text_bible_v0.json`](text_bible_v0.json) — `{key: {folk, church, state, numb1?, numb2?, numb3?}}`. **The JSON is the shipping artifact; this file is the law that governs it.** A string may not be added to the JSON without a rule here that permits it.

Sources read for this pass: `DECISIONS.md` (D6 table binding), `ENCOUNTERS.md`, `PRD.md` R14, `docs/lore/CONSOLIDATED_LORE_SURFACE.md`, `docs/lore/CAST_BIBLE.md`, `docs/lore/STORY_RESCUE_PLAN.md`, `docs/story/STORYBOARD_BIBLE.md` §3/§6, `docs/lore/tincture_of_mercy_v0_3.md` §V (polyphonic naming), §VII (the finished cabin prose — the voice bar), §X (Ember), §XI (Grey Stone).

---

## 0. The four laws

**L-T1 — Register is a property of the surface, not of the speaker.**
Cards, UI, notebook framing, and world messaging are rendered in a register. **Spoken lines are not.** Anna says what Anna says.

**L-T2 — Numbness never rewrites an utterance.**
Ember degrades what the player is *told about* a person — the label, the card, the prompt, the log line. It cannot touch what was said, and it cannot touch what is already written in the notebook. *The dead do not change their words because you took something.* Mechanically this is why every spoken-line key in the JSON has no `numb*` fields: there is nothing there to degrade.

**L-T3 — The register that lies is the one that flatters.**
The State register is not evil and is never cartoon. It is tired, correct, and useful — written by people who kept a system running past the point where anyone could say why (`STORYBOARD_BIBLE` §3: Wittehaven must first feel like relief and must be partly right; `v0_3` §XII: staffed by tired people who did what had to be done). Its horror is that it is *accurate*. `ui.ember.numbness_gained` State is the model line: **"Perception index reduced. Function maintained."** Nothing in it is false.

**L-T4 — Two scenes are register-locked and never degrade.**
The **Anna gravity encounter** (⚓ ADR 0007) and the **Birdie apple refusal** (⚓) always render at folk, step 0, whatever the Numbness state. The canon-locked beats are not available to the cost system. (In the slice this is also true by construction — the vial is not the player's until Anna dies — but the lock is stated so no later leg can quietly break it.)

---

## 1. The three registers

Canon calls the copy modes **folk / sanctioned / sacred** (ADR 0005). D6 names the same three axes **folk / Church / State** and D6 is binding for v1.0. The mapping, once, so no future worker re-derives it wrong:

| D6 (binding, v1.0) | ADR 0005 / v0.3 §V | Who speaks it |
|---|---|---|
| **folk** | folk | Kalev, Anna, Iiro, Birdie, the road |
| **Church** | sacred | commemoration, the lamp, the diptych |
| **State** | sanctioned (Wittehaven / Office of Continuance) | the forms, the stations, the tags |

### folk — concrete, bodily, tool-words

Names the thing you can put a hand on. Nouns are objects; verbs are things hands do. No abstraction that a person carrying a pack would not say out loud. Contractions allowed. Sentences run short and stop when the fact is delivered. Numbers only where a person would actually count (doses, days, loaves).

1. `item.weapon.hearth_iron.desc` — "The fire iron from Anna's hearth. Black at the tip, warm halfway up."
2. `npc.anna.water` — "Just the wet on my lip. Don't spend it all on me."
3. `ui.turn.near` — "Not much page left."
4. `item.pouch.myrrh.desc` — "Resin beads, dark red. Cuts a smell no washing will."
5. `ui.recovery.respawn` — "The fire held. You did not."

### Church — liturgical, witness-language

Names what a thing *is for* before God and before memory. Passive and receptive verbs (received, kept, commemorated, given, laid). It witnesses; it does not console, explain, or promise a cure (Father Ilarion's voice rules, `CAST_BIBLE`). It never sermonizes and never wins an argument. Slightly longer rhythm than folk, but never more than one clause past the point.

1. `item.tincture.vial.name` — "mercy you can carry" *(D6 verbatim)*
2. `item.pouch.myrrh.desc` — "Brought to the tomb by women who expected to use it."
3. `ui.death.open_page_lost` — "Unwritten here. Not unnamed elsewhere."
4. `boss.warden.attrib` — "the lamp that stayed lit after the asking died" *(ENCOUNTERS verbatim)*
5. `item.ember.desc` — "It burns. It was not given."

### State — case-language, abbreviation, passive voice

Names the thing by what may be done with it, filed under. Agentless passive ("is advised", "was recorded"), nominalization (write → *filing*), abbreviation and code, and the imperative addressed to no one in particular ("Log on entry."). Persons become classes; events become outcomes. It is *administratively correct* at all times — that is the whole point.

1. `ui.death.message` — "Outcome failure recorded."
2. `item.ember.desc` — "E-7. Units on hand: {n}. Self-administration is within protocol."
3. `item.key.notebook.desc` — "Non-standard personal register. Names recorded without case reference."
4. `ui.attr.spirit` — "Form 9 — V. agent response"
5. `item.loot.wolf_meat.desc` — "Recovered animal protein. Cook thoroughly. Not for issue."

### Deliberate absence

`null` in the JSON means **this register has no word for this thing**, and that silence is content. Three standing absences:

- **The State has no word for the cedar dog.** It is unlisted, unclassifiable, and worthless to a form. At Numbness step 3 the game finally finds one — "personal effect, unlisted" — which is the joke and the wound.
- **The Church has no word for what the old world synthesized.** Pulseleaf, Arbor, Acebark, Phrine, Cillin, Zyl, Furos: `church: null` (v0.3 §V marks Pulseleaf "(no church name)" explicitly). But it has names for what the earth gives and the liturgy uses — honey, cedar, wool, cotton, salt, myrrh, oil. **The Church names creation and not the pharmacopoeia.** That split is legible to the player who opens the pouch twice.
- **The Church does not commemorate the wolves.** All four loot cards are `church: null`. Commemoration is for persons. A wolf is not a person, and pretending otherwise would cheapen the notebook (`ADR 0008`: violence is real, loot is consequence not win).

An omitted `numb1/2/3` means "this key does not degrade" (spoken lines, register-locked scenes). `""` at a step means "at this step this line is not shown at all" — that is how lore lines die.

---

## 2. The Numbness ladder

Each Ember dose adds a permanent **Numbness** stack: −8% Tincture healing, +25% Turn buildup, and **one register-degradation step** (D6, TUNING_V0). Text degradation is the visible half of the cost; the stat penalties are the invisible half.

```
textStep = clamp(stacks − vigilRestore, 0, 3)
```

`vigilRestore` is 1 while the current Hearth vigil holds; it drops to 0 at the **first hostile contact** after leaving the Hearth. Stat penalties are never restored — only the words come back, and only until you fight again. (D6 says "partially restored at a Hearth" and stops there; the one-step / lost-on-contact shape is authored here — see §8 Disputes.)

**Slice reach:** Ember is 2 doses in the slice, so the Ironwood reaches **step 2** at most. Step 3 is authored now because legs 2–6 will reach it and because a 3-stack player who keeps vigil renders at step 2 — the ladder must be complete for the Hearth restore to have anything to restore *to*.

### Transformation rules

| Step | Names | Item cards | Sentences | Lore lines |
|---|---|---|---|---|
| **0** | Given names for everyone Kalev has met. | Folk name is the header; description folk; lore line present. | Full folk sentences, second person, concrete verbs. | Present. |
| **1** | Given names hold **only for those written in the notebook**; everyone else drops to role. | Folk header holds. Description loses its second sentence. | One clause shorter. Second person survives. | Truncated to their first clause. |
| **2** | All given names → roles, including Iiro and Birdie. Kalev becomes "the healer". | Header becomes `Folk name (STATE CODE)`. Description is State phrasing in folk word order. | Articles and feeling-verbs drop. Imperatives become nominals ("Write the Names" → "Write / file"). | **Gone** (`""`). |
| **3** | Roles → classes. Anna is "the case". Kalev is "practitioner, unlicensed". | State code is the header; the folk name is not shown. | State register outright: passive, abbreviated, no second person. | Gone. |

**Anna is the last name to go, and she goes.** That is the ladder's argument. The world does not stop being real; the player stops being able to read it.

### Before / after

| Key | Step 0 | Step 2 | Step 3 |
|---|---|---|---|
| `ui.death.message` | The page falls open. | Page open. | Outcome failure recorded. |
| `item.ember.name` | Ember | Ember (E-7) | E-7 |
| `npc.anna.attrib` | Anna | the mother | the case |
| `npc.kalev.attrib` | Kalev | the healer | practitioner, unlicensed |
| `ui.hearth.remember` | Write the Names | Write / file | File outcomes |
| `item.charm.cedar_dog.desc` | Carved by a smaller hand than his. The ear is uneven and the flank has a knife mark. | A carving. Wood. Uneven. | Personal effect. No classification. |
| `item.key.open_page.lore` | Die again on the way and they are lost to the spreadsheet. | *(not shown)* | *(not shown)* |
| `ui.turn.rising` | The margin is narrowing. | Margin narrowing. | Flattening index: rising. |

### Hearth partial restoration

At the Hearth, `ui.hearth.numbness_restore` fires: folk **"Some of the words came back."** / Church "Sight is returned in part." / State "Perception index partially corrected." The line itself is rendered at the *restored* step, so the player reads the recovery in the recovered voice — and at step 3 restored to 2 they read "Some words came back" in a sentence that is still missing a word. That is the intended sting.

### What the ladder may never touch

Spoken lines (L-T2); notebook entries already written (they are graphite, not UI); the Anna encounter and the Birdie coda (L-T4); the canon death line; the Warden's name once written.

---

## 3. Item cards

Card = **folk name · one-line description · lore line**, in each register that has a word for it. `—` below = deliberate `null`. Keys are `item.<group>.<slug>.{name,desc,lore}`.

### Weapon

| Register | Name | Description | Lore |
|---|---|---|---|
| folk | the hearth iron | The fire iron from Anna's hearth. Black at the tip, warm halfway up. | It was for banking coals. It banks nothing now. |
| Church | the warming iron | What kept her fire is carried out into the cold. | A tool of warmth taken up for a harder warmth. |
| State | domestic implement, ferrous | Household implement in unsanctioned use. Log on entry. | — |

*Material memory (L11): the card never stops calling it a fire iron. It is not a sword and the text must not let it become one.*

### The Tincture and the wheel

| Item | folk | Church | State |
|---|---|---|---|
| the vial | **the Tincture** — "Doses drawn for Anna. They are yours now, and they are counted." Lore: *Borrowed mercy. Renewed at the fire, never repaid.* | **mercy you can carry** — "What was prepared for one is spent by another." | **E-3 stabilizer** — "Doses on hand: {n}. Replenish at Warming Station." |
| variant | **Pulseleaf Draught** — "Bitter and quick. Closes the wound before you have finished flinching." | — | LOL susp. |
| variant | **Honeyed Draw** — "Slow and sweet. Keeps working while you keep moving." | — | HONEY-LOL, extended |
| variant | **Salt Wash** — "Stings badly enough to be believed. Drives the Turn back out of you." | the washing — "The Withering is washed out; it is not argued with." | SALT irrigation |
| variant | **Cedar-Wool Compress** — "Heat held against the chest. Your breath comes back and your feet hold." | — | CEDAR-WOOL, topical |
| variant | **Bitter Phrine** — "Takes the whole wound. Then your hands are not yours for a while." | — | PHRINE, high-dose |
| **Ember** | **Ember** — "One swallow and the grey stone turns to smoke." Lore: *A fire he had not been given.* | **Strange Fire** — "It burns. It was not given." Lore: *Unauthorized fire, offered and consumed.* | **E-7** — "Units on hand: {n}. **Self-administration is within protocol.**" |

*Ember's State line is the most important string in the slice. The register does not forbid him. It has a box for this.*

### The pouch (15 entries, folk order — v0.3 §V/§X verbatim)

> Pulseleaf, Arbor, Acebark, Phrine, Cillin, Zyl, Honey, Cedar, Wool, Cotton, Salt, Myrrh, Oil, Furos, **Ember.**

Slot 1 is the cedar dog and slot 16 is Ember (`CAST_BIBLE` locks). Ember's card is above; the other fourteen:

| folk | Church | State | Description (folk) |
|---|---|---|---|
| Pulseleaf | — | LOL | Small leaves at the base of a stone, with a bitter shimmer if you know how to read it. |
| Arbor | — | ARB | Shaved inner bark, dried grey. Loosens what is clenched. |
| Acebark | — | ACE | Chewed for fever. Tastes like a fence post and works anyway. |
| Phrine | — | PHRINE | Kept in dark glass. A little wakes a heart; more than a little does not. |
| Cillin | — | CILLIN | The good powder. He is always out and always looking. |
| Zyl | — | ZYL | Numbs the skin so the hands can work. Does not reach any deeper. |
| Honey | the sweetness of the land | HONEY | In waxed cloth. Dresses a burn and carries a bitter dose past the tongue. |
| Cedar | the wood that does not rot | CEDAR | Shavings and a strip of bark. Smells like a hope chest. |
| Wool | the fleece | WOOL | Greasy and warm even wet. Packs a wound, holds a compress. |
| Cotton | the clean cloth | COTTON | Boiled, folded, counted. The one thing he still keeps in numbers. |
| Salt | the salt of the covenant | SALT | For the wash and for the road. Everything here has salt on it by December. |
| Myrrh | the burial spice | MYRRH | Resin beads, dark red. Cuts a smell no washing will. |
| Oil | the oil of the sick | OIL | A flat tin of it. Loosens a bandage, softens a hand, thins a salve. |
| Furos | — | FUROS | Small dark glass, hoarded since the last town. Pulls water off a drowning chest. |

*Zyl's lore line — "The honest kind of numb: it stops where it says it stops." — is the pouch's one comment on Ember, and it is the only one it gets.*

*Symbol discipline (`CONSOLIDATED_LORE_SURFACE` § Symbol register: **a symbol used twice is used too much**, except notebook, cedar dog, Ember vial, patient panel): **"cedar lasts" is spoken once in the whole slice**, on the cedar dog card, and it must carry the canon transmission exactly — Kalev said it to his son, and the son handed it back to him in the shape of a carving. Cedar's other two cards (the pouch entry, the compress) are forbidden from restating it.*

### Wolf loot (Church: deliberately silent)

| folk | State | Description (folk) |
|---|---|---|
| wolf hide | biological salvage, class III | Heavy, rank, still warm at the shoulder. It will wrap a haft or a chest. |
| wolf sinew | biological salvage, class II | Dried, it binds tighter than any cord he can trade for. |
| wolf tooth | biological salvage, class I | Longer than it looked when it was coming at you. |
| wolf meat | biological salvage, consumable | Dark and stringy. It is food, and the boy has not eaten today. |

*Lore line on the meat carries the ADR 0008 rule outright: "Loot is not winning. It is what is left over from a thing that happened."*

### Charms, keys, and the tag

| Item | folk | Church | State |
|---|---|---|---|
| **the cedar dog** (charm, slot 1) | "Carved by a smaller hand than his. The ear is uneven and the flank has a knife mark." Lore: *Pine, he told the boy. The boy insisted on cedar — because his father had said once that cedar lasts.* | the dog that went with them — "It walked out and it walked back, and no one wrote down why." *(Tobit frame)* | **—** |
| **the notebook** | "Leather, swollen with damp. Names in graphite, one to a line." Lore: *The virus could take the breath. It could not plunder the name.* | the diptych — "The commemoration, carried on the body." | unauthorized record — "Names recorded without case reference." |
| **the Open Page** | "Loose unwritten leaves, scattered where you fell. Go back for them." Lore: *Die again on the way and they are lost to the spreadsheet.* | the unnamed — "What you witnessed and did not write waits at the place." | lapsed entries — "One retrieval permitted." |
| **the hasp pin** (gate shortcut) | "A bent iron pin off a warden's gate. It opens the road back the short way." | — | access hardware, post road |
| **a tin tag** (the Warden's) | "Stamped tin, warm from his belt. There is a name on it." | the name that outlived the post | identification tag, Continuance post 9 |

*The notebook's folk name is a concession: v0.3 §V records that Kalev has **no name for it aloud**. He never says "notebook" in dialogue. Only the UI does.*

---

## 4. NPC lines

Per L-T1/L-T2 these are **folk only**; `church`/`state` are `null` and there are no `numb` variants. What degrades is the **attribution** beside them:

| Key | folk | Church | State | numb1 → numb2 → numb3 |
|---|---|---|---|---|
| `npc.kalev.attrib` | Kalev | the one who carries names | practitioner, unlicensed | Kalev → the healer → practitioner, unlicensed |
| `npc.anna.attrib` | Anna | the one commemorated | the case | Anna → the mother → the case |
| `npc.iiro.attrib` | Iiro | the child in your keeping | minor, unassigned | Iiro → the boy → minor, unassigned |
| `npc.birdie.attrib` | Birdie | the fool who keeps the road | minor, unregistered | Birdie → the girl → minor, unregistered |
| `boss.warden.attrib` | the keeper on the road | the lamp that stayed lit after the asking died | Ironwood Warden, Continuance post 9 | the keeper on the road → the warden → post 9 |

*The Warden's three names are `ENCOUNTERS.md` verbatim. **No title card** — the UI shows the folk attribution and never his name until the player writes it.*

### Anna — prologue care beats

Restraint is law here (`STORYBOARD_BIBLE` §3: no melodrama; §6: names over categories, admission over explanation, silence where the scene carries meaning). She is dying, she knows it, and she is thinking about the boy.

- Water — "Just the wet on my lip. Don't spend it all on me."
- Bread — "Give it to the boy."
- First dose (the flask tutorial) — "Is that the last of it?"
- Relief — "Better. For a while."
- On Iiro — "He's been carrying that cup since morning. He won't set it down."
- **Last line (PROPOSED, see §8)** — "Did the boy eat?"

### Anna — the gravity encounter (⚓ ADR 0007, register-locked)

Eight presence verbs (`ENCOUNTERS.md` beat 5). Prompts carry all three registers so the scene reads correctly on a Church- or State-framed surface; **her responses do not**, and none of it degrades.

| Verb | Prompt (folk / Church / State) | Anna |
|---|---|---|
| ObserveBreath | Watch her breathing / Attend the breath / Observe respiration | *(Her breath goes long, then short, then long. Nothing you do changes the count.)* |
| SitNear | Sit near her / Abide with her / Remain at bedside | "Sit where I can see you." |
| HoldHand | Hold her hand / Take her hand / Physical contact, comfort | "Cold hands. Good for a fever." |
| SpeakName | Say her name / Name her aloud / Verbal orientation | "That's mine. Keep it." |
| Pray | Pray / Pray / Spiritual attendance, unrecorded | "I don't know the words either. Say them anyway." |
| KeepWatch | Keep watch / Keep the vigil / Continuous observation | *(She does not speak. The hearth does.)* |
| WitnessDeath | Stay / Witness / Confirm outcome | **"Anna's breath stops with Kalev still beside her."** *(canon line, verbatim, never reworded)* |
| WriteName | Write her name / Commemorate her / File the outcome | *(You write Anna. The graphite shines darkly in the damp.)* |

*"That's mine. Keep it." is the whole economy in four words: Names are what she leaves and what he spends. It must not be dressed up.*
*"Pray" is identical in folk and Church. There is no folk word for it that is not the word. The State line — "Spiritual attendance, unrecorded" — is the register admitting it has no column.*

### Iiro — cabin and the flight route

Soft-failure escort (`ENCOUNTERS` beat 4): he runs his own route, the objective is his safety, and he is a person, not a quest token (`STORYBOARD_BIBLE` §12).

- Bread — "Half's enough. Is she having some?"
- Water — "I can carry it. I won't spill it."
- Cabin — "Is she asleep, or is it the other thing?"
- Flight start — "I know the way. Past the stump, then the two turns."
- Flight mid — "I'm at the stump! Don't come — hold it there!"
- Wounded (soft failure) — "It got my leg. I'm still going."
- Woodline — "I'm in the trees. I'm in the trees."
- After Anna — *(Iiro says nothing. He holds the cup with both hands.)*

*The wounded line is the whole soft-failure design in six words: he is hurt, the state carries forward, and nothing is over.*

### Birdie — the apple refusal (⚓, register-locked)

- First sight — "You walk loud for someone on his own."
- Apple refused — "I'm not hungry for that." *(the Eden bribe declined; the gesture that defines her)*
- Follows anyway — "I'm not following you. I'm going the same way."
- Misnaming — "Which way now, Caleb?" *(CAST_BIBLE: she misnames him Caleb in the first two shared scenes)*
- If asked her name — "Names are for people who know where they came from." *(v0.3 verbatim; she never explains it)*
- The road — "That road bends toward Bethany. I've never been. I'm still going."

*Ruth is not spoken, written, hinted, or hoverable anywhere in the slice.*

### The Warden — role-fragments only (12 lines)

He cannot be talked down; there is no one left to talk to. Every line is a fragment of a procedure. No line contains a personal pronoun for himself, an explanation, or a threat — a threat would be a relationship.

| Beat | Line |
|---|---|
| First sight | **"Line's mine."** |
| Warning (approach) | **"Off the line."** |
| P1 bark | "Marked." |
| P1 bark | "Post nine." |
| P1 bark | "Back." |
| Ceremony — hangs the lantern | "Line holds." |
| Ceremony — takes E-7 | "Continuance." |
| P2 bark | "On the line." |
| P2 bark | **"Tagged."** |
| P2 bark | "Cleared." |
| The quiet (Wither pulse) | "Quiet." |
| Death | "Line's —" |

*Phase 2 narrows: five- and four-word fragments become two and one. His last line does not finish. Nothing eulogizes him; the aftermath does that, and only if the player chooses it.*

### Notebook

Written in graphite, in Kalev's hand: **folk only, and never degraded.** What is written stays written.

- Anna's entry — three choices, none of them better writing than the others:
  - **"Anna."**
  - **"Anna. The breath went out with me still there."**
  - **"Anna. She asked whether the boy had eaten."**
- Borrowed mercy — "The doses were hers. I am walking on them."
- Bread — "Bread, halved. It was what there was."
- The Warden — "Arvo Lampi. He kept the line after there was no one left to keep it for."
- Tag not yet written — *(A tin tag in the pouch. The border keeps an unwritten mark.)*
- Page 66 — *(Page sixty-six is spoken for. Seven lines down, in his own hand.)* — read-only; the Eli Keene precedent is provenance and stays closed in this slice.
- Page 77 — *(Page seventy-seven. A faint gold rule, seven lines down. Nothing on it.)* — the wife's name is **reserved and never legible**.
- `notebook.names_carried` is the one notebook string that *is* UI framing and so carries all three registers: "Carried, not yet written: {n}" / "The uncommemorated: {n}" / "Unfiled outcomes: {n}".

*The bare "Anna." must be first in the list. A player who picks it has understood the game.*

---

## 5. UI strings

All ×3 registers, all Numbness-driven, all in the JSON. Highlights and the rules behind them:

### The Hearth (D6: the Hearth · keeping vigil · Vigil Save)

| Verb | folk | Church | State |
|---|---|---|---|
| approach | Keep vigil | Keep the lamp | Check in — Warming Station |
| light | Light it | Kindle the lamp | Activate station |
| wait | Wait a while | Abide | Standby |
| remember | Write the Names | Commemorate | File outcomes |
| leave | Bank the fire and go | Go in peace | Check out |

Plus `vigil_save` ("The fire holds. Vigil kept."), `doses_renewed` ("Doses drawn again. {n}."), `numbness_restore`.

*"Bank the fire and go" is the exit verb because banking coals is what the hearth iron was for. The weapon and the rest point share a noun.*

### Death and recovery

`ui.death.message` folk — **"The page falls open."** State — "Outcome failure recorded." Church — "Unwritten leaves scatter."
`open_page_lost` folk — **"Lost to the spreadsheet."** (D6 verbatim; the folk register spits it.) Church — "Unwritten here. Not unnamed elsewhere."
`recovery.respawn` folk — "The fire held. You did not."

*No death string contains the word "died", "failed", or "try again". The page falls open; that is the whole message. Souls-loop legibility is carried by the Open Page marker and the border, not by scolding.*

### Names, attributes, Burden

`ui.level.names_banked` — "Names: {n}" / "The uncommemorated: {n}" / "Unfiled outcomes: {n}" (D6 verbatim across all three).
Attributes are folk-named and Church-silent (D6 gives the Church no column): Pulse · Breath · Hands · Steady · Spirit · Sight, rendered in State as **Form 9** indices I–VI (vital reserve, exertion tolerance, manual force, postural stability, agent response, observational acuity).
`ui.burden.label` — Burden / the weight / accumulated load, with the line **"Bearing it is the work."** (canon v0.3 §XI) — which dies at step 2, because it is exactly the sentence Ember disagrees with.

### Attend and the Turn

Attend / keep them in sight / case focus (D6 verbatim). The Turn / the Withering / affect flattening (D6 verbatim).
The Turn's warnings are written **against the margin, never against a bar** (D6: "buildup renders as the manuscript margin narrowing, never a green bar"), so every folk string is about page space: "The margin is narrowing." → "Not much page left." → "Turned." → "The margin opens again."

### Prompts and world

`interact` · `pick_up` · `offer_apple` · `take_iron` · `gate_locked` · `gate_opened` · `shortcut_opened` · `snare_rooted` ("The line has you. The tags are ringing.").

---

## 6. Boss aftermath

**The name on the tag: `ARVO LAMPI`.**

Chosen against the brief "a real quiet Michigan name". Ironwood is a Gogebic-range town settled by Finnish and Cornish mining families; *Arvo* and *Lampi* are ordinary names on ordinary mailboxes there, which is the requirement — the tag must read like a man, not like a boss. It rhymes with the active cast (Iiro is the same stock) without being conspicuous. Buried, unannounced, in the manner of *Rafe* / Raphael: **arvo** is Finnish for *worth*, and **lampi** is a small woodland pond. Neither is legible to an English-reading player. Nothing in the game points at it.

| Key | folk | Church | State |
|---|---|---|---|
| `tag_name` | Arvo Lampi | Arvo Lampi | LAMPI, A. — post 9 |
| `tag_read` | The tag reads ARVO LAMPI. Below it, POST 9. | A name, stamped in tin, on a line he strung himself. | Post identification recovered: LAMPI, A. Post 9. |
| `write_prompt` | Write the name | Commemorate him | File the outcome |
| `walked_away` | The tag stays in your pouch. The border keeps the mark unwritten. | One name still uncommemorated, and it is on you. | Outcome unfiled. Tag retained. |
| `hearth_lit` | The clearing has a fire in it now. | A lamp where the lamp went out. | Warming Station established, Ironwood clearing. |
| `turn_cleansed` | Writing it opens the margin. | Commemoration lifts the Withering. | Filing returns the index to baseline. |

**The written entry** (folk only, permanent, undegradable):

> **Arvo Lampi. He kept the line after there was no one left to keep it for.**

The entry states a fact and passes no verdict. It does not forgive him, mourn him, or call him a victim — it says what he did, in the tense of a thing that is over. It is the same sentence shape the notebook uses for Anna, which is the point: the man who killed him writes him down the way he writes down the people he could not save.

*Registers, side by side, one last time — folk and Church spell the name identically and the State abbreviates it. Nothing else in the slice states the thesis that plainly.*

---

## 7. Authoring rules (for anyone adding a string later)

1. **Length caps.** folk ≤ 14 words per sentence, ≤ 2 sentences per card line. Church ≤ 1 clause past the point. State: no cap, but every sentence must be fileable.
2. **Banned in folk**: therapy register; quest-log register ("Objective:", "Complete", "Reward"); triumph language at any care or victory moment; clinical jargon *unless* Kalev is under pressure and slipping into hospital shorthand (`v0_3` §XII — use sparingly, and it is a tell, not a style).
3. **Banned everywhere**: melodrama, exclamation marks outside a shout across distance (Iiro's flight barks are the only ones in the slice), addiction clichés, any string that makes Ember look obviously bad (`D6`: if players do not want to use Ember, the design has failed), any string that makes the State look cartoonish.
4. **Names over categories.** If a string can use a person's name, it does — until Numbness takes it. That is the only reason the game ever uses a category.
5. **No string may explain a mechanic that the fiction already names.** Borrowed mercy gets *one* notebook line, not a tutorial popup (`ENCOUNTERS` beat 5).
6. **Test for a new folk string:** could it sit inside the §VII cabin prose without a seam? If not, rewrite it.
7. **Test for a new State string:** would a tired person who believed they were helping have written it? If it sneers, it is wrong.

---

## 8. Disputes and authored extensions

Noted, not edited — no packet file was changed by this slice.

1. **Register vocabulary collision (ADR 0005 vs D6).** ADR 0005 reserves *folk / sanctioned / sacred*. D6 legislates *folk / Church / State* for the same axis. Both are canon; nothing contradicts, but two vocabularies for one system will confuse a cold worker. Mapping is fixed in §1. **Recommend** a one-line amendment in D6 or a new ADR recording the mapping, owner's call.
2. **Anna's last line is an open canon question.** `STORY_RESCUE_PLAN` lists "Anna's last line; the notebook line after her death" among the questions to close *before drafting*. **"Did the boy eat?"** is authored here as a candidate and marked PROPOSED: it puts her last words on the Bread beat (ADR 0006), keeps her a mother rather than an oracle, and refuses a benediction. **Not owner-ratified.** The notebook entry choices are likewise proposals.
3. **She does not give permission.** No Anna line grants Kalev the leftover doses. Canon's borrowed mercy (`v0_3` §VII: *I took his death. I earn the life*) depends on him taking them. A gift would repair the theology and ruin the arc. Flagged in case a later writer is tempted.
4. **The notebook's folk name.** v0.3 §V records the notebook's folk register as "(no name aloud)" — Kalev never names it in speech. D6 does not mention the notebook at all, so it is unresolved whether that rule binds a **UI label**. Authored position: it does not (a card is not speech), so `item.key.notebook.name.folk` = "the notebook", and no character ever says the word. If the owner rules the other way, set that one field to `null` and let the card render Church/State only — everything else stands. Raised by the canon-check pass on this slice.
5. **Tincture-variant Church/State cells.** D6's table leaves both blank ("—") for the five variants. Authored here: State codes built from the canon abbreviation set (v0.3 §V — LOL, PHRINE, etc.), Church left deliberately `null` except Salt Wash ("the washing"). This **extends** an empty cell; it does not override a filled one.
6. **Church names for liturgical pouch materials.** v0.3 §V marks only Pulseleaf "(no church name)" and leaves the rest blank. Church names authored for honey, cedar, wool, cotton, salt, myrrh, oil under the rule in §1. Extension, flagged.
7. **Non-drug State codes.** Honey/Cedar/Wool/Cotton/Salt/Myrrh/Oil have no canon abbreviation, so the State register uppercases the folk word — the same thing canon does for PHRINE, CILLIN, FUROS. No invention.
8. **Hearth restore shape.** D6 says "partially restored at a Hearth" and no more. One step, lost at first hostile contact, stat penalties permanent (§2) is authored. It belongs in `TUNING_V0.md` once ratified; it is stated here because the ladder cannot be written without it.
9. **`Form 9` index names.** D6 gives State the phrase "Form 9 indices" with no contents. Six index names authored (§5). Extension.
10. **Wolf-loot salvage classes.** "biological salvage, class I–III" is authored State vocabulary. No canon term exists; the pattern follows the Office of Continuance's habit of classing what it cannot name.
11. **`_meta` key in the JSON.** The file's first entry is `_meta`, carrying the schema note. It satisfies the `folk` invariant so validators pass; consumers should skip keys with a leading underscore.
12. **Not written, deliberately.** Kalev's own dialogue (not in scope); legs 2–6; Lena, Ilarion, Bethany, Halloway (cut from slice per D7); Ruth; anything on page 77.

---

## 9. Key namespace

| Prefix | Contents | Registers |
|---|---|---|
| `item.weapon.*` `item.tincture.*` `item.ember` `item.pouch.*` `item.loot.*` `item.charm.*` `item.key.*` | 31 cards × `{name,desc,lore}` | 3 + ladder |
| `npc.<who>.attrib` | speaker attributions (5) | 3 + ladder |
| `npc.anna.*` `npc.iiro.*` `npc.birdie.*` | spoken lines | folk only |
| `npc.anna.presence.*` | gravity-encounter responses | folk only, register-locked |
| `boss.warden.<beat>` | 12 role-fragments | folk only |
| `boss.aftermath.*` | the tag, the writing, the walking away | 3 + ladder (except the written entry) |
| `notebook.*` | entries in Kalev's hand | folk only (except `names_carried`) |
| `ui.hearth.*` `ui.death.*` `ui.recovery.*` `ui.level.*` `ui.attr.*` `ui.burden.*` `ui.attend.*` `ui.turn.*` `ui.tincture.*` `ui.ember.*` `ui.presence.*` `ui.prompt.*` `ui.world.*` | UI | 3 + ladder |

**212 keys** in `text_bible_v0.json` (211 strings + `_meta`).

Validate:

```bash
python3 -c "import json,sys; d=json.load(open('design_system/v1_0_threejs_soulslike/text_bible_v0.json')); assert len(d)>=80, len(d); assert all('folk' in v for v in d.values()); print(len(d),'keys')"
```

When `game/data/` exists, this JSON is its source. Keys are stable; strings are not — a string may be retuned by the feel/art gates, but **a key may only be renamed by amending this file first.**
