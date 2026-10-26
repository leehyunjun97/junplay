import { useState } from 'react';
import { useSavedSongStore, type SavedSong, type SaveSongChanges } from '@/entities/saved-song';
import { usePlayPlaylist } from '@/features/play-playlist';
import { useToast } from '@/shared/lib/toast';
import { PageTitle, Toast } from '@/shared/ui';
import { SavedSongItem } from './SavedSongItem';

// 담은 곡 목록. 누르면 그 영상을 곡 시작 시간부터 재생한다 (곡이 끝나도 영상은 이어서 재생된다)
export function MySongsPage() {
  const songs = useSavedSongStore((store) => store.songs);
  const updateSong = useSavedSongStore((store) => store.update);
  const removeSong = useSavedSongStore((store) => store.remove);
  const playPlaylist = usePlayPlaylist();
  const toast = useToast();
  // 지금 수정 중인 곡. 한 번에 한 곡만 수정한다
  const [editingId, setEditingId] = useState<string | null>(null);

  const saveSong = (id: string, changes: SaveSongChanges) => {
    updateSong(id, changes);
    setEditingId(null);
  };

  const playSong = (song: SavedSong) => playPlaylist(song.playlist, song.seconds);

  // 클립보드는 권한이 없거나 보안 연결(https)이 아니면 실패할 수 있어서 결과를 나눠 알린다
  const copyTitle = (title: string) => {
    navigator.clipboard
      .writeText(title)
      .then(() => toast.show('곡명을 복사했어요'))
      .catch(() => toast.show('복사하지 못했어요'));
  };

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
        <ul aria-label="담은 곡" className="flex flex-col gap-3">
          {songs.map((song) => (
            <SavedSongItem
              key={song.id}
              song={song}
              isEditing={song.id === editingId}
              onSelect={playSong}
              onCopyTitle={copyTitle}
              onEdit={setEditingId}
              onSave={saveSong}
              onCancelEdit={() => setEditingId(null)}
              onRemove={removeSong}
            />
          ))}
        </ul>
      )}
      {/* 플레이어 바의 담기 토스트와 같은 자리(헤더 바로 아래 가운데)에 띄운다 */}
      <Toast message={toast.message} className="inset-x-4 top-20 flex justify-center" />
    </div>
  );
}
