import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { initialHistoryState, useHistoryStore } from '@/entities/history';
import { initialPlayerState, usePlayerStore } from '@/entities/player';
import type { Playlist } from '@/entities/playlist';
import { usePlayPlaylist } from './usePlayPlaylist';

const playlist: Playlist = {
  id: 'VID1',
  title: '공부할 때 듣는 플레이리스트',
  channelTitle: '채널',
  thumbnailUrl: 'https://i.ytimg.com/vi/VID1/hqdefault.jpg',
};

describe('usePlayPlaylist', () => {
  beforeEach(() => {
    localStorage.clear();
    usePlayerStore.setState(initialPlayerState);
    useHistoryStore.setState(initialHistoryState);
  });

  it('플레이리스트를 재생하고 히스토리에 기록한다', () => {
    const { result } = renderHook(() => usePlayPlaylist());

    act(() => result.current(playlist));

    expect(usePlayerStore.getState().current).toEqual(playlist);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(useHistoryStore.getState().entries[0]?.playlist).toEqual(playlist);
  });

  it('시작 위치를 넘기면 그 위치부터 재생하도록 요청하고, 히스토리에도 기록한다', () => {
    const { result } = renderHook(() => usePlayPlaylist());

    act(() => result.current(playlist, 200));

    expect(usePlayerStore.getState().startRequest).toEqual({ seconds: 200 });
    expect(useHistoryStore.getState().entries[0]?.playlist).toEqual(playlist);
  });
});
