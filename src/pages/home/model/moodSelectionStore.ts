import { create } from 'zustand';
import type { MainMood } from '@/entities/mood';

// 홈에서 고른 분위기. 컴포넌트 state에 두면 다른 페이지로 갔다 올 때 사라지므로 스토어에 둔다.
// 새로고침하면 처음 화면으로 돌아가도록 저장(persist)하지 않는다
interface MoodSelectionState {
  mainMood: MainMood | null;
  subMoodId: string | null;
}

interface MoodSelectionActions {
  // 메인 분위기를 바꾸면 이전 서브 분위기 선택은 비운다
  selectMainMood: (mainMood: MainMood) => void;
  selectSubMood: (subMoodId: string) => void;
}

export const initialMoodSelectionState: MoodSelectionState = {
  mainMood: null,
  subMoodId: null,
};

export const useMoodSelectionStore = create<MoodSelectionState & MoodSelectionActions>()((set) => ({
  ...initialMoodSelectionState,
  selectMainMood: (mainMood) =>
    set((state) => (state.mainMood === mainMood ? state : { mainMood, subMoodId: null })),
  selectSubMood: (subMoodId) => set({ subMoodId }),
}));
