namespace Tincture.Substrate.Data;

public static class ActCatalogValidator
{
    public static ActDef ValidateAct(ActDef act)
    {
        ArgumentNullException.ThrowIfNull(act);
        return act.Validate();
    }
}
