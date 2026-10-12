import { useEffect } from 'react';
import { usePlayerStore } from '@/entities/player';

// 스페이스바가 원래 하는 일이 있는 요소. 여기에 포커스가 있으면 가로채지 않는다
// (입력창은 공백 입력, 버튼은 누르기, 슬라이더는 조작)
const SPACE_OWNER_SELECTOR = 'input, textarea, select, button, a[href], [role="button"]';

function shouldIgnore(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return true;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest(SPACE_OWNER_SELECTOR) !== null;
}

// 페이지 어디서든 스페이스바로 재생/일시정지한다.
// YouTube 영상(iframe) 안에 포커스가 있으면 키 입력이 iframe으로 가므로 여기서는 받지 않고,
// YouTube가 직접 처리한 결과가 onStateChange로 스토어에 반영된다.
export function useSpacebarTogglePlay() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || shouldIgnore(event)) return;

      const { current, togglePlay } = usePlayerStore.getState();
      if (!current) return;

      // 스페이스바의 기본 동작(페이지 스크롤)을 막는다
      event.preventDefault();
      // 키를 누르고 있으면 keydown이 반복되므로, 처음 한 번만 토글한다
      if (!event.repeat) togglePlay();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
