import { beforeEach, describe, expect, it } from 'vitest';
import {
  HISTORY_STORAGE_KEY,
  initialHistoryState,
  MAX_HISTORY_ENTRIES,
  useHistoryStore,
  type HistoryItem,
} from './historyStore';

function createItem(id: string): HistoryItem {
  return {
    id,
    title: `${id} 플레이리스트`,
    channelTitle: '채널',
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

// 기록된 플레이리스트 ID를 최근 순서대로 꺼낸다
function recordedIds(): string[] {
  return useHistoryStore.getState().entries.map((entry) => entry.playlist.id);
}

describe('useHistoryStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useHistoryStore.setState(initialHistoryState);
  });

  it('재생한 플레이리스트를 재생 시각과 함께 기록한다', () => {
    useHistoryStore.getState().add(createItem('A'), 1000);

    expect(useHistoryStore.getState().entries).toEqual([
      { playlist: createItem('A'), playedAt: 1000 },
    ]);
  });

  it('최근에 들은 것이 앞에 온다', () => {
    useHistoryStore.getState().add(createItem('A'));
    useHistoryStore.getState().add(createItem('B'));

    expect(recordedIds()).toEqual(['B', 'A']);
  });

  it('같은 플레이리스트를 연속으로 재생하면 중복 기록하지 않는다', () => {
    useHistoryStore.getState().add(createItem('A'));
    useHistoryStore.getState().add(createItem('A'));

    expect(recordedIds()).toEqual(['A']);
  });

  it('사이에 다른 것을 들었다면 같은 플레이리스트도 다시 기록한다', () => {
    useHistoryStore.getState().add(createItem('A'));
    useHistoryStore.getState().add(createItem('B'));
    useHistoryStore.getState().add(createItem('A'));

    expect(recordedIds()).toEqual(['A', 'B', 'A']);
  });

  it(`최대 ${MAX_HISTORY_ENTRIES}개까지 저장하고, 넘으면 오래된 것부터 지운다`, () => {
    for (let index = 1; index <= MAX_HISTORY_ENTRIES + 1; index += 1) {
      useHistoryStore.getState().add(createItem(`P${index}`));
    }

    const ids = recordedIds();
    expect(ids).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(ids[0]).toBe(`P${MAX_HISTORY_ENTRIES + 1}`);
    // 가장 먼저 들은 P1이 지워졌다
    expect(ids).not.toContain('P1');
  });

  it('전체 삭제할 수 있다', () => {
    useHistoryStore.getState().add(createItem('A'));
    useHistoryStore.getState().clear();

    expect(useHistoryStore.getState().entries).toEqual([]);
  });

  it('localStorage에 저장하고, 새로고침 후 다시 불러온다', async () => {
    useHistoryStore.getState().add(createItem('A'), 1000);
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    expect(saved).not.toBeNull();

    // 메모리 상태를 비운 뒤 저장소에서 다시 읽는다 (새로고침 흉내)
    useHistoryStore.setState(initialHistoryState);
    localStorage.setItem(HISTORY_STORAGE_KEY, saved ?? '');
    await useHistoryStore.persist.rehydrate();

    expect(recordedIds()).toEqual(['A']);
  });
});
