import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

interface HeaderNavLinkProps {
  to: string;
  children: ReactNode;
  // 아이콘만 있는 링크처럼 화면에 글자가 없을 때 스크린 리더가 읽을 이름
  label?: string;
}

// 헤더 메뉴 링크. 클릭 가능한 요소의 상태를 여기서 정의한다.
// 현재 경로와 일치하면 isActive가 true가 되어 강조 색을 적용한다
export function HeaderNavLink({ to, children, label }: HeaderNavLinkProps) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      className={({ isActive }) =>
        `focus-visible:outline-primary flex cursor-pointer items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-70 motion-safe:transition motion-safe:duration-150 ${isActive ? 'text-primary' : 'text-on-dark hover:text-primary-light'}`
      }
    >
      {children}
    </NavLink>
  );
}
