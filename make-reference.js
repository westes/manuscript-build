#!/usr/bin/env node
//
// make-reference.js
// Generates reference.docx for pandoc --reference-doc
// Follows Standard Manuscript Format (SMF) for fiction submissions
//
// Usage:
//   node make-reference.js [--out reference.docx]
//
// Defines STYLES ONLY — no author/title/word-count content.
// Actual content is injected by build.js at build time.

'use strict';

const {
  Document, Packer, Paragraph, TextRun,
  Header, AlignmentType, TabStopType, TabStopPosition,
  PageNumber,
} = require('docx');

const fs = require('fs');
const args = process.argv.slice(2);

function getArg(flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const outPath = getArg('--out', 'reference.docx');
const INCH = 1440; // 1440 DXA = 1 inch

const runningHeader = new Header({
  children: [
    new Paragraph({
      style: 'Header',
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun('SURNAME / TITLE'),
        new TextRun({ children: ['\t', PageNumber.CURRENT] }),
      ],
    }),
  ],
});

const doc = new Document({
  styles: {
    default: {
      document: {
        // Courier New is traditional SMF.
        // Swap to "Times New Roman" here if the anthology spec requires it.
        run: { font: 'Courier New', size: 24 }, // 24 half-points = 12pt
      },
    },
    paragraphStyles: [

      // Body text — double-spaced, 0.5" first-line indent
      {
        id: 'Normal',
        name: 'Normal',
        run: { font: 'Courier New', size: 24 },
        paragraph: {
          spacing: { line: 480, lineRule: 'auto', before: 0, after: 0 },
          indent: { firstLine: INCH / 2 },
        },
      },

      // First paragraph after a heading or scene break — no indent
      {
        id: 'BodyFirst',
        name: 'Body First',
        basedOn: 'Normal',
        paragraph: { indent: { firstLine: 0 } },
      },

      // Scene break marker — centered, no indent, small breathing room
      {
        id: 'SceneBreak',
        name: 'Scene Break',
        basedOn: 'Normal',
        paragraph: {
          alignment: AlignmentType.CENTER,
          indent: { firstLine: 0 },
          spacing: { before: 240, after: 240, line: 480, lineRule: 'auto' },
        },
      },

      // Story title / chapter heading — centered, not bold (SMF convention)
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'BodyFirst',
        quickFormat: true,
        run: { font: 'Courier New', size: 24, bold: false },
        paragraph: {
          alignment: AlignmentType.CENTER,
          indent: { firstLine: 0 },
          outlineLevel: 0,
          spacing: { before: 0, after: 480, line: 480, lineRule: 'auto' },
        },
      },

      // Title-page contact block — single-spaced, no indent
      {
        id: 'TitleBlock',
        name: 'Title Block',
        basedOn: 'Normal',
        paragraph: {
          indent: { firstLine: 0 },
          spacing: { line: 240, lineRule: 'auto', before: 0, after: 0 },
        },
      },

      // Running header — single-spaced, no indent
      {
        id: 'Header',
        name: 'Header',
        basedOn: 'Normal',
        paragraph: {
          indent: { firstLine: 0 },
          spacing: { line: 240, lineRule: 'auto', before: 0, after: 0 },
        },
      },

    ],
  },

  sections: [{
    properties: {
      page: {
        size:   { width: 12240, height: 15840 }, // US Letter
        margin: { top: INCH, right: INCH, bottom: INCH, left: INCH },
      },
    },
    headers: { default: runningHeader },
    // Minimal placeholder content — pandoc reads styles, not this text
    children: [
      new Paragraph({ style: 'TitleBlock',  children: [new TextRun('Author Name')] }),
      new Paragraph({ style: 'TitleBlock',  children: [new TextRun('author@email.com')] }),
      new Paragraph({ style: 'Heading1',    children: [new TextRun('Story Title')] }),
      new Paragraph({ style: 'BodyFirst',   children: [new TextRun('First paragraph.')] }),
      new Paragraph({ style: 'Normal',      children: [new TextRun('Body paragraph.')] }),
      new Paragraph({ style: 'SceneBreak',  children: [new TextRun('#')] }),
      new Paragraph({ style: 'BodyFirst',   children: [new TextRun('After scene break.')] }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log(`Written: ${outPath}`);
});
