import type { TimelineItem } from '@/entities/timeline';

// 지금 재생 중인 구간의 순번. 시작 시간이 현재 시간 이하인 항목 중 마지막 것이다.
// 첫 곡이 시작하기 전(인트로 등)이면 -1을 반환한다. timeline은 시간순으로 정렬되어 있다고 본다
export function findCurrentTimelineIndex(timeline: TimelineItem[], currentTime: number): number {
  return timeline.findLastIndex((item) => item.seconds <= currentTime);
}
