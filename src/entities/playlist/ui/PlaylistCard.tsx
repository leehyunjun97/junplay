import type { Playlist } from '../model/types';

interface PlaylistCardProps {
  playlist: Playlist;
}

// 글자를 읽어야 하는 영역이라 유리 효과 없이 불투명(surface) 배경을 쓴다
export function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <article className="bg-surface overflow-hidden rounded-xl">
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
    </article>
  );
}
