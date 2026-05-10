using Tincture.Substrate.Data;

namespace Tincture.Tests.Data;

public sealed class LatentPathTests
{
    [Fact]
    public void LatentPath_ToIdFailsFastForUnsupportedValue()
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() => ((LatentPath)999).ToId());

        Assert.Equal("path", exception.ParamName);
    }
}
