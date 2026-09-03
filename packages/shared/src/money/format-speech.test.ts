import { describe, expect, it } from 'vitest';
import { cents } from './core';
import { formatMoneyForSpeech } from './format-speech';

describe('formatMoneyForSpeech', () => {
  it('speaks a whole-euro amount without a cents clause', () => {
    expect(formatMoneyForSpeech(cents(41_200))).toBe('412 euro');
  });

  it('speaks an amount with cents', () => {
    expect(formatMoneyForSpeech(cents(41_250))).toBe('412 euro en 50 cent');
  });

  it('speaks a negative whole-euro amount with the word min, not a minus glyph', () => {
    expect(formatMoneyForSpeech(cents(-4200))).toBe('min 42 euro');
  });

  it('speaks a negative amount with cents', () => {
    expect(formatMoneyForSpeech(cents(-4250))).toBe('min 42 euro en 50 cent');
  });

  it('speaks zero as zero euro', () => {
    expect(formatMoneyForSpeech(cents(0))).toBe('0 euro');
  });
});
