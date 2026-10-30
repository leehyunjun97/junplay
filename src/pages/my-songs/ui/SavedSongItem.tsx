import { Fragment } from 'react';
import type { SavedSong, SaveSongChanges } from '@/entities/saved-song';
import { CopyIcon, IconButton, PencilIcon, TrashIcon } from '@/shared/ui';
import { createMusicSearchLinks } from '../lib/musicSearchLinks';
import { SavedSongEditForm } from './SavedSongEditForm';

interface SavedSongItemProps {
  song: SavedSong;
  // 수정 중이면 곡명·메모 대신 수정 폼을 보여 준다
  isEditing: boolean;
  // 누르면 할 일 (그 영상을 곡 시작 시간부터 재생)
  onSelect: (song: SavedSong) => void;
  onCopyTitle: (title: string) => void;
  onEdit: (id: string) => void;
  onSave: (id: string, changes: SaveSongChanges) => void;
  onCancelEdit: () => void;
  onRemove: (id: string) => void;
}

// 내 곡 목록의 한 줄. 지금은 이 페이지에서만 쓰므로 페이지 안에 둔다
export function SavedSongItem({
  song,
  isEditing,
  onSelect,
  onCopyTitle,
  onEdit,
  onSave,
  onCancelEdit,
  onRemove,
}: SavedSongItemProps) {
  // 곡명이 바로 옆에 있으므로 썸네일은 장식으로 처리한다
  const thumbnail = (
    <img
      src={song.playlist.thumbnailUrl}
      alt=""
      loading="lazy"
      className="aspect-video w-24 shrink-0 rounded-md object-cover md:w-32"
    />
  );

  // 수정 중에는 재생 버튼 없이 폼만 둔다. 입력하다가 실수로 재생되지 않게 한다
  if (isEditing) {
    return (
      <li className="bg-surface flex items-start gap-3 rounded-xl p-3">
        {thumbnail}
        <SavedSongEditForm
          song={song}
          onSave={(changes) => onSave(song.id, changes)}
          onCancel={onCancelEdit}
        />
      </li>
    );
  }

  return (
    // 버튼 안에 버튼을 넣을 수 없으므로, 행 전체를 덮는 재생 버튼을 맨 아래에 깔고
    // 복사·수정·삭제 버튼만 그 위(z-10)에 올린다. 나머지 글자와 썸네일은 재생 버튼 아래에 있어 누르면 재생된다.
    // isolate: 안의 z-index가 이 행 안에서만 비교되게 한다
    <li className="bg-surface relative isolate flex items-center gap-3 rounded-xl p-3">
      {/* 글자가 버튼 밖에 있어서, 스크린 리더가 읽을 이름을 aria-label로 준다 */}
      <button
        type="button"
        aria-label={song.title}
        onClick={() => onSelect(song)}
        className="hover:bg-on-dark/10 active:bg-on-dark/15 focus-visible:outline-primary absolute inset-0 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:transition motion-safe:duration-150"
      />
      {thumbnail}
      {/* min-w-0: flex 안에서 글자가 길어도 줄어들 수 있게 해야 truncate가 동작한다 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1">
          {/* title: ...으로 잘려도 마우스를 올리면 브라우저 말풍선으로 전체 곡명을 볼 수 있다 */}
          <p title={song.title} className="truncate font-bold">
            {song.title}
          </p>
          {/* -my-1.5: 버튼(32px)이 글자 줄(24px)보다 커서 줄 높이가 부풀지 않게, 위아래로 넘치게 둔다 */}
          <div className="relative z-10 -my-1.5">
            <IconButton
              label="곡명 복사"
              onClick={() => onCopyTitle(song.title)}
              size="sm"
              tone="subtle"
            >
              <CopyIcon className="size-4" />
            </IconButton>
          </div>
        </div>
        {/* whitespace-pre-line: 메모에 입력한 줄바꿈을 그대로 보여 준다 */}
        {song.memo && (
          <p className="text-on-dark/70 line-clamp-2 text-sm whitespace-pre-line">{song.memo}</p>
        )}
        {/* 원곡 찾기 링크. 재생 버튼 위(z-10)에 올려서 눌러도 재생되지 않고 새 탭이 열린다 */}
        <div className="flex items-center gap-1.5 text-xs">
          {createMusicSearchLinks(song.title).map(({ service, url }, index) => (
            <Fragment key={service}>
              {index > 0 && (
                <span aria-hidden="true" className="text-on-dark/40">
                  ·
                </span>
              )}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-on-dark/60 hover:text-primary focus-visible:outline-primary relative z-10 cursor-pointer rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 active:opacity-70"
              >
                {service}
              </a>
            </Fragment>
          ))}
        </div>
      </div>
      <div className="relative z-10 flex shrink-0">
        <IconButton label="수정" onClick={() => onEdit(song.id)} size="sm" tone="subtle">
          <PencilIcon className="size-4" />
        </IconButton>
        <IconButton label="삭제" onClick={() => onRemove(song.id)} size="sm" tone="subtle">
          <TrashIcon className="size-4" />
        </IconButton>
      </div>
    </li>
  );
}
