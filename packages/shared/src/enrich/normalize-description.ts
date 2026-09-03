import { resolveKnownCounterpartyAlias } from './known-counterparties';
import { parseTrtpFields, stripGenericPrefixes, stripTikkiePrefix, stripTrtpPrefix } from './strip-prefixes';
import { collapseAndTrim, deriveCounterpartyFromLeadingWords, removeUnlabeledNoise } from './text-utils';
import { extractLabeledFields } from './tokenize-labels';
import { LIMITS, type ParsedDescriptorFields } from './types';

/* ── Types ────────────────────────────────────────────── */
interface DescriptorFields {
  readonly name: string | null;
  readonly memo: string | null;
  /** The unlabelled leftover text, used only when neither `name` nor `memo` was found. */
  readonly remainder: string;
  /** Set when a known prefix format (Tikkie) identifies the counterparty by itself. */
  readonly fixedCounterparty: string | null;
}

const FIXED_COUNTERPARTY = { tikkie: 'Tikkie' } as const;

/* ── Implementation ───────────────────────────────────── */

function parseTrtpDescriptor(trtpRemainder: string): DescriptorFields {
  const { name, memo } = parseTrtpFields(trtpRemainder);
  return { name, memo, remainder: collapseAndTrim(trtpRemainder), fixedCounterparty: null };
}

function parseColonStyleDescriptor(raw: string): DescriptorFields {
  const tikkieRemainder = stripTikkiePrefix(raw);
  const afterPrefixes = tikkieRemainder ?? stripGenericPrefixes(raw);
  const fixedCounterparty = tikkieRemainder != null ? FIXED_COUNTERPARTY.tikkie : null;

  const { leading, name, memo } = extractLabeledFields(afterPrefixes);
  const remainder = collapseAndTrim(removeUnlabeledNoise(leading));
  return { name, memo, remainder, fixedCounterparty };
}

/** Runs `docs/09` §2 steps 1–6 once, producing everything both public functions need. */
function parseDescriptor(raw: string): DescriptorFields {
  const trtpRemainder = stripTrtpPrefix(raw);
  return trtpRemainder != null ? parseTrtpDescriptor(trtpRemainder) : parseColonStyleDescriptor(raw);
}

/** `description_clean = name || memo || remainder` (`docs/09` §2 step 6) — `name` and `memo` combine when both exist. */
function buildDescriptionClean(fields: DescriptorFields): string {
  let combined: string;
  if (fields.name != null) {
    combined = fields.memo != null ? `${fields.name} ${fields.memo}` : fields.name;
  } else {
    combined = fields.memo ?? fields.remainder;
  }
  return collapseAndTrim(combined).slice(0, LIMITS.maxDescriptionCleanLength);
}

function buildCounterpartyName(fields: DescriptorFields): string | null {
  if (fields.fixedCounterparty != null) return fields.fixedCounterparty;
  if (fields.name != null) return resolveKnownCounterpartyAlias(fields.name);
  return deriveCounterpartyFromLeadingWords(fields.remainder);
}

/** Normalises a raw bank descriptor into `description_clean` (`docs/09` §2). */
export function normalizeDescription(raw: string): string {
  return buildDescriptionClean(parseDescriptor(raw));
}

/**
 * The parsed-field extractor: normalises `raw` and, in the same pass, derives the
 * counterparty name (`docs/09` §2).
 */
export function extractParsedFields(raw: string): ParsedDescriptorFields {
  const fields = parseDescriptor(raw);
  return { descriptionClean: buildDescriptionClean(fields), counterpartyName: buildCounterpartyName(fields) };
}
