import { useHistoryStore } from '@/entities/history';
import { PlaylistGrid, type Playlist } from '@/entities/playlist';
import { LikeButton } from '@/features/toggle-like';

// SPEC: 홈 화면에는 최근 들은 플레이리스트를 최대 4개 보여 준다 (데스크톱 카드 한 줄)
const MAX_RECENT_PLAYLISTS = 4;

interface RecentPlaylistsProps {
  onSelectPlaylist: (playlist: Playlist) => void;
}

// 홈 화면 아래쪽의 "최근 들은 플레이리스트" 섹션
export function RecentPlaylists({ onSelectPlaylist }: RecentPlaylistsProps) {
  const entries = useHistoryStore((store) => store.entries);

  // 기록이 없으면 섹션을 숨긴다. 그 자리의 안내 문구는 HomePage가 보여 준다
  if (entries.length === 0) return null;

  const playlists = entries.slice(0, MAX_RECENT_PLAYLISTS).map((entry) => entry.playlist);

  return (
    <section aria-labelledby="recent-playlists-heading" className="flex flex-col gap-4">
      <h2 id="recent-playlists-heading" className="text-primary text-xl font-bold">
        최근 들은 플레이리스트
      </h2>
      <PlaylistGrid
        playlists={playlists}
        onSelect={onSelectPlaylist}
        renderAction={(playlist) => <LikeButton playlist={playlist} />}
      />
    </section>
  );
}
