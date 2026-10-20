import { create } from 'zustand';

// 마지막으로 검색한 키워드. 헤더의 검색 아이콘으로 /search에 다시 들어왔을 때 그 결과를 보여 주려고 기억한다.
// 새로고침하면 처음 화면으로 돌아가도록 저장(persist)하지 않는다
interface LastKeywordState {
  lastKeyword: string;
}

interface LastKeywordActions {
  setLastKeyword: (keyword: string) => void;
}

export const initialLastKeywordState: LastKeywordState = {
  lastKeyword: '',
};

export const useLastKeywordStore = create<LastKeywordState & LastKeywordActions>()((set) => ({
  ...initialLastKeywordState,
  setLastKeyword: (lastKeyword) => set({ lastKeyword }),
}));
