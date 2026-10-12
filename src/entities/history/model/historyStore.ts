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

export const initialHistoryState: HistoryState = {
  entries: [],
};

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      ...initialHistoryState,
      add: (playlist, playedAt = Date.now()) =>
        set((state) => {
          // 바로 직전에 들은 것과 같으면(연속 재생) 중복으로 기록하지 않는다
          if (state.entries[0]?.playlist.id === playlist.id) return state;
          return {
            entries: [{ playlist, playedAt }, ...state.entries].slice(0, MAX_HISTORY_ENTRIES),
          };
        }),
      clear: () => set({ entries: [] }),
    }),
    // 새로고침해도 히스토리가 유지되도록 localStorage에 저장한다
    { name: HISTORY_STORAGE_KEY },
  ),
);
