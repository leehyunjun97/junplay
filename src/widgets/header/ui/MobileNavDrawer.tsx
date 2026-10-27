import { useEffect, useRef, type KeyboardEvent } from 'react';
import { CloseIcon, IconButton } from '@/shared/ui';
import { NAV_ITEMS } from '../config/navItems';
import { HeaderNavLink } from './HeaderNavLink';

interface MobileNavDrawerProps {
  onClose: () => void;
}

// 드로어 안에서 Tab으로 오갈 수 있는 요소들
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled])';

// 모바일 헤더의 메뉴 버튼을 누르면 오른쪽에서 나오는 메뉴 (md 이상에서는 보이지 않는다).
// 열려 있는 동안: 포커스는 드로어 안에서만 돌고, 뒤 페이지는 스크롤되지 않는다.
// 닫기: 닫기 버튼, 바깥(어두운 배경) 클릭, Esc, 메뉴 이동. 포커스를 메뉴 버튼으로 돌려주는 일은 헤더가 한다
export function MobileNavDrawer({ onClose }: MobileNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 열리면 닫기 버튼에 포커스를 준다. 스크린 리더가 드로어 안에서 읽기 시작한다
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // 열려 있는 동안 뒤 페이지가 스크롤되지 않게 한다
  useEffect(() => {
    document.documentElement.classList.add('overflow-hidden');
    return () => document.documentElement.classList.remove('overflow-hidden');
  }, []);

  // 열린 채로 화면이 md 이상으로 넓어지면 드로어가 숨겨지므로(md:hidden) 상태도 닫아 둔다
  useEffect(() => {
    const query = window.matchMedia?.('(min-width: 768px)');
    if (!query) return;
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) onClose();
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, [onClose]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      // 펼친 영상 접기 같은 다른 Esc 동작까지 함께 일어나지 않게 여기서 멈춘다
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;

    // 마지막 요소에서 Tab이면 처음으로, 처음 요소에서 Shift+Tab이면 마지막으로 보낸다
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    // 헤더(glass)에는 backdrop-filter가 있어서 그 안에 fixed 요소를 두면 화면이 아니라 헤더 기준으로 놓인다.
    // 그래서 헤더 밖(형제)에 그린다. z-40: 플레이어 바와 토스트(z-30)보다 위
    <div className="fixed inset-0 z-40 md:hidden" onKeyDown={handleKeyDown}>
      {/* 바깥을 누르면 닫는다. 닫기 버튼과 Esc가 있으므로 스크린 리더에서는 숨긴다 */}
      <div aria-hidden="true" onClick={onClose} className="bg-bg/60 absolute inset-0" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="메뉴"
        className="glass motion-safe:animate-slide-in-right absolute inset-y-0 right-0 flex w-64 flex-col gap-2 border-l p-4 font-bold"
      >
        <div className="flex justify-end">
          <IconButton ref={closeButtonRef} label="메뉴 닫기" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <nav aria-label="메뉴" className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label }) => (
            <HeaderNavLink key={to} to={to} layout="drawer" onClick={onClose}>
              {label}
            </HeaderNavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
