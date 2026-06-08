#nullable enable
using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Tincture.AiMock;

internal static class Program
{
    private static readonly JsonSerializerOptions EnvelopeJson = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never,
    };

    private static async Task<int> Main(string[] args)
    {
        var baseUrl = Environment.GetEnvironmentVariable("LLM_BASE_URL") ?? "http://localhost:1234";
        var model = Environment.GetEnvironmentVariable("LLM_MODEL") ?? "qwen/qwen3-4b-2507";
        var character = args.Length > 0 ? args[0] : "FatherIlarion";
        var verbose = args.Contains("--verbose");

        var root = AppContext.BaseDirectory;
        var worldRulesPath = Path.Combine(root, "WorldRules.md");
        var personaPath = Path.Combine(root, "Characters", character, "persona.md");
        var skillsPath = Path.Combine(root, "Characters", character, "skills.md");

        if (!File.Exists(worldRulesPath) || !File.Exists(personaPath) || !File.Exists(skillsPath))
        {
            Console.Error.WriteLine("Missing data files. Expected:");
            Console.Error.WriteLine($"  {worldRulesPath}");
            Console.Error.WriteLine($"  {personaPath}");
            Console.Error.WriteLine($"  {skillsPath}");
            return 2;
        }

        var worldRules = await File.ReadAllTextAsync(worldRulesPath);
        var persona = await File.ReadAllTextAsync(personaPath);
        var skills = SkillsLoader.Load(skillsPath);
        var systemPrompt = SystemPromptBuilder.Build(worldRules, persona, skills);
        var dispatcher = new IntentDispatcher(skills);
        var state = MockWorldState.SeedWayhouseAfternoon();

        Console.WriteLine($"== Tincture.AiMock — character: {character} ==");
        Console.WriteLine($"   LLM:     {baseUrl}  model={model}");
        Console.WriteLine($"   Verbs:   {string.Join(", ", skills.Select(s => s.Verb))}");
        Console.WriteLine($"   Scene:   {state.Strings["scene.location"]} · {state.Strings["scene.hour"]}");
        Console.WriteLine();
        Console.WriteLine("Type as Kalev. Commands: /state, /prompt, /quit");
        Console.WriteLine();

        using var llm = new LlmClient(baseUrl, model);

        while (true)
        {
            Console.Write("kalev> ");
            var line = Console.ReadLine();
            if (line is null) return 0;
            line = line.Trim();
            if (line.Length == 0) continue;
            if (line == "/quit" || line == "/exit") return 0;
            if (line == "/state") { DumpState(state); continue; }
            if (line == "/prompt") { Console.WriteLine(systemPrompt); continue; }

            var envelope = state.BuildEnvelope(line, kalevDid: null);
            var envelopeJson = JsonSerializer.Serialize(envelope, EnvelopeJson);

            if (verbose)
            {
                Console.WriteLine("--- envelope ---");
                Console.WriteLine(envelopeJson);
            }

            string raw;
            try
            {
                raw = await llm.CompleteJsonAsync(systemPrompt, envelopeJson);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[llm error] {ex.Message}");
                Console.WriteLine($"[hint] is LM Studio's server running at {baseUrl} with a model loaded?");
                continue;
            }

            NpcResponse? parsed = null;
            try
            {
                parsed = JsonSerializer.Deserialize<NpcResponse>(raw);
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"[parse error] {ex.Message}");
                Console.WriteLine($"[raw] {raw}");
                continue;
            }
            if (parsed is null)
            {
                Console.WriteLine("[parse error] null response");
                continue;
            }

            var dispatch = dispatcher.Dispatch(state, parsed.ProposedIntent);
            RecordTurn(state, line, parsed, dispatch);
            PrintTurn(parsed, dispatch);
        }
    }

    private static void RecordTurn(MockWorldState state, string kalevSays, NpcResponse parsed, DispatchResult dispatch)
    {
        state.EventTail.Add($"kalev said: \"{kalevSays}\"");
        if (!string.IsNullOrEmpty(parsed.Say))
        {
            state.EventTail.Add($"father_ilarion said: \"{parsed.Say}\"");
        }
        if (dispatch.Accepted)
        {
            state.EventTail.Add($"father_ilarion did: {dispatch.Verb}");
        }
        if (!string.IsNullOrEmpty(parsed.MemoryToPersist))
        {
            state.Memory.Add(parsed.MemoryToPersist);
        }
    }

    private static void PrintTurn(NpcResponse parsed, DispatchResult dispatch)
    {
        Console.WriteLine();
        Console.WriteLine($"  ilarion ({parsed.RegisterUsed}): \"{parsed.Say}\"");
        if (!string.IsNullOrWhiteSpace(parsed.Gesture))
        {
            Console.WriteLine($"  [gesture] {parsed.Gesture}");
        }
        if (parsed.ProposedIntent is null)
        {
            Console.WriteLine("  [intent]  none");
        }
        else
        {
            var verdict = dispatch.Accepted ? "ACCEPTED" : "REJECTED";
            Console.WriteLine($"  [intent]  {parsed.ProposedIntent.Verb} -> {parsed.ProposedIntent.Target}  ({verdict}: {dispatch.Reason})");
            if (!dispatch.Accepted && dispatch.FailedPreconds.Count > 0)
            {
                Console.WriteLine($"            unmet: {string.Join("; ", dispatch.FailedPreconds)}");
            }
            foreach (var change in dispatch.AppliedCosts) Console.WriteLine($"  [cost]    {change}");
            foreach (var change in dispatch.AppliedEffects) Console.WriteLine($"  [effect]  {change}");
            if (dispatch.Accepted && !string.IsNullOrEmpty(dispatch.Animation))
            {
                Console.WriteLine($"  [anim]    play {dispatch.Animation}");
            }
        }
        if (!string.IsNullOrWhiteSpace(parsed.InternalNote))
        {
            Console.WriteLine($"  [note]    {parsed.InternalNote}");
        }
        Console.WriteLine();
    }

    private static void DumpState(MockWorldState state)
    {
        Console.WriteLine("--- numbers ---");
        foreach (var kv in state.Numbers.OrderBy(k => k.Key, System.StringComparer.Ordinal))
        {
            Console.WriteLine($"  {kv.Key} = {kv.Value:0.##}");
        }
        Console.WriteLine("--- strings ---");
        foreach (var kv in state.Strings.OrderBy(k => k.Key, System.StringComparer.Ordinal))
        {
            Console.WriteLine($"  {kv.Key} = \"{kv.Value}\"");
        }
        Console.WriteLine("--- flags ---");
        foreach (var f in state.Flags.OrderBy(s => s, System.StringComparer.Ordinal))
        {
            Console.WriteLine($"  {f}");
        }
        Console.WriteLine($"--- event_tail (last 6) ---");
        foreach (var e in state.EventTail.TakeLast(6)) Console.WriteLine($"  - {e}");
        Console.WriteLine($"--- memory ---");
        foreach (var m in state.Memory) Console.WriteLine($"  - {m}");
        Console.WriteLine();
    }
}
