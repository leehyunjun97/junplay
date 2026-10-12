import type { Playlist } from '../model/types';

interface PlaylistCardProps {
  playlist: Playlist;
  // 카드를 눌렀을 때 할 일. 카드는 플레이어를 모르고, 사용하는 쪽(페이지)이 정한다
  onSelect: (playlist: Playlist) => void;
}

// 글자를 읽어야 하는 영역이라 유리 효과 없이 불투명(surface) 배경을 쓴다
export function PlaylistCard({ playlist, onSelect }: PlaylistCardProps) {
  return (
    <article className="bg-surface overflow-hidden rounded-xl">
      {/* 카드 전체를 하나의 버튼으로 만든다. 버튼 이름은 안의 제목·채널명 글자가 된다 */}
      <button
        type="button"
        onClick={() => onSelect(playlist)}
        className="hover:bg-on-dark/10 active:bg-on-dark/15 focus-visible:outline-primary block w-full cursor-pointer rounded-xl text-left focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {/* 제목이 바로 아래 있으므로 썸네일은 장식으로 처리한다 */}
        <img
          src={playlist.thumbnailUrl}
          alt=""
          loading="lazy"
          className="aspect-video w-full object-cover"
        />
        <div className="p-3">
          {/* 제목이 1줄이어도 2줄 높이를 차지하게 해, 카드끼리 채널명 줄이 맞도록 한다 */}
          <h3 className="line-clamp-2 min-h-12 leading-6 font-bold">{playlist.title}</h3>
          <p className="text-on-dark/70 mt-1 truncate text-sm">{playlist.channelTitle}</p>
        </div>
      </button>
    </article>
  );
}
