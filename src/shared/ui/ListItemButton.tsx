import type { ReactNode } from 'react';

interface ListItemButtonProps {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}

// 목록 한 줄을 차지하는 글자 버튼 (예: 최근 검색어). 클릭 가능한 요소의 상태를 여기서 정의한다.
// 글자가 길면 한 줄로 자른다
export function ListItemButton({ onClick, children, disabled }: ListItemButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-on-dark hover:bg-on-dark/10 active:bg-on-dark/20 focus-visible:outline-primary min-w-0 flex-1 cursor-pointer truncate rounded-lg px-3 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
