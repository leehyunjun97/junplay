import {
  PlaylistGrid,
  PlaylistGridSkeleton,
  type Playlist,
  type PlaylistSearchState,
} from '@/entities/playlist';
import { LikeButton } from '@/features/toggle-like';

interface PlaylistResultsProps {
  state: PlaylistSearchState;
  onSelectPlaylist: (playlist: Playlist) => void;
  // 결과가 0개일 때 보여 줄 문구. 화면마다 다르다 (분위기 추천, 키워드 검색)
  emptyMessage: string;
}

// 검색 상태(대기/로딩/성공/실패)에 맞는 화면을 보여 준다. 홈의 분위기 추천과 검색 페이지가 함께 쓴다
export function PlaylistResults({ state, onSelectPlaylist, emptyMessage }: PlaylistResultsProps) {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return (
        <div>
          {/* 화면에는 스켈레톤만 보이고, 스크린 리더에는 이 문구로 로딩 중임을 알린다.
              role="status": 내용이 바뀌면 스크린 리더가 읽어 준다 */}
          <p role="status" className="sr-only">
            플레이리스트를 불러오는 중...
          </p>
          <PlaylistGridSkeleton />
        </div>
      );
    case 'error':
      return (
        <p role="alert" className="text-selected text-center">
          플레이리스트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      );
    case 'success':
      if (state.playlists.length === 0) {
        return <p className="text-on-dark/70 text-center">{emptyMessage}</p>;
      }
      return (
        <PlaylistGrid
          playlists={state.playlists}
          onSelect={onSelectPlaylist}
          renderAction={(playlist) => <LikeButton playlist={playlist} />}
        />
      );
  }
}
