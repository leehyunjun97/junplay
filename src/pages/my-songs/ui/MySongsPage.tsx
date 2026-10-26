import { useSavedSongStore, type SavedSong } from '@/entities/saved-song';
import { usePlayPlaylist } from '@/features/play-playlist';
import { PageTitle } from '@/shared/ui';
import { SavedSongItem } from './SavedSongItem';

// 담은 곡 목록. 누르면 그 영상을 곡 시작 시간부터 재생한다 (곡이 끝나도 영상은 이어서 재생된다)
export function MySongsPage() {
  const songs = useSavedSongStore((store) => store.songs);
  const removeSong = useSavedSongStore((store) => store.remove);
  const playPlaylist = usePlayPlaylist();

  const playSong = (song: SavedSong) => playPlaylist(song.playlist, song.seconds);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle page="내 곡" />
      <h1 className="text-primary text-2xl font-extrabold">내 곡</h1>
      {songs.length === 0 ? (
        <div className="text-on-dark/70 flex flex-col gap-1 text-center">
          <p>아직 담은 곡이 없어요.</p>
          <p className="text-sm">플레이어의 타임라인 목록에서 마음에 드는 곡을 담아 보세요.</p>
        </div>
      ) : (
        <ul aria-label="담은 곡" className="flex flex-col gap-2">
          {songs.map((song) => (
            <SavedSongItem key={song.id} song={song} onSelect={playSong} onRemove={removeSong} />
          ))}
        </ul>
      )}
    </div>
  );
}
