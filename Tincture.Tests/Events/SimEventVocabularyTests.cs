using Tincture.Substrate.Actors;
using Tincture.Substrate.Combat;
using Tincture.Substrate.Consequences.DeathFriction;
using Tincture.Substrate.Economy;
using Tincture.Substrate.Events;
using Tincture.Substrate.Rules;
using Tincture.Tests.Support;

namespace Tincture.Tests.Events;

public sealed class SimEventVocabularyTests
{
    [Fact]
    public void SimEventVocabulary_RegistersProducerOwnedEventConstants()
    {
        var entries = SimEventVocabulary.All;

        Assert.Contains(entries, entry => entry.EventType == VerbInvocation.CompletedEventType && entry.OwnerPath == "Rules/VerbInvocation.cs");
        Assert.Contains(entries, entry => entry.EventType == CostLedger.ResourceChangedEventType && entry.OwnerPath == "Rules/CostLedger.cs");
        Assert.Contains(entries, entry => entry.EventType == OutcomeResolver.ResolvedEventType && entry.OwnerPath == "Rules/OutcomeResolver.cs");
        Assert.Contains(entries, entry => entry.EventType == AuraSystem.ExpiredEventType && entry.OwnerPath == "Actors/AuraSystem.cs");
        Assert.Contains(entries, entry => entry.EventType == CooldownSystem.StartedEventType && entry.OwnerPath == "Actors/CooldownSystem.cs");
        Assert.Contains(entries, entry => entry.EventType == EncounterAiSystem.LeashTriggeredEventType && entry.SourceSystem == EncounterAiSystem.SourceSystemId);
        Assert.Contains(entries, entry => entry.EventType == LootSystem.MaterialOutcomeEventType && entry.SourceSystem == LootSystem.SourceSystemId);
        Assert.Contains(entries, entry => entry.EventType == DeathFrictionSystem.DiedEventType && entry.SourceSystem == DeathFrictionSystem.SourceSystemId);
        Assert.All(entries, entry => Assert.DoesNotContain('.', entry.EventType));
        Assert.Equal(entries.Count, entries.Select(entry => entry.EventType).Distinct(StringComparer.Ordinal).Count());
    }

    [Fact]
    public void SimEventVocabulary_FindAndSourceLookupAreDeterministic()
    {
        var material = SimEventVocabulary.Find(LootSystem.MaterialOutcomeEventType);
        var encounter = SimEventVocabulary.ForSourceSystem(EncounterAiSystem.SourceSystemId);

        Assert.NotNull(material);
        Assert.Equal("Economy/LootSystem.cs", material!.OwnerPath);
        Assert.Equal(encounter.OrderBy(entry => entry.EventType, StringComparer.Ordinal).ToList(), encounter.ToList());
        Assert.Null(SimEventVocabulary.Find("fixture_only_event"));
    }

    [Fact]
    public void EventVocabularyStructure_NoAdHocEventStringsOutsideVocabulary()
    {
        var vocabularySource = File.ReadAllText(Path.Combine(StructureGuard.SubstrateRoot, "Events", "SimEventVocabulary.cs"));

        Assert.Contains("VerbInvocation.CompletedEventType", vocabularySource, StringComparison.Ordinal);
        Assert.Contains("EncounterAiSystem.LeashTriggeredEventType", vocabularySource, StringComparison.Ordinal);
        Assert.Contains("LootSystem.MaterialOutcomeEventType", vocabularySource, StringComparison.Ordinal);
        Assert.DoesNotContain("\"material_outcome_emitted\"", vocabularySource, StringComparison.Ordinal);

        var shortcutRoots = new[]
        {
            Path.Combine(StructureGuard.SubstrateRoot, "Runtime"),
            Path.Combine(StructureGuard.SubstrateRoot, "ReadModels"),
            Path.Combine(StructureGuard.SubstrateRoot, "Presentation")
        };
        var offenders = shortcutRoots
            .Where(Directory.Exists)
            .SelectMany(root => StructureGuard.FilesContainingAny(root, ["EventType = \""]))
            .Order(StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }
}
