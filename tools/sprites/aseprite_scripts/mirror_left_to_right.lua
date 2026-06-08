-- Tincture of Mercy — mirror_left_to_right.lua
-- Copy one flat-sheet row into another row, horizontally flipped per cell.
-- Params: from=<row-name-or-index> to=<row-name-or-index>. Defaults walk_left→walk_right, then idle_left→idle_right.

local script_dir = app.fs.filePath(string.sub(debug.getinfo(1, "S").source, 2))
local tom = dofile(app.fs.joinPath(script_dir, "tom_sprite_lib.lua"))

local sprite, cel, img = tom.active_edit_image()
local ctx = tom.context(sprite)
local meta = tom.metadata(ctx)

local function row_for_name(name)
  local rows = tom.row_indices(meta, name)
  for row, _ in pairs(rows) do return row end
  tom.abort("No row matched: " .. tostring(name))
end

local keys = meta.animation_keys or {}
local from_name = app.params["from"]
local to_name = app.params["to"]
if not from_name or not to_name then
  local has = {}
  for _, key in ipairs(keys) do has[key] = true end
  if has["walk_left"] and has["walk_right"] then
    from_name, to_name = "walk_left", "walk_right"
  elseif has["idle_left"] and has["idle_right"] then
    from_name, to_name = "idle_left", "idle_right"
  else
    tom.abort("Pass from=<row> and to=<row>; no left/right default pair exists for this pass.")
  end
end

local from_row = row_for_name(from_name)
local to_row = row_for_name(to_name)
if from_row == to_row then tom.abort("from and to rows are the same") end

local transparent = tom.pixel(sprite, 0, 0, 0, 0)
app.transaction("Mirror row " .. from_name .. " to " .. to_name, function()
  for col = 0, meta.target_cols - 1 do
    local sx0 = col * meta.frame_w
    local sy0 = from_row * meta.frame_h
    local dx0 = col * meta.frame_w
    local dy0 = to_row * meta.frame_h
    for y = 0, meta.frame_h - 1 do
      for x = 0, meta.frame_w - 1 do
        img:putPixel(dx0 + x, dy0 + y, transparent)
      end
    end
    for y = 0, meta.frame_h - 1 do
      for x = 0, meta.frame_w - 1 do
        local p = img:getPixel(sx0 + (meta.frame_w - 1 - x), sy0 + y)
        img:putPixel(dx0 + x, dy0 + y, p)
      end
    end
  end
  cel.image = img
end)
app.refresh()
tom.message("mirror_left_to_right", "Mirrored " .. from_name .. " → " .. to_name .. " across " .. tostring(meta.target_cols) .. " cell(s).")
