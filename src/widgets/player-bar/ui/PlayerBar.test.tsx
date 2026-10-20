import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialHistoryState, useHistoryStore } from '@/entities/history';
import { initialPlayerState, usePlayerStore, type PlayerItem } from '@/entities/player';
import { fetchTimeline } from '@/entities/timeline';
import {
  createYouTubePlayer,
  type YouTubePlayer,
  type YouTubePlayerEvents,
} from '@/shared/lib/youtube-player';
import { PROGRESS_POLL_MS } from '../model/useYouTubePlayer';
import { PlayerBar } from './PlayerBar';

// 실제 YouTube 스크립트를 불러오지 않고, 호출 기록만 남기는 가짜 플레이어를 돌려준다
vi.mock('@/shared/lib/youtube-player', () => ({ createYouTubePlayer: vi.fn() }));
const mockedCreateYouTubePlayer = vi.mocked(createYouTubePlayer);

// 실제 /api/video를 호출하지 않고 타임라인을 테스트에서 직접 정한다
vi.mock('@/entities/timeline', () => ({ fetchTimeline: vi.fn() }));
const mockedFetchTimeline = vi.mocked(fetchTimeline);

function createFakePlayer(): YouTubePlayer {
  return {
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
}

function createItem(id: string): PlayerItem {
  return {
    id,
    title: `${id} 플레이리스트`,
    channelTitle: `${id} 채널`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

describe('PlayerBar', () => {
  let fakePlayer: YouTubePlayer;
  // 가짜 플레이어에 넘겨진 이벤트 콜백. 실제 플레이어의 상태 변화를 흉내 낼 때 쓴다
  let playerEvents: YouTubePlayerEvents | undefined;

  beforeEach(() => {
    localStorage.clear();
    usePlayerStore.setState(initialPlayerState);
    fakePlayer = createFakePlayer();
    playerEvents = undefined;
    mockedCreateYouTubePlayer.mockReset();
    mockedCreateYouTubePlayer.mockImplementation(async (_container, events) => {
      playerEvents = events;
      return fakePlayer;
    });
    mockedFetchTimeline.mockReset();
    mockedFetchTimeline.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 플레이어 바를 띄우고, 가짜 플레이어가 준비되어 영상을 불러올 때까지 기다린다
  async function renderPlaying(item = createItem('VID1')) {
    const result = render(<PlayerBar />);
    act(() => usePlayerStore.getState().play(item));
    await waitFor(() => expect(fakePlayer.load).toHaveBeenCalledWith(item.id));
    return result;
  }

  describe('재생 전', () => {
    it('안내 문구를 보여 주고 재생 관련 조작은 비활성화한다', () => {
      render(<PlayerBar />);

      expect(screen.getByRole('region', { name: '플레이어' })).toBeInTheDocument();
      expect(screen.getByText('플레이리스트를 골라 주세요')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '재생' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '반복' })).toBeDisabled();
      expect(screen.getByRole('slider', { name: '재생 위치' })).toBeDisabled();
    });

    it('볼륨과 음소거는 조절할 수 있다', async () => {
      const user = userEvent.setup();
      render(<PlayerBar />);

      await user.click(screen.getByRole('button', { name: '음소거' }));

      expect(usePlayerStore.getState().isMuted).toBe(true);
      expect(screen.getByRole('slider', { name: '볼륨' })).toBeEnabled();
    });

    it('YouTube 플레이어를 만들지 않는다', () => {
      render(<PlayerBar />);
      expect(mockedCreateYouTubePlayer).not.toHaveBeenCalled();
    });
  });

  it('플레이리스트를 고르면 영상을 불러오고 제목과 채널명을 보여 준다', async () => {
    await renderPlaying();

    expect(screen.getByText('VID1 플레이리스트')).toBeInTheDocument();
    expect(screen.getByText('VID1 채널')).toBeInTheDocument();
    expect(screen.queryByText('플레이리스트를 골라 주세요')).not.toBeInTheDocument();
  });

  it('일시정지와 재생 버튼으로 플레이어를 조작한다', async () => {
    const user = userEvent.setup();
    await renderPlaying();

    await user.click(screen.getByRole('button', { name: '일시정지' }));
    expect(fakePlayer.pause).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '재생' }));
    expect(fakePlayer.play).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '일시정지' })).toBeInTheDocument();
  });

  it('영상 안에서 일시정지되면 버튼이 재생 버튼으로 바뀐다', async () => {
    await renderPlaying();

    act(() => playerEvents?.onStateChange('paused'));

    expect(screen.getByRole('button', { name: '재생' })).toBeInTheDocument();
  });

  it('음소거 버튼으로 음소거를 켜고 끈다', async () => {
    const user = userEvent.setup();
    await renderPlaying();

    await user.click(screen.getByRole('button', { name: '음소거' }));
    expect(fakePlayer.mute).toHaveBeenCalled();
    expect(screen.getByRole('slider', { name: '볼륨' })).toHaveValue('0');

    await user.click(screen.getByRole('button', { name: '음소거 해제' }));
    expect(fakePlayer.unMute).toHaveBeenCalled();
  });

  it('볼륨 슬라이더를 움직이면 플레이어 볼륨이 바뀐다', async () => {
    await renderPlaying();

    // 슬라이더 드래그는 user-event로 흉내 낼 수 없어서 change 이벤트를 직접 보낸다
    fireEvent.change(screen.getByRole('slider', { name: '볼륨' }), { target: { value: '30' } });

    expect(fakePlayer.setVolume).toHaveBeenLastCalledWith(30);
    expect(usePlayerStore.getState().volume).toBe(30);
  });

  it('다른 플레이리스트를 고르면 플레이어를 새로 만들지 않고 영상만 바꾼다', async () => {
    await renderPlaying();

    act(() => usePlayerStore.getState().play(createItem('VID2')));

    expect(fakePlayer.load).toHaveBeenLastCalledWith('VID2');
    expect(screen.getByText('VID2 플레이리스트')).toBeInTheDocument();
    expect(mockedCreateYouTubePlayer).toHaveBeenCalledTimes(1);
  });

  it('화면에서 사라지면 플레이어를 정리한다', async () => {
    const { unmount } = await renderPlaying();

    unmount();

    expect(fakePlayer.destroy).toHaveBeenCalled();
  });

  describe('진행 바', () => {
    it('현재 시간과 전체 길이를 주기적으로 읽어 표시한다', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(fakePlayer.getCurrentTime).mockReturnValue(65);
      vi.mocked(fakePlayer.getDuration).mockReturnValue(3750);
      await renderPlaying();

      act(() => vi.advanceTimersByTime(PROGRESS_POLL_MS));

      expect(screen.getByText('1:05')).toBeInTheDocument();
      expect(screen.getByText('1:02:30')).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: '재생 위치' })).toHaveValue('65');
    });

    it('진행 바를 움직이면 그 위치로 이동한다', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(fakePlayer.getDuration).mockReturnValue(600);
      await renderPlaying();
      act(() => vi.advanceTimersByTime(PROGRESS_POLL_MS));

      fireEvent.change(screen.getByRole('slider', { name: '재생 위치' }), {
        target: { value: '120' },
      });

      expect(fakePlayer.seekTo).toHaveBeenCalledWith(120);
      expect(screen.getByText('2:00')).toBeInTheDocument();
    });
  });

  describe('반복', () => {
    it('반복이 켜져 있으면 영상이 끝났을 때 처음부터 다시 재생한다', async () => {
      const user = userEvent.setup();
      await renderPlaying();

      await user.click(screen.getByRole('button', { name: '반복' }));
      expect(screen.getByRole('button', { name: '반복' })).toHaveAttribute('aria-pressed', 'true');
      act(() => playerEvents?.onStateChange('ended'));

      expect(fakePlayer.seekTo).toHaveBeenCalledWith(0);
      expect(fakePlayer.play).toHaveBeenCalled();
      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });

    it('반복이 꺼져 있으면 영상이 끝났을 때 멈춘 상태가 된다', async () => {
      await renderPlaying();

      act(() => playerEvents?.onStateChange('ended'));

      expect(fakePlayer.seekTo).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: '재생' })).toBeInTheDocument();
    });
  });

  describe('에러', () => {
    it('재생할 수 없는 영상이면 에러 메시지를 보여 주고, 다른 영상을 고르면 사라진다', async () => {
      await renderPlaying();

      act(() => playerEvents?.onError(150));

      expect(screen.getByRole('alert')).toHaveTextContent('재생할 수 없는 영상이에요');
      expect(usePlayerStore.getState().isPlaying).toBe(false);

      act(() => usePlayerStore.getState().play(createItem('VID2')));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('플레이어 스크립트를 불러오지 못하면 에러 메시지를 보여 준다', async () => {
      mockedCreateYouTubePlayer.mockRejectedValue(new Error('script error'));
      render(<PlayerBar />);

      act(() => usePlayerStore.getState().play(createItem('VID1')));

      expect(await screen.findByRole('alert')).toHaveTextContent('플레이어를 불러오지 못했어요');
    });
  });

  describe('스페이스바', () => {
    it('페이지에서 스페이스바를 누르면 재생/일시정지가 바뀌고 스크롤되지 않는다', async () => {
      await renderPlaying();

      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      act(() => document.body.dispatchEvent(event));

      expect(usePlayerStore.getState().isPlaying).toBe(false);
      expect(event.defaultPrevented).toBe(true);

      act(() => {
        document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
      });
      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });

    it('입력창에 입력 중이면 동작하지 않는다', async () => {
      const user = userEvent.setup();
      await renderPlaying();
      const input = document.createElement('input');
      document.body.append(input);

      await user.type(input, ' ');

      expect(usePlayerStore.getState().isPlaying).toBe(true);
      expect(input).toHaveValue(' ');
      input.remove();
    });

    it('버튼에 포커스가 있으면 그 버튼만 눌리고 재생 상태를 따로 바꾸지 않는다', async () => {
      const user = userEvent.setup();
      await renderPlaying();

      // 음소거 버튼에 포커스를 두고 스페이스바를 누른다
      screen.getByRole('button', { name: '음소거' }).focus();
      await user.keyboard(' ');

      expect(usePlayerStore.getState().isMuted).toBe(true);
      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });

    it('재생할 항목이 없으면 아무 일도 하지 않는다', () => {
      render(<PlayerBar />);

      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        bubbles: true,
        cancelable: true,
      });
      act(() => document.body.dispatchEvent(event));

      expect(usePlayerStore.getState().isPlaying).toBe(false);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('영상 보기', () => {
    it('재생 전에는 영상 보기 버튼이 비활성화된다', () => {
      render(<PlayerBar />);
      expect(screen.getByRole('button', { name: '영상 크게 보기' })).toBeDisabled();
    });

    it('버튼을 누를 때마다 영상을 크게 펼치고 다시 작게 접는다', async () => {
      const user = userEvent.setup();
      await renderPlaying();
      const expandButton = screen.getByRole('button', { name: '영상 크게 보기' });

      await user.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-pressed', 'true');
      expect(usePlayerStore.getState().isExpanded).toBe(true);

      await user.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-pressed', 'false');
      expect(usePlayerStore.getState().isExpanded).toBe(false);
    });

    it('펼친 상태에서 Esc를 누르면 작게 돌아간다', async () => {
      const user = userEvent.setup();
      await renderPlaying();
      await user.click(screen.getByRole('button', { name: '영상 크게 보기' }));

      await user.keyboard('{Escape}');

      expect(usePlayerStore.getState().isExpanded).toBe(false);
    });

    it('펼치거나 접어도 플레이어를 새로 만들거나 정리하지 않아 재생이 끊기지 않는다', async () => {
      const user = userEvent.setup();
      await renderPlaying();
      const expandButton = screen.getByRole('button', { name: '영상 크게 보기' });

      await user.click(expandButton);
      await user.click(expandButton);

      expect(mockedCreateYouTubePlayer).toHaveBeenCalledTimes(1);
      expect(fakePlayer.destroy).not.toHaveBeenCalled();
      expect(fakePlayer.pause).not.toHaveBeenCalled();
    });
  });

  describe('타임라인', () => {
    const timeline = [
      { seconds: 0, label: '곡1 - 가수A' },
      { seconds: 200, label: '곡2 - 가수B' },
      { seconds: 400, label: '곡3 - 가수C' },
    ];

    // 재생 위치를 정해 두고, 진행 시간을 한 번 읽게 한다
    async function renderAt(currentTime: number) {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(fakePlayer.getCurrentTime).mockReturnValue(currentTime);
      vi.mocked(fakePlayer.getDuration).mockReturnValue(600);
      await renderPlaying();
      act(() => vi.advanceTimersByTime(PROGRESS_POLL_MS));
    }

    it('재생 중인 영상의 타임라인을 요청한다', async () => {
      await renderPlaying();
      expect(mockedFetchTimeline).toHaveBeenCalledWith('VID1');
    });

    it('작은 상태에서는 플레이어 바에 지금 구간의 곡 정보를 보여 준다', async () => {
      mockedFetchTimeline.mockResolvedValue(timeline);
      await renderAt(250);

      expect(await screen.findByText('곡2 - 가수B')).toBeInTheDocument();
      expect(screen.queryByText('VID1 채널')).not.toBeInTheDocument();
    });

    it('타임라인 버튼으로 목록 패널을 열고, 지금 구간을 강조한다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockedFetchTimeline.mockResolvedValue(timeline);
      await renderAt(250);

      await user.click(screen.getByRole('button', { name: '타임라인' }));

      const list = await screen.findByRole('list', { name: '타임라인' });
      expect(within(list).getAllByRole('button')).toHaveLength(3);
      expect(within(list).getByRole('button', { name: /곡2/ })).toHaveAttribute(
        'aria-current',
        'true',
      );
      expect(within(list).getByRole('button', { name: /곡1/ })).not.toHaveAttribute('aria-current');
    });

    it('타임라인 항목을 누르면 같은 영상 안에서 그 시간으로 이동한다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockedFetchTimeline.mockResolvedValue(timeline);
      await renderAt(250);
      await user.click(screen.getByRole('button', { name: '타임라인' }));

      await user.click(await screen.findByRole('button', { name: /곡3/ }));

      expect(fakePlayer.seekTo).toHaveBeenCalledWith(400);
      expect(fakePlayer.load).toHaveBeenCalledTimes(1);
    });

    it('타임라인 버튼을 다시 누르거나 Esc를 누르면 패널이 닫힌다', async () => {
      const user = userEvent.setup();
      await renderPlaying();
      const timelineButton = screen.getByRole('button', { name: '타임라인' });

      await user.click(timelineButton);
      expect(screen.getByRole('complementary', { name: '타임라인 목록' })).toBeInTheDocument();
      await user.click(timelineButton);
      expect(
        screen.queryByRole('complementary', { name: '타임라인 목록' }),
      ).not.toBeInTheDocument();

      await user.click(timelineButton);
      await user.keyboard('{Escape}');
      expect(
        screen.queryByRole('complementary', { name: '타임라인 목록' }),
      ).not.toBeInTheDocument();
    });

    it('설명란에 타임스탬프가 없으면 안내 문구를 보여 준다', async () => {
      const user = userEvent.setup();
      await renderPlaying();

      await user.click(screen.getByRole('button', { name: '타임라인' }));

      expect(await screen.findByText('타임라인 정보가 없어요')).toBeInTheDocument();
    });

    it('타임라인을 불러오지 못하면 안내 문구를 보여 준다', async () => {
      const user = userEvent.setup();
      mockedFetchTimeline.mockRejectedValue(new Error('network error'));
      await renderPlaying();

      await user.click(screen.getByRole('button', { name: '타임라인' }));

      expect(await screen.findByText('타임라인을 불러오지 못했어요.')).toBeInTheDocument();
    });

    it('펼친 상태에서는 버튼 없이 영상 옆에 목록이 보이고, 타임라인 버튼은 비활성화된다', async () => {
      const user = userEvent.setup();
      mockedFetchTimeline.mockResolvedValue(timeline);
      await renderPlaying();

      await user.click(screen.getByRole('button', { name: '영상 크게 보기' }));

      expect(await screen.findByRole('list', { name: '타임라인' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '타임라인' })).toBeDisabled();
    });

    it('패널이 열린 채로 영상을 펼쳤다 접으면 패널은 닫혀 있다', async () => {
      const user = userEvent.setup();
      await renderPlaying();
      const expandButton = screen.getByRole('button', { name: '영상 크게 보기' });

      await user.click(screen.getByRole('button', { name: '타임라인' }));
      await user.click(expandButton);
      await user.click(expandButton);

      expect(
        screen.queryByRole('complementary', { name: '타임라인 목록' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('이전/다음', () => {
    beforeEach(() => {
      useHistoryStore.setState(initialHistoryState);
    });

    it('재생 전에는 이전/다음 버튼이 비활성화된다', () => {
      render(<PlayerBar />);

      expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    });

    it('들었던 플레이리스트 사이를 오가며 영상을 바꾸고, 처음과 끝에서는 버튼이 비활성화된다', async () => {
      const user = userEvent.setup();
      await renderPlaying(createItem('VID1'));
      act(() => usePlayerStore.getState().play(createItem('VID2')));
      await waitFor(() => expect(fakePlayer.load).toHaveBeenCalledWith('VID2'));
      expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

      await user.click(screen.getByRole('button', { name: '이전' }));

      await waitFor(() => expect(fakePlayer.load).toHaveBeenLastCalledWith('VID1'));
      expect(screen.getByText('VID1 플레이리스트')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
      expect(useHistoryStore.getState().entries[0]?.playlist.id).toBe('VID1');

      await user.click(screen.getByRole('button', { name: '다음' }));

      await waitFor(() => expect(fakePlayer.load).toHaveBeenLastCalledWith('VID2'));
      expect(screen.getByText('VID2 플레이리스트')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '이전' })).toBeEnabled();
    });
  });
});
