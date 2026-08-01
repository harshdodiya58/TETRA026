/**
 * Bloom's Taxonomy (revised) verb lexicon and validator.
 *
 * This is deliberately a rule check, not a model call. The whole argument to a
 * Board of Studies is that cognitive level was *verified*, and "the language
 * model said it was level 4" is not verification. A verb either appears in the
 * lexicon at the required level or the outcome is rejected and regenerated.
 *
 * On numbering: the product brief refers to a "level 5 (Evaluate/Create)" band.
 * Revised Bloom's separates these — 5 Evaluate, 6 Create — so both are
 * implemented and the requirement "levels 3-5" is enforced as "level 3 and
 * above". Rejecting a Create-level outcome for being too high would be absurd.
 */

export const BLOOM_LEVELS = [1, 2, 3, 4, 5, 6] as const;
export type BloomLevel = (typeof BLOOM_LEVELS)[number];

export const BLOOM_LEVEL_NAMES: Record<BloomLevel, string> = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Evaluate",
  6: "Create",
};

/**
 * Verb → level. Where a verb is defensible at more than one level it is listed
 * at its conventional level; ambiguity is resolved once, here, rather than
 * per-call.
 */
const LEXICON: Record<string, BloomLevel> = {};

function register(level: BloomLevel, verbs: string[]) {
  for (const verb of verbs) LEXICON[verb] = level;
}

register(1, [
  "define", "list", "recall", "name", "state", "identify", "recognise", "recognize",
  "label", "match", "select", "cite", "record", "repeat", "memorise", "memorize",
]);

register(2, [
  "explain", "summarise", "summarize", "describe", "discuss", "interpret",
  "classify", "illustrate", "paraphrase", "restate", "outline", "review",
  "understand", "express", "report",
]);

register(3, [
  "apply", "implement", "construct", "execute", "demonstrate", "use", "solve",
  "compute", "configure", "build", "operate", "employ", "practise", "practice",
  "produce", "run", "write", "install", "deploy", "modify", "sketch", "calculate",
]);

register(4, [
  "analyse", "analyze", "compare", "contrast", "differentiate", "distinguish",
  "examine", "audit", "diagnose", "profile", "investigate", "deconstruct",
  "categorise", "categorize", "correlate", "infer", "test", "measure",
  "troubleshoot", "benchmark", "trace",
]);

register(5, [
  "evaluate", "justify", "critique", "assess", "defend", "recommend", "validate",
  "appraise", "judge", "verify", "prioritise", "prioritize", "select-between",
  "argue", "conclude", "rank",
]);

register(6, [
  "design", "formulate", "develop", "compose", "devise", "propose", "architect",
  "create", "generate", "plan", "invent", "synthesise", "synthesize",
  "reorganise", "reorganize", "author", "prototype",
]);

/** Minimum acceptable level for a generated outcome. */
export const MIN_ACCEPTABLE_LEVEL: BloomLevel = 3;

/** Where each kind of addition is expected to sit. */
export const EXPECTED_MINIMUM: Record<AdditionKind, BloomLevel> = {
  lab: 3,
  "case-study": 4,
  "micro-project": 5,
};

export type AdditionKind = "lab" | "case-study" | "micro-project";

export type BloomVerdict = {
  verb: string | null;
  level: BloomLevel | null;
  required: BloomLevel;
  passed: boolean;
  reason: string | null;
};

const CO_PREFIX =
  /^\s*(?:at the end of[^,]*,?\s*)?(?:the\s+)?(?:student|learner)s?\s+(?:will\s+be\s+able\s+to|should\s+be\s+able\s+to|can)\s+/i;

/**
 * Extract the action verb from a Course Outcome statement and grade it.
 *
 * The verb is taken as the first lexicon word after the standard OBE preamble,
 * which is where OBE convention requires it to sit.
 */
export function validateOutcome(statement: string, kind: AdditionKind): BloomVerdict {
  const required = EXPECTED_MINIMUM[kind];
  const stripped = statement.replace(CO_PREFIX, "").trim();

  const words = stripped
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let verb: string | null = null;
  let level: BloomLevel | null = null;

  for (const word of words.slice(0, 6)) {
    const known = LEXICON[word] ?? LEXICON[singularise(word)];
    if (known) {
      verb = word;
      level = known;
      break;
    }
  }

  if (level === null) {
    return {
      verb: null,
      level: null,
      required,
      passed: false,
      reason:
        "No recognised Bloom's action verb found in the opening clause of the outcome.",
    };
  }

  if (level < required) {
    return {
      verb,
      level,
      required,
      passed: false,
      reason: `"${verb}" is level ${level} (${BLOOM_LEVEL_NAMES[level]}); a ${kind} outcome requires level ${required} (${BLOOM_LEVEL_NAMES[required]}) or above.`,
    };
  }

  return { verb, level, required, passed: true, reason: null };
}

/** Verbs a prompt can legitimately suggest for a given addition kind. */
export function verbsAtOrAbove(level: BloomLevel, limit = 12): string[] {
  return Object.entries(LEXICON)
    .filter(([, l]) => l >= level)
    .sort((a, b) => a[1] - b[1])
    .map(([verb]) => verb)
    .filter((v) => !v.includes("-"))
    .slice(0, limit);
}

function singularise(word: string): string {
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

export function lexiconSize(): number {
  return Object.keys(LEXICON).length;
}
