-- Tincture of Mercy — shrink_or_lift_cell.lua
-- Shift and optionally nearest-neighbor scale selected flat-sheet cells.
-- Params: rows=all|name, cols=all|0,1, dx=0, dy=-2, scale=100.

local script_dir = app.fs.filePath(string.sub(debug.getinfo(1, "S").source, 2))
local tom = dofile(app.fs.joinPath(script_dir, "tom_sprite_lib.lua"))

local sprite, cel, img = tom.active_edit_image()
local ctx = tom.context(sprite)
local meta = tom.metadata(ctx)

local rows = tom.row_indices(meta, app.params["rows"] or "all")
local cols = tom.col_indices(meta, app.params["cols"] or "all")
local dx = tonumber(app.params["dx"] or "0") or 0
local dy = tonumber(app.params["dy"] or "0") or 0
local scale = (tonumber(app.params["scale"] or "100") or 100) / 100.0
if scale <= 0 then tom.abort("scale must be > 0") end
local transparent = tom.pixel(sprite, 0, 0, 0, 0)

local function transform_cell(row, col)
  local x0 = col * meta.frame_w
  local y0 = row * meta.frame_h
  local pixels = {}
  for y = 0, meta.frame_h - 1 do
    for x = 0, meta.frame_w - 1 do
      local p = img:getPixel(x0 + x, y0 + y)
      if tom.alpha(p) > 0 then
        table.insert(pixels, {x=x, y=y, p=p})
      end
    end
  end
  for y = 0, meta.frame_h - 1 do
    for x = 0, meta.frame_w - 1 do
      img:putPixel(x0 + x, y0 + y, transparent)
    end
  end
  local cx = (meta.frame_w - 1) / 2.0
  local cy = (meta.frame_h - 1) / 2.0
  for _, item in ipairs(pixels) do
    local nx = math.floor((item.x - cx) * scale + cx + dx + 0.5)
    local ny = math.floor((item.y - cy) * scale + cy + dy + 0.5)
    if nx >= 0 and nx < meta.frame_w and ny >= 0 and ny < meta.frame_h then
      img:putPixel(x0 + nx, y0 + ny, item.p)
    end
  end
end

local count = 0
app.transaction("Shift/scale selected cells", function()
  for row = 0, meta.target_rows - 1 do
    if rows[row] then
      for col = 0, meta.target_cols - 1 do
        if cols[col] then
          transform_cell(row, col)
          count = count + 1
        end
      end
    end
  end
  cel.image = img
end)
app.refresh()
tom.message("shrink_or_lift_cell", "Adjusted " .. tostring(count) .. " cell(s): dx=" .. dx .. ", dy=" .. dy .. ", scale=" .. tostring(math.floor(scale * 100 + 0.5)) .. "%.")
