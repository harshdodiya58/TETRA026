/**
 * Structural chunker for Indian university syllabi.
 *
 * VTU, Anna University, and GTU all format differently — "UNIT - I", "Module 1",
 * "UNIT–II:" — and hours appear as "(10 Hours)", "[08 Hrs]", or "10 Periods".
 * This splits on unit boundaries rather than fixed character windows so that a
 * chunk corresponds to a teachable unit, which is what a gap score has to be
 * attributed to.
 *
 * Two passes over the document, deliberately:
 *   - Unit boundaries, course code, and course title read the RAW lines, where
 *     layout and line breaks are themselves structural signals.
 *   - Course Outcomes and textbooks read REFLOWED lines, because those are
 *     prose entries that PDF extraction hard-wraps mid-sentence. Reading them
 *     raw yields one fragment per visual line rather than one per outcome.
 *
 * Everything reported is derived from the document. Where a value cannot be
 * found it is null, never a default that would read as measured.
 */

export type SyllabusUnit = {
  index: number;
  label: string;
  title: string;
  body: string;
  hours: number | null;
  topics: string[];
};

export type SyllabusStructure = {
  courseCode: string | null;
  courseTitle: string | null;
  units: SyllabusUnit[];
  declaredTotalHours: number | null;
  summedUnitHours: number | null;
  courseOutcomes: string[];
  textbooks: string[];
  /** 0–1, computed from real structural signals. See scoreBoundaries(). */
  boundaryConfidence: number;
};

/** "UNIT - I", "Module 1:", "UNIT–II" — separator and case both vary. */
const UNIT_HEADING =
  /^[ \t]*(unit|module)[ \t]*[-–—:.]?[ \t]*([ivxlc]+|\d{1,2})[ \t]*[-–—:.)]?[ \t]*(.*)$/i;

/** "(10 Hours)", "[08 Hrs]", "10 Periods" */
const HOURS = /(?:^|[^\d])(\d{1,3})[ \t]*(?:hrs?\b|hours?\b|periods?\b)/i;

/** Same, but as a strippable annotation anywhere in a heading. */
const HOURS_ANNOTATION = /[([]?[ \t]*\d{1,3}[ \t]*(?:hrs?|hours?|periods?)[ \t]*[)\]]?/gi;

const TOTAL_HOURS =
  /(?:total|contact)[ \t]*(?:contact[ \t]*)?(?:hours|hrs|periods)[ \t]*[:\-–]?[ \t]*(\d{1,3})/i;

const CO_LINE = /^[ \t]*(?:co)[ \t]*[-–]?[ \t]*(\d{1,2})[ \t]*[:.\-)][ \t]*(.+)$/i;

const CO_HEADING = /^[ \t]*course[ \t]*outcomes?\b/i;

/** "At the end of the course the student will be able to:" is a preamble. */
const CO_LEADIN =
  /^(at the end of|at the conclusion|on completion of|upon completion|after (completing|studying))/i;

const COURSE_CODE = /\b([A-Z]{2,4})[ \t]?-?[ \t]?(\d{3,5})\b/;

const TEXTBOOK_HEADING = /^[ \t]*(text|reference)[ \t]*books?\b/i;

const SECTION_STOP =
  /^[ \t]*(course[ \t]*outcomes?|text[ \t]*books?|reference[ \t]*books?|question[ \t]*paper|assessment|evaluation|scheme[ \t]*of)/i;

/** Lines that begin a new logical entry and must never be merged into the previous one. */
const ENTRY_START =
  /^[ \t]*$|^[ \t]*(unit|module)\b|^[ \t]*co[ \t]*[-–]?[ \t]*\d|^[ \t]*\d{1,2}[.)][ \t]+|^[ \t]*[-•*][ \t]+|^[ \t]*(text|reference)[ \t]*books?\b|^[ \t]*course[ \t]*outcomes?\b/i;

/** Header lines that are never the course title. */
const NOT_A_TITLE =
  /university|scheme[ \t]*of|department|semester|regulation|credits?|marks|teaching|b\.?[ \t]?e\.?\b|b\.?[ \t]?tech\b|m\.?[ \t]?tech\b/i;

export function chunkSyllabus(raw: string): SyllabusStructure {
  const text = normalise(raw);
  const lines = text.split("\n");
  const reflowed = reflowLines(lines);

  const units = extractUnits(lines);
  const courseOutcomes = extractCourseOutcomes(reflowed);
  const textbooks = extractTextbooks(reflowed);

  const declaredTotalHours = matchNumber(text, TOTAL_HOURS);
  const unitHours = units.map((u) => u.hours).filter((h): h is number => h !== null);
  const summedUnitHours = unitHours.length > 0 ? unitHours.reduce((a, b) => a + b, 0) : null;

  return {
    courseCode: extractCourseCode(lines),
    courseTitle: extractCourseTitle(lines),
    units,
    declaredTotalHours,
    summedUnitHours,
    courseOutcomes,
    textbooks,
    boundaryConfidence: scoreBoundaries(units, courseOutcomes, declaredTotalHours, summedUnitHours),
  };
}

function normalise(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    // Ligatures PDF extraction commonly emits.
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Rejoin hard-wrapped prose. A line continues the previous one when the
 * previous does not close a sentence and this one does not open a new entry.
 */
function reflowLines(lines: string[]): string[] {
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      out.push("");
      continue;
    }

    const previous = out.length > 0 ? out[out.length - 1] : null;

    const canJoin =
      previous !== null &&
      previous.trim() !== "" &&
      !/[.:;!?]$/.test(previous.trim()) &&
      !ENTRY_START.test(line);

    if (canJoin) out[out.length - 1] = `${previous} ${trimmed}`;
    else out.push(trimmed);
  }

  return out;
}

function extractUnits(lines: string[]): SyllabusUnit[] {
  const starts: { line: number; label: string; title: string }[] = [];

  lines.forEach((line, i) => {
    const match = line.match(UNIT_HEADING);
    if (!match) return;

    // A unit heading is short. A sentence mentioning "module" mid-paragraph is
    // not a boundary.
    if (line.trim().length > 120) return;

    const [, keyword, numeral, rest] = match;

    starts.push({
      line: i,
      label: `${titleCase(keyword)} ${numeral.toUpperCase()}`,
      // The heading remainder is usually just the hours annotation.
      title: stripAnnotations(rest),
    });
  });

  return starts.map((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].line : findUnitEnd(lines, start.line);
    const body = lines
      .slice(start.line + 1, end)
      .join("\n")
      .trim();

    const headingLine = lines[start.line];
    const hours = matchNumber(headingLine, HOURS) ?? matchNumber(body.slice(0, 400), HOURS);

    return {
      index: i + 1,
      label: start.label,
      title: start.title || deriveTitle(body),
      body,
      hours,
      topics: extractTopics(body),
    };
  });
}

/** Units run until the syllabus moves on to outcomes, texts, or assessment. */
function findUnitEnd(lines: string[], from: number): number {
  for (let i = from + 1; i < lines.length; i += 1) {
    if (SECTION_STOP.test(lines[i])) return i;
  }
  return lines.length;
}

/**
 * Unit bodies are conventionally written "Topic Heading: item, item, item".
 * The text before the first colon is the unit's real subject.
 */
function deriveTitle(body: string): string {
  const first = body.split("\n").find((l) => l.trim().length > 0) ?? "";
  const beforeColon = first.split(":")[0].trim();
  const candidate =
    beforeColon.length >= 4 && beforeColon.length <= 80 ? beforeColon : first.trim();
  return candidate.slice(0, 80);
}

function extractTopics(body: string): string[] {
  return body
    .split(/[,;\n]/)
    .map((t) => t.replace(/^[-•*\d.\s]+/, "").trim())
    .filter((t) => t.length >= 3 && t.length <= 90 && /[a-z]/i.test(t))
    .slice(0, 40);
}

function extractCourseOutcomes(lines: string[]): string[] {
  const outcomes: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (CO_HEADING.test(line)) {
      inSection = true;
      continue;
    }

    const explicit = line.match(CO_LINE);
    if (explicit) {
      const statement = explicit[2].trim();
      if (!CO_LEADIN.test(statement)) outcomes.push(statement);
      continue;
    }

    if (!inSection) continue;

    if (TEXTBOOK_HEADING.test(line) || UNIT_HEADING.test(line)) {
      inSection = false;
      continue;
    }

    const cleaned = line.replace(/^[-•*\d.)\s]+/, "").trim();
    // Skip the "At the end of the course…" preamble; it is not an outcome.
    if (cleaned.length > 20 && !CO_LEADIN.test(cleaned)) outcomes.push(cleaned);
  }

  return dedupe(outcomes).slice(0, 12);
}

function extractTextbooks(lines: string[]): string[] {
  const books: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (TEXTBOOK_HEADING.test(line)) {
      inSection = true;
      continue;
    }
    if (!inSection) continue;

    if (UNIT_HEADING.test(line) || CO_HEADING.test(line)) {
      inSection = false;
      continue;
    }

    const cleaned = line.replace(/^[-•*\d.)\s]+/, "").trim();
    if (cleaned.length > 12) books.push(cleaned);
  }

  return dedupe(books).slice(0, 15);
}

function extractCourseCode(lines: string[]): string | null {
  // Course codes live in the header block, not buried in unit bodies.
  for (const line of lines.slice(0, 30)) {
    const match = line.match(COURSE_CODE);
    if (match) return `${match[1]}${match[2]}`;
  }
  return null;
}

/**
 * The course title is the display line immediately above the course code —
 * reliably so across VTU, Anna, and GTU layouts. Institution, degree, and
 * scheme lines sit above it and are filtered out.
 */
function extractCourseTitle(lines: string[]): string | null {
  const header = lines.slice(0, 30);
  const codeIndex = header.findIndex((l) => COURSE_CODE.test(l));

  if (codeIndex > 0) {
    for (let i = codeIndex - 1; i >= 0 && i >= codeIndex - 6; i -= 1) {
      const candidate = header[i].trim();
      if (!candidate) continue;
      if (NOT_A_TITLE.test(candidate)) continue;
      if (candidate.length >= 6 && candidate.length <= 90 && /[A-Za-z]/.test(candidate)) {
        return tidy(candidate);
      }
    }
  }

  for (const line of header) {
    const candidate = line.trim();
    if (
      candidate.length >= 8 &&
      candidate.length <= 80 &&
      /[A-Za-z]/.test(candidate) &&
      !NOT_A_TITLE.test(candidate)
    ) {
      return tidy(candidate);
    }
  }

  return null;
}

/**
 * Confidence that the document was structurally understood, from four
 * independent signals. A low score means downstream gap analysis would be
 * attributing skills to unreliable boundaries.
 */
function scoreBoundaries(
  units: SyllabusUnit[],
  outcomes: string[],
  declaredTotal: number | null,
  summed: number | null,
): number {
  if (units.length === 0) return 0;

  let score = 0;

  // 1. A plausible unit count for an Indian course.
  score += units.length >= 3 && units.length <= 10 ? 0.3 : 0.12;

  // 2. Hours recovered for most units.
  const withHours = units.filter((u) => u.hours !== null).length;
  score += 0.3 * (withHours / units.length);

  // 3. Summed unit hours agree with the declared total.
  if (declaredTotal !== null && summed !== null && declaredTotal > 0) {
    const drift = Math.abs(declaredTotal - summed) / declaredTotal;
    score += drift <= 0.1 ? 0.25 : drift <= 0.25 ? 0.12 : 0;
  }

  // 4. Course Outcomes located.
  score += outcomes.length > 0 ? 0.15 : 0;

  return Math.min(1, Math.round(score * 100) / 100);
}

/** Embedding chunks. One per unit, split only when a unit is very long. */
export function toEmbeddingChunks(
  structure: SyllabusStructure,
  maxChars = 1400,
): { unitIndex: number; label: string; text: string }[] {
  const chunks: { unitIndex: number; label: string; text: string }[] = [];

  for (const unit of structure.units) {
    const full = `${unit.label}. ${unit.title}\n${unit.body}`.trim();

    if (full.length <= maxChars) {
      chunks.push({ unitIndex: unit.index, label: unit.label, text: full });
      continue;
    }

    // Overlap one sentence so a topic straddling the split is not lost.
    const sentences = full.split(/(?<=[.;])\s+/);
    let buffer = "";
    let part = 1;

    for (const sentence of sentences) {
      if (buffer.length + sentence.length > maxChars && buffer.length > 0) {
        chunks.push({
          unitIndex: unit.index,
          label: `${unit.label} (${part})`,
          text: buffer.trim(),
        });
        const tail = buffer.split(/(?<=[.;])\s+/).slice(-1)[0] ?? "";
        buffer = `${tail} `;
        part += 1;
      }
      buffer += `${sentence} `;
    }

    if (buffer.trim().length > 0) {
      chunks.push({
        unitIndex: unit.index,
        label: part > 1 ? `${unit.label} (${part})` : unit.label,
        text: buffer.trim(),
      });
    }
  }

  return chunks;
}

function stripAnnotations(value: string): string {
  return value
    .replace(HOURS_ANNOTATION, "")
    .replace(/^[-–—:.\s()[\]]+|[-–—:.\s()[\]]+$/g, "")
    .trim();
}

function matchNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function tidy(value: string): string {
  return value.replace(/\s{2,}/g, " ").trim();
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()))].filter(Boolean);
}
