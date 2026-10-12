import { describe, expect, it } from 'vitest';
import { findCurrentTimelineIndex } from './findCurrentTimelineIndex';

const timeline = [
  { seconds: 10, label: '곡1' },
  { seconds: 200, label: '곡2' },
  { seconds: 400, label: '곡3' },
];

describe('findCurrentTimelineIndex', () => {
  it.each([
    [10, 0],
    [199.9, 0],
    [200, 1],
    [399, 1],
    [400, 2],
    [9999, 2],
  ])('%d초에는 %d번째 구간을 재생 중이다', (currentTime, expected) => {
    expect(findCurrentTimelineIndex(timeline, currentTime)).toBe(expected);
  });

  it('첫 곡이 시작하기 전이면 -1을 반환한다', () => {
    expect(findCurrentTimelineIndex(timeline, 5)).toBe(-1);
  });

  it('타임라인이 비어 있으면 -1을 반환한다', () => {
    expect(findCurrentTimelineIndex([], 100)).toBe(-1);
  });
});
