-- Tincture of Mercy — add_hair_canopy.lua
-- Conservative one-keystroke hair-volume helper for flat runtime sheets.
-- Params: rows=all|name, cols=all|0,1, height=5, color=#1A1612, min_run=5.

local script_dir = app.fs.filePath(string.sub(debug.getinfo(1, "S").source, 2))
local tom = dofile(app.fs.joinPath(script_dir, "tom_sprite_lib.lua"))

local sprite, cel, img = tom.active_edit_image()
local ctx = tom.context(sprite)
local meta = tom.metadata(ctx)

local rows = tom.row_indices(meta, app.params["rows"] or "all")
local cols = tom.col_indices(meta, app.params["cols"] or "all")
local height = tonumber(app.params["height"] or "5") or 5
local min_run = tonumber(app.params["min_run"] or "5") or 5
if height < 1 then tom.abort("height must be >= 1") end
local r, g, b = tom.hex_to_rgb(app.params["color"] or "#1A1612")
local hair = tom.pixel(sprite, r, g, b, 255)

local function add_to_cell(row, col)
  local x0 = col * meta.frame_w
  local y0 = row * meta.frame_h
  local max_scan_y = math.min(meta.frame_h - 1, math.floor(meta.frame_h * 0.60))
  local top_by_x = {}
  local run = 0
  for x = 1, meta.frame_w - 2 do
    for y = 0, max_scan_y do
      if tom.alpha(img:getPixel(x0 + x, y0 + y)) > 0 then
        top_by_x[x] = y
        run = run + 1
        break
      end
    end
  end
  if run < min_run then return 0 end

  local changed = 0
  for x, top_y in pairs(top_by_x) do
    for lift = 1, height do
      local y = top_y - lift
      if y >= 0 then
        -- Dither the furthest edge so the canopy doesn't become a hard helmet.
        if lift < height or ((x + row + col) % 2 == 0) then
          if tom.alpha(img:getPixel(x0 + x, y0 + y)) == 0 then
            img:putPixel(x0 + x, y0 + y, hair)
            changed = changed + 1
          end
        end
      end
    end
  end
  return changed
end

local cells = 0
local pixels = 0
app.transaction("Add hair canopy", function()
  for row = 0, meta.target_rows - 1 do
    if rows[row] then
      for col = 0, meta.target_cols - 1 do
        if cols[col] then
          local changed = add_to_cell(row, col)
          if changed > 0 then cells = cells + 1; pixels = pixels + changed end
        end
      end
    end
  end
  cel.image = img
end)
app.refresh()
tom.message("add_hair_canopy", "Added hair canopy to " .. tostring(cells) .. " cell(s), " .. tostring(pixels) .. " pixel(s). Use export_with_validation to validate.")
