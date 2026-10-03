-- SPDX-FileCopyrightText: 2026 Will Estes <westes575@gmail.com>
--
-- SPDX-License-Identifier: MIT

-- hrule-to-scene-break.lua
-- Converts markdown horizontal rules (---, ***, ___) to a centered # paragraph
-- styled as "Scene Break" in the output docx. The custom-style goes on a Div,
-- not a Span: pandoc maps a Span's custom-style to a character style, which
-- leaves the paragraph itself in the default (left-aligned) body style.
--
-- Usage:
--   pandoc story.md --lua-filter hrule-to-scene-break.lua ...

function HorizontalRule()
  return pandoc.Div(
    { pandoc.Para({ pandoc.Str('#') }) },
    pandoc.Attr('', {}, { ['custom-style'] = 'Scene Break' })
  )
end
