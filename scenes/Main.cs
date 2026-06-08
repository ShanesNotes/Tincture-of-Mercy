using Godot;

public partial class Main : Node2D
{
    private const string WorldLabScenePath = "res://scenes/world_lab/ironwood_world_lab.tscn";

    public override void _Ready()
    {
        var packed = GD.Load<PackedScene>(WorldLabScenePath);
        if (packed is null)
        {
            GD.PushError($"Main: could not load world lab scene at {WorldLabScenePath}");
            return;
        }
        AddChild(packed.Instantiate());
    }
}
