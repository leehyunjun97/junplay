import type { ReactNode } from 'react';
import type { Playlist } from '../model/types';
import { PlaylistCard } from './PlaylistCard';
import { PLAYLIST_GRID_CLASS } from './playlistGridClass';

interface PlaylistGridProps {
  playlists: Playlist[];
  onSelect: (playlist: Playlist) => void;
  // 각 카드에 놓을 버튼을 만든다 (예: 좋아요)
  renderAction?: (playlist: Playlist) => ReactNode;
}

// 플레이리스트 카드 그리드 (추천 결과, 최근 들은 목록, 히스토리 페이지, 내 플레이리스트)
export function PlaylistGrid({ playlists, onSelect, renderAction }: PlaylistGridProps) {
  return (
    <ul className={PLAYLIST_GRID_CLASS}>
      {playlists.map((playlist, index) => (
        // 히스토리에는 같은 플레이리스트가 여러 번 들어 있을 수 있어서 순번을 함께 키로 쓴다
        <li key={`${playlist.id}-${index}`}>
          <PlaylistCard playlist={playlist} onSelect={onSelect} action={renderAction?.(playlist)} />
        </li>
      ))}
    </ul>
  );
}
