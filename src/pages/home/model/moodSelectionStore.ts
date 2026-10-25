import { create } from 'zustand';
import type { MainMood } from '@/entities/mood';
import { DEFAULT_SEARCH_ORDER, type SearchOrder } from '@/entities/playlist';

// 홈에서 고른 분위기와 정렬. 컴포넌트 state에 두면 다른 페이지로 갔다 올 때 사라지므로 스토어에 둔다.
// 새로고침하면 처음 화면으로 돌아가도록 저장(persist)하지 않는다
interface MoodSelectionState {
  mainMood: MainMood | null;
  subMoodId: string | null;
  order: SearchOrder;
}

interface MoodSelectionActions {
  // 메인 분위기를 바꾸면 이전 서브 분위기 선택은 비운다
  selectMainMood: (mainMood: MainMood) => void;
  selectSubMood: (subMoodId: string) => void;
  selectOrder: (order: SearchOrder) => void;
}

export const initialMoodSelectionState: MoodSelectionState = {
  mainMood: null,
  subMoodId: null,
  order: DEFAULT_SEARCH_ORDER,
};

// 분위기가 바뀌면 정렬은 추천순으로 돌아간다 (SPEC F7). 이미 고른 분위기를 다시 누르면 그대로 둔다
export const useMoodSelectionStore = create<MoodSelectionState & MoodSelectionActions>()((set) => ({
  ...initialMoodSelectionState,
  selectMainMood: (mainMood) =>
    set((state) =>
      state.mainMood === mainMood
        ? state
        : { mainMood, subMoodId: null, order: DEFAULT_SEARCH_ORDER },
    ),
  selectSubMood: (subMoodId) =>
    set((state) =>
      state.subMoodId === subMoodId ? state : { subMoodId, order: DEFAULT_SEARCH_ORDER },
    ),
  selectOrder: (order) => set({ order }),
}));
