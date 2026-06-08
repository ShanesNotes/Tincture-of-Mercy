#nullable enable
using Godot;

public partial class Presentation : SceneTree
{
    private const int TotalFrames = 450;
    private Node2D? _scene;
    private Node2D? _player;
    private Camera2D? _camera;
    private Sprite2D? _kalev;
    private int _frame;

    public override void _Initialize()
    {
        var packed = GD.Load<PackedScene>("res://scenes/world_lab/ironwood_world_lab.tscn");
        if (packed is null)
        {
            GD.PushError("Could not load ironwood world lab scene for presentation capture.");
            Quit(1);
            return;
        }

        _scene = packed.Instantiate<Node2D>();
        Root.AddChild(_scene);
        _player = FindNode<Node2D>(_scene, "KalevPlayer");
        _camera = FindNode<Camera2D>(_scene, "WorldCamera");
        _kalev = FindNode<Sprite2D>(_scene, "KalevSprite");
        if (_camera is not null)
        {
            _camera.MakeCurrent();
        }
    }

    public override bool _Process(double delta)
    {
        _frame++;
        var t = Mathf.Clamp(_frame / (float)TotalFrames, 0f, 1f);
        var pos = PathPosition(t);

        if (_player is not null)
        {
            _player.Position = pos;
        }
        if (_camera is not null)
        {
            _camera.Position = CameraPosition(t);
            _camera.MakeCurrent();
        }
        if (_kalev is not null)
        {
            var row = DirectionRow(t);
            var col = (_frame / 4) % 5;
            _kalev.RegionRect = new Rect2(col * 64, row * 96, 64, 96);
        }

        if (_frame >= TotalFrames)
        {
            Quit();
        }
        return false;
    }

    private static Vector2 PathPosition(float t)
    {
        var points = new[]
        {
            new Vector2(24 * 32 + 16, 30 * 32 + 24), // snowy road approach
            new Vector2(24 * 32 + 16, 25 * 32 + 24), // warm threshold
            new Vector2(23 * 32 + 16, 19 * 32 + 24), // cabin center/rug
            new Vector2(19 * 32 + 16, 16 * 32 + 24), // hearth + Iiro
            new Vector2(29 * 32 + 16, 17 * 32 + 24), // Anna bedside
            new Vector2(35 * 32 + 16, 22 * 32 + 24), // yard/treeline wolf
            new Vector2(24 * 32 + 16, 25 * 32 + 24), // return to threshold
        };
        var scaled = t * (points.Length - 1);
        var index = Mathf.Clamp(Mathf.FloorToInt(scaled), 0, points.Length - 2);
        var local = scaled - index;
        return points[index].Lerp(points[index + 1], Smooth(local));
    }

    private static Vector2 CameraPosition(float t)
    {
        var points = new[]
        {
            new Vector2(24 * 32 + 16, 27 * 32 + 0),  // road/threshold
            new Vector2(24 * 32 + 16, 18 * 32 + 0),  // cabin floor/rug
            new Vector2(18 * 32 + 16, 15 * 32 + 0),  // hearth + Iiro
            new Vector2(29 * 32 + 16, 17 * 32 + 0),  // Anna bedside
            new Vector2(36 * 32 + 16, 21 * 32 + 0),  // treeline wolf
            new Vector2(24 * 32 + 16, 24 * 32 + 0),  // return threshold/Lena
        };
        var scaled = t * (points.Length - 1);
        var index = Mathf.Clamp(Mathf.FloorToInt(scaled), 0, points.Length - 2);
        var local = scaled - index;
        return points[index].Lerp(points[index + 1], Smooth(local));
    }

    private static float Smooth(float x)
    {
        return x * x * (3f - 2f * x);
    }

    private static int DirectionRow(float t)
    {
        // Kalev sheet row order: idle_down, walk_down, idle_left, walk_left, idle_up, walk_up, idle_right, walk_right.
        if (t < 0.34f) return 5; // walking up toward cabin/hearth
        if (t < 0.55f) return 7; // walking right toward Anna
        if (t < 0.73f) return 7; // walking right toward treeline
        return 1;                // walking down/back to threshold
    }

    private static T? FindNode<T>(Node node, string name) where T : Node
    {
        if (node.Name == name && node is T typed)
        {
            return typed;
        }
        foreach (var child in node.GetChildren())
        {
            var found = FindNode<T>(child, name);
            if (found is not null)
            {
                return found;
            }
        }
        return null;
    }
}
