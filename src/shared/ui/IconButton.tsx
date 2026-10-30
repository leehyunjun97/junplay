import type { ReactNode, Ref } from 'react';
import { Tooltip } from './Tooltip';

// md: 플레이어 바처럼 주요 조작 버튼, sm: 목록 행 안처럼 촘촘한 자리의 보조 버튼
const SIZE_CLASS = {
  md: 'size-10',
  sm: 'size-8',
};

// default: 항상 또렷하게, subtle: 평소에는 흐리게 두었다가 가리키거나 포커스하면 또렷해진다
const TONE_CLASS = {
  default: 'text-on-dark',
  subtle: 'text-on-dark/60 hover:text-on-dark focus-visible:text-on-dark',
};

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
  size?: keyof typeof SIZE_CLASS;
  tone?: keyof typeof TONE_CLASS;
  // 포커스를 직접 옮길 때 쓴다 (예: 드로어가 열리면 닫기 버튼에 포커스). React 19부터 ref를 일반 prop으로 받을 수 있다
  ref?: Ref<HTMLButtonElement>;
}

// 아이콘 하나로 된 둥근 버튼. 클릭 가능한 요소의 상태(hover, focus-visible, active, disabled)를 여기서 정의한다
export function IconButton({
  label,
  onClick,
  children,
  type = 'button',
  disabled,
  pressed,
  size = 'md',
  tone = 'default',
  ref,
}: IconButtonProps) {
  return (
    // 아이콘만으로는 뜻을 알기 어려우므로, 마우스를 올리거나 키보드로 포커스하면 같은 이름을 툴팁으로 보여 준다
    <Tooltip label={label}>
      <button
        ref={ref}
        type={type}
        aria-label={label}
        aria-pressed={pressed}
        disabled={disabled}
        onClick={onClick}
        className={`hover:bg-on-dark/15 active:bg-on-dark/25 focus-visible:outline-on-dark inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent motion-safe:transition motion-safe:duration-150 ${SIZE_CLASS[size]} ${TONE_CLASS[tone]}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}
