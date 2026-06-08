-- Tincture of Mercy — auto_tag_animations.lua
-- Create timeline tags from tools/sprites/specs/<character>.json animation_keys.
-- For flat sheet files, this sets grid bounds and explains that tags require a timeline document.
-- Params: fps=8, replace=1.

local script_dir = app.fs.filePath(string.sub(debug.getinfo(1, "S").source, 2))
local tom = dofile(app.fs.joinPath(script_dir, "tom_sprite_lib.lua"))

local sprite = app.activeSprite
if not sprite then tom.abort("Open a sprite first.") end
local ctx = tom.context(sprite)
local meta = tom.metadata(ctx)
local fps = tonumber(app.params["fps"] or "8") or 8
if fps <= 0 then tom.abort("fps must be > 0") end
local replace = (app.params["replace"] or "1") ~= "0"
local keys = meta.animation_keys or {}

app.transaction("Auto-tag animations", function()
  sprite.gridBounds = Rectangle(0, 0, meta.frame_w, meta.frame_h)
  for _, frame in ipairs(sprite.frames) do
    frame.duration = 1.0 / fps
  end
  if #sprite.frames >= meta.target_cols * #keys and #keys > 0 then
    for row, key in ipairs(keys) do
      local from_frame = (row - 1) * meta.target_cols + 1
      local to_frame = math.min(row * meta.target_cols, #sprite.frames)
      if from_frame <= #sprite.frames then
        if replace then pcall(function() sprite:deleteTag(key) end) end
        local tag = sprite:newTag(from_frame, to_frame)
        tag.name = key
        tag.aniDir = AniDir.FORWARD
      end
    end
  end
end)
app.refresh()

if #sprite.frames < meta.target_cols * #keys then
  tom.message("auto_tag_animations", {
    "Set grid bounds to " .. meta.frame_w .. "×" .. meta.frame_h .. " and frame duration to " .. tostring(1.0 / fps) .. "s.",
    "Timeline tags were not created because this document has " .. tostring(#sprite.frames) .. " frame(s).",
    "Import/split the sheet into timeline frames first, then rerun this script."
  })
else
  tom.message("auto_tag_animations", "Created/updated " .. tostring(#keys) .. " animation tag(s) at " .. tostring(fps) .. " fps.")
end
