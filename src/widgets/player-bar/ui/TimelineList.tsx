import type { ReactNode } from 'react';
import type { TimelineItem } from '@/entities/timeline';
import { formatTime } from '@/shared/lib/time';
import type { TimelineState } from '../model/useTimeline';
import { TimelineListSkeleton } from './TimelineListSkeleton';

interface TimelineListProps {
  state: TimelineState;
  // 지금 재생 중인 구간의 순번 (-1이면 첫 곡 전)
  currentIndex: number;
  // 항목을 누르면 같은 영상 안에서 그 시간으로 이동한다
  onSelect: (seconds: number) => void;
  // 타임라인이 없을 때 곡 정보를 찾으러 갈 YouTube 영상 페이지 주소 (현재 위치부터 재생)
  youtubeUrl: string;
  // YouTube 링크를 눌렀을 때 (우리 플레이어를 멈추는 데 쓴다)
  onOpenYouTube: () => void;
  // 각 곡 옆에 놓을 담기 버튼
  renderSaveButton: (item: TimelineItem) => ReactNode;
}

// 타임라인 목록. 작은 상태의 패널과 펼친 상태의 옆 목록에서 함께 쓴다
export function TimelineList({
  state,
  currentIndex,
  onSelect,
  youtubeUrl,
  onOpenYouTube,
  renderSaveButton,
}: TimelineListProps) {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return (
        <div>
          {/* 화면에는 스켈레톤만 보이고, 스크린 리더에는 이 문구로 로딩 중임을 알린다 */}
          <p role="status" className="sr-only">
            타임라인을 불러오는 중...
          </p>
          <TimelineListSkeleton />
        </div>
      );
    case 'error':
      return <p className="text-on-dark/70 p-4 text-sm">타임라인을 불러오지 못했어요.</p>;
    case 'success':
      if (state.items.length === 0) {
        // 자동 챕터, "음악" 섹션, 다른 사람의 타임라인 댓글은 API로 받을 수 없지만 영상 페이지에서는 볼 수 있다
        return (
          <div className="flex flex-col items-start gap-2 p-4 text-sm">
            <p className="text-on-dark/70">타임라인 정보가 없어요</p>
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onOpenYouTube}
              className="text-primary focus-visible:outline-primary cursor-pointer rounded-sm font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 active:opacity-70"
            >
              YouTube에서 곡 정보 찾기
            </a>
          </div>
        );
      }
      return (
        <ol aria-label="타임라인" className="flex flex-col gap-1 p-2">
          {state.items.map((item, index) => {
            const isCurrent = index === currentIndex;
            return (
              // 버튼 안에 버튼을 넣을 수 없으므로, 한 행을 [시간 이동 버튼][담기 버튼] 두 개로 나눈다
              <li key={item.seconds} className="flex items-center gap-1">
                <button
                  type="button"
                  // aria-current: 스크린 리더에 "지금 재생 중인 항목"임을 알린다
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => onSelect(item.seconds)}
                  className={`hover:bg-on-dark/10 active:bg-on-dark/15 focus-visible:outline-primary flex min-w-0 flex-1 cursor-pointer items-baseline gap-3 rounded-md px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:transition motion-safe:duration-150 ${isCurrent ? 'bg-primary/20 text-primary font-bold' : 'text-on-dark'}`}
                >
                  <span className="shrink-0 tabular-nums opacity-80">
                    {formatTime(item.seconds)}
                  </span>
                  <span className="min-w-0 flex-1 break-words">{item.label}</span>
                </button>
                {renderSaveButton(item)}
              </li>
            );
          })}
        </ol>
      );
  }
}
