import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('label을 스크린 리더가 읽을 이름으로 쓰고, 키보드로 포커스하면 같은 이름을 툴팁으로 보여 준다', async () => {
    const user = userEvent.setup();
    render(
      <IconButton label="재생">
        <svg />
      </IconButton>,
    );

    await user.tab();

    expect(screen.getByRole('button', { name: '재생' })).toHaveFocus();
    // 툴팁은 aria-hidden이라 글자로 찾는다
    expect(screen.getByText('재생')).toBeInTheDocument();
  });
});
