import { describe, expect, it } from 'vitest';
import { formatRelativeDate } from './formatRelativeDate';

// 어느 시간대에서 테스트해도 같은 날짜가 되도록 한낮(UTC 12시)을 기준으로 잡는다
const NOW = new Date('2025-10-20T12:00:00Z').getTime();
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

describe('formatRelativeDate', () => {
  it.each([
    ['0초', 0, '방금 전'],
    ['59초', 59 * SECOND, '방금 전'],
    ['1분', MINUTE, '1분 전'],
    ['59분', 59 * MINUTE, '59분 전'],
    ['1시간', HOUR, '1시간 전'],
    ['23시간 59분', DAY - MINUTE, '23시간 전'],
    ['1일', DAY, '1일 전'],
    ['7일 23시간', 8 * DAY - HOUR, '7일 전'],
  ])('%s 전이면 "%s"로 표시한다', (_, elapsed, expected) => {
    expect(formatRelativeDate(ago(elapsed), NOW)).toBe(expected);
  });

  it('8일째부터는 절대 날짜로 표시한다', () => {
    expect(formatRelativeDate(ago(8 * DAY), NOW)).toBe('2025. 10. 12.');
    expect(formatRelativeDate('2023-01-05T12:00:00Z', NOW)).toBe('2023. 1. 5.');
  });

  it('기기 시계가 느려서 미래 날짜가 되면 "방금 전"으로 표시한다', () => {
    expect(formatRelativeDate(new Date(NOW + 5 * MINUTE).toISOString(), NOW)).toBe('방금 전');
  });

  it('날짜를 읽을 수 없으면 null을 반환한다', () => {
    expect(formatRelativeDate('어제', NOW)).toBeNull();
  });
});
