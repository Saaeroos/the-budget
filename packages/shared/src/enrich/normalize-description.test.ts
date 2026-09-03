import { describe, expect, it } from 'vitest';
import { extractParsedFields, normalizeDescription } from './normalize-description';

// docs/09 §2's worked examples table — must be test cases, verbatim.
describe('docs/09 §2 worked examples', () => {
  it('normalises an Albert Heijn card payment descriptor', () => {
    const raw = 'BEA, Betaalpas ALBERT HEIJN 1234 DEN HAAG,PAS402';
    expect(normalizeDescription(raw)).toBe('ALBERT HEIJN 1234 DEN HAAG');
    expect(extractParsedFields(raw)).toEqual({ descriptionClean: 'ALBERT HEIJN 1234 DEN HAAG', counterpartyName: 'Albert Heijn' });
  });

  it('normalises a bol.com iDEAL payment with Naam/Omschrijving fields', () => {
    const raw = 'SEPA iDEAL IBAN: NL12INGB0001234567 BIC: INGBNL2A Naam: Bol.com b.v. Omschrijving: 3012345678';
    expect(normalizeDescription(raw)).toBe('Bol.com b.v. 3012345678');
    expect(extractParsedFields(raw)).toEqual({ descriptionClean: 'Bol.com b.v. 3012345678', counterpartyName: 'bol' });
  });

  it('normalises a Zilveren Kruis direct debit, discarding Incassant and Machtiging', () => {
    const raw = 'SEPA Incasso algemeen doorlopend Incassant: NL42ZZZ33099220 Naam: Zilveren Kruis Machtiging: 123';
    expect(normalizeDescription(raw)).toBe('Zilveren Kruis');
    expect(extractParsedFields(raw)).toEqual({ descriptionClean: 'Zilveren Kruis', counterpartyName: 'Zilveren Kruis' });
  });

  it('normalises a TRTP-structured Belastingdienst Toeslagen transfer', () => {
    const raw = '/TRTP/SEPA OVERBOEKING/IBAN/NL91ABNA.../NAME/Belastingdienst Toeslagen/REMI/ZORGTOESLAG MAART';
    expect(normalizeDescription(raw)).toBe('Belastingdienst Toeslagen ZORGTOESLAG MAART');
    expect(extractParsedFields(raw)).toEqual({
      descriptionClean: 'Belastingdienst Toeslagen ZORGTOESLAG MAART',
      counterpartyName: 'Belastingdienst/Toeslagen',
    });
  });

  it('normalises a Tikkie payment request, recognising Tikkie as the counterparty', () => {
    const raw = 'Tikkie ID 1234 Fleur - pizza vrijdag';
    expect(normalizeDescription(raw)).toBe('Fleur - pizza vrijdag');
    expect(extractParsedFields(raw)).toEqual({ descriptionClean: 'Fleur - pizza vrijdag', counterpartyName: 'Tikkie' });
  });
});

describe('normalizeDescription — additional cases', () => {
  it('truncates description_clean to 120 characters', () => {
    const raw = 'A'.repeat(200);
    expect(normalizeDescription(raw)).toHaveLength(120);
  });

  it('wipes an unlabelled all-digits remainder (a bare reference number)', () => {
    expect(normalizeDescription('1234567890')).toBe('');
  });

  it('removes an embedded date token', () => {
    expect(normalizeDescription('Betaling 03-09-2026 Albert Heijn')).toBe('Betaling Albert Heijn');
  });

  it('removes an embedded time token', () => {
    expect(normalizeDescription('Pin 14:05 Jumbo Amsterdam')).toBe('Pin Jumbo Amsterdam');
  });

  it('is idempotent on an already-clean description', () => {
    expect(normalizeDescription('Jumbo Amsterdam')).toBe('Jumbo Amsterdam');
  });

  it('handles the Wero equivalent of an iDEAL prefix (docs/09 §5.4)', () => {
    // Wero descriptors are treated like the generic BEA/GEA/SEPA/... prefix family.
    expect(normalizeDescription('WERO Fleur van Dijk')).toBe('Fleur van Dijk');
  });

  it('returns an empty string for an entirely empty input', () => {
    expect(normalizeDescription('')).toBe('');
  });
});

describe('extractParsedFields — additional cases', () => {
  it('returns a null counterparty when nothing can be derived', () => {
    expect(extractParsedFields('1234567890').counterpartyName).toBeNull();
  });

  it('returns a null counterparty for an entirely empty input', () => {
    expect(extractParsedFields('').counterpartyName).toBeNull();
  });

  it('extracts a counterparty from an Incasso descriptor with only a Naam field', () => {
    const result = extractParsedFields('SEPA Incasso Naam: Vitens');
    expect(result).toEqual({ descriptionClean: 'Vitens', counterpartyName: 'Vitens' });
  });

  it('derives a counterparty from a plain merchant descriptor with no trailing digits', () => {
    const result = extractParsedFields('Jumbo Amsterdam');
    expect(result.counterpartyName).toBe('Jumbo Amsterdam');
  });

  it('collapses internal double spaces before deriving a leading-words counterparty', () => {
    // collapseAndTrim runs before deriveCounterpartyFromLeadingWords ever sees the text
    // (docs/09 §2 step 5 before step 6), so a doubled space in the raw descriptor never
    // survives to the title-casing step.
    const result = extractParsedFields('ALBERT  HEIJN 1234 DEN HAAG');
    expect(result.counterpartyName).toBe('Albert Heijn');
  });
});
