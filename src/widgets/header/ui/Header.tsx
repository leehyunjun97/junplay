import { Link, NavLink } from 'react-router';
import logoUrl from '@/shared/assets/logo-vinyl.svg';
import { SearchIcon } from '@/shared/ui';

export function Header() {
  return (
    <header className="glass sticky top-0 z-10 border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-primary flex items-center gap-2 text-xl font-extrabold">
          {/* 장식용 이미지라 alt를 비워 링크 이름이 "JUNPLAYLIST"로 유지되게 한다 */}
          <img src={logoUrl} alt="" className="h-8 w-8" />
          JUNPLAYLIST
        </Link>
        {/* font-semibold: 메뉴 글자를 본문(400)보다 살짝 굵게 한다. 링크들이 물려받는다 */}
        <nav className="flex items-center gap-6 font-semibold">
          {/* 검색창은 검색 페이지 본문에 있고, 헤더에는 그리로 가는 아이콘만 둔다 */}
          <NavLink
            to="/search"
            aria-label="검색"
            className={({ isActive }) =>
              `focus-visible:outline-primary flex cursor-pointer items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-70 ${isActive ? 'text-primary' : 'text-on-dark hover:text-primary-light'}`
            }
          >
            {/* 옆 메뉴 글자 굵기에 맞춰 선을 조금 굵게 한다 */}
            <SearchIcon className="size-5" strokeWidth={2.5} />
          </NavLink>
          {/* 현재 경로와 일치하면 isActive가 true가 되어 강조 색을 적용한다 */}
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `focus-visible:outline-primary cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-70 ${isActive ? 'text-primary' : 'text-on-dark hover:text-primary-light'}`
            }
          >
            HISTORY
          </NavLink>
          <NavLink
            to="/my"
            className={({ isActive }) =>
              isActive ? 'text-primary' : 'text-on-dark hover:text-primary-light'
            }
          >
            MYPLAYLIST
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
