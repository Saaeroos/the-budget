/* ── Types ────────────────────────────────────────────── */

/** The output of the parsed-field extractor (`docs/09` §2). */
export interface ParsedDescriptorFields {
  readonly descriptionClean: string;
  readonly counterpartyName: string | null;
}

export const LIMITS = {
  /** `description_clean` is capped at 120 characters (`docs/09` §2 step 6). */
  maxDescriptionCleanLength: 120,
} as const;
