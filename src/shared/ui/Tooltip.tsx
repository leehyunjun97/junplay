import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { calculateTooltipPosition } from './tooltipPosition';

// 마우스를 올려 두고 이만큼 기다린 뒤 띄운다. 훑고 지나갈 때 툴팁이 줄줄이 깜빡이지 않게 한다
export const TOOLTIP_DELAY_MS = 200;

interface TooltipProps {
  // 툴팁에 보여 줄 글자. 감싼 요소의 접근 가능한 이름(aria-label)과 같은 글자를 넘긴다
  label: string;
  children: ReactNode;
}

// 감싼 요소에 마우스를 올려 두거나 키보드로 포커스하면 이름을 말풍선으로 보여 준다.
// 스크롤 영역(타임라인 패널 등)에 잘리지 않도록 body에 포털로 띄우고, 화면 좌표로 자리를 잡는다
export function Tooltip({ label, children }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    window.clearTimeout(timerRef.current);
    setIsOpen(true);
  }

  function close() {
    window.clearTimeout(timerRef.current);
    setIsOpen(false);
  }

  function handlePointerEnter(event: PointerEvent<HTMLSpanElement>) {
    // 터치는 "올려 두기"가 없으므로 마우스일 때만 띄운다
    if (event.pointerType !== 'mouse') return;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(open, TOOLTIP_DELAY_MS);
  }

  function handleFocus(event: FocusEvent<HTMLSpanElement>) {
    // 키보드로 옮겨 온 포커스일 때만 바로 띄운다. 마우스로 클릭해서 생긴 포커스로는 띄우지 않는다
    if (event.target.matches(':focus-visible')) open();
  }

  // 툴팁이 그려진 직후(화면에 보이기 전) 크기를 재서 자리를 잡는다.
  // 좌표는 실행 중에 잰 값이라 Tailwind 클래스로 쓸 수 없어서, top/left만 style로 넣는다 (CLAUDE.md 예외로 승인됨)
  function placeTooltip(tooltip: HTMLSpanElement | null) {
    const trigger = triggerRef.current;
    if (!tooltip || !trigger) return;
    const { top, left } = calculateTooltipPosition(
      trigger.getBoundingClientRect(),
      tooltip.getBoundingClientRect(),
      window.innerWidth,
    );
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  // 떠 있는 동안 Esc를 누르거나, 스크롤·창 크기 변경으로 요소가 움직이면 닫는다
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    function handleMove() {
      setIsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    // capture: 페이지뿐 아니라 타임라인 패널처럼 안쪽 영역의 스크롤도 잡는다
    window.addEventListener('scroll', handleMove, true);
    window.addEventListener('resize', handleMove);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleMove, true);
      window.removeEventListener('resize', handleMove);
    };
  }, [isOpen]);

  // 기다리는 중에 화면에서 사라지면 타이머를 정리한다
  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  return (
    <span
      ref={triggerRef}
      className="inline-flex shrink-0"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={close}
      onPointerDown={close}
      onFocus={handleFocus}
      onBlur={close}
    >
      {children}
      {isOpen &&
        createPortal(
          // 같은 글자를 감싼 요소의 이름으로 이미 읽으므로, 스크린 리더가 두 번 읽지 않게 숨긴다
          <span
            ref={placeTooltip}
            aria-hidden="true"
            className="bg-on-dark text-bg pointer-events-none fixed top-0 left-0 z-50 rounded-md px-2 py-1 text-xs font-bold whitespace-nowrap"
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}
