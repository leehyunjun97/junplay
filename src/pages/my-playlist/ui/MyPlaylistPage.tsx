import { useLikeStore } from '@/entities/like';
import { PlaylistGrid } from '@/entities/playlist';
import { usePlayPlaylist } from '@/features/play-playlist';
import { LikeButton } from '@/features/toggle-like';
import { PageTitle } from '@/shared/ui';

// 좋아요한 플레이리스트 목록. 카드를 누르면 재생하고, 하트를 눌러 좋아요를 해제하면 목록에서 삭제된다
export function MyPlaylistPage() {
  const likedPlaylists = useLikeStore((store) => store.items);
  const playPlaylist = usePlayPlaylist();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle page="내 플레이리스트" />
      <h1 className="text-primary text-2xl font-extrabold">내 플레이리스트</h1>
      {likedPlaylists.length === 0 ? (
        <p className="text-on-dark/70 text-center">아직 좋아요한 플레이리스트가 없어요.</p>
      ) : (
        <PlaylistGrid
          playlists={likedPlaylists}
          onSelect={playPlaylist}
          renderAction={(playlist) => <LikeButton playlist={playlist} />}
        />
      )}
    </div>
  );
}
