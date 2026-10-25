import { describe, expect, it } from 'vitest';
import { formatKoreanCount } from './formatKoreanCount';

describe('formatKoreanCount', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [9_999, '9,999'],
    [10_000, '1만'],
    [12_345, '1.2만'],
    [29_000, '2.9만'],
    [99_999, '9.9만'],
    [100_000, '10만'],
    [150_000, '15만'],
    [12_345_678, '1234만'],
    [99_999_999, '9999만'],
    [100_000_000, '1억'],
    [123_456_789, '1.2억'],
    [1_500_000_000, '15억'],
  ])('%d는 "%s"로 표시한다', (count, expected) => {
    expect(formatKoreanCount(count)).toBe(expected);
  });
});
