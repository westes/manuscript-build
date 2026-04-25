STORY     ?= story.md
OUT       := $(patsubst %.md,%.docx,$(STORY))
REF_DOCX  := $(dir $(STORY))reference.docx

.PHONY: all reference clean distclean setup

# ── One-time setup ────────────────────────────────────────────────────────────
# Run once after cloning: make setup
# Requires node and pandoc to already be installed.
# If you add packages later: npm install <package> (updates package.json too)

setup:
	npm init -y
	npm install docx js-yaml adm-zip @xmldom/xmldom

# ── Reference doc ─────────────────────────────────────────────────────────────
# Rebuilt only when make-reference.js changes.

$(REF_DOCX): make-reference.js
	node make-reference.js --out $@

reference: $(REF_DOCX)
# ──
$(OUT): $(STORY) $(patsubst %.md,%.yaml,$(STORY)) $(REF_DOCX)
	node build.js --story $(STORY) --out $(OUT)

all: $(OUT)

clean:
	rm -f $(OUT)

distclean: clean
	rm -f $(REF_DOCX)
