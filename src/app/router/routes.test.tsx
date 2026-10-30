import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialPlayerState, usePlayerStore } from '@/entities/player';
import { initialLastKeywordState, useLastKeywordStore } from '@/pages/search';
import { fetchTimeline } from '@/entities/timeline';
import { createYouTubePlayer, type YouTubePlayer } from '@/shared/lib/youtube-player';
import { routes } from './routes';

// 실제 YouTube 스크립트 대신 가짜 플레이어를 쓴다
vi.mock('@/shared/lib/youtube-player', () => ({ createYouTubePlayer: vi.fn() }));
const mockedCreateYouTubePlayer = vi.mocked(createYouTubePlayer);
// 실제 /api/video를 호출하지 않는다
vi.mock('@/entities/timeline', () => ({ fetchTimeline: vi.fn() }));
vi.mocked(fetchTimeline).mockResolvedValue([]);
// 실제 /api/search를 호출하지 않는다 (검색 페이지가 URL의 검색어로 바로 검색한다)
vi.mock('@/entities/playlist/api/searchPlaylists', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/playlist/api/searchPlaylists')>();
  return { ...actual, searchPlaylists: vi.fn().mockResolvedValue([]) };
});

// 주어진 경로에서 시작하는 메모리 라우터로 앱을 렌더링한다
function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('routes', () => {
  beforeEach(() => {
    localStorage.clear();
    usePlayerStore.setState(initialPlayerState);
    useLastKeywordStore.setState(initialLastKeywordState);
    mockedCreateYouTubePlayer.mockReset();
  });

  it.each([
    ['/', '오늘은 어떤 분위기인가요?'],
    ['/search?q=드라이브', '검색 결과'],
    ['/history', '최근 들은 플레이리스트'],
    ['/my', '내 플레이리스트'],
    ['/songs', '내 곡'],
  ])('%s 경로에서 "%s" 페이지를 렌더링한다', (path, title) => {
    renderAt(path);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it.each([
    ['/', 'JUNPLAYLIST | 분위기 따라 듣는 플레이리스트'],
    ['/search?q=드라이브', '검색 | JUNPLAYLIST'],
    ['/history', '최근 들은 플레이리스트 | JUNPLAYLIST'],
    ['/my', '내 플레이리스트 | JUNPLAYLIST'],
    ['/songs', '내 곡 | JUNPLAYLIST'],
  ])('%s 경로의 브라우저 탭 제목은 "%s"이다', (path, title) => {
    renderAt(path);
    expect(document.title).toBe(title);
  });

  it('페이지를 이동하면 탭 제목도 바뀐다', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByRole('link', { name: 'MYPLAYLIST' }));

    expect(document.title).toBe('내 플레이리스트 | JUNPLAYLIST');
  });

  it('모든 페이지에 헤더가 표시된다', () => {
    renderAt('/my');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'JUNPLAYLIST' })).toBeInTheDocument();
  });

  it('헤더의 검색 아이콘을 누르면 검색 페이지로 이동하고 검색창에 포커스가 간다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/');

    await user.click(screen.getByRole('link', { name: '검색' }));

    expect(router.state.location.pathname).toBe('/search');
    expect(screen.getByRole('searchbox', { name: '검색어' })).toHaveFocus();
  });

  it('헤더의 "MYPLAYLIST" 링크를 누르면 /my로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/');

    await user.click(screen.getByRole('link', { name: 'MYPLAYLIST' }));

    expect(router.state.location.pathname).toBe('/my');
    expect(screen.getByRole('heading', { name: '내 플레이리스트' })).toBeInTheDocument();
  });

  it('헤더의 "HISTORY" 링크를 누르면 /history로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/');

    await user.click(screen.getByRole('link', { name: 'HISTORY' }));

    expect(router.state.location.pathname).toBe('/history');
  });

  it('헤더의 "MEMORY" 링크를 누르면 /songs로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/');

    await user.click(screen.getByRole('link', { name: 'MEMORY' }));

    expect(router.state.location.pathname).toBe('/songs');
    expect(screen.getByRole('heading', { name: '내 곡' })).toBeInTheDocument();
  });

  it('로고를 누르면 홈으로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/my');

    await user.click(screen.getByRole('link', { name: 'JUNPLAYLIST' }));

    expect(router.state.location.pathname).toBe('/');
  });

  it('페이지를 이동해도 플레이어가 그대로 유지된다', async () => {
    const user = userEvent.setup();
    const fakePlayer: YouTubePlayer = {
      load: vi.fn(),
      cue: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      seekTo: vi.fn(),
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 0),
      setVolume: vi.fn(),
      mute: vi.fn(),
      unMute: vi.fn(),
      destroy: vi.fn(),
    };
    mockedCreateYouTubePlayer.mockResolvedValue(fakePlayer);
    renderAt('/');
    act(() =>
      usePlayerStore.getState().play({
        id: 'VID1',
        title: '공부할 때 듣는 플레이리스트',
        channelTitle: '채널',
        thumbnailUrl: 'https://i.ytimg.com/vi/VID1/hqdefault.jpg',
      }),
    );
    await waitFor(() => expect(fakePlayer.load).toHaveBeenCalledWith('VID1'));

    await user.click(screen.getByRole('link', { name: 'MYPLAYLIST' }));

    expect(screen.getByRole('heading', { name: '내 플레이리스트' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '플레이어' })).toBeInTheDocument();
    // 플레이어를 새로 만들거나 정리하지 않았으므로 재생이 끊기지 않는다
    expect(mockedCreateYouTubePlayer).toHaveBeenCalledTimes(1);
    expect(fakePlayer.destroy).not.toHaveBeenCalled();
  });

  it('영상을 크게 보는 중에 다른 페이지로 이동하면 작게 돌아간다', async () => {
    const user = userEvent.setup();
    renderAt('/');
    act(() => usePlayerStore.getState().setExpanded(true));

    await user.click(screen.getByRole('link', { name: 'MYPLAYLIST' }));

    expect(usePlayerStore.getState().isExpanded).toBe(false);
  });

  it('처음 열 때는 크게 보기 상태를 건드리지 않는다', () => {
    usePlayerStore.setState({ isExpanded: true });

    renderAt('/');

    expect(usePlayerStore.getState().isExpanded).toBe(true);
  });
});
