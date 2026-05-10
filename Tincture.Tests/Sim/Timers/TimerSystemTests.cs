using Tincture.Substrate.Events;
using Tincture.Substrate.Sim;
using Tincture.Substrate.Sim.Timers;

namespace Tincture.Tests.Sim.Timers;

public sealed class TimerSystemTests
{
    private static string RepoRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    private static string FixturePath(string fixtureName) => Path.Combine(AppContext.BaseDirectory, "Fixtures", fixtureName);

    [Fact]
    public void Timers_EmitStartTickCompleteInterrupted()
    {
        var timerSystem = new TimerSystem();
        var stream = new SimEventStream();
        var gcd = new TimerDefinition
        {
            TimerId = "timer.gcd.test",
            Kind = TimerKind.GlobalCooldown,
            DurationTicks = 4,
            TickIntervalTicks = 1,
            Tags = ["gcd"]
        };

        var started = stream.AppendBatch([timerSystem.Start(gcd, Request("gcd-001", "combat.guard.ready", 10))]);
        var afterStart = timerSystem.Project(started)["gcd-001"];
        var midEvents = stream.AppendBatch(timerSystem.Advance(afterStart, 12));
        var afterMid = timerSystem.Project(stream.Events)["gcd-001"];
        var completionEvents = stream.AppendBatch(timerSystem.Advance(afterMid, 14));

        var swing = new TimerDefinition
        {
            TimerId = "timer.swing.test",
            Kind = TimerKind.Swing,
            DurationTicks = 5,
            TickIntervalTicks = 1,
            Tags = ["swing"]
        };
        stream.AppendBatch([timerSystem.Start(swing, Request("swing-001", "combat.attack.resolve", 20))]);
        var activeSwing = timerSystem.Project(stream.Events)["swing-001"];
        var interrupted = stream.AppendBatch([timerSystem.Interrupt(activeSwing, new TimerInterruptRequest
        {
            InterruptId = "interrupt-001",
            Tick = 22,
            Reason = "wolf_staggered_kalev"
        })]);
        var completedGcd = timerSystem.Project(stream.Events)["gcd-001"];
        var interruptedSwing = timerSystem.Project(stream.Events)["swing-001"];

        Assert.Equal(TimerSystem.StartedEventType, started.Single().EventType);
        Assert.Equal([TimerSystem.TickEventType, TimerSystem.TickEventType], midEvents.Select(simEvent => simEvent.EventType));
        Assert.Equal([TimerSystem.TickEventType, TimerSystem.CompletedEventType], completionEvents.Select(simEvent => simEvent.EventType));
        Assert.Equal(TimerSystem.InterruptedEventType, interrupted.Single().EventType);
        Assert.Empty(timerSystem.Advance(interruptedSwing, 25));
        Assert.Equal("gcd", started.Single().Fields["timer_kind"]);
        Assert.Equal("timer.gcd.test", completionEvents.Last().Fields["timer_id"]);
        Assert.Equal("wolf_staggered_kalev", interrupted.Single().Fields["interrupt_reason"]);
        Assert.Throws<InvalidOperationException>(() => timerSystem.Interrupt(completedGcd, new TimerInterruptRequest
        {
            InterruptId = "interrupt-002",
            Tick = 15,
            Reason = "too_late"
        }));
    }

    [Fact]
    public void Timers_ReplayWithoutGodotTimerDependency()
    {
        var first = BuildClockDrivenTimerTrace();
        var second = BuildClockDrivenTimerTrace();
        var replay = SimEventStream.FromStableJson(first.ToStableJson());

        Assert.Equal(first.ToStableJson(), second.ToStableJson());
        Assert.Equal(first.ToStableJson(), replay.ToStableJson());
        Assert.Contains(first.Events, simEvent => simEvent.EventType == TimerSystem.CompletedEventType);
        AssertNoTimerRuntimeDependency();
    }

    [Fact]
    public void Timers_CompletionFeedsVerbInvocationFixture()
    {
        var stream = BuildInvocationCompletionFixture();
        var json = stream.ToStableJson();
        var fixture = File.ReadAllText(FixturePath("timer_completion_invocation_fixture.json"));
        var replay = SimEventStream.FromStableJson(json);
        var timerSystem = new TimerSystem();
        var projected = timerSystem.Project(replay.Events);

        var completion = replay.Events.Single(simEvent =>
            simEvent.EventType == TimerSystem.CompletedEventType
            && simEvent.Fields["timer_request_id"] == "verb-invocation-001");
        var ignored = replay.Events
            .Where(simEvent => simEvent.Fields.GetValueOrDefault("timer_request_id") == "verb-invocation-001")
            .Where(simEvent => simEvent.EventType != TimerSystem.CompletedEventType)
            .ToList();

        Assert.Equal(fixture, json);
        Assert.All(ignored, simEvent => Assert.NotEqual(TimerSystem.CompletedEventType, simEvent.EventType));
        Assert.Equal("verb_invocation", completion.Fields["completion_consumer"]);
        Assert.Equal("verb_invocation.resolve", completion.Fields["completion_key"]);
        Assert.Equal("verb-invocation-001", completion.Fields["invocation_id"]);
        Assert.Equal("combat.attack.resolve", completion.VerbId);
        Assert.Equal(Tincture.Substrate.Events.SimDomain.Combat, completion.Domain);
        Assert.True(projected["verb-invocation-001"].IsComplete);
    }

    [Fact]
    public void Timers_EpicBDefaultsIncludeRequiredRows()
    {
        var defaults = TimerDefinition.EpicBDefaults();

        Assert.Contains(defaults.Values, definition => definition.Kind == TimerKind.GlobalCooldown);
        Assert.Contains(defaults.Values, definition => definition.Kind == TimerKind.Work);
        Assert.Contains(defaults.Values, definition => definition.Kind == TimerKind.Cast);
        Assert.Contains(defaults.Values, definition => definition.Kind == TimerKind.Channel);
        Assert.Contains(defaults.Values, definition => definition.Kind == TimerKind.Swing);
        Assert.Contains(defaults.Values, definition => definition.Kind == TimerKind.RitePulse);
        Assert.All(defaults.Values, definition =>
        {
            var validated = definition.Validate();
            Assert.Equal(definition.TimerId, validated.TimerId);
            Assert.Equal(definition.Kind, validated.Kind);
            Assert.Equal(definition.DurationTicks, validated.DurationTicks);
            Assert.Equal(definition.TickIntervalTicks, validated.TickIntervalTicks);
        });
    }

    [Theory]
    [InlineData(TimerKind.GlobalCooldown, "gcd")]
    [InlineData(TimerKind.Work, "work")]
    [InlineData(TimerKind.Cast, "cast")]
    [InlineData(TimerKind.Channel, "channel")]
    [InlineData(TimerKind.Swing, "swing")]
    [InlineData(TimerKind.RitePulse, "rite_pulse")]
    public void Timers_TimerKindIdsAreExplicit(TimerKind kind, string id)
    {
        Assert.Equal(id, kind.ToId());
        Assert.Equal(kind, TimerKindExtensions.FromId(id));
    }

    [Fact]
    public void Timers_InvalidRowsFailFast()
    {
        Assert.Throws<InvalidOperationException>(() => new TimerDefinition { TimerId = "timer.bad", DurationTicks = 0 }.Validate());
        Assert.Throws<InvalidOperationException>(() => new TimerDefinition { TimerId = string.Empty, DurationTicks = 1 }.Validate());
        Assert.Throws<InvalidOperationException>(() => new TimerDefinition { TimerId = "timer.bad", DurationTicks = 1, TickIntervalTicks = 2 }.Validate());
        Assert.Throws<InvalidOperationException>(() => Request("bad", string.Empty, 1).Validate());
        Assert.Throws<InvalidOperationException>(() => Request("bad", "combat.guard.ready", -1).Validate());
        Assert.Throws<ArgumentOutOfRangeException>(() => ((TimerKind)999).ToId());
        Assert.Throws<ArgumentOutOfRangeException>(() => TimerKindExtensions.FromId("cooldown_ready"));
    }

    private static SimEventStream BuildClockDrivenTimerTrace()
    {
        var timerSystem = new TimerSystem();
        var stream = new SimEventStream();
        var clock = new SimClock(seed: 90210, tickRate: 30);
        var definition = new TimerDefinition
        {
            TimerId = "timer.channel.clock_fixture",
            Kind = TimerKind.Channel,
            DurationTicks = 3,
            TickIntervalTicks = 1,
            Tags = ["channel"]
        };

        stream.AppendBatch([timerSystem.Start(definition, Request("clock-channel-001", "care.tincture.administer", clock.Tick, SimDomain.Care))]);
        AppendTimerAdvanceForClockTicks(timerSystem, stream, clock.AdvanceTicks(1));
        clock.Pause();
        AppendTimerAdvanceForClockTicks(timerSystem, stream, clock.AdvanceTicks(5));
        clock.Resume();
        clock.SetTimeScale(0);
        AppendTimerAdvanceForClockTicks(timerSystem, stream, clock.AdvanceTicks(5));
        clock.SetTimeScale(2);
        AppendTimerAdvanceForClockTicks(timerSystem, stream, clock.AdvanceTicks(1));
        return stream;
    }

    private static SimEventStream BuildInvocationCompletionFixture()
    {
        var timerSystem = new TimerSystem();
        var stream = new SimEventStream();
        var definition = new TimerDefinition
        {
            TimerId = "timer.cast.fixture",
            Kind = TimerKind.Cast,
            DurationTicks = 3,
            TickIntervalTicks = 1,
            CompletionFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["completion_stage"] = "resolve_outcome"
            },
            Tags = ["cast"]
        };
        var request = Request("verb-invocation-001", "combat.attack.resolve", 20) with
        {
            CompletionKey = "verb_invocation.resolve",
            TargetId = "wolf_01",
            ContextFields = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["invocation_id"] = "verb-invocation-001"
            }
        };

        stream.AppendBatch([timerSystem.Start(definition, request)]);
        var active = timerSystem.Project(stream.Events)["verb-invocation-001"];
        stream.AppendBatch(timerSystem.Advance(active, 23));
        return stream;
    }

    private static void AppendTimerAdvanceForClockTicks(TimerSystem timerSystem, SimEventStream stream, IEnumerable<long> ticks)
    {
        foreach (var tick in ticks)
        {
            var projected = timerSystem.Project(stream.Events);
            var dueEvents = timerSystem.Advance(projected.Values, tick);
            if (dueEvents.Count > 0)
            {
                stream.AppendBatch(dueEvents);
            }
        }
    }

    private static TimerRequest Request(
        string requestId,
        string verbId,
        long startedTick,
        SimDomain domain = SimDomain.Combat) => new()
        {
            RequestId = requestId,
            ActorId = "kalev",
            VerbId = verbId,
            Domain = domain,
            StartedTick = startedTick
        };

    private static void AssertNoTimerRuntimeDependency()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate", "Sim", "Timers");
        var blockedPatterns = new[]
        {
            "Godot.Timer",
            "SceneTreeTimer",
            "System.Threading.Timer",
            "Task.Delay",
            "DateTime.Now",
            "DateTime.UtcNow",
            "DateTimeOffset.Now",
            "DateTimeOffset.UtcNow",
            "Stopwatch",
            "Environment.TickCount"
        };

        var offenders = Directory
            .EnumerateFiles(sourceRoot, "*.cs", SearchOption.AllDirectories)
            .Select(path => new { path, text = File.ReadAllText(path) })
            .SelectMany(file => blockedPatterns
                .Where(pattern => file.text.Contains(pattern, StringComparison.Ordinal))
                .Select(pattern => $"{Path.GetRelativePath(sourceRoot, file.path)} contains {pattern}"))
            .ToList();

        Assert.Empty(offenders);
    }
}
