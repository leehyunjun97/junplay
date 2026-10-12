import type { Playlist } from '../model/types';
import { PlaylistCard } from './PlaylistCard';

interface PlaylistGridProps {
  playlists: Playlist[];
  onSelect: (playlist: Playlist) => void;
}

// 플레이리스트 카드 그리드 (추천 결과, 최근 들은 목록, 히스토리 페이지)
export function PlaylistGrid({ playlists, onSelect }: PlaylistGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {playlists.map((playlist, index) => (
        // 히스토리에는 같은 플레이리스트가 여러 번 들어 있을 수 있어서 순번을 함께 키로 쓴다
        <li key={`${playlist.id}-${index}`}>
          <PlaylistCard playlist={playlist} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
