import type { Playlist } from '@/entities/playlist';
import { useSavedSongStore } from '@/entities/saved-song';
import { BookmarkPlusIcon, IconButton } from '@/shared/ui';
import { SAVE_SONG_MESSAGES } from '../config/messages';

interface SaveSongButtonProps {
  // 곡을 담을 영상. 플레이어 바처럼 아직 재생할 항목이 없으면 null을 넘기고, 비활성화된다
  playlist: Playlist | null;
  // 곡 시작 시간(초)
  seconds: number;
  // 곡명. 타임라인이 없으면 빈 문자열을 넘기고 나중에 내 곡 페이지에서 입력한다
  title: string;
  // 담은 결과를 알릴 문구를 받는다 (토스트로 보여 주는 쪽이 정한다)
  onResult: (message: string) => void;
  iconClassName?: string;
}

// 지금 곡을 내 곡에 담는 버튼. 같은 영상의 같은 구간이면 저장하지 않고 "이미 담은 곡"이라고 알린다
export function SaveSongButton({
  playlist,
  seconds,
  title,
  onResult,
  iconClassName,
}: SaveSongButtonProps) {
  const save = useSavedSongStore((store) => store.save);

  return (
    // 어느 곡의 버튼인지는 플레이어 바, 타임라인 행 같은 맥락으로 구분된다 (좋아요 버튼과 같은 방식)
    <IconButton
      label="내 곡에 담기"
      onClick={() => {
        if (playlist) onResult(SAVE_SONG_MESSAGES[save({ playlist, seconds, title })]);
      }}
      disabled={!playlist}
    >
      <BookmarkPlusIcon className={iconClassName} />
    </IconButton>
  );
}
