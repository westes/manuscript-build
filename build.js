#!/usr/bin/env node
//
// build.js
// Reads a story's YAML sidecar, counts words, builds the title-page docx,
// runs pandoc for the body, merges both into the final submission docx.
//
// Usage:
//   node build.js --story path/to/story.md [--outdir /path/to/output/dir]
//
// Output filename is derived from the YAML sidecar as: Surname-Title.docx
// Sidecar is resolved as: <story-basename>.yaml in the same directory as the story.
//
// Required YAML fields:
//   title:    "The Long Dark"
//   author:   "Jane Smith"
//   surname:  "Smith"
//   email:    "jane@example.com"
//
// Optional YAML fields:
//   address:  "123 Main St, City, ST 00000"

'use strict';

const {
  Document, Packer, Paragraph, TextRun,
  Header, AlignmentType, TabStopType, TabStopPosition,
  PageNumber, HeadingLevel,
} = require('docx');

const fs                        = require('fs');
const path                      = require('path');
const yaml                      = require('js-yaml');
const AdmZip                    = require('adm-zip');
const { execSync }              = require('child_process');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

// Args

const args = process.argv.slice(2);

function getArg(flag, fallback = null) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const storyPath = getArg('--story');
if (!storyPath) {
  console.error('Usage: node build.js --story <file.md> [--outdir <dir>]');
  process.exit(1);
}

const storyDir  = path.dirname(path.resolve(storyPath));
const storyBase = path.basename(storyPath, path.extname(storyPath));
const yamlPath  = path.join(storyDir, `${storyBase}.yaml`);
const outDir    = path.resolve(getArg('--outdir', '.'));
const refDocPath = path.join(outDir, 'reference.docx');

// Load metadata

if (!fs.existsSync(yamlPath)) {
  console.error(`Metadata file not found: ${yamlPath}`);
  process.exit(1);
}

const meta = yaml.load(fs.readFileSync(yamlPath, 'utf8'));

for (const key of ['title', 'author', 'surname', 'email']) {
  if (!meta[key]) {
    console.error(`Missing required metadata field: ${key}`);
    process.exit(1);
  }
}

// Output filename: Surname-Title.docx (spaces in title become hyphens)
const safeTitle = meta.title.replace(/\s+/g, '-');
const outPath   = path.join(outDir, `${meta.surname}-${safeTitle}.docx`);
const bodyTmp   = path.join(outDir, `${storyBase}.body.tmp.docx`);

// Word count

function countWords(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  text = text
    .replace(/^---[\s\S]*?^---\s*/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/[#*_~>\-]+/g, ' ')
    .replace(/<[^>]+>/g, '');
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const exactCount   = countWords(storyPath);
const roundedCount = Math.round(exactCount / 100) * 100;
const displayCount = roundedCount.toLocaleString();
console.log(`Word count: ${exactCount} (displayed as ~${displayCount})`);
console.log(`Output: ${outPath}`);

const INCH = 1440;

// Build title-page docx

async function buildTitlePage() {
  const shortTitle = meta.title.toUpperCase();

  const runningHeader = new Header({
    children: [
      new Paragraph({
        style: 'Header',
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun(`${meta.surname} / ${shortTitle}`),
          new TextRun({ children: ['\t', PageNumber.CURRENT] }),
        ],
      }),
    ],
  });

  const contactLines = [meta.author, meta.address || null, meta.email].filter(Boolean);

  const contactParagraphs = contactLines.map((line, i) =>
    i === 0
      ? new Paragraph({
          style: 'TitleBlock',
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun(line),
            new TextRun(`\t~${displayCount} words`),
          ],
        })
      : new Paragraph({ style: 'TitleBlock', children: [new TextRun(line)] })
  );

  const spacers = Array.from({ length: 8 }, () =>
    new Paragraph({ style: 'Normal', children: [new TextRun('')] })
  );

  const styles = {
    default: {
      document: { run: { font: 'Courier New', size: 24 } },
    },
    paragraphStyles: [
      {
        id: 'Normal', name: 'Normal',
        run: { font: 'Courier New', size: 24 },
        paragraph: {
          spacing: { line: 480, lineRule: 'auto', before: 0, after: 0 },
          indent: { firstLine: INCH / 2 },
        },
      },
      {
        id: 'BodyFirst', name: 'Body First', basedOn: 'Normal',
        paragraph: { indent: { firstLine: 0 } },
      },
      {
        id: 'TitleBlock', name: 'Title Block', basedOn: 'Normal',
        paragraph: {
          indent: { firstLine: 0 },
          spacing: { line: 240, lineRule: 'auto', before: 0, after: 0 },
        },
      },
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal',
        next: 'BodyFirst', quickFormat: true,
        run: { font: 'Courier New', size: 24, bold: false },
        paragraph: {
          alignment: AlignmentType.CENTER,
          indent: { firstLine: 0 },
          outlineLevel: 0,
          spacing: { before: 0, after: 480, line: 480, lineRule: 'auto' },
        },
      },
      {
        id: 'Header', name: 'Header', basedOn: 'Normal',
        paragraph: {
          indent: { firstLine: 0 },
          spacing: { line: 240, lineRule: 'auto', before: 0, after: 0 },
        },
      },
    ],
  };

  const doc = new Document({
    styles,
    sections: [{
      properties: {
        page: {
          size:   { width: 12240, height: 15840 },
          margin: { top: INCH, right: INCH, bottom: INCH, left: INCH },
        },
      },
      headers: { default: runningHeader },
      children: [
        ...contactParagraphs,
        ...spacers,
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun(meta.title)],
        }),
        new Paragraph({
          style: 'Normal',
          alignment: AlignmentType.CENTER,
          indent: { firstLine: 0 },
          spacing: { before: 0, after: 480, line: 480, lineRule: 'auto' },
          children: [new TextRun(`by ${meta.author}`)],
        }),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}

// Run pandoc

function runPandoc() {
  if (!fs.existsSync(refDocPath)) {
    console.error(`reference.docx not found at: ${refDocPath}`);
    console.error('Run: make reference');
    process.exit(1);
  }
  const cmd = `pandoc ${storyPath} --from markdown --to docx --reference-doc=${refDocPath} -o ${bodyTmp}`;
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

// Merge title page + pandoc body via ZIP/XML

function mergeDocs(titleBuf) {
  const titleZip = new AdmZip(titleBuf);
  const bodyZip  = new AdmZip(bodyTmp);

  const parser     = new DOMParser();
  const serializer = new XMLSerializer();

  const titleDom = parser.parseFromString(titleZip.readAsText('word/document.xml'), 'text/xml');
  const bodyDom  = parser.parseFromString(bodyZip.readAsText('word/document.xml'),  'text/xml');

  const titleBody = titleDom.getElementsByTagNameNS('*', 'body')[0];
  const bodyBody  = bodyDom.getElementsByTagNameNS('*',  'body')[0];

  const titleSectPr = titleBody.lastChild;

  for (const node of Array.from(bodyBody.childNodes)) {
    const localName = node.localName || node.nodeName.replace(/^.*:/, '');
    if (localName === 'sectPr') continue;
    titleBody.insertBefore(titleDom.importNode(node, true), titleSectPr);
  }

  titleZip.updateFile('word/document.xml', Buffer.from(serializer.serializeToString(titleDom)));
  titleZip.writeZip(outPath);

  fs.unlinkSync(bodyTmp);
  console.log(`Done: ${outPath}`);
}

// Main

(async () => {
  runPandoc();
  const titleBuf = await buildTitlePage();
  mergeDocs(titleBuf);
})();
