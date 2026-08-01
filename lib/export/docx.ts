import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { Block } from "@/lib/export/proposal";

/**
 * Renders the proposal block list to a .docx buffer.
 *
 * Word rather than PDF is the primary export because a Board of Studies edits
 * the document before tabling it — a locked PDF would be handed straight back.
 */

const INK = "16150F";
const MUTED = "6B675C";
const RULE = "D6D0C4";
const ACCENT = "8C2F26";

export async function renderDocx(blocks: Block[]): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "title":
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: block.text, bold: true, size: 34, color: INK, font: "Georgia" }),
            ],
          }),
        );
        if (block.subtitle) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 320 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE } },
              children: [new TextRun({ text: block.subtitle, size: 20, color: MUTED })],
            }),
          );
        }
        break;

      case "heading":
        children.push(
          new Paragraph({
            heading: block.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
            spacing: { before: block.level === 1 ? 360 : 240, after: 120 },
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                size: block.level === 1 ? 26 : 22,
                color: INK,
                font: "Georgia",
              }),
            ],
          }),
        );
        break;

      case "paragraph":
        children.push(
          new Paragraph({
            spacing: { after: 160, line: 300 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: block.text,
                size: 21,
                italics: block.italic,
                color: block.italic ? MUTED : INK,
              }),
            ],
          }),
        );
        break;

      case "keyValue":
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: hairline(),
            rows: block.rows.map(
              ([key, value]) =>
                new TableRow({
                  children: [
                    cell(key, { width: 38, bold: false, color: MUTED }),
                    cell(value, { width: 62, bold: true }),
                  ],
                }),
            ),
          }),
        );
        children.push(spacer());
        break;

      case "table":
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: hairline(),
            rows: [
              new TableRow({
                tableHeader: true,
                children: block.head.map((heading, i) =>
                  cell(heading, {
                    width: block.widths?.[i],
                    bold: true,
                    color: ACCENT,
                    shading: "EFEBE2",
                  }),
                ),
              }),
              ...block.rows.map(
                (row) =>
                  new TableRow({
                    children: row.map((value, i) => cell(value, { width: block.widths?.[i] })),
                  }),
              ),
            ],
          }),
        );
        children.push(spacer());
        break;

      case "list":
        for (const item of block.items) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 60 },
              children: [new TextRun({ text: item, size: 20, color: MUTED })],
            }),
          );
        }
        children.push(spacer());
        break;

      case "signatures":
        children.push(
          new Paragraph({
            spacing: { before: 640, after: 160 },
            children: [
              new TextRun({ text: "Endorsements", bold: true, size: 22, color: INK, font: "Georgia" }),
            ],
          }),
        );
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: hairline(),
            rows: block.roles.map(
              (role) =>
                new TableRow({
                  children: [
                    cell(role, { width: 40, color: MUTED }),
                    cell(" ", { width: 35 }),
                    cell("Date", { width: 25, color: MUTED }),
                  ],
                }),
            ),
          }),
        );
        break;
    }
  }

  const document = new Document({
    creator: "CurriPulse AI",
    title: "Board of Studies — Proposal for Syllabus Revision",
    description: "Fast-track syllabus amendment within 15% of contact hours",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 21, color: INK } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}

function cell(
  text: string,
  options: { width?: number; bold?: boolean; color?: string; shading?: string } = {},
): TableCell {
  return new TableCell({
    width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
    shading: options.shading ? { fill: options.shading } : undefined,
    margins: { top: 90, bottom: 90, left: 140, right: 140 },
    children: [
      new Paragraph({
        spacing: { line: 260 },
        children: [
          new TextRun({
            text: text || " ",
            bold: options.bold,
            size: 19,
            color: options.color ?? INK,
          }),
        ],
      }),
    ],
  });
}

function hairline() {
  const side = { style: BorderStyle.SINGLE, size: 3, color: RULE };
  return { top: side, bottom: side, left: side, right: side, insideHorizontal: side, insideVertical: side };
}

function spacer(): Paragraph {
  return new Paragraph({ spacing: { after: 200 }, children: [] });
}
