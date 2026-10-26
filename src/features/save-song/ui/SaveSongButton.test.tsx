import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Playlist } from '@/entities/playlist';
import { initialSavedSongState, useSavedSongStore } from '@/entities/saved-song';
import { SaveSongButton } from './SaveSongButton';

const playlist: Playlist = {
  id: 'VID1',
  title: '공부할 때 듣는 플레이리스트',
  channelTitle: '채널',
  thumbnailUrl: 'https://i.ytimg.com/vi/VID1/hqdefault.jpg',
};

describe('SaveSongButton', () => {
  beforeEach(() => {
    localStorage.clear();
    useSavedSongStore.setState(initialSavedSongState);
  });

  it('누르면 곡을 담고 "내 곡에 담았어요"를 알린다', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(<SaveSongButton playlist={playlist} seconds={200} title="곡2" onResult={onResult} />);

    await user.click(screen.getByRole('button', { name: '내 곡에 담기' }));

    expect(onResult).toHaveBeenCalledWith('내 곡에 담았어요');
    expect(useSavedSongStore.getState().songs).toMatchObject([
      { id: 'VID1-200', playlist, seconds: 200, title: '곡2' },
    ]);
  });

  it('같은 곡을 다시 누르면 저장하지 않고 "이미 담은 곡이에요"를 알린다', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(<SaveSongButton playlist={playlist} seconds={200} title="곡2" onResult={onResult} />);
    const button = screen.getByRole('button', { name: '내 곡에 담기' });

    await user.click(button);
    await user.click(button);

    expect(onResult).toHaveBeenLastCalledWith('이미 담은 곡이에요');
    expect(useSavedSongStore.getState().songs).toHaveLength(1);
  });

  it('담을 영상이 없으면(null) 비활성화된다', () => {
    render(<SaveSongButton playlist={null} seconds={0} title="" onResult={vi.fn()} />);

    expect(screen.getByRole('button', { name: '내 곡에 담기' })).toBeDisabled();
  });
});
