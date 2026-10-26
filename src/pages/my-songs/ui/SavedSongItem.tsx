import type { SavedSong } from '@/entities/saved-song';
import { CopyIcon, IconButton, TrashIcon } from '@/shared/ui';

interface SavedSongItemProps {
  song: SavedSong;
  // 누르면 할 일 (그 영상을 곡 시작 시간부터 재생)
  onSelect: (song: SavedSong) => void;
  onCopyTitle: (title: string) => void;
  onRemove: (id: string) => void;
}

// 내 곡 목록의 한 줄. 지금은 이 페이지에서만 쓰므로 페이지 안에 둔다.
// 버튼 안에 버튼을 넣을 수 없으므로, 행 전체를 덮는 재생 버튼을 맨 아래에 깔고
// 복사·삭제 버튼만 그 위(z-10)에 올린다. 나머지 글자와 썸네일은 재생 버튼 아래에 있어 누르면 재생된다
export function SavedSongItem({ song, onSelect, onCopyTitle, onRemove }: SavedSongItemProps) {
  return (
    // isolate: 안의 z-index가 이 행 안에서만 비교되게 한다
    <li className="bg-surface relative isolate flex items-center gap-3 rounded-xl p-2">
      {/* 글자가 버튼 밖에 있어서, 스크린 리더가 읽을 이름을 aria-label로 준다 */}
      <button
        type="button"
        aria-label={song.title}
        onClick={() => onSelect(song)}
        className="hover:bg-on-dark/10 active:bg-on-dark/15 focus-visible:outline-primary absolute inset-0 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:transition motion-safe:duration-150"
      />
      {/* 곡명이 바로 옆에 있으므로 썸네일은 장식으로 처리한다 */}
      <img
        src={song.playlist.thumbnailUrl}
        alt=""
        loading="lazy"
        className="aspect-video w-24 shrink-0 rounded-md object-cover md:w-32"
      />
      {/* min-w-0: flex 안에서 글자가 길어도 줄어들 수 있게 해야 truncate가 동작한다 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate font-bold">{song.title}</p>
          <div className="relative z-10">
            <IconButton label="곡명 복사" onClick={() => onCopyTitle(song.title)}>
              <CopyIcon className="size-4" />
            </IconButton>
          </div>
        </div>
        {song.memo && <p className="text-on-dark/70 line-clamp-2 text-sm">{song.memo}</p>}
      </div>
      <div className="relative z-10">
        <IconButton label="삭제" onClick={() => onRemove(song.id)}>
          <TrashIcon className="size-5" />
        </IconButton>
      </div>
    </li>
  );
}
