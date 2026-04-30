-- hrule-to-scene-break.lua
-- Converts markdown horizontal rules (---, ***, ___) to a centered # paragraph
-- styled as "Scene Break" in the output docx.
--
-- Usage:
--   pandoc story.md --lua-filter hrule-to-scene-break.lua ...

function HorizontalRule()
  return pandoc.Para({
    pandoc.Span(
      { pandoc.Str('#') },
      pandoc.Attr('', {}, { ['custom-style'] = 'Scene Break' })
    )
  })
end
