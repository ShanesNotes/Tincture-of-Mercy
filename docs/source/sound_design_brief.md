# Sound Design Brief — Tincture of Mercy
## Ambient world, foley, combat SFX, UI cues for the opening slice

---

## What this document is

A comprehensive catalog of every diegetic sound the player will hear in the opening slice (Acts 1–5), plus the ambient beds that underlie the world *between* sounds. The score (cinematic, day-loop, combat, long-pour) handles emotional architecture; this document handles **the texture of the world as a physical place**.

Sound design is the half of game audio that does not announce itself. When it works, the player doesn't notice it; when it fails, the world feels flat and the score has nothing to lean against. The discipline here is **layered believability**: every footstep is on a specific surface, every door has a specific hinge, every wolf has a specific throat. The cabin is a real cabin, the cold is a real cold, and the player feels the world before they think about it.

**Generation tool note**: most of these are generatable in ElevenLabs Sound Effects, Suno (for longer ambient beds), Adobe Audition's generative audio, or Freesound.org for non-generated sourcing. Where a sound is too specific or important to leave to generation, I flag it for *real foley capture* — a USB mic and a quiet afternoon will outperform any AI tool on the load-bearing sounds.

---

## The audio philosophy of the cabin

Three principles before the catalog:

**1. The cold is audible.** Late autumn / early winter in rural Michigan has a specific sonic signature: distance carries further, high frequencies feel thinner, wood creaks louder, breath is heavier and slightly icy. The world should sound *colder than it looks*. Pad every outdoor ambient with subtle wind, every indoor ambient with the contrast of warmth-against-cold (hearth-crackle prominent, walls creaking with thermal contraction).

**2. Silence is an instrument.** The cabin is a place where you can hear a spoon set down across the room. Mix everything so that the *absence* of sound has weight. When the wolves arrive, they don't announce themselves with stingers — the *silence breaks* with a single far-off howl. Build the soundscape so that silence is the default and every sound is *placed*.

**3. The body is present.** Kalev's breath, footsteps, hand movements, and small unconscious sounds (a sigh, a sniff, a clearing throat) should be subtly audible. Not constant — that would fatigue — but threaded through quiet moments. The player should feel they are inhabiting a *body in a room*, not floating above a scene.

---

## Section 1 — Ambient beds (looping)

These are the long-running environmental loops that play under everything else. Each is generated once, then layered with situational SFX.

### 1.1 Cabin Interior — Day

**Use**: plays through Acts 1–3 inside the cabin during daylight.

**Length**: 3:00 minute seamless loop.

**Layers**:
- Hearth-crackle (continuous, gentle — embers, occasional small pop)
- Wood-beam creak (intermittent, every 20–45 seconds, deep low frequency)
- Wind against shutters (intermittent, distant)
- A wall clock ticking softly somewhere off-screen (continuous, ~60 BPM)
- Cabin-wide low-frequency drone (the building "breathing" — just below conscious hearing)
- Distant bird occasionally (chickadee, nuthatch, crow at greater distance)

**Generation prompt**:
> Ambient sound bed three minute seamless loop, interior of small wooden cabin in rural Michigan late autumn afternoon, gentle hearth fire crackling continuously with occasional small pop of embers, intermittent wooden beam creaking from thermal contraction every twenty to forty seconds in deep low frequency, distant wind against window shutters occasional, soft mechanical wall clock ticking at sixty beats per minute somewhere off in another room, very subtle building drone below conscious hearing, occasional distant chickadee or nuthatch through windows, occasional far-off crow at greater distance, no music no instruments no human voices, no dramatic stings, naturalistic field recording quality, slightly thin high frequencies suggesting cold air, mono-to-stereo natural ambient

---

### 1.2 Cabin Interior — Dusk/Evening

**Use**: plays through Acts 4–5 inside the cabin as light fails.

**Length**: 3:00 minute seamless loop.

**Layers shift from 1.1**: the hearth is now more prominent (it's the primary light source), the clock-tick is slightly louder (silence has settled), wind has picked up against shutters, the wood creaks are more frequent (temperature drop), and a single new layer enters — **the cabin "settling"** as outdoor temperature drops.

**Generation prompt**:
> Ambient sound bed three minute seamless loop, interior of small wooden cabin in rural Michigan late autumn early evening as light fails, hearth fire crackling more prominently now as primary light source, wooden beam creaking more frequently every fifteen to thirty seconds from temperature drop, wind picking up against window shutters with occasional whistle, soft mechanical wall clock ticking at sixty BPM more audible in the deepening quiet, the cabin settling sound very subtle low-frequency thermal contraction pops, no birds, no music no instruments no human voices, no dramatic stings, naturalistic field recording quality, slightly thinner high frequencies than day version, mono-to-stereo natural ambient, dusk mood

---

### 1.3 Outdoor — Cabin Yard, Daytime

**Use**: when Kalev steps outside to fetch water or forage in Acts 1–2.

**Length**: 2:30 minute seamless loop.

**Layers**:
- Distant wind through bare or half-bare hardwood trees
- Occasional creak of larger branches
- Birds — chickadees, nuthatches, a distant crow, intermittent
- The well-pump in the distance when wind catches it (a faint metallic creak)
- Leaves rustling on the ground in occasional small drifts
- A far-off woodpecker very occasionally (1–2 times in the loop)

**Generation prompt**:
> Ambient outdoor sound bed two minutes thirty seconds seamless loop, rural Michigan cabin yard surrounded by hemlock and bare hardwood forest in late autumn afternoon, gentle wind through bare and half-bare hardwood trees, occasional larger branch creak, scattered birdsong from chickadees nuthatches with one distant crow, faint metallic creak of an old well pump catching the wind, dry leaves rustling in small drifts on the ground occasionally, very occasional far-off woodpecker drumming twice in the loop, no music no instruments no human voices, naturalistic field recording quality, cold air thin high frequencies, peaceful but slightly desolate, mid-distance perspective as if standing in a yard

---

### 1.4 Outdoor — Cabin Yard, Dusk

**Use**: when Kalev steps outside in late Acts 4–5 or after the wolves retreat.

**Length**: 2:30 minute seamless loop.

**Layers**:
- Wind through trees, slightly stronger than 1.3
- An owl calling distantly (single hoot every 30–60 seconds)
- Leaves still rustling but less, the air is colder
- A coyote-or-distant-wolf call far off (once across the loop, foreboding)
- A single dry branch falling somewhere mid-loop
- The metallic well-pump creak

**Generation prompt**:
> Ambient outdoor sound bed two minutes thirty seconds seamless loop, rural Michigan cabin yard at dusk in late autumn, wind through bare hardwood and hemlock trees stronger than daytime, distant owl single hoot every thirty to sixty seconds, dry leaves rustling occasionally less than daytime, single distant coyote or wolf call far off somewhere in the loop, one dry branch falling and hitting forest floor mid-loop, faint metallic creak of old well pump in wind, no music no human voices no dramatic stings, naturalistic field recording quality, very cold air thin high frequencies, foreboding but not yet alarming, mid-distance perspective

---

### 1.5 Forest Edge — Foraging

**Use**: when Kalev gathers herbs at the wood-edge in Act 2.

**Length**: 2:30 minute seamless loop.

**Layers**:
- Closer wind, more leaf-rustle since Kalev is among the trees
- Small bird activity (chickadee close, nuthatch close)
- Small mammal sounds (a squirrel running on a branch, leaves displaced by an unseen something)
- Distant water — a creek somewhere off, very faint
- Branches against branches in wind

**Generation prompt**:
> Ambient outdoor sound bed two minutes thirty seconds seamless loop, edge of mixed hardwood and hemlock forest in rural Michigan late autumn, wind close through bare branches with substantial leaf rustle on forest floor, chickadee and nuthatch nearby actively foraging, occasional small mammal rustling leaves a squirrel running on a branch, very faint distant creek water somewhere off, dry branches scraping each other in wind, no music no human voices, naturalistic field recording close perspective as if standing at forest edge, cold air, peaceful, foraging mood

---

## Section 2 — Kalev's body and movement

The protagonist's diegetic body sounds. These are pitched/timed to player input. Most should be generated as a **set of variations** (4–8 per category) and randomized in engine to avoid repetition fatigue.

### 2.1 Footsteps — wood floor (cabin)

4 variations. Soft-soled boot on aged pine board. Each step has slight creak from the floorboard.

**Prompt**:
> Footstep sound effect, single step, soft-soled leather boot on aged dry pine wood floor interior cabin, slight floorboard creak with the step, dry not wet, mid-weight adult man, foley quality close-mic recording, no reverb, isolated single step

### 2.2 Footsteps — packed dirt / cabin yard

4 variations. Boot on hard-packed cold soil with occasional dry leaves.

**Prompt**:
> Footstep sound effect, single step, soft-soled leather boot on hard-packed cold dirt yard with scattered dry autumn leaves crunching, mid-weight adult man, foley quality close-mic, no reverb, dry, single isolated step

### 2.3 Footsteps — forest floor (foraging)

4 variations. Boot on damp forest duff, leaves, occasional snap of small twig.

**Prompt**:
> Footstep sound effect, single step, soft-soled leather boot on damp forest floor of leaf litter and pine duff with occasional small twig snap, mid-weight adult man, foley quality close-mic, slight forest reverb tail, isolated single step

### 2.4 Footsteps — running (Act 5 combat)

3 variations of each above surface, accelerated. The runs are *not* heavier — Kalev is wounded and moving with desperation, not power.

**Prompt** (template, vary surface):
> Footstep sound effect, single running step, soft-soled leather boot on [SURFACE], faster cadence than walking, slight imbalance suggesting fatigue or wound, mid-weight adult man, foley close-mic, isolated single step

### 2.5 Cloth movement

Subtle wool-and-linen rustling when Kalev turns, kneels, reaches. 4 variations.

**Prompt**:
> Cloth movement sound effect, wool and linen layered clothing rustling with body movement, gentle not dramatic, mid-weight adult man turning or reaching, foley close-mic, no reverb, isolated 1-2 second clip

### 2.6 Breath cycles

These need careful authoring. Three states:

- **Calm breath** — for Acts 1–3, threaded into quiet moments at low volume. 6-second cycle (inhale 2s, hold 1s, exhale 3s).
- **Working breath** — for crafting, kneeling, lifting. Slightly heavier, 4-second cycle.
- **Combat breath** — for Act 5. Sharp, urgent, audible inhales, controlled exhales. 2-second cycle.

**Prompt (calm)**:
> Calm breath cycle sound effect, adult man breathing quietly at rest, six second cycle inhale through nose two seconds hold one second exhale through nose three seconds, very low volume foley close-mic, no music, isolated loopable

**Prompt (combat)**:
> Combat breath cycle sound effect, adult man breathing under physical stress and fear, two second cycle sharp audible inhale through mouth controlled exhale through teeth, slight rasp on exhale, foley close-mic, no music, isolated loopable

### 2.7 Small unconscious sounds

A sigh, a sniff (cold weather), a throat-clearing, a quiet grunt of effort. 2–3 variations of each. These play *very occasionally* in quiet moments, threading the body through the silence.

**Prompt**:
> Small unconscious body sounds set, adult man in cold rural setting, including: one quiet sigh, one cold-weather sniff, one soft throat clearing, one quiet grunt of effort kneeling or lifting, foley close-mic, no music, naturalistic not performed, isolated separate clips

---

## Section 3 — Cabin interior interactions

Every diegetic surface Kalev touches or affects.

### 3.1 Doors

- **Cabin front door — opening**: heavy wood, leather hinge or worn iron hinge creak, swings inward with weight. Single 2-second clip.
- **Cabin front door — closing**: same hinge in reverse, ends with the wooden thunk of door meeting frame and a small iron latch click.
- **Interior partition curtain or door** (if cabin has one): lighter, smaller, quicker.

**Prompt**:
> Door sound effect, heavy wooden cabin front door opening inward, worn iron hinge creak prominent, two second clip, foley close-mic with small natural reverb of interior space, no music, single isolated event

### 3.2 Hearth and fire

- **Adding wood to fire**: log placed on coals, brief flare-up of flame, then settle. 3 seconds.
- **Poking the fire**: iron poker disturbing coals, embers shifting, brief flare.
- **Pot or kettle hung over fire**: iron handle on iron hook, the chain or arm creaking under weight.

**Prompt**:
> Sound effect of adding split log to existing hearth fire, log placed on hot coals with brief crackling flare-up of flame then settle back to gentle burn, three second clip, foley close-mic with small interior reverb, no music

### 3.3 Apothecary table — crafting

This is the load-bearing crafting interaction in Act 3 and needs full coverage.

- **Pestle in mortar — grinding herbs**: ceramic-on-ceramic, slightly different per herb (dry leafy = light scrape, dried root = harder grind). 3–4 variations.
- **Pouring water into a flask**: glass-and-water specific sound, 2 seconds.
- **Setting glass flask on wood table**: small clink. 2 variations.
- **Cork or stopper into flask**: small rubbery-squeaky pop. 2 variations.
- **Lighting a candle (for distilling)**: match strike or flint-and-steel — flint preferred (more period-correct), 1.5 seconds.
- **Liquid simmering in flask over candle**: gentle bubble sound, loopable 10-second clip.
- **Decanting tincture from flask to bottle**: liquid pouring at small volume, glass-clinking at end.
- **Writing in notebook**: quill or graphite pencil on paper, 3–4 variations of different stroke lengths.
- **Page turning**: stiff paper turning in a leather-bound book, 2 variations.

**Prompt (pestle/mortar)**:
> Sound effect of pestle grinding dried herbs in ceramic mortar, dry leafy material being crushed and ground, ceramic-on-ceramic light scrape and percussive grind, foley close-mic, no reverb, two second clip, naturalistic

**Prompt (writing in notebook)**:
> Sound effect of pencil or graphite stub writing on aged paper, single short word being written, scratch of soft graphite on slightly rough paper, foley close-mic, no reverb, two second clip, naturalistic single isolated stroke

### 3.4 Patient care interactions

- **Pouring water into a tin cup**: liquid + tin reverberation, 2 seconds.
- **Holding cup to patient's lips, patient drinks**: small swallow sound, very subtle. **This is foley you should record yourself or pull from a clean library** — generated versions of "person drinking" tend to sound performed.
- **Setting cup down on bedside table**: tin on wood, small clink.
- **Adjusting blanket / quilt**: cloth rustle slightly heavier than Kalev's clothing.
- **Pressing hand to forehead (checking fever)**: very subtle skin-on-skin, almost inaudible — used as cue that the action happened, not as foreground audio.
- **Spoon in bowl (porridge)**: wooden spoon in ceramic, scrape and tap.

**Prompt (cup of water to patient)**:
> Sound effect of small tin cup being lifted from wooden bedside, brought to patient's lips, faint small swallow sound, cup lowered, very intimate close-mic foley, naturalistic restrained not performed, three second clip total, no music no breath

### 3.5 Pouch and inventory

- **Opening a leather pouch**: drawstring loosening, single pull. 1 second.
- **Taking item from pouch**: small object retrieved, leather creak.
- **Putting item into pouch**: reverse, leather creak.
- **Closing pouch**: drawstring pulled tight, small wood-bead clack at the end if drawstring has beads.

**Prompt**:
> Sound effect of small leather drawstring pouch being opened, single pull of drawstring with leather creak, one second clip, foley close-mic, no reverb, naturalistic isolated

### 3.6 The Tincture Wheel UI interactions

Diegetic but slightly stylized — these are sounds the player hears when interacting with the crafting interface. Should feel of-the-world (real materials) but with slight UI clarity (clean attack and decay).

- **Selecting an ingredient on the wheel**: a small glass clink with light reverberation.
- **Confirming an ingredient choice**: a slightly warmer wooden tap.
- **Committing the craft**: a single deliberate exhale (Kalev's breath, audible) + the strike of flint to candle, layered.
- **Failed craft (Miss / flask cracks)**: glass cracking, liquid spilling — **only plays at the Act 3 forced-Miss outcome if it lands; do not deploy in other crafts.**

**Prompt (commit craft)**:
> Sound effect of brief deliberate adult man exhale layered with flint-and-steel sparking to candle ignition, two second clip, foley close-mic, no music, naturalistic, slightly ritualistic feel without being theatrical, isolated single event

---

## Section 4 — The forced Glance (Act 4) — special audio

The mother's death scene has three discrete audio events that must be authored with care. These are the single most emotionally loaded sound design moments in the slice.

### 4.1 The administration

Anna receives the tincture. Same audio palette as 3.4 (water to patient) — *deliberately matching*, so the player does not yet know this is different from any other administration.

### 4.2 The moment of partial uptake

She drinks. Her breathing audibly changes — the breath cycle shifts from labored 4-second to a slightly easier 3-second cycle for about 15 seconds (the rally). Then the breath becomes ragged. Then stops.

**Prompt (breath transition)**:
> Sound effect of dying woman's breath cycle transition, fifteen second clip, begins with labored four second cycle then shifts to slightly easier three second cycle suggesting brief rally for about ten seconds then becomes ragged and uneven and stops on the final exhale which is longer and softer than expected, foley close-mic, restrained naturalistic not performed, no music no other sounds, intimate

### 4.3 The cessation

The moment her breathing stops. There is no sting. There is no dramatic chord. There is only **the absence of the breath cycle that the player has been hearing in the ambient mix for three acts**. The silence where her breath used to be is the entire sound design of this moment. The hearth keeps crackling. The clock keeps ticking. The cabin keeps breathing. She does not.

**Implementation note**: this is *not* a generated sound. This is a *mix decision*. The breath layer in the ambient bed simply *stops*. The player's body will register the absence within five seconds even if their conscious mind does not catch it.

### 4.4 The notebook entry writing itself

The page turns by itself. Kalev's hand is shown to write Anna's name under a charcoal cross *without player input*. The sound is the **same writing sound from 3.3, but slower, more deliberate, with the addition of a single soft choke of held breath from Kalev** between two strokes. This is the only moment in the slice where Kalev makes a sound that is unmistakably grief.

**Prompt**:
> Sound effect of pencil writing single short name on paper slowly with deliberation, including one barely audible soft choke of held breath from adult man between two of the strokes, four second clip, foley close-mic, no music no reverb, intimate restrained naturalistic, single isolated event

---

## Section 5 — Wolves and Act 5 combat

### 5.1 The first howl

Distant, far off. Foreboding. Travels through cold air. Single 4-second clip.

**Prompt**:
> Sound effect of single timber wolf howl heard from very far away across cold late autumn Michigan landscape at dusk, four second clip, distant perspective with natural reverb of open distance carrying the sound, slightly thin high frequencies suggesting cold air, mournful low pitch single voice not a pack chorus, foley field recording quality, no music no other sounds

### 5.2 The closer howl (response)

Closer, second wolf answering. 3-second clip. Communicates that there is more than one.

**Prompt**:
> Sound effect of single timber wolf howl heard from medium distance perhaps a quarter mile away in cold late autumn Michigan forest at dusk, three second clip, less reverb than the distant version, slightly higher pitched suggesting younger or different wolf, communicates pack presence, foley field recording quality, no music

### 5.3 Wolf at the door

The wolves' arrival is signaled by:
- A scrape of claw against the cabin's wooden door (single 1-second clip, can repeat).
- A growl through the door — close, low, threatening. 2-second clip.
- A sniff at the door-crack — wet animal breath, brief. 1-second clip.
- Pacing footsteps in the yard — clawed feet on hard-packed dirt. 4 variations, looping.

**Prompt (growl)**:
> Sound effect of single timber wolf growl heard from close distance through wooden cabin door, low threatening continuous growl with audible breath, two second clip, foley close-mic with slight muffling as if heard through wood, predatory not aggressive bark, no music

### 5.4 Combat wolf sounds

Once combat is engaged, wolves produce a richer audio palette:
- **Lunge bark/snarl** — sharp aggressive vocalization at moment of attack. 4 variations.
- **Snapping jaws** — teeth clacking together as they bite at air or miss. 4 variations.
- **Yelp on hit** — pained vocalization when Kalev's cudgel connects. 3 variations.
- **Death cry** — final pained vocalization when a wolf falls. 2 variations.
- **Continuous combat breath** — wolf panting and chuffing between attacks. Loopable 8-second clip.
- **Pawing claws on dirt and wood** — movement sounds in combat. Multiple variations.

**Prompt (combat snarl)**:
> Sound effect of timber wolf lunge snarl during attack, sharp aggressive vocalization with audible bared teeth and breath, one and a half second clip, close perspective, foley field recording quality, predatory not pet dog, no music no other sounds, isolated single event

**Prompt (yelp on hit)**:
> Sound effect of timber wolf yelp of pain from blunt impact, sharp involuntary vocalization cut short, one second clip, close perspective, foley quality, naturalistic not performed, isolated

### 5.5 Cudgel combat sounds

- **Cudgel swing through air** — wooden whoosh. 4 variations.
- **Cudgel impact on wolf** — heavy wooden thud into flesh, slight bone-crunch. 4 variations.
- **Cudgel impact on cabin wall (miss)** — wood-on-wood thud. 3 variations.
- **Cudgel on ground or floor (miss)** — wood-on-dirt or wood-on-floorboard thud. 3 variations.
- **Cudgel readied / gripped tighter** — small leather glove creak. 2 variations.

**Prompt (impact)**:
> Sound effect of heavy wooden cudgel impact on large animal body, blunt wooden thud with slight muffled flesh and bone crunch underneath, one second clip, foley close-mic, no reverb, no music, naturalistic visceral but not gory, isolated single event

### 5.6 The bash ability — taunt

Kalev's threat-pulling ability needs a distinct audio signature so the player learns to associate it with the threat-table state change. Suggested layering:
- A sharp shout/yell from Kalev (single syllable, wordless aggression).
- The cudgel impact (heavier than normal swing).
- A subtle low-frequency thud underneath for weight.

**Prompt**:
> Sound effect of adult man sharp single-syllable aggressive shout layered with heavy wooden cudgel impact on large animal body, two second clip, the shout is short and wordless and pulls attention, the impact is heavier than a normal strike, foley close-mic, no music, isolated single event, distinct audio signature

### 5.7 The thrown object (the taunt-pull alternative)

If Kalev throws a stone or cup to pull the wolf off Iiro:
- **Throwing motion** — fast cloth-rustle.
- **Object whistling through air** — single 1-second clip per object.
- **Object impact on wolf or floor** — stone-on-wood, pewter-on-floor, etc.

### 5.8 Iiro fleeing

As Iiro escapes through the back door:
- **Small running footsteps** — boy on packed dirt then forest leaves, lighter and quicker than Kalev's.
- **Door closing behind him** (the back door).
- **A single small cry from the boy** as he gets far enough away — fear, not pain. 2-second clip, distant.
- **Branches snapping in the woodline** as he disappears into the trees.

### 5.9 The leashing / retreat

When the encounter resolves:
- **Wolves panting in retreat** — heavy breath moving away.
- **Claws on dirt receding** — footsteps fading into the distance.
- **One final distant howl** — different in tone from the arrival howl, more frustrated than predatory.
- **Silence falling back into the cabin yard** — the absence of wolf sounds, layered with returning ambient (Section 1.4 sounds resuming).

---

## Section 6 — UI and notebook sounds

The player will interact with the notebook constantly. These sounds should be diegetic-feeling (real paper and ink) rather than gamey (clicks and beeps).

### 6.1 Notebook open / close

- **Notebook opening**: leather binding flex, pages settling. 2 variations.
- **Notebook closing**: leather meeting leather, slight clap. 2 variations.

**Prompt**:
> Sound effect of small leather-bound notebook being opened, leather binding flexing pages settling open with slight paper rustle, two second clip, foley close-mic, no reverb, naturalistic, single isolated event

### 6.2 Page turning

- **Page turn forward**: stiff aged paper turning. 4 variations.
- **Page turn back**: same in reverse.

### 6.3 Marginalia appearing

When the game writes a marginalia entry automatically (after a P3 roll, after a named-event), the visual of ink appearing on the page is accompanied by:
- **A soft scratch of pencil** (3.3 variations work).
- **For named events** (Anna's death, Iiro's escape, the wolves retreating): a slightly more deliberate version, with an added soft bell-tone underneath at very low volume — *the same struck bell from the score, played pianissimo, a single tone*. This is the only place where score-instrument and SFX cross over, and it should be used sparingly — perhaps 3–5 times across the entire slice.

**Prompt (named-event marginalia)**:
> Sound effect of pencil writing single short notebook entry slowly with deliberation, layered underneath at very low volume a single soft pianissimo struck small brass bell tone barely audible, three second clip, foley close-mic, intimate restrained, only used for emotionally significant notebook entries, no music otherwise, isolated single event

### 6.4 Inventory and character sheet flip

When the player opens the character sheet or inventory page:
- **Notebook page flip with destination** (more deliberate than a casual page turn).
- **A soft brush of fingers across the page** (suggests Kalev is finding his place).

### 6.5 Stat changes

When Witness ticks up, when a level-up happens, when a Vocation point is gained — these are *quiet* events that respect the contemplative tone. Audio:

- **Witness tick**: a single very soft graphite stroke. Used many times per session at low volume.
- **Level-up**: a *single* struck bell tone (the score's bell, at mezzo-forte) + a slightly longer notebook page-turn. Used 25 times in a full playthrough at most. Should feel ceremonial.
- **Vocation point gained**: the notebook turns to the Vocation page automatically, with a faint *new ink line appearing* sound — a slow, more deliberate version of the marginalia sound.

**Prompt (level-up)**:
> Sound effect of single struck small brass bell tone at mezzo-forte volume layered with deliberate leather-bound notebook page turning, three second clip, the bell is the same instrument used in the score played as a single ceremonial tone, foley close-mic, slight natural reverb tail, no music otherwise, isolated single event, ceremonial restrained

---

## Section 7 — Patient body-state cues

Kalev's interior states (Burden, Pressure, Numbness) need subtle audio signposting.

### 7.1 Burden rising

Burden is the carried weight of others' suffering. As it rises:
- A subtle low-frequency drone enters the mix, just below the threshold of consciousness.
- Kalev's footsteps become slightly heavier (different sample set deployed when Burden is over 50%).
- His breath cycle becomes longer and slower.

**Implementation note**: this is layered into the existing ambient and footstep beds, not a new sound. The composer/sound designer authors the *high-Burden* versions of footsteps and breaths to use the same character but slightly heavier.

### 7.2 Pressure spiking

Pressure is reactive strain. A short-duration spike (during difficult moments — Anna's death, the wolves' arrival):
- A high thin frequency enters briefly (a sustained tone in the 800–1200 Hz range), like a faint ringing in the ears.
- The ambient bed's bass drops out for 2–3 seconds.
- A single sharp inhale from Kalev's breath layer.

**Prompt**:
> Sound effect of brief sustained high-frequency tone in 800-1200 Hz range fading in over half a second and out over one and a half seconds, suggests faint ringing in ears from stress, layered with a single sharp adult man inhale near the end, three second clip total, foley quality, no music, used to signal a momentary spike of stress, isolated event

### 7.3 Numbness onset

Numbness is Ember-induced detachment. When it deepens:
- The ambient mix gets quieter overall (a -6dB duck on the ambient bed).
- High frequencies are slightly rolled off (mild low-pass filter).
- Kalev's footsteps and breath are dampened.
- A very faint pink-noise wash enters, like distant white static.

**Implementation note**: this is a *mix automation*, not a triggered sound. The audio engine performs this filter when the Numbness state crosses a threshold. The player should feel the world become *less present* rather than hear a specific cue.

---

## Section 8 — Environmental specifics for the slice

A few one-off sounds specific to the cabin and the slice.

### 8.1 The well-pump

When Kalev fetches water in Act 1:
- **Pump handle worked** (3–4 strokes) — metallic creak with the back-pressure.
- **Water emerging into bucket** — first small splash, then steady fill.
- **Bucket lifted with water** — handle creak, water sloshing slightly.

### 8.2 The cot creaking

Iiro and Anna both lie on cots. When they move:
- **Cot frame creak** — rope-and-wood frame under shifting weight.
- **Quilt rustle** — heavier than Kalev's clothing.

### 8.3 The kettle / pot for porridge

In Act 2:
- **Water poured into kettle** — generated.
- **Stirring porridge** — wooden spoon in cooking pot, rhythmic circular motion.
- **Porridge simmering and bubbling** — gentle, loopable 30-second clip.
- **Ladle scraping pot** — wooden ladle removing porridge.

### 8.4 The deer at the woodline

When Kalev sees the deer in Act 1 (P11 aggro-radius teach):
- **Deer hoof on forest floor** — sharper than a wolf paw, lighter.
- **Deer huff / snort** — startled vocalization. 2-second clip.
- **Deer bounding away** — receding hooves on leaves and branches.

**Prompt**:
> Sound effect of single startled white-tailed deer huff snort followed by quick hooves bounding away through autumn leaves and breaking small branches, three second clip, foley field recording quality, mid-distance perspective, naturalistic, no music

### 8.5 The kantele sitting in the corner

A small but powerful detail: a kantele rests in the corner of the cabin (foreshadowing Kalev's later Hesychast practice, gesturing toward the family's Finnish heritage). If the player walks past and brushes it:
- **Single accidental string-pluck** — one note, the same D from the motif. A small environmental Easter egg for the player who notices.

**Prompt**:
> Sound effect of single accidental pluck of one string on a kantele Finnish zither, single D-natural note sustained for two seconds with natural decay, foley close-mic, slight room reverb, naturalistic as if brushed by clothing, no music, isolated single event

---

## Section 9 — The audio mix architecture

Six layers, mixed in this priority order from quietest to loudest:

1. **Sub-conscious ambient bed** (Sections 1.1–1.5) — always playing, quiet
2. **Body-state filter automation** (Section 7) — modifying everything else
3. **Body sounds** (Section 2) — Kalev's breath, footsteps, cloth
4. **Diegetic interactions** (Sections 3, 6, 8) — what Kalev touches
5. **Score** (the four music tracks) — emotional architecture
6. **Special / load-bearing audio events** (Section 4 — the death; Section 5 — the wolves) — these duck other layers and command the player's attention

The mix should be quiet by default. Most of the time, the player should hear the hearth and a faint wind and Kalev's breath, and that should be *enough*. When something significant happens, *that* is what gets foregrounded — but only briefly. The score and the special events are the only layers that rise above mezzo-piano in the final mix.

**Reference for mix density**: think *Dear Esther*, *Firewatch*, *Inside* — games where ambient and foley do most of the work and music is the punctuation. Not *Skyrim* or *Witcher* where music is continuous wallpaper.

---

## Section 10 — Tools and workflow

A practical note on producing this.

**Generation tools that work well for this list**:
- **ElevenLabs Sound Effects** (best single tool for one-off SFX, supports detailed text prompts)
- **Suno / Udio** (best for ambient beds — the 2:30+ loops)
- **Adobe Audition** (for mixing, layering, and DAW work)
- **Freesound.org** (for real field recordings — wolves especially benefit from real wolf audio rather than generated)

**Real foley capture recommendations**: at minimum, record yourself producing:
- Footsteps on the actual surfaces (wood floor, dirt, leaves)
- Cloth movement (with the clothing materials you imagine Kalev wearing)
- Patient interactions (water in cup, swallow, blanket adjust)
- The notebook writing (real pencil on real paper)
- Kalev's breath cycles (yours, recorded in three states)

These six categories will be heard hundreds of times per playthrough. A real-foley pass on them will outperform any AI-generated set, and a single afternoon with a USB mic and the actual materials produces results that no generation tool currently matches.

**Wolf audio**: source from Freesound.org or similar libraries. Real wolves have a sonic complexity that AI-generated wolves consistently miss. There are excellent free-use timber wolf recordings available.

**Mix in Audacity, Reaper, or Audition**: layered into the Godot engine via AudioStreamPlayer nodes for spatial sources and AudioStreamPlayer2D for positional ones. The body-state filter automation should be implemented as a Bus effect chain that responds to Burden/Pressure/Numbness state from the autoload singletons.

---

## A closing principle

Sound design in this game is *the apothecary register of the score*. The composer's music is doing the work of presence and contemplation and hosting; the sound design is doing the work of *the world being a real physical place where these things happen*. Both registers are necessary. A great score over weak SFX produces a game that sounds like a movie soundtrack album. Great SFX under no score produces a game that sounds like a tech demo. Great SFX *and* great score, layered with the discipline of mezzo-piano-by-default, produces a game the player inhabits.

Build the world quietly. Let the hearth crackle. Let Kalev breathe. Let the cabin creak around him in the cold. When the wolves come, the *break* will mean everything.
