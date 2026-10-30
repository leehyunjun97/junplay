import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 기록할 플레이리스트. 같은 레이어(entities)의 playlist 슬라이스를 import하지 않으려고 필요한 모양을 따로 적는다.
// TypeScript는 모양이 같으면 같은 타입으로 보므로 Playlist를 그대로 넘길 수 있다.
export interface HistoryItem {
  id: string; // YouTube videoId
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

export interface HistoryEntry {
  playlist: HistoryItem;
  playedAt: number; // 재생한 시각 (Date.now())
}

interface HistoryState {
  // 최근에 들은 것이 앞에 온다
  entries: HistoryEntry[];
}

interface HistoryActions {
  add: (playlist: HistoryItem, playedAt?: number) => void;
  clear: () => void;
}

export type HistoryStore = HistoryState & HistoryActions;

// SPEC: 최대 50개까지 저장하고, 넘으면 오래된 것부터 지운다
export const MAX_HISTORY_ENTRIES = 50;
export const HISTORY_STORAGE_KEY = 'junplaylist-history';

// 저장 형식 버전. 1부터 같은 플레이리스트를 한 번만 기록한다
const HISTORY_STORAGE_VERSION = 1;

export const initialHistoryState: HistoryState = {
  entries: [],
};

// 같은 플레이리스트는 가장 최근 기록(앞쪽) 하나만 남긴다
function dedupeEntries(entries: HistoryEntry[]): HistoryEntry[] {
  const seenIds = new Set<string>();
  return entries.filter((entry) => {
    if (seenIds.has(entry.playlist.id)) return false;
    seenIds.add(entry.playlist.id);
    return true;
  });
}

function isHistoryState(value: unknown): value is HistoryState {
  return (
    typeof value === 'object' && value !== null && 'entries' in value && Array.isArray(value.entries)
  );
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      ...initialHistoryState,
      add: (playlist, playedAt = Date.now()) =>
        set((state) => ({
          // 이미 들은 플레이리스트면 기존 기록을 지우고 새 재생 시각으로 맨 앞에 둔다
          entries: [
            { playlist, playedAt },
            ...state.entries.filter((entry) => entry.playlist.id !== playlist.id),
          ].slice(0, MAX_HISTORY_ENTRIES),
        })),
      clear: () => set({ entries: [] }),
    }),
    // 새로고침해도 히스토리가 유지되도록 localStorage에 저장한다
    {
      name: HISTORY_STORAGE_KEY,
      version: HISTORY_STORAGE_VERSION,
      // 함수는 저장되지 않으므로 상태(entries)만 저장 대상으로 명시한다
      partialize: (state): HistoryState => ({ entries: state.entries }),
      // 버전 0(이전 방식)에 쌓인 중복 기록을 처음 불러올 때 한 번 정리한다
      migrate: (persistedState) => {
        if (!isHistoryState(persistedState)) return initialHistoryState;
        return { entries: dedupeEntries(persistedState.entries) };
      },
    },
  ),
);
