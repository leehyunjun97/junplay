import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { initialHistoryState, useHistoryStore } from '@/entities/history';
import { initialLikeState, useLikeStore } from '@/entities/like';
import { initialPlayerState, usePlayerStore } from '@/entities/player';
import type { Playlist } from '@/entities/playlist';
import { MyPlaylistPage } from './MyPlaylistPage';

function createPlaylist(id: string): Playlist {
  return {
    id,
    title: `${id} 플레이리스트`,
    channelTitle: `${id} 채널`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

describe('MyPlaylistPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useLikeStore.setState(initialLikeState);
    usePlayerStore.setState(initialPlayerState);
    useHistoryStore.setState(initialHistoryState);
  });

  it('좋아요한 항목이 없으면 안내 문구를 보여 준다', () => {
    render(<MyPlaylistPage />);

    expect(screen.getByText('아직 좋아요한 플레이리스트가 없어요.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('좋아요한 목록을 최근에 누른 순서대로 보여 준다', () => {
    useLikeStore.setState({ items: [createPlaylist('B'), createPlaylist('A')] });
    render(<MyPlaylistPage />);

    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(['B 플레이리스트', 'A 플레이리스트']);
  });

  it('하트를 눌러 좋아요를 해제하면 목록에서 삭제되고, 다 지우면 안내 문구가 보인다', async () => {
    const user = userEvent.setup();
    useLikeStore.setState({ items: [createPlaylist('A')] });
    render(<MyPlaylistPage />);

    await user.click(screen.getByRole('button', { name: '좋아요' }));

    expect(screen.queryByText('A 플레이리스트')).not.toBeInTheDocument();
    expect(screen.getByText('아직 좋아요한 플레이리스트가 없어요.')).toBeInTheDocument();
  });

  it('카드를 누르면 재생하고 히스토리에 기록한다', async () => {
    const user = userEvent.setup();
    const playlist = createPlaylist('A');
    useLikeStore.setState({ items: [playlist] });
    render(<MyPlaylistPage />);

    await user.click(screen.getByRole('button', { name: /A 채널/ }));

    expect(usePlayerStore.getState().current).toEqual(playlist);
    expect(useHistoryStore.getState().entries[0]?.playlist).toEqual(playlist);
  });
});
