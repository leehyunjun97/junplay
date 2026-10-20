import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchForm } from './SearchForm';

describe('SearchForm', () => {
  it('Enter를 누르면 앞뒤 공백을 지운 검색어로 검색한다', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchForm initialKeyword="" onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: '검색어' }), '  아이유  {Enter}');

    expect(onSearch).toHaveBeenCalledWith('아이유');
  });

  it('검색 버튼을 눌러도 검색한다', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchForm initialKeyword="" onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: '검색어' }), '재즈');
    await user.click(screen.getByRole('button', { name: '검색' }));

    expect(onSearch).toHaveBeenCalledWith('재즈');
  });

  it('빈 문자열이나 공백만 있으면 검색 버튼이 비활성화되고, Enter를 눌러도 검색하지 않는다', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchForm initialKeyword="" onSearch={onSearch} />);
    const input = screen.getByRole('searchbox', { name: '검색어' });

    expect(screen.getByRole('button', { name: '검색' })).toBeDisabled();
    await user.type(input, '   {Enter}');

    expect(screen.getByRole('button', { name: '검색' })).toBeDisabled();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('처음 검색어를 입력창에 채워 둔다', () => {
    render(<SearchForm initialKeyword="드라이브" onSearch={vi.fn()} />);

    expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveValue('드라이브');
  });

  it('검색어가 없을 때만 입력창에 바로 포커스한다', () => {
    const { unmount } = render(<SearchForm initialKeyword="" onSearch={vi.fn()} />);
    expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveFocus();
    unmount();

    render(<SearchForm initialKeyword="드라이브" onSearch={vi.fn()} />);
    expect(screen.getByRole('searchbox', { name: '검색어' })).not.toHaveFocus();
  });
});
