import { describe, expect, it } from 'vitest';
import { parseTrtpFields, stripGenericPrefixes, stripTikkiePrefix, stripTrtpPrefix } from './strip-prefixes';

describe('stripGenericPrefixes', () => {
  it('returns the text unchanged when no known prefix matches', () => {
    expect(stripGenericPrefixes('Jumbo Amsterdam')).toBe('Jumbo Amsterdam');
  });

  it('strips a single BEA/Betaalpas-style prefix', () => {
    expect(stripGenericPrefixes('BEA, Betaalpas ALBERT HEIJN 1234 DEN HAAG,PAS402')).toBe('ALBERT HEIJN 1234 DEN HAAG,PAS402');
  });

  it('strips a leading SEPA before an Incasso/Overboeking-style word', () => {
    expect(stripGenericPrefixes('SEPA Incasso algemeen doorlopend Incassant: NL42ZZZ33099220')).toBe(
      'algemeen doorlopend Incassant: NL42ZZZ33099220',
    );
  });

  it('strips an Overboeking-style word with no SEPA prefix', () => {
    expect(stripGenericPrefixes('Overboeking naar spaarrekening')).toBe('naar spaarrekening');
  });

  it('is case-insensitive and stops once no further prefix matches', () => {
    expect(stripGenericPrefixes('wero Fleur van Dijk')).toBe('Fleur van Dijk');
  });
});

describe('stripTrtpPrefix', () => {
  it('returns null when the text has no /TRTP/ prefix', () => {
    expect(stripTrtpPrefix('BEA, Betaalpas ALBERT HEIJN')).toBeNull();
  });

  it('strips the /TRTP/.../ structured prefix, returning what follows it', () => {
    expect(stripTrtpPrefix('/TRTP/SEPA OVERBOEKING/IBAN/NL91ABNA.../NAME/Belastingdienst Toeslagen/REMI/ZORGTOESLAG MAART')).toBe(
      'IBAN/NL91ABNA.../NAME/Belastingdienst Toeslagen/REMI/ZORGTOESLAG MAART',
    );
  });
});

describe('parseTrtpFields', () => {
  it('extracts NAME and REMI, ignoring other tags such as IBAN', () => {
    const result = parseTrtpFields('IBAN/NL91ABNA.../NAME/Belastingdienst Toeslagen/REMI/ZORGTOESLAG MAART');
    expect(result).toEqual({ name: 'Belastingdienst Toeslagen', memo: 'ZORGTOESLAG MAART' });
  });

  it('trims whitespace from each extracted value', () => {
    const result = parseTrtpFields('NAME/ Fleur van Dijk /REMI/ pizza vrijdag ');
    expect(result).toEqual({ name: 'Fleur van Dijk', memo: 'pizza vrijdag' });
  });

  it('returns null fields when neither NAME nor REMI is present', () => {
    expect(parseTrtpFields('IBAN/NL91ABNA123456789')).toEqual({ name: null, memo: null });
  });

  it('returns null fields for an empty remainder', () => {
    expect(parseTrtpFields('')).toEqual({ name: null, memo: null });
  });
});

describe('stripTikkiePrefix', () => {
  it('strips a "Tikkie ID <n>" prefix', () => {
    expect(stripTikkiePrefix('Tikkie ID 1234 Fleur - pizza vrijdag')).toBe('Fleur - pizza vrijdag');
  });

  it('strips a "Tikkie <n>" prefix without the ID word', () => {
    expect(stripTikkiePrefix('Tikkie 5678 Bram - drankjes')).toBe('Bram - drankjes');
  });

  it('returns null when the text has no Tikkie prefix', () => {
    expect(stripTikkiePrefix('Jumbo Amsterdam')).toBeNull();
  });
});
