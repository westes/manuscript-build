STORY    ?= story.md
STORYBASE = $(basename $(notdir $(STORY)))
YAMLFILE  = $(dir $(STORY))$(STORYBASE).yaml
REF_DOCX  = reference.docx
NODE ?= node

all: $(YAMLFILE) $(STORY) $(REF_DOCX)
	$(NODE) build.js --story $(STORY) --outdir .

# Submission docx files are Surname-Title.docx — archive them separately,
# don't rely on make clean to manage them.
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
	node make-reference.js --out $(REF_DOCX)


.PHONY: all reference clean distclean setup
