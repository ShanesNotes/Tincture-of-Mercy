#nullable enable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace Tincture.AiMock;

/// <summary>
/// Stand-in for the real Tincture.Substrate WorldState. Stores both numeric
/// scalars and string flags in flat dotted-path form so the precondition
/// evaluator and effect applier can stay generic. In production this is
/// replaced by reads against ActorState + SimEventStream projections.
/// </summary>
public sealed class MockWorldState
{
    public Dictionary<string, double> Numbers { get; } = new(StringComparer.Ordinal);
    public Dictionary<string, string> Strings { get; } = new(StringComparer.Ordinal);
    public HashSet<string> Flags { get; } = new(StringComparer.Ordinal);
    public List<string> NotebookEntries { get; } = new();
    public List<string> EventTail { get; } = new();
    public List<string> Memory { get; } = new();
    public List<string> Wiki { get; } = new();
    public List<string> KalevCarried { get; } = new();
    public List<string> ScenePresent { get; } = new();

    public static MockWorldState SeedWayhouseAfternoon()
    {
        var s = new MockWorldState();

        s.Strings["scene.location"] = "wayhouse_porch_bethany";
        s.Strings["scene.hour"] = "late_afternoon";
        s.Strings["scene.weather"] = "wind_off_the_hills";
        s.Numbers["scene.tension"] = 0.0;
        s.Numbers["scene.silence_held"] = 0.0;

        s.Numbers["kalev.hp"] = 0.62;
        s.Numbers["kalev.spirit"] = 0.18;
        s.Numbers["kalev.steady"] = 0.71;
        s.Numbers["kalev.burden"] = 0.55;
        s.Numbers["kalev.pressure"] = 0.40;
        s.Numbers["kalev.numbness"] = 0.28;
        s.Flags.Add("kalev.notebook_open");

        s.Strings["self.condition"] = "well, ink-stained";
        s.Numbers["self.disposition_to_kalev"] = 0.2;
        s.Numbers["self.bread_count"] = 1;
        s.Numbers["self.spirit"] = 0.9;
        s.Flags.Add("self.has_bread");

        s.ScenePresent.AddRange(new[] { "kalev", "father_ilarion" });
        s.KalevCarried.AddRange(new[] { "notebook", "empty_vial", "wolf_tooth" });
        s.Flags.Add("kalev_present");

        s.EventTail.Add("kalev arrived on foot from the north road");
        s.EventTail.Add("kalev did not speak for the first minute");
        s.EventTail.Add("kalev's notebook is open to a page with a charcoal cross");

        s.Memory.Add("kalev came once before, asked nothing, left at dawn");
        s.Memory.Add("kalev would not say the mother's name aloud last visit");

        s.Wiki.Add("Hesychasm: discipline of interior watchfulness; does not act on body");
        s.Wiki.Add("Charcoal cross in a healer's notebook marks the dead");
        s.Wiki.Add("Bethany wayhouse offers bread, water, and a bench; never a cure");

        return s;
    }

    public RuntimeEnvelope BuildEnvelope(string kalevSays, string? kalevDid)
    {
        if (kalevSays.TrimEnd().EndsWith("?", StringComparison.Ordinal))
        {
            Flags.Add("kalev_just_asked");
        }
        else
        {
            Flags.Remove("kalev_just_asked");
        }

        return new RuntimeEnvelope
        {
            Scene = new SceneSnapshot
            {
                Location = Strings.GetValueOrDefault("scene.location", string.Empty),
                Hour = Strings.GetValueOrDefault("scene.hour", string.Empty),
                Weather = Strings.GetValueOrDefault("scene.weather", string.Empty),
                Present = new List<string>(ScenePresent),
            },
            Kalev = new KalevSnapshot
            {
                Hp = Numbers.GetValueOrDefault("kalev.hp"),
                Spirit = Numbers.GetValueOrDefault("kalev.spirit"),
                Steady = Numbers.GetValueOrDefault("kalev.steady"),
                Burden = Numbers.GetValueOrDefault("kalev.burden"),
                Pressure = Numbers.GetValueOrDefault("kalev.pressure"),
                Numbness = Numbers.GetValueOrDefault("kalev.numbness"),
                ActiveRite = null,
                Carried = new List<string>(KalevCarried),
            },
            Self = new SelfSnapshot
            {
                Condition = Strings.GetValueOrDefault("self.condition", string.Empty),
                DispositionToKalev = Numbers.GetValueOrDefault("self.disposition_to_kalev"),
                RegisterOpen = new List<string> { "sanctioned", "sacred" },
            },
            EventTail = EventTail.TakeLast(12).ToList(),
            Memory = Memory.TakeLast(6).ToList(),
            Wiki = new List<string>(Wiki),
            KalevSays = kalevSays,
            KalevDid = kalevDid,
        };
    }

    public string FormatNumber(double v) => v.ToString("0.##", CultureInfo.InvariantCulture);
}
