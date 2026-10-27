import { useHistoryStore } from '@/entities/history';
import { PlaylistGrid } from '@/entities/playlist';
import { usePlayPlaylist } from '@/features/play-playlist';
import { LikeButton } from '@/features/toggle-like';
import { Button, PageHeading, PageTitle } from '@/shared/ui';

// 최근 들은 플레이리스트 목록. 카드를 누르면 다시 재생한다
export function HistoryPage() {
  const entries = useHistoryStore((store) => store.entries);
  const clearHistory = useHistoryStore((store) => store.clear);
  const playPlaylist = usePlayPlaylist();

  const playlists = entries.map((entry) => entry.playlist);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <PageTitle page="최근 들은 플레이리스트" />
        <PageHeading>최근 들은 플레이리스트</PageHeading>
        <Button onClick={clearHistory} disabled={entries.length === 0}>
          전체 삭제
        </Button>
      </div>
      {playlists.length === 0 ? (
        <p className="text-on-dark/70 text-center">아직 들은 플레이리스트가 없어요.</p>
      ) : (
        <PlaylistGrid
          playlists={playlists}
          onSelect={playPlaylist}
          renderAction={(playlist) => <LikeButton playlist={playlist} />}
        />
      )}
    </div>
  );
}
