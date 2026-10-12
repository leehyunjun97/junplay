import { useEffect } from 'react';
import { usePlayerStore } from '@/entities/player';

// 영상을 크게 펼친 상태에서 Esc를 누르면 작게 돌아간다.
// 펼쳐져 있을 때만 키 입력을 듣는다. YouTube 영상(iframe) 안에 포커스가 있으면 키 입력이 여기로 오지 않는다.
export function useEscapeToCollapse() {
  const isExpanded = usePlayerStore((store) => store.isExpanded);

  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      usePlayerStore.getState().setExpanded(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);
}
