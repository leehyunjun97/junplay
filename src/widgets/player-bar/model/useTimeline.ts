import { useEffect, useState } from 'react';
import { fetchTimeline, type TimelineItem } from '@/entities/timeline';

export type TimelineState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; items: TimelineItem[] }
  | { status: 'error' };

// 결과가 어느 영상의 것인지 함께 기록한다. items가 null이면 실패
interface TimelineResult {
  videoId: string;
  items: TimelineItem[] | null;
}

// 재생 중인 영상의 타임라인을 불러온다.
// 영상이 바뀌면 이전 결과의 videoId와 달라지므로, 따로 초기화하지 않아도 자동으로 '불러오는 중'이 된다
export function useTimeline(videoId: string | undefined): TimelineState {
  const [result, setResult] = useState<TimelineResult | null>(null);

  useEffect(() => {
    if (!videoId) return;

    // 응답이 오기 전에 영상이 또 바뀌면, 늦게 온 이전 응답은 버린다
    let ignore = false;
    fetchTimeline(videoId)
      .then((items) => {
        if (!ignore) setResult({ videoId, items });
      })
      .catch(() => {
        if (!ignore) setResult({ videoId, items: null });
      });

    return () => {
      ignore = true;
    };
  }, [videoId]);

  if (!videoId) return { status: 'idle' };
  if (result?.videoId !== videoId) return { status: 'loading' };
  return result.items ? { status: 'success', items: result.items } : { status: 'error' };
}
