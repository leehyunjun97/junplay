import type { ReactNode } from 'react';
import { formatKoreanCount } from '@/shared/lib/number';
import { formatRelativeDate } from '@/shared/lib/time';
import type { Playlist } from '../model/types';

// 예: '조회수 1.2만회 · 3일 전'. 값이 없는 부분은 빼고, 둘 다 없으면 빈 문자열
function formatPlaylistMeta({ viewCount, publishedAt }: Playlist): string {
  const parts = [
    viewCount === undefined ? null : `조회수 ${formatKoreanCount(viewCount)}회`,
    publishedAt === undefined ? null : formatRelativeDate(publishedAt),
  ];
  return parts.filter((part): part is string => part !== null).join(' · ');
}

interface PlaylistCardProps {
  playlist: Playlist;
  // 카드를 눌렀을 때 할 일. 카드는 플레이어를 모르고, 사용하는 쪽(페이지)이 정한다
  onSelect: (playlist: Playlist) => void;
  // 썸네일 오른쪽 위에 놓을 버튼 (예: 좋아요). entities는 features를 import할 수 없어서 사용하는 쪽이 넣어 준다
  action?: ReactNode;
}

// 글자를 읽어야 하는 영역이라 유리 효과 없이 불투명(surface) 배경을 쓴다
export function PlaylistCard({ playlist, onSelect, action }: PlaylistCardProps) {
  return (
    // group: 카드 어디에 마우스를 올려도 아래 hover 배경이 반응하게 한다.
    // isolate: hover 배경(-z-10)이 페이지 뒤로 숨지 않고 이 카드 바로 뒤에 깔리게 한다
    <article className="group relative isolate">
      {/* hover 배경. 카드보다 조금 크게 깔아 두고, hover하면 퍼지고 떼면 다시 줄어든다 (YouTube 카드처럼).
          모션 줄이기 설정을 켠 사용자에게는 크기 변화 없이 나타나기만 한다 */}
      <div
        aria-hidden="true"
        className="bg-on-dark/10 pointer-events-none absolute -inset-2 -z-10 rounded-2xl opacity-0 group-hover:opacity-100 motion-safe:scale-95 motion-safe:transition motion-safe:duration-200 motion-safe:group-hover:scale-100"
      />
      <div className="bg-surface overflow-hidden rounded-xl">
        {/* 카드 전체를 하나의 버튼으로 만든다. 버튼 이름은 안의 제목·채널명 글자가 된다 */}
        <button
          type="button"
          onClick={() => onSelect(playlist)}
          className="active:bg-on-dark/15 focus-visible:outline-primary block w-full cursor-pointer rounded-xl text-left focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {/* relative: AI 의심 배지를 썸네일 왼쪽 위에 겹치는 기준 */}
          <div className="relative">
            {/* 제목이 바로 아래 있으므로 썸네일은 장식으로 처리한다 */}
            <img
              src={playlist.thumbnailUrl}
              alt=""
              loading="lazy"
              className="aspect-video w-full object-cover"
            />
            {/* 업로더가 밝힌 표현으로 추정한 값이라 "의심"으로 표시한다. 버튼 안에 있어서 스크린 리더는 제목과 함께 읽는다.
                오른쪽 위 좋아요 버튼과 같은 반투명 어두운 배경을 써서 밝은 썸네일 위에서도 보이게 한다 */}
            {playlist.isAiSuspected && (
              <span className="bg-bg/60 text-on-dark absolute top-2 left-2 rounded-full px-2.5 py-1 text-xs font-bold">
                AI 의심
              </span>
            )}
          </div>
          <div className="p-3">
            {/* 제목이 1줄이어도 2줄 높이를 차지하게 해, 카드끼리 채널명 줄이 맞도록 한다 */}
            <h3 className="line-clamp-2 min-h-12 leading-6 font-bold">{playlist.title}</h3>
            <p className="text-on-dark/70 mt-1 truncate text-sm">{playlist.channelTitle}</p>
            {/* 값이 없어도(예전에 저장한 좋아요·히스토리) 한 줄 높이를 차지해, 섞여 있어도 카드 높이가 맞게 한다 */}
            <p className="text-on-dark/70 min-h-5 truncate text-sm">
              {formatPlaylistMeta(playlist)}
            </p>
          </div>
        </button>
      </div>
      {/* 버튼 안에 버튼을 넣을 수 없으므로(HTML 규칙) 카드 버튼의 형제로 두고 썸네일 위에 겹친다.
          밝은 썸네일 위에서도 보이도록 반투명한 어두운 원을 깐다 */}
      {action && <div className="bg-bg/60 absolute top-2 right-2 rounded-full">{action}</div>}
    </article>
  );
}
