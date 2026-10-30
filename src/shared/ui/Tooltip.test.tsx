import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Tooltip, TOOLTIP_DELAY_MS } from './Tooltip';

function renderTooltip() {
  render(
    <Tooltip label="재생">
      <button type="button" aria-label="재생">
        ▶
      </button>
    </Tooltip>,
  );
  return screen.getByRole('button', { name: '재생' });
}

// 툴팁은 스크린 리더에서 숨겨 두므로(aria-hidden) 역할이 아니라 글자로 찾는다. 버튼 이름은 aria-label이라 글자로는 잡히지 않는다
function queryTooltip() {
  return screen.queryByText('재생');
}

describe('Tooltip', () => {
  beforeEach(() => {
    // shouldAdvanceTime: 실제 시간도 함께 흐르게 한다. 시간을 완전히 멈추면 Testing Library의 비동기 처리가 끝나지 않는다
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // delay: null — user-event가 동작 사이에 기다리지 않게 해, 실제로 흐르는 시간을 최소로 줄인다
  function setupUser() {
    return userEvent.setup({ delay: null });
  }

  it('마우스를 올리자마자는 뜨지 않고, 잠시 머무르면 뜬다', async () => {
    const user = setupUser();
    const button = renderTooltip();

    await user.hover(button);
    expect(queryTooltip()).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(TOOLTIP_DELAY_MS));
    expect(queryTooltip()).toBeInTheDocument();
  });

  it('뜨기 전에 마우스가 벗어나면 뜨지 않는다', async () => {
    const user = setupUser();
    const button = renderTooltip();

    await user.hover(button);
    await user.unhover(button);
    act(() => vi.advanceTimersByTime(TOOLTIP_DELAY_MS));

    expect(queryTooltip()).not.toBeInTheDocument();
  });

  it('마우스가 벗어나면 사라진다', async () => {
    const user = setupUser();
    const button = renderTooltip();
    await user.hover(button);
    act(() => vi.advanceTimersByTime(TOOLTIP_DELAY_MS));

    await user.unhover(button);

    expect(queryTooltip()).not.toBeInTheDocument();
  });

  it('누르면 사라진다', async () => {
    const user = setupUser();
    const button = renderTooltip();
    await user.hover(button);
    act(() => vi.advanceTimersByTime(TOOLTIP_DELAY_MS));

    await user.click(button);

    expect(queryTooltip()).not.toBeInTheDocument();
  });

  it('Tab으로 포커스하면 바로 뜨고, Esc를 누르면 사라진다', async () => {
    const user = setupUser();
    renderTooltip();

    await user.tab();
    expect(queryTooltip()).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(queryTooltip()).not.toBeInTheDocument();
  });

  it('포커스가 빠지면 사라진다', async () => {
    const user = setupUser();
    renderTooltip();
    await user.tab();

    await user.tab();

    expect(queryTooltip()).not.toBeInTheDocument();
  });
});
