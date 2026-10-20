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
        <nav className="flex items-center gap-6">
          {/* 검색창은 검색 페이지 본문에 있고, 헤더에는 그리로 가는 아이콘만 둔다 */}
          <NavLink
            to="/search"
            aria-label="검색"
            className={({ isActive }) =>
              `focus-visible:outline-primary flex cursor-pointer items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-70 ${isActive ? 'text-primary' : 'text-on-dark hover:text-primary-light'}`
            }
          >
            <SearchIcon className="size-5" />
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
