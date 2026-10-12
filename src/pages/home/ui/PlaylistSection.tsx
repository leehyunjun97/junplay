import { PlaylistGrid, type Playlist } from '@/entities/playlist';
import type { PlaylistSearchState } from '../model/usePlaylistSearch';

interface PlaylistSectionProps {
  state: PlaylistSearchState;
  onSelectPlaylist: (playlist: Playlist) => void;
}

// 검색 상태(대기/로딩/성공/실패)에 맞는 화면을 보여 준다
export function PlaylistSection({ state, onSelectPlaylist }: PlaylistSectionProps) {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return (
        // role="status": 내용이 바뀌면 스크린 리더가 읽어 준다
        <p role="status" className="text-on-dark/70 text-center">
          플레이리스트를 불러오는 중...
        </p>
      );
    case 'error':
      return (
        <p role="alert" className="text-selected text-center">
          플레이리스트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      );
    case 'success':
      if (state.playlists.length === 0) {
        return (
          <p className="text-on-dark/70 text-center">이 분위기에 맞는 플레이리스트가 없어요.</p>
        );
      }
      return <PlaylistGrid playlists={state.playlists} onSelect={onSelectPlaylist} />;
  }
}
