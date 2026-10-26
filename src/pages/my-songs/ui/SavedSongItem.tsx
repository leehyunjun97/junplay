import type { SavedSong } from '@/entities/saved-song';
import { formatRelativeDate, formatTime } from '@/shared/lib/time';
import { IconButton, TrashIcon } from '@/shared/ui';

interface SavedSongItemProps {
  song: SavedSong;
  // 누르면 할 일 (그 영상을 곡 시작 시간부터 재생)
  onSelect: (song: SavedSong) => void;
  onRemove: (id: string) => void;
}

// 내 곡 목록의 한 줄. 지금은 이 페이지에서만 쓰므로 페이지 안에 둔다
export function SavedSongItem({ song, onSelect, onRemove }: SavedSongItemProps) {
  const savedDate = formatRelativeDate(new Date(song.savedAt).toISOString());

  return (
    // 버튼 안에 버튼을 넣을 수 없으므로, 한 행을 [재생 버튼][삭제 버튼] 두 개로 나눈다
    <li className="bg-surface flex items-center gap-2 rounded-xl p-2">
      {/* 버튼 이름은 안의 곡명·영상 제목 글자가 된다 */}
      <button
        type="button"
        onClick={() => onSelect(song)}
        className="hover:bg-on-dark/10 active:bg-on-dark/15 focus-visible:outline-primary flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-1 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:transition motion-safe:duration-150"
      >
        {/* 곡명과 영상 제목이 바로 옆에 있으므로 썸네일은 장식으로 처리한다 */}
        <img
          src={song.playlist.thumbnailUrl}
          alt=""
          loading="lazy"
          className="aspect-video w-24 shrink-0 rounded-md object-cover md:w-32"
        />
        {/* min-w-0: flex 안에서 글자가 길어도 줄어들 수 있게 해야 truncate가 동작한다 */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{song.title}</p>
          <p className="text-on-dark/70 truncate text-sm">{song.playlist.title}</p>
          <p className="text-on-dark/70 text-sm tabular-nums">
            {formatTime(song.seconds)}부터
            {savedDate && ` · ${savedDate} 담음`}
          </p>
          {song.memo && <p className="mt-1 line-clamp-2 text-sm">{song.memo}</p>}
        </div>
      </button>
      <IconButton label="삭제" onClick={() => onRemove(song.id)}>
        <TrashIcon className="size-5" />
      </IconButton>
    </li>
  );
}
