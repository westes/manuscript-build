# SPDX-FileCopyrightText: 2026 Will Estes <westes575@gmail.com>
#
# SPDX-License-Identifier: MIT

STORY    ?= story.md
STORYBASE = $(basename $(notdir $(STORY)))
YAMLFILE  = $(dir $(STORY))$(STORYBASE).yaml
REF_DOCX  = reference.docx
NODE     ?= node

# Lua filters passed to pandoc. Default converts horizontal rules to scene breaks.
# Override on the command line:
#   make STORY=my-story.md                               -- default filter
#   make STORY=my-story.md FILTERS="--lua-filter other.lua"  -- different filter
#   make STORY=my-story.md FILTERS=                      -- no filters at all
FILTERS ?= --lua-filter hrule-to-scene-break.lua

all: $(YAMLFILE) $(STORY) $(REF_DOCX)
	$(NODE) build.js --story $(STORY) --outdir . --extra-args "$(FILTERS)"

clean:
	rm -f *.tmp.docx

distclean: clean
	rm -f $(REF_DOCX)

# Run once after cloning. Requires node and pandoc to already be installed.
# To add packages later: npm install <package>  (updates package.json too)

setup:
	npm init -y
	npm install docx js-yaml adm-zip @xmldom/xmldom

reference: $(REF_DOCX)

$(REF_DOCX): make-reference.js
	$(NODE) make-reference.js --out $(REF_DOCX)

.PHONY: all reference clean distclean setup
