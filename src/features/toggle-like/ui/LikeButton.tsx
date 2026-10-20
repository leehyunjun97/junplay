import { selectIsLiked, useLikeStore } from '@/entities/like';
import type { Playlist } from '@/entities/playlist';
import { HeartIcon, IconButton } from '@/shared/ui';

interface LikeButtonProps {
  // 좋아요할 플레이리스트. 플레이어 바처럼 아직 재생할 항목이 없으면 null을 넘기고, 비활성화된 빈 하트가 보인다
  playlist: Playlist | null;
  // 하트 크기. 카드는 작게(기본값), 플레이어 바는 다른 아이콘과 맞춰 크게 쓴다
  iconClassName?: string;
}

// 플레이리스트 좋아요를 켜고 끄는 하트 버튼. 내 플레이리스트 화면에서는 해제가 곧 삭제다.
// 카드와 플레이어 바가 같은 스토어를 읽어서, 한쪽에서 누르면 다른 쪽 하트도 함께 바뀐다
export function LikeButton({ playlist, iconClassName = 'size-5' }: LikeButtonProps) {
  const isLiked = useLikeStore((store) => (playlist ? selectIsLiked(playlist.id)(store) : false));
  const toggle = useLikeStore((store) => store.toggle);

  return (
    // 켜짐/꺼짐은 aria-pressed로 알린다. 버튼이 카드나 플레이어 바 안에 있어서 어느 플레이리스트의 버튼인지는 맥락으로 구분된다
    <IconButton
      label="좋아요"
      onClick={() => {
        if (playlist) toggle(playlist);
      }}
      pressed={isLiked}
      disabled={!playlist}
    >
      <span className={isLiked ? 'text-like' : undefined}>
        <HeartIcon filled={isLiked} className={iconClassName} />
      </span>
    </IconButton>
  );
}
