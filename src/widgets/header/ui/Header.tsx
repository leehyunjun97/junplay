import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router';
import logoUrl from '@/shared/assets/logo-vinyl.svg';
import { IconButton, MenuIcon, SearchIcon } from '@/shared/ui';
import { NAV_ITEMS } from '../config/navItems';
import { HeaderNavLink } from './HeaderNavLink';
import { MobileNavDrawer } from './MobileNavDrawer';

export function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // 드로어를 닫으면 연 버튼으로 포커스를 돌려준다. 드로어의 effect가 이 함수에 의존하므로 고정해 둔다
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  return (
    <>
      <header className="glass sticky top-0 z-10 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="text-primary focus-visible:outline-primary flex cursor-pointer items-center gap-2 rounded-sm text-xl font-extrabold hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-70 motion-safe:transition motion-safe:duration-150"
          >
            {/* 장식용 이미지라 alt를 비워 링크 이름이 "JUNPLAYLIST"로 유지되게 한다 */}
            <img src={logoUrl} alt="" className="h-8 w-8" />
            {/* 모바일에서는 글자를 화면에서만 숨긴다. 스크린 리더는 계속 읽는다 */}
            <span className="sr-only md:not-sr-only">JUNPLAYLIST</span>
          </Link>
          {/* font-bold: SPEC의 강조 굵기(700). 링크들이 물려받는다 */}
          <nav className="flex items-center gap-3 font-bold md:gap-6">
            {/* 검색은 자주 쓰므로 모바일에서도 드로어에 넣지 않고 헤더에 둔다.
                검색창은 검색 페이지 본문에 있고, 헤더에는 그리로 가는 아이콘만 둔다 */}
            <HeaderNavLink to="/search" label="검색">
              {/* 옆 메뉴 글자 굵기에 맞춰 선을 조금 굵게 한다 */}
              <SearchIcon className="size-5" strokeWidth={2.5} />
            </HeaderNavLink>
            {/* 나머지 메뉴는 md 이상에서만 헤더에 펼쳐 두고, 모바일에서는 드로어에 넣는다 */}
            {NAV_ITEMS.map(({ to, label }) => (
              <div key={to} className="hidden md:flex">
                <HeaderNavLink to={to}>{label}</HeaderNavLink>
              </div>
            ))}
            <div className="md:hidden">
              <IconButton
                ref={menuButtonRef}
                label="메뉴 열기"
                onClick={() => setIsDrawerOpen(true)}
                size="sm"
              >
                <MenuIcon className="size-5" />
              </IconButton>
            </div>
          </nav>
        </div>
      </header>
      {isDrawerOpen && <MobileNavDrawer onClose={closeDrawer} />}
    </>
  );
}
