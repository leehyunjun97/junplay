import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentKeywordsState {
  // 최근에 검색한 것이 앞에 온다
  keywords: string[];
}

interface RecentKeywordsActions {
  // 같은 검색어가 이미 있으면 지우고 맨 앞에 다시 넣는다
  add: (keyword: string) => void;
  remove: (keyword: string) => void;
  clear: () => void;
}

export type RecentKeywordsStore = RecentKeywordsState & RecentKeywordsActions;

// SPEC: 최근 검색어는 최대 10개
export const MAX_RECENT_KEYWORDS = 10;
export const RECENT_KEYWORDS_STORAGE_KEY = 'junplaylist-recent-keywords';

export const initialRecentKeywordsState: RecentKeywordsState = {
  keywords: [],
};

export const useRecentKeywordsStore = create<RecentKeywordsStore>()(
  persist(
    (set) => ({
      ...initialRecentKeywordsState,
      add: (keyword) =>
        set((state) => {
          const trimmed = keyword.trim();
          if (!trimmed) return state;
          const others = state.keywords.filter((saved) => saved !== trimmed);
          return { keywords: [trimmed, ...others].slice(0, MAX_RECENT_KEYWORDS) };
        }),
      remove: (keyword) =>
        set((state) => ({ keywords: state.keywords.filter((saved) => saved !== keyword) })),
      clear: () => set({ keywords: [] }),
    }),
    // 새로고침해도 최근 검색어가 유지되도록 localStorage에 저장한다
    { name: RECENT_KEYWORDS_STORAGE_KEY },
  ),
);
