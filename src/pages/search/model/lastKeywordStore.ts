import { create } from 'zustand';
import { DEFAULT_SEARCH_ORDER, type SearchOrder } from '@/entities/playlist';

// 마지막으로 검색한 키워드와 정렬. 헤더의 검색 아이콘으로 /search에 다시 들어왔을 때 그 결과를 보여 주려고 기억한다.
// 새로고침하면 처음 화면으로 돌아가도록 저장(persist)하지 않는다
interface LastKeywordState {
  lastKeyword: string;
  lastOrder: SearchOrder;
}

interface LastKeywordActions {
  setLastKeyword: (keyword: string, order: SearchOrder) => void;
}

export const initialLastKeywordState: LastKeywordState = {
  lastKeyword: '',
  lastOrder: DEFAULT_SEARCH_ORDER,
};

export const useLastKeywordStore = create<LastKeywordState & LastKeywordActions>()((set) => ({
  ...initialLastKeywordState,
  setLastKeyword: (lastKeyword, lastOrder) => set({ lastKeyword, lastOrder }),
}));
