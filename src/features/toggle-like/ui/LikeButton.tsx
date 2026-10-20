import { selectIsLiked, useLikeStore } from '@/entities/like';
import type { Playlist } from '@/entities/playlist';
import { HeartIcon, IconButton } from '@/shared/ui';

interface LikeButtonProps {
  playlist: Playlist;
}

// 플레이리스트 좋아요를 켜고 끄는 하트 버튼. 내 플레이리스트 화면에서는 해제가 곧 삭제다
export function LikeButton({ playlist }: LikeButtonProps) {
  const isLiked = useLikeStore(selectIsLiked(playlist.id));
  const toggle = useLikeStore((store) => store.toggle);

  return (
    // 켜짐/꺼짐은 aria-pressed로 알린다. 버튼이 각 카드(article) 안에 있어서 어느 카드의 버튼인지는 맥락으로 구분된다
    <IconButton label="좋아요" onClick={() => toggle(playlist)} pressed={isLiked}>
      <span className={isLiked ? 'text-like' : undefined}>
        <HeartIcon filled={isLiked} className="size-5" />
      </span>
    </IconButton>
  );
}
