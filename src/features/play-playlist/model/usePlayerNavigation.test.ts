import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { initialHistoryState, useHistoryStore } from '@/entities/history';
import { initialPlayerState, usePlayerStore } from '@/entities/player';
import type { Playlist } from '@/entities/playlist';
import { usePlayerNavigation } from './usePlayerNavigation';
import { usePlayPlaylist } from './usePlayPlaylist';

function createPlaylist(id: string): Playlist {
  return {
    id,
    title: `${id} 플레이리스트`,
    channelTitle: `${id} 채널`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

// F6 히스토리 목록의 ID들 (최근 것이 앞)
function historyIds() {
  return useHistoryStore.getState().entries.map((entry) => entry.playlist.id);
}

describe('usePlayerNavigation', () => {
  beforeEach(() => {
    localStorage.clear();
    usePlayerStore.setState(initialPlayerState);
    useHistoryStore.setState(initialHistoryState);
  });

  function renderNavigation() {
    return renderHook(() => ({ play: usePlayPlaylist(), navigation: usePlayerNavigation() }));
  }

  it('기록이 없으면 이전/다음으로 갈 수 없다', () => {
    const { result } = renderNavigation();

    act(() => result.current.play(createPlaylist('A')));

    expect(result.current.navigation.canGoPrevious).toBe(false);
    expect(result.current.navigation.canGoNext).toBe(false);
  });

  it('이전/다음으로 이동해 재생하고, 기록의 처음과 끝을 알려 준다', () => {
    const { result } = renderNavigation();
    act(() => result.current.play(createPlaylist('A')));
    act(() => result.current.play(createPlaylist('B')));
    expect(result.current.navigation.canGoPrevious).toBe(true);

    act(() => result.current.navigation.playPrevious());

    expect(usePlayerStore.getState().current?.id).toBe('A');
    expect(result.current.navigation.canGoPrevious).toBe(false);
    expect(result.current.navigation.canGoNext).toBe(true);

    act(() => result.current.navigation.playNext());

    expect(usePlayerStore.getState().current?.id).toBe('B');
    expect(result.current.navigation.canGoNext).toBe(false);
  });

  it('이동해서 재생한 항목도 히스토리 목록에 기록한다', () => {
    const { result } = renderNavigation();
    act(() => result.current.play(createPlaylist('A')));
    act(() => result.current.play(createPlaylist('B')));

    act(() => result.current.navigation.playPrevious());

    expect(historyIds()).toEqual(['A', 'B', 'A']);
  });

  it('다음 기록이 사라져도 히스토리 목록은 그대로 남는다', () => {
    const { result } = renderNavigation();
    act(() => result.current.play(createPlaylist('A')));
    act(() => result.current.play(createPlaylist('B')));
    act(() => result.current.navigation.playPrevious());

    act(() => result.current.play(createPlaylist('C')));

    expect(result.current.navigation.canGoNext).toBe(false);
    expect(historyIds()).toEqual(['C', 'A', 'B', 'A']);
  });
});
