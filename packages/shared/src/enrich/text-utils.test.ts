import { describe, expect, it } from 'vitest';
import { collapseAndTrim, deriveCounterpartyFromLeadingWords, removeUnlabeledNoise } from './text-utils';

describe('removeUnlabeledNoise', () => {
  it('removes a card reference token (PAS followed by digits)', () => {
    expect(removeUnlabeledNoise('ALBERT HEIJN,PAS402')).toBe('ALBERT HEIJN,');
  });

  it('removes an embedded date token', () => {
    expect(removeUnlabeledNoise('Betaling 03-09-2026 Albert Heijn')).toBe('Betaling  Albert Heijn');
  });

  it('removes an embedded time token', () => {
    expect(removeUnlabeledNoise('Pin 14:05 Jumbo Amsterdam')).toBe('Pin  Jumbo Amsterdam');
  });

  it('wipes a bare all-digits reference number', () => {
    expect(removeUnlabeledNoise('1234567890')).toBe('');
  });

  it('leaves a short digit run (under 6 digits) untouched, since it is not a bare reference', () => {
    expect(removeUnlabeledNoise('12345')).toBe('12345');
  });

  it('leaves clean text with no noise tokens unchanged', () => {
    expect(removeUnlabeledNoise('Jumbo Amsterdam')).toBe('Jumbo Amsterdam');
  });
});

describe('collapseAndTrim', () => {
  it('collapses runs of internal whitespace to a single space', () => {
    expect(collapseAndTrim('Albert   Heijn')).toBe('Albert Heijn');
  });

  it('trims leading and trailing whitespace', () => {
    expect(collapseAndTrim('  Jumbo Amsterdam  ')).toBe('Jumbo Amsterdam');
  });

  it('drops trailing punctuation', () => {
    expect(collapseAndTrim('Zilveren Kruis,,')).toBe('Zilveren Kruis');
  });
});

describe('deriveCounterpartyFromLeadingWords', () => {
  it('title-cases the leading run of word-like tokens before a digit-leading token', () => {
    expect(deriveCounterpartyFromLeadingWords('ALBERT HEIJN 1234 DEN HAAG')).toBe('Albert Heijn');
  });

  it('title-cases a leading run that spans the whole text', () => {
    expect(deriveCounterpartyFromLeadingWords('Jumbo Amsterdam')).toBe('Jumbo Amsterdam');
  });

  it('preserves letter-adjacent punctuation such as an apostrophe or ampersand', () => {
    expect(deriveCounterpartyFromLeadingWords("M&S O'Brien")).toBe("M&s O'brien");
  });

  it('returns null when the text starts with a digit, so no leading word run exists', () => {
    expect(deriveCounterpartyFromLeadingWords('1234567890')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(deriveCounterpartyFromLeadingWords('')).toBeNull();
  });
});
