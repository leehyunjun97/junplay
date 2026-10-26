import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialHistoryState, useHistoryStore } from '@/entities/history';
import { initialPlayerState, usePlayerStore } from '@/entities/player';
import type { Playlist } from '@/entities/playlist';
import { initialSavedSongState, useSavedSongStore, type SavedSong } from '@/entities/saved-song';
import { MySongsPage } from './MySongsPage';

function createPlaylist(id: string): Playlist {
  return {
    id,
    title: `${id} 플레이리스트`,
    channelTitle: `${id} 채널`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

function createSong(videoId: string, seconds: number, title: string, memo = ''): SavedSong {
  return {
    id: `${videoId}-${seconds}`,
    playlist: createPlaylist(videoId),
    seconds,
    title,
    memo,
    savedAt: Date.now(),
  };
}

// 담은 곡 목록의 행들
function songRows() {
  return within(screen.getByRole('list', { name: '담은 곡' })).getAllByRole('listitem');
}

describe('MySongsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useSavedSongStore.setState(initialSavedSongState);
    usePlayerStore.setState(initialPlayerState);
    useHistoryStore.setState(initialHistoryState);
  });

  it('담은 곡이 없으면 안내 문구를 보여 준다', () => {
    render(<MySongsPage />);

    expect(screen.getByText('아직 담은 곡이 없어요.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('썸네일과 곡명을 최근에 담은 순서대로 보여 주고, 영상 제목은 보여 주지 않는다', () => {
    useSavedSongStore.setState({
      songs: [createSong('VID2', 200, '곡2 - 가수B'), createSong('VID1', 0, '곡1 - 가수A')],
    });
    render(<MySongsPage />);

    const rows = songRows();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('곡2 - 가수B');
    expect(rows[1]).toHaveTextContent('곡1 - 가수A');
    expect(screen.queryByText('VID2 플레이리스트')).not.toBeInTheDocument();
    // 썸네일은 장식용(alt="")이라 img 역할로 찾을 수 없어서 요소를 직접 찾는다
    expect(rows[0].querySelector('img')).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/VID2/hqdefault.jpg',
    );
  });

  it('메모가 있으면 곡명 아래에 보여 준다', () => {
    useSavedSongStore.setState({ songs: [createSong('VID1', 0, '곡1', '드라이브할 때 최고')] });
    render(<MySongsPage />);

    expect(within(songRows()[0]).getByText('드라이브할 때 최고')).toBeInTheDocument();
  });

  it('복사 버튼을 누르면 곡명을 클립보드에 복사하고 알린다', async () => {
    const user = userEvent.setup();
    useSavedSongStore.setState({ songs: [createSong('VID1', 200, '곡2 - 가수B')] });
    render(<MySongsPage />);

    await user.click(screen.getByRole('button', { name: '곡명 복사' }));

    expect(await navigator.clipboard.readText()).toBe('곡2 - 가수B');
    expect(await screen.findByRole('status')).toHaveTextContent('곡명을 복사했어요');
    // 복사만 하고 재생하지 않는다
    expect(usePlayerStore.getState().current).toBeNull();
  });

  it('클립보드에 복사하지 못하면 실패를 알린다', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    useSavedSongStore.setState({ songs: [createSong('VID1', 200, '곡2 - 가수B')] });
    render(<MySongsPage />);

    await user.click(screen.getByRole('button', { name: '곡명 복사' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('복사하지 못했어요'));
  });

  it('항목을 누르면 그 영상을 곡 시작 시간부터 재생하고 히스토리에 기록한다', async () => {
    const user = userEvent.setup();
    useSavedSongStore.setState({ songs: [createSong('VID1', 200, '곡2 - 가수B')] });
    render(<MySongsPage />);

    await user.click(screen.getByRole('button', { name: /곡2 - 가수B/ }));

    const player = usePlayerStore.getState();
    expect(player.current).toEqual(createPlaylist('VID1'));
    expect(player.isPlaying).toBe(true);
    expect(player.startRequest).toEqual({ seconds: 200 });
    expect(useHistoryStore.getState().entries[0]?.playlist).toEqual(createPlaylist('VID1'));
  });

  it('삭제 버튼을 누르면 목록에서 지워지고, 다 지우면 안내 문구가 보인다', async () => {
    const user = userEvent.setup();
    useSavedSongStore.setState({
      songs: [createSong('VID1', 0, '곡1'), createSong('VID1', 200, '곡2')],
    });
    render(<MySongsPage />);

    await user.click(within(songRows()[0]).getByRole('button', { name: '삭제' }));

    expect(songRows()).toHaveLength(1);
    expect(screen.queryByText('곡1')).not.toBeInTheDocument();

    await user.click(within(songRows()[0]).getByRole('button', { name: '삭제' }));

    expect(screen.getByText('아직 담은 곡이 없어요.')).toBeInTheDocument();
    expect(useSavedSongStore.getState().songs).toEqual([]);
  });
});
