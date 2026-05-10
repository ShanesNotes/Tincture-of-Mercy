using System.Globalization;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;

namespace Tincture.Substrate.Data;

public sealed record RegisterMatchModifier
{
    public LatentPath Path { get; init; }

    public VoiceRegister VoiceRegister { get; init; }

    public string ReceptivityProfileId { get; init; } = string.Empty;

    public string ReceptivityActorId { get; init; } = string.Empty;

    public int PathFit { get; init; }

    public int RegisterFit { get; init; }

    public int Amount { get; init; }

    public List<string> NeedTags { get; init; } = [];

    public List<string> FearTags { get; init; } = [];

    public List<string> ComfortTags { get; init; } = [];

    public List<string> RefusalTriggers { get; init; } = [];

    public List<string> RecognitionHooks { get; init; } = [];

    public List<string> PathStateTags { get; init; } = [];

    public List<string> SceneTags { get; init; } = [];

    public List<string> PriorTags { get; init; } = [];

    public List<string> MatchedNeedTags { get; init; } = [];

    public List<string> MatchedFearTags { get; init; } = [];

    public List<string> MatchedComfortTags { get; init; } = [];

    public List<string> MatchedRefusalTriggers { get; init; } = [];

    public List<string> MatchedRecognitionHooks { get; init; } = [];

    public string SourceId { get; init; } = "receptivity";

    public string? SourceEventId { get; init; }

    public static RegisterMatchModifier FromProfile(
        LatentPath path,
        VoiceRegister voiceRegister,
        ReceptivityProfile profile,
        IEnumerable<string>? pathStateTags = null,
        IEnumerable<string>? sceneTags = null,
        IEnumerable<string>? priorTags = null,
        string sourceId = "receptivity",
        string? sourceEventId = null)
    {
        if (string.IsNullOrWhiteSpace(profile.ProfileId))
        {
            throw new ArgumentException("Profile id must be non-blank.", nameof(profile));
        }

        if (string.IsNullOrWhiteSpace(profile.ActorId))
        {
            throw new ArgumentException("Receptivity profile actor id must be non-blank.", nameof(profile));
        }

        var stablePathStateTags = SimEvent.StableTags(pathStateTags ?? []);
        var stableSceneTags = SimEvent.StableTags(sceneTags ?? []);
        var stablePriorTags = SimEvent.StableTags(priorTags ?? []);
        var contextTags = SimEvent.StableTags(stablePathStateTags.Concat(stableSceneTags).Concat(stablePriorTags));
        var matchedNeedTags = Intersect(profile.NeedTags, contextTags);
        var matchedFearTags = Intersect(profile.FearTags, contextTags);
        var matchedComfortTags = Intersect(profile.ComfortTags, contextTags);
        var matchedRefusalTriggers = Intersect(profile.RefusalTriggers, contextTags);
        var matchedRecognitionHooks = Intersect(profile.RecognitionHooks, contextTags);
        var pathFit = profile.PathFitFor(path);
        var registerFit = profile.RegisterFitFor(voiceRegister);
        var amount = pathFit + registerFit + matchedComfortTags.Count - matchedFearTags.Count - matchedRefusalTriggers.Count;

        return new RegisterMatchModifier
        {
            Path = path,
            VoiceRegister = voiceRegister,
            ReceptivityProfileId = profile.ProfileId,
            ReceptivityActorId = profile.ActorId,
            PathFit = pathFit,
            RegisterFit = registerFit,
            Amount = amount,
            NeedTags = SimEvent.StableTags(profile.NeedTags),
            FearTags = SimEvent.StableTags(profile.FearTags),
            ComfortTags = SimEvent.StableTags(profile.ComfortTags),
            RefusalTriggers = SimEvent.StableTags(profile.RefusalTriggers),
            RecognitionHooks = SimEvent.StableTags(profile.RecognitionHooks),
            PathStateTags = stablePathStateTags,
            SceneTags = stableSceneTags,
            PriorTags = stablePriorTags,
            MatchedNeedTags = matchedNeedTags,
            MatchedFearTags = matchedFearTags,
            MatchedComfortTags = matchedComfortTags,
            MatchedRefusalTriggers = matchedRefusalTriggers,
            MatchedRecognitionHooks = matchedRecognitionHooks,
            SourceId = sourceId,
            SourceEventId = sourceEventId
        };
    }

    public OutcomeModifier ToOutcomeModifier()
    {
        if (string.IsNullOrWhiteSpace(ReceptivityProfileId))
        {
            throw new InvalidOperationException("ReceptivityProfileId must be non-blank.");
        }

        if (string.IsNullOrWhiteSpace(ReceptivityActorId))
        {
            throw new InvalidOperationException("ReceptivityActorId must be non-blank.");
        }

        var metadata = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["path_id"] = Path.ToId(),
            ["voice_register"] = ToSnakeCase(VoiceRegister),
            ["receptivity_profile_id"] = ReceptivityProfileId,
            ["receptivity_actor_id"] = ReceptivityActorId,
            ["path_fit"] = PathFit.ToString(CultureInfo.InvariantCulture),
            ["register_fit"] = RegisterFit.ToString(CultureInfo.InvariantCulture),
            ["register_match_modifier"] = Amount.ToString(CultureInfo.InvariantCulture),
            ["need_tags"] = string.Join(",", NeedTags),
            ["fear_tags"] = string.Join(",", FearTags),
            ["comfort_tags"] = string.Join(",", ComfortTags),
            ["refusal_triggers"] = string.Join(",", RefusalTriggers),
            ["recognition_hooks"] = string.Join(",", RecognitionHooks),
            ["path_state_tags"] = string.Join(",", PathStateTags),
            ["scene_tags"] = string.Join(",", SceneTags),
            ["prior_tags"] = string.Join(",", PriorTags),
            ["matched_need_tags"] = string.Join(",", MatchedNeedTags),
            ["matched_fear_tags"] = string.Join(",", MatchedFearTags),
            ["matched_comfort_tags"] = string.Join(",", MatchedComfortTags),
            ["matched_refusal_triggers"] = string.Join(",", MatchedRefusalTriggers),
            ["matched_recognition_hooks"] = string.Join(",", MatchedRecognitionHooks)
        };

        return new OutcomeModifier
        {
            ModifierId = $"register_match:{Path.ToId()}:{ToSnakeCase(VoiceRegister)}:{ReceptivityProfileId}",
            SourceId = SourceId,
            SourceEventId = SourceEventId,
            Kind = OutcomeModifierKind.RegisterMatch,
            Amount = Amount,
            Metadata = metadata
        };
    }

    private static List<string> Intersect(IEnumerable<string> profileTags, IEnumerable<string> contextTags)
    {
        var context = contextTags.ToHashSet(StringComparer.Ordinal);
        return SimEvent.StableTags(profileTags.Where(context.Contains));
    }

    private static string ToSnakeCase(VoiceRegister voiceRegister)
    {
        return voiceRegister switch
        {
            VoiceRegister.Folk => "folk",
            VoiceRegister.Sanctioned => "sanctioned",
            VoiceRegister.Sacred => "sacred",
            _ => throw new ArgumentOutOfRangeException(nameof(voiceRegister), voiceRegister, "Unsupported voice register.")
        };
    }
}
