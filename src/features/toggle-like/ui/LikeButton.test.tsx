import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { initialLikeState, useLikeStore } from '@/entities/like';
import type { Playlist } from '@/entities/playlist';
import { LikeButton } from './LikeButton';

const playlist: Playlist = {
  id: 'VID1',
  title: '공부할 때 듣는 플레이리스트',
  channelTitle: '채널',
  thumbnailUrl: 'https://i.ytimg.com/vi/VID1/hqdefault.jpg',
};

describe('LikeButton', () => {
  beforeEach(() => {
    localStorage.clear();
    useLikeStore.setState(initialLikeState);
  });

  it('누를 때마다 좋아요를 추가하고 해제한다', async () => {
    const user = userEvent.setup();
    render(<LikeButton playlist={playlist} />);
    const button = screen.getByRole('button', { name: '좋아요' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(useLikeStore.getState().items).toEqual([playlist]);

    await user.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(useLikeStore.getState().items).toEqual([]);
  });

  it('이미 좋아요한 플레이리스트면 눌린 상태로 보인다', () => {
    useLikeStore.setState({ items: [playlist] });
    render(<LikeButton playlist={playlist} />);

    expect(screen.getByRole('button', { name: '좋아요' })).toHaveAttribute('aria-pressed', 'true');
  });
});
