using Tincture.Tests.Support;

namespace Tincture.Tests.Support;

public sealed class StructureGuardTests
{
    [Fact]
    public void StructureGuard_FindsRepoRootsAndCSharpSources()
    {
        Assert.True(Directory.Exists(StructureGuard.RepoRoot));
        Assert.True(Directory.Exists(StructureGuard.SubstrateRoot));
        Assert.Contains(
            Path.Combine(StructureGuard.SubstrateRoot, "Events", "SimEvent.cs"),
            StructureGuard.CSharpFiles(StructureGuard.SubstrateRoot));
    }

    [Fact]
    public void StructureGuard_PatternScanReportsRelativeOffenders()
    {
        var offenders = StructureGuard.FilesContainingAny(
            Path.Combine(StructureGuard.SubstrateRoot, "Runtime"),
            ["OpeningActRuntime"]);

        Assert.Contains(offenders, offender => offender.StartsWith("OpeningActRuntime.cs contains", StringComparison.Ordinal));
        Assert.DoesNotContain(offenders, offender => offender.Contains("bin", StringComparison.Ordinal) || offender.Contains("obj", StringComparison.Ordinal));
    }
}
