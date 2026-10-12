import type { TimelineItem } from '../model/types';
import { createMockTimeline } from './mockTimeline';

// 로딩 상태를 화면에서 확인할 수 있도록 목 응답을 일부러 늦춘다
const MOCK_DELAY_MS = 500;

// `npm run dev:mock`으로 실행하면 true가 된다 (.env.mock)
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// 영상별 타임라인 캐시. 새로고침 전까지 메모리에만 유지된다.
// 결과가 아닌 Promise를 저장해서, 응답을 기다리는 중에 같은 영상이 또 요청돼도 호출은 한 번만 나간다.
const cache = new Map<string, Promise<TimelineItem[]>>();

function isTimelineItem(value: unknown): value is TimelineItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof value.seconds === 'number' &&
    'label' in value &&
    typeof value.label === 'string'
  );
}

async function requestTimeline(videoId: string): Promise<TimelineItem[]> {
  const response = await fetch(`/api/video?${new URLSearchParams({ id: videoId }).toString()}`);
  if (!response.ok) {
    throw new Error(`타임라인 요청 실패: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isTimelineItem)) {
    throw new Error('타임라인 응답 형식이 올바르지 않습니다.');
  }
  return data;
}

async function requestMockTimeline(videoId: string): Promise<TimelineItem[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return createMockTimeline(videoId);
}

// 영상 설명란의 타임라인을 가져온다. 같은 영상은 다시 요청하지 않고 캐시를 쓴다
export function fetchTimeline(videoId: string): Promise<TimelineItem[]> {
  const cached = cache.get(videoId);
  if (cached) return cached;

  const request = USE_MOCK_API ? requestMockTimeline(videoId) : requestTimeline(videoId);
  cache.set(videoId, request);
  // 실패한 요청은 캐시에서 지워서 다시 시도할 수 있게 한다
  request.catch(() => cache.delete(videoId));
  return request;
}
