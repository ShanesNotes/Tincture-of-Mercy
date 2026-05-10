using System.Text.Json.Serialization;

namespace Tincture.Substrate.Events;

public sealed record SimEventLocation(
    [property: JsonPropertyOrder(0)] string ZoneId,
    [property: JsonPropertyOrder(1)] int X,
    [property: JsonPropertyOrder(2)] int Y);
