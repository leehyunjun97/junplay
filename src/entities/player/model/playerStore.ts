import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 재생할 항목. 같은 레이어(entities)의 playlist 슬라이스를 import하지 않으려고 필요한 모양을 따로 적는다.
// TypeScript는 모양이 같으면 같은 타입으로 보므로 Playlist를 그대로 넘길 수 있다.
export interface PlayerItem {
  id: string; // YouTube videoId
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

interface PlayerState {
  current: PlayerItem | null;
  isPlaying: boolean;
  volume: number; // 0 ~ 100
  isMuted: boolean;
  isLoop: boolean; // 현재 영상 반복
  isExpanded: boolean; // 영상 크게 보기
  // 이전/다음 이동 기록 (브라우저의 뒤로/앞으로와 같은 방식). 마지막 원소가 가장 가까운 기록이다.
  // F6 히스토리 목록과는 따로 관리하고, 새로고침하면 사라진다
  backStack: PlayerItem[];
  forwardStack: PlayerItem[];
}

interface PlayerActions {
  // 새 항목을 재생한다. 지금 항목은 이전 기록에 쌓고, 다음 기록은 비운다
  play: (item: PlayerItem) => void;
  // 이전/다음 기록으로 이동해 재생한다. 이동한 항목을 돌려주고, 기록이 없으면 null을 돌려준다
  playPrevious: () => PlayerItem | null;
  playNext: () => PlayerItem | null;
  // 실제 플레이어의 상태가 바뀌었을 때(영상 안 컨트롤 조작, 영상 끝남 등) 스토어를 맞춘다
  setPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  toggleExpanded: () => void;
  setExpanded: (isExpanded: boolean) => void;
}

export type PlayerStore = PlayerState & PlayerActions;

export const DEFAULT_VOLUME = 50;
export const PLAYER_STORAGE_KEY = 'junplaylist-player';

export const initialPlayerState: PlayerState = {
  current: null,
  isPlaying: false,
  volume: DEFAULT_VOLUME,
  isMuted: false,
  isLoop: false,
  isExpanded: false,
  backStack: [],
  forwardStack: [],
};

function clampVolume(volume: number): number {
  return Math.min(100, Math.max(0, Math.round(volume)));
}

// 스토어는 "어떻게 재생되어야 하는지"만 갖고 있다. 실제 YouTube 플레이어는 widgets/player-bar가 이 값에 맞춘다
export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...initialPlayerState,
      play: (item) =>
        set((state) => {
          // 처음 재생하거나 지금 항목을 다시 고르면(연속 재생) 기록을 건드리지 않는다
          if (!state.current || state.current.id === item.id) {
            return { current: item, isPlaying: true };
          }
          return {
            current: item,
            isPlaying: true,
            backStack: [...state.backStack, state.current],
            forwardStack: [],
          };
        }),
      playPrevious: () => {
        const { current, backStack, forwardStack } = get();
        const previous = backStack.at(-1);
        if (!current || !previous) return null;
        set({
          current: previous,
          isPlaying: true,
          backStack: backStack.slice(0, -1),
          forwardStack: [...forwardStack, current],
        });
        return previous;
      },
      playNext: () => {
        const { current, backStack, forwardStack } = get();
        const next = forwardStack.at(-1);
        if (!current || !next) return null;
        set({
          current: next,
          isPlaying: true,
          backStack: [...backStack, current],
          forwardStack: forwardStack.slice(0, -1),
        });
        return next;
      },
      setPlaying: (isPlaying) => set({ isPlaying }),
      // 재생할 항목이 없으면 재생 상태로 바꾸지 않는다
      togglePlay: () => set((state) => (state.current ? { isPlaying: !state.isPlaying } : state)),
      // 볼륨을 움직이면 음소거를 푼다 (YouTube 플레이어와 같은 동작)
      setVolume: (volume) => set({ volume: clampVolume(volume), isMuted: false }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      toggleLoop: () => set((state) => ({ isLoop: !state.isLoop })),
      toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setExpanded: (isExpanded) => set({ isExpanded }),
    }),
    {
      name: PLAYER_STORAGE_KEY,
      // 새로고침 후에도 유지할 값만 localStorage에 저장한다 (SPEC: 볼륨과 음소거 상태). 반복과 크게 보기는 저장하지 않는다
      partialize: (state) => ({ volume: state.volume, isMuted: state.isMuted }),
    },
  ),
);
