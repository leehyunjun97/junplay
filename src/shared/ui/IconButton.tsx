import type { ReactNode } from 'react';

interface IconButtonProps {
  // 아이콘만 있어서 화면에 글자가 없으므로, 스크린 리더가 읽을 이름을 반드시 받는다
  label: string;
  // 폼 제출 버튼(type="submit")이면 onClick 없이 폼의 onSubmit이 처리한다
  onClick?: () => void;
  children: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  // 켜고 끄는 토글 버튼이면 현재 상태를 넘긴다 (aria-pressed)
  pressed?: boolean;
}

// 아이콘 하나로 된 둥근 버튼. 클릭 가능한 요소의 상태(hover, focus-visible, active, disabled)를 여기서 정의한다
export function IconButton({
  label,
  onClick,
  children,
  type = 'button',
  disabled,
  pressed,
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className="text-on-dark hover:bg-on-dark/15 active:bg-on-dark/25 focus-visible:outline-on-dark inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
