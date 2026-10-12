import type { TimelineItem } from '../model/types';

const MOCK_TRACK_COUNT = 12;
const MOCK_TRACK_SECONDS = 4 * 60;

// 개발용 목 타임라인. 목 플레이리스트 중 실제 영상(첫 번째 카드)에만 4분 간격 12곡을 주고,
// 가짜 ID(`mock-`로 시작)에는 빈 목록을 줘서 "타임라인 정보가 없어요" 화면을 확인할 수 있게 한다
export function createMockTimeline(videoId: string): TimelineItem[] {
  if (videoId.startsWith('mock-')) return [];
  return Array.from({ length: MOCK_TRACK_COUNT }, (_, index) => ({
    seconds: index * MOCK_TRACK_SECONDS,
    label: `목 곡 ${index + 1} - 목 가수`,
  }));
}
