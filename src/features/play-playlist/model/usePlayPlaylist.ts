import { useCallback } from 'react';
import { useHistoryStore } from '@/entities/history';
import { usePlayerStore } from '@/entities/player';
import type { Playlist } from '@/entities/playlist';

// "플레이리스트 재생" 사용자 행동. 재생과 히스토리 기록을 한 곳에서 함께 처리한다.
// 홈, 히스토리, (이후) 검색·내 플레이리스트 화면이 모두 이 훅으로 재생한다.
// 이전/다음(6-2)이 생기면 이동 기록도 여기서 함께 업데이트한다.
export function usePlayPlaylist() {
  const play = usePlayerStore((store) => store.play);
  const addHistory = useHistoryStore((store) => store.add);

  return useCallback(
    (playlist: Playlist) => {
      play(playlist);
      addHistory(playlist);
    },
    [play, addHistory],
  );
}
