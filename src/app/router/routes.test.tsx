import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialPlayerState, usePlayerStore } from '@/entities/player';
import { createYouTubePlayer, type YouTubePlayer } from '@/shared/lib/youtube-player';
import { routes } from './routes';

// 실제 YouTube 스크립트 대신 가짜 플레이어를 쓴다
vi.mock('@/shared/lib/youtube-player', () => ({ createYouTubePlayer: vi.fn() }));
const mockedCreateYouTubePlayer = vi.mocked(createYouTubePlayer);

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
    mockedCreateYouTubePlayer.mockReset();
  });

  it.each([
    ['/', '오늘은 어떤 분위기인가요?'],
    ['/search?q=드라이브', '검색 결과'],
    ['/my', '내 플레이리스트'],
  ])('%s 경로에서 "%s" 페이지를 렌더링한다', (path, title) => {
    renderAt(path);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it('모든 페이지에 헤더가 표시된다', () => {
    renderAt('/my');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'JUNPLAYLIST' })).toBeInTheDocument();
  });

  it('헤더의 "MYPLAYLIST" 링크를 누르면 /my로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/');

    await user.click(screen.getByRole('link', { name: 'MYPLAYLIST' }));

    expect(router.state.location.pathname).toBe('/my');
    expect(screen.getByRole('heading', { name: '내 플레이리스트' })).toBeInTheDocument();
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
});
