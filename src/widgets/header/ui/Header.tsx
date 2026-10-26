import { Link } from 'react-router';
import logoUrl from '@/shared/assets/logo-vinyl.svg';
import { SearchIcon } from '@/shared/ui';
import { HeaderNavLink } from './HeaderNavLink';

export function Header() {
  return (
    <header className="glass sticky top-0 z-10 border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          to="/"
          className="text-primary focus-visible:outline-primary flex cursor-pointer items-center gap-2 rounded-sm text-xl font-extrabold hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-70 motion-safe:transition motion-safe:duration-150"
        >
          {/* 장식용 이미지라 alt를 비워 링크 이름이 "JUNPLAYLIST"로 유지되게 한다 */}
          <img src={logoUrl} alt="" className="h-8 w-8" />
          {/* 모바일에서는 메뉴가 들어갈 자리가 모자라 글자를 화면에서만 숨긴다. 스크린 리더는 계속 읽는다 */}
          <span className="sr-only md:not-sr-only">JUNPLAYLIST</span>
        </Link>
        {/* font-bold: SPEC의 강조 굵기(700). 링크들이 물려받는다.
            모바일(375px)에서도 메뉴 4개가 한 줄에 들어가도록 간격을 좁힌다 */}
        <nav className="flex items-center gap-3 font-bold md:gap-6">
          {/* 검색창은 검색 페이지 본문에 있고, 헤더에는 그리로 가는 아이콘만 둔다 */}
          <HeaderNavLink to="/search" label="검색">
            {/* 옆 메뉴 글자 굵기에 맞춰 선을 조금 굵게 한다 */}
            <SearchIcon className="size-5" strokeWidth={2.5} />
          </HeaderNavLink>
          <HeaderNavLink to="/history">HISTORY</HeaderNavLink>
          <HeaderNavLink to="/my">MYPLAYLIST</HeaderNavLink>
          {/* 내 곡: 담아 둔 순간들이라는 뜻으로 MEMORY라고 부른다 */}
          <HeaderNavLink to="/songs">MEMORY</HeaderNavLink>
        </nav>
      </div>
    </header>
  );
}
