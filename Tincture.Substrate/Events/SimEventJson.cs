using System.Text.Json;
using System.Text.Json.Serialization;

namespace Tincture.Substrate.Events;

public static class SimEventJson
{
    public static readonly JsonSerializerOptions Options = CreateOptions();

    public static string SerializeEvents(IEnumerable<SimEvent> events)
    {
        var stableEvents = events
            .OrderBy(simEvent => simEvent.Sequence)
            .Select(simEvent => simEvent with
            {
                Fields = SimEvent.StableDictionary(simEvent.Fields),
                Costs = SimEvent.StableDictionary(simEvent.Costs),
                Results = SimEvent.StableDictionary(simEvent.Results),
                Tags = SimEvent.StableTags(simEvent.Tags)
            })
            .ToList();

        return JsonSerializer.Serialize(stableEvents, Options) + Environment.NewLine;
    }

    public static IReadOnlyList<SimEvent> DeserializeEvents(string json)
    {
        return JsonSerializer.Deserialize<List<SimEvent>>(json, Options) ?? [];
    }

    private static JsonSerializerOptions CreateOptions()
    {
        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DictionaryKeyPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.Never
        };
        options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower));
        return options;
    }
}
