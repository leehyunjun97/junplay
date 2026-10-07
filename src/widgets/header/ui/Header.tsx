import { Link, NavLink } from 'react-router';

export function Header() {
  return (
    <header className="bg-bg border-surface border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-primary text-xl font-bold">
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
