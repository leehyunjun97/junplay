import { MAX_PLAYLIST_RESULTS } from '../api/searchPlaylists';
import { PlaylistCardSkeleton } from './PlaylistCardSkeleton';
import { PLAYLIST_GRID_CLASS } from './playlistGridClass';

interface PlaylistGridSkeletonProps {
  // 그릴 스켈레톤 카드 수. 기본값은 검색 결과의 최대 개수
  count?: number;
}

// 불러오는 중에 보여 주는 카드 그리드 스켈레톤. 장식이라 스크린 리더에서는 숨긴다
// (로딩 중이라는 안내는 사용하는 쪽에서 role="status" 문구로 알린다)
export function PlaylistGridSkeleton({ count = MAX_PLAYLIST_RESULTS }: PlaylistGridSkeletonProps) {
  return (
    <div aria-hidden="true" data-testid="playlist-grid-skeleton" className={PLAYLIST_GRID_CLASS}>
      {Array.from({ length: count }, (_, index) => (
        <PlaylistCardSkeleton key={index} />
      ))}
    </div>
  );
}
