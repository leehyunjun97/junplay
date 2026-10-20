import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialRecentKeywordsState, useRecentKeywordsStore } from '../model/recentKeywordsStore';
import { SearchForm } from './SearchForm';

describe('SearchForm', () => {
  beforeEach(() => {
    localStorage.clear();
    useRecentKeywordsStore.setState(initialRecentKeywordsState);
  });

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
  describe('최근 검색어', () => {
    // 최근 검색어 패널
    function queryPanel() {
      return screen.queryByRole('region', { name: '최근 검색어' });
    }

    function saveKeywords(...keywords: string[]) {
      useRecentKeywordsStore.setState({ keywords });
    }

    it('검색하면 최근 검색어에 기록한다', async () => {
      const user = userEvent.setup();
      render(<SearchForm initialKeyword="" onSearch={vi.fn()} />);

      await user.type(screen.getByRole('searchbox', { name: '검색어' }), '아이유{Enter}');

      expect(useRecentKeywordsStore.getState().keywords).toEqual(['아이유']);
    });

    it('입력창에 포커스하면 최근 검색어를 최근 순으로 보여 준다', async () => {
      const user = userEvent.setup();
      saveKeywords('재즈', '아이유');
      render(<SearchForm initialKeyword="드라이브" onSearch={vi.fn()} />);
      expect(queryPanel()).not.toBeInTheDocument();

      await user.click(screen.getByRole('searchbox', { name: '검색어' }));

      const items = within(screen.getByRole('region', { name: '최근 검색어' })).getAllByRole(
        'listitem',
      );
      expect(items.map((item) => item.textContent)).toEqual(['재즈', '아이유']);
    });

    it('최근 검색어가 없으면 포커스해도 패널을 보여 주지 않는다', async () => {
      const user = userEvent.setup();
      render(<SearchForm initialKeyword="드라이브" onSearch={vi.fn()} />);

      await user.click(screen.getByRole('searchbox', { name: '검색어' }));

      expect(queryPanel()).not.toBeInTheDocument();
    });

    it('최근 검색어를 누르면 그 검색어로 검색하고 맨 앞으로 올린 뒤 패널을 닫는다', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();
      saveKeywords('재즈', '아이유');
      render(<SearchForm initialKeyword="드라이브" onSearch={onSearch} />);

      await user.click(screen.getByRole('searchbox', { name: '검색어' }));
      await user.click(screen.getByRole('button', { name: '아이유' }));

      expect(onSearch).toHaveBeenCalledWith('아이유');
      expect(useRecentKeywordsStore.getState().keywords).toEqual(['아이유', '재즈']);
      expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveValue('아이유');
      expect(queryPanel()).not.toBeInTheDocument();
    });

    it('검색어를 하나씩 지울 수 있고, 패널은 열린 채로 남는다', async () => {
      const user = userEvent.setup();
      saveKeywords('재즈', '아이유');
      render(<SearchForm initialKeyword="" onSearch={vi.fn()} />);

      await user.click(screen.getByRole('searchbox', { name: '검색어' }));
      await user.click(screen.getByRole('button', { name: '재즈 삭제' }));

      expect(useRecentKeywordsStore.getState().keywords).toEqual(['아이유']);
      expect(queryPanel()).toBeInTheDocument();
      expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveFocus();
    });

    it('전체 삭제하면 모두 지워지고 패널이 사라진다', async () => {
      const user = userEvent.setup();
      saveKeywords('재즈', '아이유');
      render(<SearchForm initialKeyword="" onSearch={vi.fn()} />);

      await user.click(screen.getByRole('searchbox', { name: '검색어' }));
      await user.click(screen.getByRole('button', { name: '전체 삭제' }));

      expect(useRecentKeywordsStore.getState().keywords).toEqual([]);
      expect(queryPanel()).not.toBeInTheDocument();
    });

    it('Esc를 누르면 입력값은 그대로 두고 패널만 닫는다. 다시 누르면 열린다', async () => {
      const user = userEvent.setup();
      saveKeywords('재즈');
      render(<SearchForm initialKeyword="드라이브" onSearch={vi.fn()} />);
      const input = screen.getByRole('searchbox', { name: '검색어' });

      await user.click(input);
      await user.keyboard('{Escape}');

      expect(queryPanel()).not.toBeInTheDocument();
      expect(input).toHaveValue('드라이브');

      await user.click(input);
      expect(queryPanel()).toBeInTheDocument();
    });

    it('바깥을 누르면 패널이 닫힌다', async () => {
      const user = userEvent.setup();
      saveKeywords('재즈');
      render(
        <>
          <SearchForm initialKeyword="" onSearch={vi.fn()} />
          <button type="button">바깥</button>
        </>,
      );

      await user.click(screen.getByRole('searchbox', { name: '검색어' }));
      expect(queryPanel()).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '바깥' }));

      expect(queryPanel()).not.toBeInTheDocument();
    });

    it('Tab으로 패널 안의 버튼으로 이동해도 패널은 열려 있다', async () => {
      const user = userEvent.setup();
      saveKeywords('재즈');
      render(<SearchForm initialKeyword="드라이브" onSearch={vi.fn()} />);

      await user.click(screen.getByRole('searchbox', { name: '검색어' }));
      await user.tab(); // 검색 버튼
      await user.tab(); // 전체 삭제

      expect(screen.getByRole('button', { name: '전체 삭제' })).toHaveFocus();
      expect(queryPanel()).toBeInTheDocument();
    });
  });
});
