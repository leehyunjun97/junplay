import type { ReactNode } from 'react';

interface ChipProps {
  onClick: () => void;
  children: ReactNode;
  // solid: 진한 배경의 큰 칩 (메인 분위기), glass: 유리 효과의 작은 칩 (서브 분위기)
  variant: 'solid' | 'glass';
  // 선택되면 selected 색으로 바뀌고, 스크린 리더에 "선택됨" 상태를 알린다 (aria-pressed)
  selected?: boolean;
  disabled?: boolean;
}

// variant별 크기와 색. 선택 여부에 따라 색이 바뀐다
const VARIANT_CLASS_NAMES = {
  solid: {
    base: 'px-5 py-2 font-bold',
    selected: 'bg-selected text-on-dark',
    unselected: 'bg-primary text-bg enabled:hover:bg-primary-light',
  },
  glass: {
    base: 'border px-4 py-1.5 text-sm',
    selected: 'bg-selected border-selected text-on-dark',
    unselected: 'glass text-primary-light enabled:hover:text-primary',
  },
} as const;

// 둥근 선택 칩. 클릭 가능한 요소의 상태(hover, focus-visible, active, disabled)를 여기서 정의한다
export function Chip({ onClick, children, variant, selected = false, disabled }: ChipProps) {
  const classNames = VARIANT_CLASS_NAMES[variant];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      className={`focus-visible:outline-primary cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 enabled:active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:transition motion-safe:duration-150 ${classNames.base} ${selected ? classNames.selected : classNames.unselected}`}
    >
      {children}
    </button>
  );
}
