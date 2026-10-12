import { useEffect } from 'react';

// isActive가 true일 때만 Esc 키를 듣고 onEscape를 호출한다 (펼친 영상 접기, 타임라인 패널 닫기).
// YouTube 영상(iframe) 안에 포커스가 있으면 키 입력이 여기로 오지 않는다.
// onEscape가 렌더링마다 새로 만들어지면 리스너도 다시 등록되므로, 넘기는 쪽에서 useCallback 등으로 고정한다
export function useEscapeKey(isActive: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);
}
