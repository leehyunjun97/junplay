import type { ReactNode } from 'react';

interface ButtonProps {
  // 폼 제출 버튼(type="submit")이면 onClick 없이 폼의 onSubmit이 처리한다
  onClick?: () => void;
  children: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

// 글자가 있는 테두리 버튼 (예: 전체 삭제). 클릭 가능한 요소의 상태를 여기서 정의한다
export function Button({ onClick, children, type = 'button', disabled }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="border-on-dark/30 text-on-dark hover:bg-on-dark/10 active:bg-on-dark/20 focus-visible:outline-on-dark inline-flex shrink-0 cursor-pointer items-center rounded-full border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent motion-safe:transition motion-safe:duration-150"
    >
      {children}
    </button>
  );
}
