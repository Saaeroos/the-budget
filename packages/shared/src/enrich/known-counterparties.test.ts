import { describe, expect, it } from 'vitest';
import { resolveKnownCounterpartyAlias } from './known-counterparties';

describe('resolveKnownCounterpartyAlias', () => {
  it('resolves a known alias case-insensitively', () => {
    expect(resolveKnownCounterpartyAlias('Bol.com b.v.')).toBe('bol');
  });

  it('resolves a known alias with surrounding whitespace', () => {
    expect(resolveKnownCounterpartyAlias('  belastingdienst toeslagen  ')).toBe('Belastingdienst/Toeslagen');
  });

  it('returns the trimmed input unchanged when no alias is known', () => {
    expect(resolveKnownCounterpartyAlias('  Jumbo Amsterdam  ')).toBe('Jumbo Amsterdam');
  });
});
