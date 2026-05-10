using Tincture.Substrate.Events;
using Tincture.Substrate.Presentation;

namespace Tincture.Tests.Presentation;

public sealed class DomainPresenterTests
{
    [Fact]
    public void DomainPresenter_ReturnsThinSurfaceRowsOnly()
    {
        var snapshot = PresentationEvent.Snapshot(LoadFixture("verb_invocation_care_combat_fixture.json").Events);
        var surface = new DomainPresenter().Present(new DomainPresentationRequest(PresentationSurfaceKeys.Combat, SimDomain.Combat, snapshot));

        Assert.Equal(PresentationSurfaceKeys.Combat, surface.Surface);
        Assert.Equal(SimDomain.Combat, surface.Domain);
        Assert.NotEmpty(surface.SourceEventIds);
        Assert.Equal(surface.SourceEventIds, surface.Rows.Select(row => row.SourceEventId));

        var surfaceProperties = typeof(PresentationSurface).GetProperties().Select(property => property.Name).Order().ToList();
        Assert.Equal(["Domain", "Metadata", "Rows", "SourceEventIds", "Surface"], surfaceProperties);
        Assert.DoesNotContain(surface.Rows.SelectMany(row => row.Metadata.Keys), key =>
            key.Contains("progression", StringComparison.OrdinalIgnoreCase)
            || key.Contains("recognition", StringComparison.OrdinalIgnoreCase)
            || key.Contains("duplicate", StringComparison.OrdinalIgnoreCase)
            || key.Contains("notebook_entry", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void DomainPresenter_OrdersRowsBySourceEventOrder()
    {
        var snapshot = PresentationEvent.Snapshot(LoadFixture("verb_invocation_care_combat_fixture.json").Events);
        var surface = new DomainPresenter().Present(new DomainPresentationRequest(PresentationSurfaceKeys.Care, SimDomain.Care, snapshot));

        var expectedIds = snapshot
            .Where(simEvent => simEvent.Domain == SimDomain.Care)
            .Select(simEvent => simEvent.Id)
            .ToList();

        Assert.Equal(expectedIds, surface.Rows.Select(row => row.SourceEventId));
        Assert.Equal(Enumerable.Range(1, expectedIds.Count).Select(value => (long)value), surface.Rows.Select(row => row.Order));
    }

    [Fact]
    public void DomainPresenter_CoversBedsideCareCombatEconomyAndNotebookSurfaceContracts()
    {
        var snapshot = PresentationEvent.Snapshot(LoadFixture("loot_hooks_wolf_material_fixture.json").Events);
        var presenter = new DomainPresenter();

        var bedside = presenter.Present(new DomainPresentationRequest(PresentationSurfaceKeys.Bedside, SimDomain.Care, snapshot));
        var care = presenter.Present(new DomainPresentationRequest(PresentationSurfaceKeys.Care, SimDomain.Care, snapshot));
        var combat = presenter.Present(new DomainPresentationRequest(PresentationSurfaceKeys.Combat, SimDomain.Combat, snapshot));
        var economy = presenter.Present(new DomainPresentationRequest(PresentationSurfaceKeys.Economy, SimDomain.Economy, snapshot));
        var notebook = presenter.Present(new DomainPresentationRequest(PresentationSurfaceKeys.Notebook, SimDomain.Notebook, snapshot));

        Assert.Equal(PresentationSurfaceKeys.Bedside, bedside.Surface);
        Assert.Equal(PresentationSurfaceKeys.Care, care.Surface);
        Assert.Equal(PresentationSurfaceKeys.Combat, combat.Surface);
        Assert.Equal(PresentationSurfaceKeys.Economy, economy.Surface);
        Assert.Equal(PresentationSurfaceKeys.Notebook, notebook.Surface);
        Assert.Empty(notebook.Rows);
    }

    private static SimEventStream LoadFixture(string name)
    {
        return SimEventStream.FromStableJson(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Fixtures", name)));
    }
}
