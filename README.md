<!--
SPDX-FileCopyrightText: 2026 Will Estes <westes575@gmail.com>

SPDX-License-Identifier: MIT
-->

# manuscript-build

Converts a Markdown story file into a submission-ready Word document following
Standard Manuscript Format (SMF). Handles the title page, running headers, word
count, and double-spaced body text automatically.

## Requirements

- [Node.js](https://nodejs.org/)
- [pandoc](https://pandoc.org/)

## Setup

Run once after cloning:

```
make setup
```

This runs `npm init` and installs the required Node packages. You will need to
commit the generated `package.json` to the repository afterward.

## Files

| File | Purpose |
|---|---|
| `Makefile` | Build orchestration |
| `build.js` | Reads metadata, counts words, builds title page, runs pandoc, merges output |
| `make-reference.js` | Generates `reference.docx` — the style template pandoc uses |
| `hrule-to-scene-break.lua` | Pandoc Lua filter: converts `---` horizontal rules to centered `#` scene break markers |
| `story.yaml` | Example metadata sidecar — copy and rename alongside each story file |

## Story metadata

Each story needs a YAML sidecar file in the same directory, named to match the
story file:

```
my-story.md
my-story.yaml
```

Required fields:

```yaml
title:    "The Long Dark"
author:   "Jane Smith"
surname:  "Smith"
email:    "jane@example.com"
```

Optional fields:

```yaml
address:  "123 Main St, City, ST 00000"
```

`surname` is used in the running header (`Smith / THE LONG DARK`) and in the
output filename. Use your submission name here — pseudonym if applicable.

## Building

Generate the style reference document once (or after any style changes):

```
make reference
```

Build a submission docx:

```
make STORY=path/to/my-story.md
```

The output file is placed in the current directory and named `Surname-Title.docx`.

By default, horizontal rules (`---`) in the Markdown are converted to centered
`#` scene break markers. To disable this:

```
make STORY=path/to/my-story.md FILTERS=
```

To use a different or additional Lua filter:

```
make STORY=path/to/my-story.md FILTERS="--lua-filter other.lua"
make STORY=path/to/my-story.md FILTERS="--lua-filter a.lua --lua-filter b.lua"
```

## Output

The generated docx follows standard manuscript format:

- Courier New 12pt (change to Times New Roman in `make-reference.js` if needed)
- Double-spaced body text with 0.5" first-line indent
- Title page: contact block with word count flush-right, title and byline centered
- Running header: `Surname / TITLE` with page number flush-right
- Word count rounded to nearest 100

## Submission files

The output docx is a build artifact. Store completed submission files separately
from this toolchain, named to reflect where and when you submitted:

```
Smith-TheLongDark-tor-2026-04.docx
```

## Cleaning up

Remove build temporaries:

```
make clean
```

Remove the generated reference document as well (it will be rebuilt on the next
`make reference`):

```
make distclean
```

## License

MIT. See `LICENSE`. Output files (generated docx) belong to their respective authors.
