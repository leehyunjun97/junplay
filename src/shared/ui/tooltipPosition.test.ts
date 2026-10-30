import { describe, expect, it } from 'vitest';
import { calculateTooltipPosition, TOOLTIP_GAP } from './tooltipPosition';

const VIEWPORT_WIDTH = 1000;
const tooltip = { width: 60, height: 24 };

// 화면 가운데쯤, 위아래로 자리가 충분한 40x40 버튼
const trigger = { top: 500, bottom: 540, left: 480, width: 40 };

describe('calculateTooltipPosition', () => {
  it('요소 위 가운데에 띄운다', () => {
    expect(calculateTooltipPosition(trigger, tooltip, VIEWPORT_WIDTH)).toEqual({
      top: 500 - 24 - TOOLTIP_GAP,
      left: 480 + 20 - 30,
    });
  });

  it('위에 자리가 없으면 요소 아래로 뒤집는다', () => {
    const nearTop = { ...trigger, top: 12, bottom: 52 };

    expect(calculateTooltipPosition(nearTop, tooltip, VIEWPORT_WIDTH).top).toBe(52 + TOOLTIP_GAP);
  });

  it('화면 왼쪽 끝을 넘으면 안쪽으로 밀어 넣는다', () => {
    const nearLeft = { ...trigger, left: 0 };

    expect(calculateTooltipPosition(nearLeft, tooltip, VIEWPORT_WIDTH).left).toBe(TOOLTIP_GAP);
  });

  it('화면 오른쪽 끝을 넘으면 안쪽으로 밀어 넣는다', () => {
    const nearRight = { ...trigger, left: VIEWPORT_WIDTH - 40 };

    expect(calculateTooltipPosition(nearRight, tooltip, VIEWPORT_WIDTH).left).toBe(
      VIEWPORT_WIDTH - 60 - TOOLTIP_GAP,
    );
  });
});
