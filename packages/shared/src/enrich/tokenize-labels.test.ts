import { describe, expect, it } from 'vitest';
import { extractLabeledFields } from './tokenize-labels';

describe('extractLabeledFields', () => {
  it('returns the whole text as leading, with null name/memo, when no label is present', () => {
    expect(extractLabeledFields('Jumbo Amsterdam')).toEqual({ leading: 'Jumbo Amsterdam', name: null, memo: null });
  });

  it('extracts Naam and Omschrijving, excluding IBAN/BIC noise from leading and from the result', () => {
    const result = extractLabeledFields('SEPA iDEAL IBAN: NL12INGB0001234567 BIC: INGBNL2A Naam: Bol.com b.v. Omschrijving: 3012345678');
    expect(result).toEqual({ leading: 'SEPA iDEAL ', name: 'Bol.com b.v.', memo: '3012345678' });
  });

  it('terminates a Naam value at the next label instead of running to end-of-string', () => {
    const result = extractLabeledFields('Incassant: NL42ZZZ33099220 Naam: Zilveren Kruis Machtiging: 123');
    expect(result.name).toBe('Zilveren Kruis');
  });

  it('recognises IncassantID distinctly from the shorter Incassant alternative', () => {
    const result = extractLabeledFields('IncassantID: NL42ZZZ33099220 Naam: Vitens');
    expect(result.name).toBe('Vitens');
  });

  it('leaves memo null when no Omschrijving label is present', () => {
    const result = extractLabeledFields('Naam: Vitens Kenmerk: 123');
    expect(result.memo).toBeNull();
  });

  it('leaves name null when no Naam label is present', () => {
    const result = extractLabeledFields('Omschrijving: factuur 42');
    expect(result.name).toBeNull();
  });

  it('recognises a bare NR label as a field boundary', () => {
    const result = extractLabeledFields('Naam: Vitens NR: 123456');
    expect(result).toEqual({ leading: '', name: 'Vitens', memo: null });
  });
});
