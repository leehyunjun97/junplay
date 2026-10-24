import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from './Chip';

describe('Chip', () => {
  it('누르면 onClick을 호출한다', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Chip variant="solid" onClick={handleClick}>
        신나는
      </Chip>,
    );

    await user.click(screen.getByRole('button', { name: '신나는' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('비활성화되면 눌러도 onClick을 호출하지 않는다', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Chip variant="glass" onClick={handleClick} disabled>
        드라이브
      </Chip>,
    );

    await user.click(screen.getByRole('button', { name: '드라이브' }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('선택 여부를 aria-pressed로 알린다', () => {
    const { rerender } = render(
      <Chip variant="glass" onClick={() => {}}>
        드라이브
      </Chip>,
    );
    expect(screen.getByRole('button', { name: '드라이브' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    rerender(
      <Chip variant="glass" onClick={() => {}} selected>
        드라이브
      </Chip>,
    );
    expect(screen.getByRole('button', { name: '드라이브' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
