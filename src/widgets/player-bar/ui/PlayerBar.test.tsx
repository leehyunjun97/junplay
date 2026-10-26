import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialHistoryState, useHistoryStore } from '@/entities/history';
import { initialLikeState, useLikeStore } from '@/entities/like';
import { initialPlayerState, usePlayerStore, type PlayerItem } from '@/entities/player';
import { initialSavedSongState, useSavedSongStore } from '@/entities/saved-song';
import { fetchTimeline } from '@/entities/timeline';
import { TOAST_DURATION_MS } from '@/shared/lib/toast';
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

    it('타임라인을 불러오는 동안 목록 자리에 스켈레톤을 보여 주고, 도착하면 목록으로 바뀐다', async () => {
      const user = userEvent.setup();
      let resolveTimeline!: (items: typeof timeline) => void;
      mockedFetchTimeline.mockReturnValue(new Promise((resolve) => (resolveTimeline = resolve)));
      await renderPlaying();

      await user.click(screen.getByRole('button', { name: '타임라인' }));

      const panel = screen.getByRole('complementary', { name: '타임라인 목록' });
      expect(within(panel).getByRole('status')).toHaveTextContent('타임라인을 불러오는 중');
      expect(within(panel).getByTestId('timeline-skeleton')).toBeInTheDocument();

      await act(async () => resolveTimeline(timeline));

      expect(within(panel).getByRole('list', { name: '타임라인' })).toBeInTheDocument();
      expect(within(panel).queryByTestId('timeline-skeleton')).not.toBeInTheDocument();
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
      // 각 행에는 담기 버튼도 있으므로, 곡 이름이 붙은 시간 이동 버튼만 센다
      expect(within(list).getAllByRole('button', { name: /곡\d/ })).toHaveLength(3);
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

  describe('이어 듣기', () => {
    // 다시 접속했을 때처럼, 저장소에서 복원된 상태(마지막 항목과 위치, 멈춤)로 시작한다
    function restore() {
      usePlayerStore.setState({
        current: createItem('VID1'),
        savedProgress: { currentTime: 65, duration: 3750 },
        isPlaying: false,
      });
    }

    it('저장된 위치에 영상을 맞춰 두고 자동 재생하지 않는다', async () => {
      restore();
      render(<PlayerBar />);

      await waitFor(() => expect(fakePlayer.cue).toHaveBeenCalledWith('VID1', 65));
      expect(fakePlayer.load).not.toHaveBeenCalled();
      expect(fakePlayer.play).not.toHaveBeenCalled();
      expect(screen.getByText('VID1 플레이리스트')).toBeInTheDocument();
      expect(screen.getByText('1:05')).toBeInTheDocument();
      expect(screen.getByText('1:02:30')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '재생' })).toBeInTheDocument();
    });

    it('재생 버튼을 누르면 맞춰 둔 위치부터 재생한다', async () => {
      const user = userEvent.setup();
      restore();
      render(<PlayerBar />);
      await waitFor(() => expect(fakePlayer.cue).toHaveBeenCalled());

      await user.click(screen.getByRole('button', { name: '재생' }));

      expect(fakePlayer.play).toHaveBeenCalled();
      expect(fakePlayer.load).not.toHaveBeenCalled();
    });

    it('멈춘 동안에는 플레이어 위치를 읽지 않아 저장된 위치가 덮어써지지 않는다', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      restore();
      render(<PlayerBar />);
      await waitFor(() => expect(fakePlayer.cue).toHaveBeenCalled());

      // cue 상태의 플레이어는 0초를 돌려준다
      act(() => vi.advanceTimersByTime(PROGRESS_POLL_MS * 4));

      expect(usePlayerStore.getState().savedProgress).toEqual({ currentTime: 65, duration: 3750 });
      expect(screen.getByText('1:05')).toBeInTheDocument();
    });

    it('재생 중에는 위치를 저장한다', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(fakePlayer.getCurrentTime).mockReturnValue(65);
      vi.mocked(fakePlayer.getDuration).mockReturnValue(3750);
      await renderPlaying();

      act(() => vi.advanceTimersByTime(PROGRESS_POLL_MS));

      expect(usePlayerStore.getState().savedProgress).toEqual({ currentTime: 65, duration: 3750 });
    });

    it('멈춘 상태에서 진행 바로 옮긴 위치도 저장한다', async () => {
      restore();
      render(<PlayerBar />);
      await waitFor(() => expect(fakePlayer.cue).toHaveBeenCalled());

      fireEvent.change(screen.getByRole('slider', { name: '재생 위치' }), {
        target: { value: '120' },
      });

      expect(fakePlayer.seekTo).toHaveBeenCalledWith(120);
      expect(usePlayerStore.getState().savedProgress).toEqual({ currentTime: 120, duration: 3750 });
    });
  });

  describe('좋아요', () => {
    beforeEach(() => {
      useLikeStore.setState(initialLikeState);
    });

    it('재생 전에는 좋아요 버튼이 비활성화된다', () => {
      render(<PlayerBar />);

      expect(screen.getByRole('button', { name: '좋아요' })).toBeDisabled();
    });

    it('재생 중인 플레이리스트에 좋아요를 추가하고 해제한다', async () => {
      const user = userEvent.setup();
      await renderPlaying(createItem('VID1'));
      const button = screen.getByRole('button', { name: '좋아요' });

      await user.click(button);

      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(useLikeStore.getState().items).toEqual([createItem('VID1')]);

      await user.click(button);

      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(useLikeStore.getState().items).toEqual([]);
    });

    it('이미 좋아요한 플레이리스트를 재생하면 눌린 상태로 보인다', async () => {
      useLikeStore.setState({ items: [createItem('VID1')] });
      await renderPlaying(createItem('VID1'));

      expect(screen.getByRole('button', { name: '좋아요' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  });

  describe('곡 담기', () => {
    const timeline = [
      { seconds: 0, label: '곡1 - 가수A' },
      { seconds: 200, label: '곡2 - 가수B' },
      { seconds: 400, label: '곡3 - 가수C' },
    ];

    beforeEach(() => {
      useSavedSongStore.setState(initialSavedSongState);
    });

    // 재생 위치를 정해 두고, 진행 시간을 한 번 읽게 한다
    async function renderAt(currentTime: number) {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(fakePlayer.getCurrentTime).mockReturnValue(currentTime);
      vi.mocked(fakePlayer.getDuration).mockReturnValue(600);
      await renderPlaying();
      act(() => vi.advanceTimersByTime(PROGRESS_POLL_MS));
    }

    // 작은 상태의 타임라인 패널을 열고, n번째 곡 행의 담기 버튼을 돌려준다
    async function openPanelAndGetSaveButton(user: ReturnType<typeof userEvent.setup>, n: number) {
      await user.click(screen.getByRole('button', { name: '타임라인' }));
      const list = await screen.findByRole('list', { name: '타임라인' });
      const row = within(list).getAllByRole('listitem')[n];
      return within(row).getByRole('button', { name: '내 곡에 담기' });
    }

    it('플레이어 바에는 담기 버튼이 없다', async () => {
      await renderAt(250);

      expect(screen.queryByRole('button', { name: '내 곡에 담기' })).not.toBeInTheDocument();
    });

    it('타임라인 목록의 담기 버튼은 그 곡을 담고, 재생 위치는 옮기지 않는다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockedFetchTimeline.mockResolvedValue(timeline);
      await renderAt(250);

      await user.click(await openPanelAndGetSaveButton(user, 2));

      expect(screen.getByRole('status')).toHaveTextContent('내 곡에 담았어요');
      expect(useSavedSongStore.getState().songs).toMatchObject([
        { id: 'VID1-400', seconds: 400, title: '곡3 - 가수C', playlist: createItem('VID1') },
      ]);
      expect(fakePlayer.seekTo).not.toHaveBeenCalled();
    });

    it('같은 곡을 다시 담으면 저장하지 않고 이미 담은 곡이라고 알린다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockedFetchTimeline.mockResolvedValue(timeline);
      await renderAt(250);
      const button = await openPanelAndGetSaveButton(user, 1);

      await user.click(button);
      await user.click(button);

      expect(screen.getByRole('status')).toHaveTextContent('이미 담은 곡이에요');
      expect(useSavedSongStore.getState().songs).toHaveLength(1);
    });

    it('펼친 상태의 옆 목록에서도 담을 수 있다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockedFetchTimeline.mockResolvedValue(timeline);
      await renderAt(250);
      await user.click(screen.getByRole('button', { name: '영상 크게 보기' }));

      const list = await screen.findByRole('list', { name: '타임라인' });
      const row = within(list).getAllByRole('listitem')[0];
      await user.click(within(row).getByRole('button', { name: '내 곡에 담기' }));

      expect(useSavedSongStore.getState().songs).toMatchObject([{ id: 'VID1-0' }]);
    });

    it('토스트는 몇 초 뒤 사라진다', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockedFetchTimeline.mockResolvedValue(timeline);
      await renderAt(250);
      await user.click(await openPanelAndGetSaveButton(user, 0));
      expect(screen.getByRole('status')).toHaveTextContent('내 곡에 담았어요');

      act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));

      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    describe('타임라인이 없을 때', () => {
      it('현재 위치부터 재생되는 YouTube 영상 페이지 링크를 새 탭으로 보여 준다', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        await renderAt(65.7);
        await user.click(screen.getByRole('button', { name: '타임라인' }));

        const link = await screen.findByRole('link', { name: 'YouTube에서 곡 정보 찾기' });

        expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=VID1&t=65s');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });

      it('링크를 누르면 소리가 겹치지 않도록 우리 플레이어를 멈춘다', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        await renderAt(10);
        await user.click(screen.getByRole('button', { name: '타임라인' }));
        const link = await screen.findByRole('link', { name: 'YouTube에서 곡 정보 찾기' });
        // jsdom은 새 탭을 열 수 없으므로 이동은 막고 클릭 처리만 확인한다
        link.addEventListener('click', (event) => event.preventDefault());

        await user.click(link);

        expect(usePlayerStore.getState().isPlaying).toBe(false);
        expect(fakePlayer.pause).toHaveBeenCalled();
      });
    });
  });

  describe('재생 중 영상 교체', () => {
    // 재생 중에 다른 영상으로 바꾼다
    async function switchWhilePlaying() {
      await renderPlaying(createItem('VID1'));
      act(() => playerEvents?.onStateChange('playing'));
      act(() => usePlayerStore.getState().play(createItem('VID2')));
      await waitFor(() => expect(fakePlayer.load).toHaveBeenLastCalledWith('VID2'));
      vi.mocked(fakePlayer.pause).mockClear();
    }

    it('교체 중에 온 이전 영상의 일시정지 이벤트로 새 영상을 멈추지 않는다', async () => {
      await switchWhilePlaying();

      // 실제 YouTube가 보내는 순서: 이전 영상 paused → 새 영상 unstarted → buffering
      act(() => playerEvents?.onStateChange('paused'));
      act(() => playerEvents?.onStateChange('unstarted'));
      act(() => playerEvents?.onStateChange('buffering'));

      expect(usePlayerStore.getState().isPlaying).toBe(true);
      expect(fakePlayer.pause).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: '일시정지' })).toBeInTheDocument();
    });

    it('새 영상이 재생된 뒤의 일시정지는 원래대로 반영한다', async () => {
      await switchWhilePlaying();
      act(() => playerEvents?.onStateChange('paused'));
      act(() => playerEvents?.onStateChange('playing'));

      // 영상 안 컨트롤로 멈춘 경우
      act(() => playerEvents?.onStateChange('paused'));

      expect(usePlayerStore.getState().isPlaying).toBe(false);
      expect(screen.getByRole('button', { name: '재생' })).toBeInTheDocument();
    });

    it('처음 재생할 때는 교체가 아니므로 일시정지 이벤트를 그대로 반영한다', async () => {
      await renderPlaying(createItem('VID1'));

      act(() => playerEvents?.onStateChange('paused'));

      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });
  });
});
