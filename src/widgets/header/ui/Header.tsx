import { Link, NavLink } from 'react-router';
import logoUrl from '@/shared/assets/logo-vinyl.svg';

export function Header() {
  return (
    <header className="glass sticky top-0 z-10 border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-primary flex items-center gap-2 text-xl font-bold">
          {/* 장식용 이미지라 alt를 비워 링크 이름이 "JUNPLAYLIST"로 유지되게 한다 */}
          <img src={logoUrl} alt="" className="h-8 w-8" />
          JUNPLAYLIST
        </Link>
        <nav>
          {/* 현재 경로와 일치하면 isActive가 true가 되어 강조 색을 적용한다 */}
          <NavLink
            to="/my"
            className={({ isActive }) =>
              isActive ? 'text-primary' : 'text-on-dark hover:text-primary-light'
            }
          >
            내 플레이리스트
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
