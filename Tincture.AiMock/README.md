# Tincture.AiMock

A standalone console mock that proves the LLM-character-runtime loop
without coupling to Godot or the real `Tincture.Substrate.VerbInvocation`.
It demonstrates the architecture proposed in
`docs/source/2026-05-10-ai-options-briefing.html`:

> AI proposes intents; VerbInvocation and OutcomeResolver remain
> authoritative.

## What it does

1. Loads three editable inputs:
   - `WorldRules.md` — universal lore guardrails
   - `Characters/<Name>/persona.md` — character voice
   - `Characters/<Name>/skills.md` — verb whitelist (single source of truth)
2. Composes a system prompt from those (verb list is **generated**, never
   hand-typed — so the prompt and the dispatcher cannot drift apart).
3. On each REPL turn, builds a runtime envelope from `MockWorldState`
   (scene, kalev stats, self stats, event_tail, memory, wiki, kalev_says).
4. Posts to a local OpenAI-compatible chat endpoint (LM Studio,
   llama.cpp `--server`, Ollama with `/v1/` proxy).
5. Parses the strict-JSON `NpcResponse`.
6. `IntentDispatcher` looks up the proposed verb in the loaded skills,
   runs `PreconditionEvaluator` against `MockWorldState`, applies effects
   and costs via `EffectApplier`, returns a `DispatchResult`.
7. Records the turn into `event_tail` and `memory` so the next envelope
   reflects the change.

## Run

Start your local LLM server. With LM Studio:
- Load `qwen/qwen3-4b-2507`.
- Click **Start Server** (default port 1234).

Then:

```bash
dotnet run --project Tincture.AiMock
```

Override defaults via env vars:

```bash
LLM_BASE_URL=http://localhost:8080 LLM_MODEL=qwen3-4b dotnet run --project Tincture.AiMock
```

REPL commands:
- `/state` — dump current `MockWorldState`
- `/prompt` — print the composed system prompt
- `/quit` — exit

Run with `--verbose` to also print the JSON envelope on every turn.

## File map

| File | Role |
|---|---|
| `Program.cs` | REPL: read input → envelope → LLM → dispatch → print |
| `LlmClient.cs` | OpenAI-compatible `chat/completions` HTTP client |
| `SystemPromptBuilder.cs` | Composes the system prompt from rules + persona + verb list |
| `SkillsLoader.cs` | Parses `skills.md` (`## verb` sections, `key: value` lines) |
| `SkillSpec.cs` | Records: `SkillSpec`, `EffectExpr`, `Precondition`, `ArgumentSpec` |
| `IntentJson.cs` | Records the LLM emits: `NpcResponse`, `ProposedIntent` |
| `RuntimeEnvelope.cs` | Records the C# side sends: scene/kalev/self/event_tail/memory/wiki |
| `IntentDispatcher.cs` | Validates verb against skills, checks preconds, applies effects |
| `PreconditionEvaluator.cs` | Tiny DSL: flags + `<,>,<=,>=,==` numeric + `==` string compare |
| `EffectApplier.cs` | Applies `+=`, `-=`, `:=`, `.append :=` against `MockWorldState` |
| `MockWorldState.cs` | Stand-in for the real `WorldState`; flat dotted-path scalars |
| `WorldRules.md` | Universal world constraints injected into every prompt |
| `Characters/FatherIlarion/persona.md` | Character voice block |
| `Characters/FatherIlarion/skills.md` | Verb whitelist + preconds + effects + animations |

## Going from mock to substrate

When the loop is proven, port two pieces:

1. **`MockWorldState` → real `Tincture.Substrate`**: replace the flat
   dotted-path dictionaries with reads against `ActorState` projections
   and `SimEventStream` event-tail. The envelope shape stays identical.
2. **`IntentDispatcher` → `VerbInvocation` adapter**: instead of mutating
   `MockWorldState` via `EffectApplier`, look up the `VerbDef` for the
   proposed verb (skills.md becomes the spec source for both prompt and
   `VerbDef`s), assemble a `VerbInvocationRequest`, and call
   `VerbInvocation.Invoke`. The substrate's existing cost / cooldown /
   timer / outcome-table machinery takes over from there. The LLM
   contract is unchanged.

The HTTP client (`LlmClient.cs`) and the prompt builder
(`SystemPromptBuilder.cs`) carry over verbatim into the Godot project.
