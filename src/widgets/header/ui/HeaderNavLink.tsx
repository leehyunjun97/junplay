import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Tooltip } from '@/shared/ui';

// inline: 헤더 한 줄 안의 메뉴, drawer: 모바일 드로어 안에서 한 줄을 차지하는 큰 메뉴 (누르기 쉽게 크게)
const LAYOUT_CLASS = {
  inline: 'rounded-sm',
  drawer: 'hover:bg-on-dark/10 rounded-lg px-4 py-3 text-lg',
};

interface HeaderNavLinkProps {
  to: string;
  children: ReactNode;
  // 아이콘만 있는 링크처럼 화면에 글자가 없을 때 스크린 리더가 읽을 이름
  label?: string;
  layout?: keyof typeof LAYOUT_CLASS;
  // 누른 뒤 할 일 (예: 드로어 닫기)
  onClick?: () => void;
}

// 헤더 메뉴 링크. 클릭 가능한 요소의 상태를 여기서 정의한다.
// 현재 경로와 일치하면 isActive가 true가 되어 강조 색을 적용한다
export function HeaderNavLink({
  to,
  children,
  label,
  layout = 'inline',
  onClick,
}: HeaderNavLinkProps) {
  const link = (
    <NavLink
      to={to}
      aria-label={label}
      onClick={onClick}
      className={({ isActive }) =>
        `focus-visible:outline-primary flex cursor-pointer items-center focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-70 motion-safe:transition motion-safe:duration-150 ${LAYOUT_CLASS[layout]} ${isActive ? 'text-primary' : 'text-on-dark hover:text-primary-light'}`
      }
    >
      {children}
    </NavLink>
  );

  // 아이콘만 있는 링크(label이 있음)는 같은 이름을 툴팁으로 보여 준다. 글자 메뉴는 그대로 둔다
  return label ? <Tooltip label={label}>{link}</Tooltip> : link;
}
