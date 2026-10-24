import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialHistoryState, useHistoryStore } from '@/entities/history';
import { initialPlayerState, usePlayerStore } from '@/entities/player';
import { searchPlaylists, type Playlist } from '@/entities/playlist';
import { initialMoodSelectionState, useMoodSelectionStore } from '../model/moodSelectionStore';
import { HomePage } from './HomePage';

// 실제 searchPlaylists(0.5초 지연 + 목 데이터) 대신 테스트에서 결과를 직접 정한다.
// usePlaylistSearch가 슬라이스 안에서 이 모듈을 직접 import하므로, public API(index)가 아니라 원본 모듈을 mock한다.
// PlaylistCard 등 나머지는 실제 구현을 그대로 쓴다.
vi.mock('@/entities/playlist/api/searchPlaylists', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/playlist/api/searchPlaylists')>();
  return { ...actual, searchPlaylists: vi.fn() };
});
const mockedSearchPlaylists = vi.mocked(searchPlaylists);

function createPlaylists(prefix: string, count: number): Playlist[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    title: `${prefix} 플레이리스트 ${index}`,
    channelTitle: '채널',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
  }));
}

// 원하는 시점에 직접 resolve할 수 있는 Promise (응답 순서를 조작할 때 쓴다)
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('HomePage', () => {
  beforeEach(() => {
    mockedSearchPlaylists.mockReset();
    localStorage.clear();
    usePlayerStore.setState(initialPlayerState);
    useHistoryStore.setState(initialHistoryState);
    useMoodSelectionStore.setState(initialMoodSelectionState);
  });

  it('처음에는 서브 분위기 목록이 보이지 않는다', () => {
    render(<HomePage />);
    expect(screen.queryByRole('group', { name: '서브 분위기' })).not.toBeInTheDocument();
  });

  it('메인 분위기를 선택하면 해당 서브 분위기 목록이 나타난다', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '신나는' }));

    const subMoodGroup = screen.getByRole('group', { name: '서브 분위기' });
    const labels = within(subMoodGroup)
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(labels).toEqual(['드라이브', '아이돌', '노동요', '기분전환', '내적댄스']);
    expect(screen.getByRole('button', { name: '신나는' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('서브 분위기를 선택하면 로딩 후 플레이리스트를 최대 12개 보여 준다', async () => {
    const user = userEvent.setup();
    mockedSearchPlaylists.mockResolvedValue(createPlaylists('드라이브', 12));
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '신나는' }));
    await user.click(screen.getByRole('button', { name: '드라이브' }));

    expect(mockedSearchPlaylists).toHaveBeenCalledWith('드라이브 노래 플레이리스트');
    expect(await screen.findAllByRole('article')).toHaveLength(12);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('불러오는 중에는 로딩 상태를 보여 준다', async () => {
    const user = userEvent.setup();
    // resolve하지 않은 Promise라서 계속 로딩 상태에 머문다
    mockedSearchPlaylists.mockReturnValue(createDeferred<Playlist[]>().promise);
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '조용한' }));
    await user.click(screen.getByRole('button', { name: '집중' }));

    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중');
  });

  it('불러오기에 실패하면 에러 메시지를 보여 준다', async () => {
    const user = userEvent.setup();
    mockedSearchPlaylists.mockRejectedValue(new Error('network error'));
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '날씨' }));
    await user.click(screen.getByRole('button', { name: '비 오는 날' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했어요');
  });

  it('이전 요청의 응답이 늦게 와도 마지막으로 선택한 분위기의 결과를 보여 준다', async () => {
    const user = userEvent.setup();
    const driveRequest = createDeferred<Playlist[]>();
    const idolRequest = createDeferred<Playlist[]>();
    mockedSearchPlaylists
      .mockReturnValueOnce(driveRequest.promise)
      .mockReturnValueOnce(idolRequest.promise);
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '신나는' }));
    await user.click(screen.getByRole('button', { name: '드라이브' }));
    await user.click(screen.getByRole('button', { name: '아이돌' }));

    // 아이돌 응답이 먼저, 드라이브 응답이 나중에 도착한다
    await act(async () => idolRequest.resolve(createPlaylists('아이돌', 1)));
    await act(async () => driveRequest.resolve(createPlaylists('드라이브', 1)));

    expect(screen.getByText('아이돌 플레이리스트 0')).toBeInTheDocument();
    expect(screen.queryByText('드라이브 플레이리스트 0')).not.toBeInTheDocument();
  });

  it('플레이리스트 카드를 누르면 그 플레이리스트를 재생하고 히스토리에 기록한다', async () => {
    const user = userEvent.setup();
    mockedSearchPlaylists.mockResolvedValue(createPlaylists('드라이브', 3));
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '신나는' }));
    await user.click(screen.getByRole('button', { name: '드라이브' }));
    await user.click(await screen.findByRole('button', { name: /드라이브 플레이리스트 1/ }));

    expect(usePlayerStore.getState().current?.id).toBe('드라이브-1');
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(useHistoryStore.getState().entries[0]?.playlist.id).toBe('드라이브-1');
  });

  it('메인 분위기를 바꾸면 이전 결과가 사라진다', async () => {
    const user = userEvent.setup();
    mockedSearchPlaylists.mockResolvedValue(createPlaylists('드라이브', 3));
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '신나는' }));
    await user.click(screen.getByRole('button', { name: '드라이브' }));
    expect(await screen.findAllByRole('article')).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: '조용한' }));

    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByRole('button', { name: '혼자' })).toBeInTheDocument();
  });

  it('다른 페이지에 갔다 돌아와도 고른 분위기와 결과가 그대로 남아 있다', async () => {
    const user = userEvent.setup();
    mockedSearchPlaylists.mockResolvedValue(createPlaylists('드라이브', 3));
    const { unmount } = render(<HomePage />);
    await user.click(screen.getByRole('button', { name: '신나는' }));
    await user.click(screen.getByRole('button', { name: '드라이브' }));
    expect(await screen.findAllByRole('article')).toHaveLength(3);

    // 다른 페이지로 이동하면 홈 화면이 사라졌다가, 돌아오면 다시 그려진다
    unmount();
    render(<HomePage />);

    expect(screen.getByRole('button', { name: '신나는' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '드라이브' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await screen.findAllByRole('article')).toHaveLength(3);
  });

  describe('홈 빈 상태 안내 문구', () => {
    const GUIDE_TEXT = '분위기를 고르면 어울리는 플레이리스트를 추천해 드려요.';

    it('분위기를 고르기 전이고 기록이 없으면 안내 문구를 보여 준다', () => {
      render(<HomePage />);
      expect(screen.getByText(GUIDE_TEXT)).toBeInTheDocument();
    });

    it('분위기를 고르면 안내 문구가 사라진다', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      await user.click(screen.getByRole('button', { name: '신나는' }));

      expect(screen.queryByText(GUIDE_TEXT)).not.toBeInTheDocument();
    });

    it('기록이 있으면 안내 문구 대신 최근 들은 플레이리스트를 보여 준다', () => {
      useHistoryStore.getState().add(createPlaylists('기록', 1)[0]!);
      render(<HomePage />);

      expect(screen.queryByText(GUIDE_TEXT)).not.toBeInTheDocument();
      expect(screen.getByRole('region', { name: '최근 들은 플레이리스트' })).toBeInTheDocument();
    });
  });

  describe('최근 들은 플레이리스트', () => {
    it('기록이 없으면 섹션을 보여 주지 않는다', () => {
      render(<HomePage />);
      expect(
        screen.queryByRole('region', { name: '최근 들은 플레이리스트' }),
      ).not.toBeInTheDocument();
    });

    it('최근 들은 플레이리스트를 최대 4개 보여 준다', () => {
      for (const playlist of createPlaylists('기록', 5)) {
        useHistoryStore.getState().add(playlist);
      }

      render(<HomePage />);

      const section = screen.getByRole('region', { name: '최근 들은 플레이리스트' });
      const titles = within(section)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent);
      // 가장 최근에 들은 기록 4부터 4개
      expect(titles).toEqual([
        '기록 플레이리스트 4',
        '기록 플레이리스트 3',
        '기록 플레이리스트 2',
        '기록 플레이리스트 1',
      ]);
    });

    it('분위기를 고르면 최근 들은 플레이리스트가 사라진다', async () => {
      const user = userEvent.setup();
      useHistoryStore.getState().add(createPlaylists('기록', 1)[0]!);
      render(<HomePage />);
      expect(screen.getByRole('region', { name: '최근 들은 플레이리스트' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '신나는' }));

      expect(
        screen.queryByRole('region', { name: '최근 들은 플레이리스트' }),
      ).not.toBeInTheDocument();
    });

    it('최근 들은 카드를 누르면 다시 재생한다', async () => {
      const user = userEvent.setup();
      useHistoryStore.getState().add(createPlaylists('기록', 1)[0]!);
      render(<HomePage />);

      const section = screen.getByRole('region', { name: '최근 들은 플레이리스트' });
      await user.click(within(section).getByRole('button', { name: /기록 플레이리스트 0/ }));

      expect(usePlayerStore.getState().current?.id).toBe('기록-0');
    });
  });
});
