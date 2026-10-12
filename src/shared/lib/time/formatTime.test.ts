import { describe, expect, it } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [65, '1:05'],
    [600, '10:00'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3750, '1:02:30'],
    [36000, '10:00:00'],
  ])('%d초는 "%s"로 표시한다', (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });

  it('소수점 아래는 버린다', () => {
    expect(formatTime(65.9)).toBe('1:05');
  });

  it.each([[-3], [Number.NaN], [Number.POSITIVE_INFINITY]])('%d는 "0:00"으로 표시한다', (value) => {
    expect(formatTime(value)).toBe('0:00');
  });
});
