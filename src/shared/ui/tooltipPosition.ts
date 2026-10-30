// 감싼 요소와 툴팁 사이, 화면 가장자리와 툴팁 사이 간격(px)
export const TOOLTIP_GAP = 8;

interface Rect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

interface Size {
  width: number;
  height: number;
}

export interface TooltipPosition {
  top: number;
  left: number;
}

// 툴팁을 띄울 화면 좌표(position: fixed 기준)를 계산한다.
// 기본은 요소 위 가운데. 위에 자리가 없으면(헤더 등) 아래로 뒤집고, 화면 좌우 끝을 넘으면 안쪽으로 밀어 넣는다
export function calculateTooltipPosition(
  trigger: Rect,
  tooltip: Size,
  viewportWidth: number,
): TooltipPosition {
  const above = trigger.top - tooltip.height - TOOLTIP_GAP;
  const top = above >= TOOLTIP_GAP ? above : trigger.bottom + TOOLTIP_GAP;

  const centered = trigger.left + trigger.width / 2 - tooltip.width / 2;
  const maxLeft = viewportWidth - tooltip.width - TOOLTIP_GAP;
  const left = Math.max(TOOLTIP_GAP, Math.min(centered, maxLeft));

  return { top, left };
}
