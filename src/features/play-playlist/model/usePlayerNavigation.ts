import { useCallback } from 'react';
import { useHistoryStore } from '@/entities/history';
import { usePlayerStore } from '@/entities/player';

// "이전/다음 플레이리스트로 이동" 사용자 행동. 이동해서 재생한 항목도 F6 히스토리에 기록한다.
// (히스토리 스토어의 연속 중복 방지 규칙은 그대로 적용된다)
export function usePlayerNavigation() {
  const playPreviousInStore = usePlayerStore((store) => store.playPrevious);
  const playNextInStore = usePlayerStore((store) => store.playNext);
  const canGoPrevious = usePlayerStore((store) => store.backStack.length > 0);
  const canGoNext = usePlayerStore((store) => store.forwardStack.length > 0);
  const addHistory = useHistoryStore((store) => store.add);

  const playPrevious = useCallback(() => {
    const moved = playPreviousInStore();
    if (moved) addHistory(moved);
  }, [playPreviousInStore, addHistory]);

  const playNext = useCallback(() => {
    const moved = playNextInStore();
    if (moved) addHistory(moved);
  }, [playNextInStore, addHistory]);

  return { canGoPrevious, canGoNext, playPrevious, playNext };
}
