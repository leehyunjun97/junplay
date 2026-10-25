import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialHistoryState, useHistoryStore } from '@/entities/history';
import { initialPlayerState, usePlayerStore } from '@/entities/player';
import { searchPlaylists, type Playlist } from '@/entities/playlist';
import { initialLastKeywordState, useLastKeywordStore } from '../model/lastKeywordStore';
import { SearchPage } from './SearchPage';

// 실제 /api/search 대신 테스트에서 결과를 직접 정한다.
// usePlaylistSearch가 슬라이스 안에서 이 모듈을 직접 import하므로 원본 모듈을 mock한다
vi.mock('@/entities/playlist/api/searchPlaylists', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/playlist/api/searchPlaylists')>();
  return { ...actual, searchPlaylists: vi.fn() };
});
const mockedSearchPlaylists = vi.mocked(searchPlaylists);

function createPlaylists(prefix: string, count: number): Playlist[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    title: `${prefix} 플레이리스트 ${index}`,
    channelTitle: `${prefix} 채널 ${index}`,
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
  }));
}

// 주어진 주소에서 검색 페이지를 띄운다. 이동한 주소를 확인할 수 있게 라우터를 돌려준다
function renderAt(path: string) {
  const router = createMemoryRouter([{ path: '/search', element: <SearchPage /> }], {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('SearchPage', () => {
  beforeEach(() => {
    mockedSearchPlaylists.mockReset();
    localStorage.clear();
    usePlayerStore.setState(initialPlayerState);
    useHistoryStore.setState(initialHistoryState);
    useLastKeywordStore.setState(initialLastKeywordState);
  });

  it('URL의 검색어로 플레이리스트를 검색해 보여 준다', async () => {
    mockedSearchPlaylists.mockResolvedValue(createPlaylists('아이유', 3));
    renderAt('/search?q=아이유');

    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중');
    // 불러오는 동안에는 카드 자리를 스켈레톤으로 잡아 두고, 결과가 오면 사라진다
    expect(screen.getByTestId('playlist-grid-skeleton')).toBeInTheDocument();
    expect(await screen.findByText('아이유 플레이리스트 0')).toBeInTheDocument();
    expect(screen.queryByTestId('playlist-grid-skeleton')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    // 플레이리스트를 뜻하는 단어가 없으면 붙여서 검색한다
    expect(mockedSearchPlaylists).toHaveBeenCalledWith('아이유 플레이리스트', 'relevance');
    expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveValue('아이유');
  });

  it('검색창에 입력하고 검색하면 URL이 바뀌고 새로 검색한다', async () => {
    const user = userEvent.setup();
    mockedSearchPlaylists.mockResolvedValue(createPlaylists('재즈', 1));
    const router = renderAt('/search');

    await user.type(screen.getByRole('searchbox', { name: '검색어' }), '재즈 노래모음{Enter}');

    expect(router.state.location.search).toBe(
      `?q=${encodeURIComponent('재즈 노래모음').replace(/%20/g, '+')}`,
    );
    expect(await screen.findByText('재즈 플레이리스트 0')).toBeInTheDocument();
    expect(mockedSearchPlaylists).toHaveBeenCalledWith('재즈 노래모음', 'relevance');
  });

  it.each(['/search', '/search?q=', '/search?q=%20%20'])(
    '%s 처럼 검색어가 비어 있으면 API를 호출하지 않고 안내 문구를 보여 준다',
    (path) => {
      renderAt(path);

      expect(screen.getByText('검색어를 입력해 주세요.')).toBeInTheDocument();
      expect(mockedSearchPlaylists).not.toHaveBeenCalled();
    },
  );

  it('결과가 없으면 안내 문구를 보여 준다', async () => {
    mockedSearchPlaylists.mockResolvedValue([]);
    renderAt('/search?q=없는검색어');

    expect(await screen.findByText('검색 결과가 없어요.')).toBeInTheDocument();
  });

  it('검색에 실패하면 에러 메시지를 보여 준다', async () => {
    mockedSearchPlaylists.mockRejectedValue(new Error('실패'));
    renderAt('/search?q=아이유');

    expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했어요');
  });

  it('결과 카드를 누르면 재생하고 히스토리에 기록한다', async () => {
    const user = userEvent.setup();
    const [playlist] = createPlaylists('아이유', 1);
    mockedSearchPlaylists.mockResolvedValue(playlist ? [playlist] : []);
    renderAt('/search?q=아이유');

    await user.click(await screen.findByRole('button', { name: /아이유 채널 0/ }));

    expect(usePlayerStore.getState().current).toEqual(playlist);
    expect(useHistoryStore.getState().entries[0]?.playlist).toEqual(playlist);
  });

  it('결과 카드에서 좋아요를 누를 수 있다', async () => {
    mockedSearchPlaylists.mockResolvedValue(createPlaylists('아이유', 1));
    renderAt('/search?q=아이유');

    expect(await screen.findByRole('button', { name: '좋아요' })).toBeInTheDocument();
  });
  describe('정렬', () => {
    it('조회순을 누르면 URL에 정렬이 담기고 조회순으로 다시 불러온다', async () => {
      const user = userEvent.setup();
      mockedSearchPlaylists.mockResolvedValue(createPlaylists('아이유', 1));
      const router = renderAt('/search?q=아이유');
      expect(await screen.findByRole('button', { name: '추천순' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );

      await user.click(screen.getByRole('button', { name: '조회순' }));

      expect(router.state.location.search).toBe(
        `?q=${encodeURIComponent('아이유')}&order=viewCount`,
      );
      expect(mockedSearchPlaylists).toHaveBeenLastCalledWith('아이유 플레이리스트', 'viewCount');
      expect(screen.getByRole('button', { name: '조회순' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('URL에 정렬이 있으면 그 정렬로 검색한다', async () => {
      mockedSearchPlaylists.mockResolvedValue(createPlaylists('아이유', 1));
      renderAt('/search?q=아이유&order=viewCount');

      expect(await screen.findByRole('button', { name: '조회순' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(mockedSearchPlaylists).toHaveBeenCalledWith('아이유 플레이리스트', 'viewCount');
    });

    it('URL의 정렬 값이 이상하면 추천순으로 검색한다', async () => {
      mockedSearchPlaylists.mockResolvedValue(createPlaylists('아이유', 1));
      renderAt('/search?q=아이유&order=date');

      await screen.findByText('아이유 플레이리스트 0');
      expect(mockedSearchPlaylists).toHaveBeenCalledWith('아이유 플레이리스트', 'relevance');
    });

    it('새로 검색하면 추천순으로 돌아간다', async () => {
      const user = userEvent.setup();
      mockedSearchPlaylists.mockResolvedValue(createPlaylists('결과', 1));
      const router = renderAt('/search?q=아이유&order=viewCount');
      const searchbox = await screen.findByRole('searchbox', { name: '검색어' });

      await user.clear(searchbox);
      await user.type(searchbox, '재즈{Enter}');

      expect(router.state.location.search).toBe(`?q=${encodeURIComponent('재즈')}`);
      expect(mockedSearchPlaylists).toHaveBeenLastCalledWith('재즈 플레이리스트', 'relevance');
    });
  });

  describe('다른 페이지에 갔다 돌아왔을 때', () => {
    it('검색하면 마지막 검색어로 기억한다', async () => {
      mockedSearchPlaylists.mockResolvedValue([]);
      renderAt('/search?q=아이유');

      await screen.findByText('검색 결과가 없어요.');
      expect(useLastKeywordStore.getState().lastKeyword).toBe('아이유');
    });

    it('검색어 없이 들어오면 마지막 검색 결과를 보여 준다', async () => {
      useLastKeywordStore.setState({ lastKeyword: '아이유' });
      mockedSearchPlaylists.mockResolvedValue(createPlaylists('아이유', 2));
      const router = renderAt('/search');

      expect(await screen.findByText('아이유 플레이리스트 0')).toBeInTheDocument();
      expect(router.state.location.search).toBe('?q=' + encodeURIComponent('아이유'));
      expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveValue('아이유');
      // 검색어 없는 주소는 방문 기록에 남기지 않는다 (replace)
      expect(router.state.historyAction).toBe('REPLACE');
    });

    it('마지막으로 고른 정렬까지 복원한다', async () => {
      useLastKeywordStore.setState({ lastKeyword: '아이유', lastOrder: 'viewCount' });
      mockedSearchPlaylists.mockResolvedValue(createPlaylists('아이유', 1));
      const router = renderAt('/search');

      expect(await screen.findByText('아이유 플레이리스트 0')).toBeInTheDocument();
      expect(router.state.location.search).toBe(
        `?q=${encodeURIComponent('아이유')}&order=viewCount`,
      );
      expect(mockedSearchPlaylists).toHaveBeenCalledWith('아이유 플레이리스트', 'viewCount');
    });
  });
});
