-- Tincture of Mercy — baseline_overlay.lua
-- Toggle/add a non-authoring helper layer with the spec baseline and cell grid.
-- Export scripts hide layers whose names start with "TOM " so the guide won't ship.

local script_dir = app.fs.filePath(string.sub(debug.getinfo(1, "S").source, 2))
local tom = dofile(app.fs.joinPath(script_dir, "tom_sprite_lib.lua"))

local sprite = app.activeSprite
if not sprite then tom.abort("Open a sprite first.") end
local ctx = tom.context(sprite)
local meta = tom.metadata(ctx)

local layer_name = "TOM baseline overlay"
local mode = app.params["mode"] or "toggle"
local existing = tom.layer_by_name(sprite, layer_name)

if existing and mode ~= "add" and mode ~= "replace" then
  app.transaction("Remove TOM baseline overlay", function()
    sprite:deleteLayer(existing)
  end)
  tom.message("baseline_overlay", "Removed baseline overlay.")
  return
end

local r, g, b = tom.hex_to_rgb(app.params["color"] or "#6E8A7C")
local alpha = tonumber(app.params["alpha"] or "160") or 160
local baseline_px = tom.pixel(sprite, r, g, b, alpha)
local grid_px = tom.pixel(sprite, r, g, b, math.floor(alpha * 0.45))
local img = Image(sprite.spec)
img:clear()

for row = 0, meta.target_rows - 1 do
  local y = row * meta.frame_h + meta.baseline_y
  if y >= 0 and y < sprite.height then
    for x = 0, math.min(sprite.width, meta.sheet_w) - 1 do
      img:putPixel(x, y, baseline_px)
    end
  end
end

for col = 0, meta.target_cols do
  local x = col * meta.frame_w
  if x >= 0 and x < sprite.width then
    for y = 0, math.min(sprite.height, meta.sheet_h) - 1, 2 do
      img:putPixel(x, y, grid_px)
    end
  end
end
for row = 0, meta.target_rows do
  local y = row * meta.frame_h
  if y >= 0 and y < sprite.height then
    for x = 0, math.min(sprite.width, meta.sheet_w) - 1, 2 do
      img:putPixel(x, y, grid_px)
    end
  end
end

app.transaction("Add TOM baseline overlay", function()
  tom.delete_layer_by_name(sprite, layer_name)
  local layer = sprite:newLayer()
  layer.name = layer_name
  sprite:newCel(layer, 1, img, Point(0, 0))
end)
app.refresh()
tom.message("baseline_overlay", "Added baseline/grid overlay at y=" .. tostring(meta.baseline_y) .. ". This helper layer is hidden by export_with_validation.")
