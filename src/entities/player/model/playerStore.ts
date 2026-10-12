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
}

interface PlayerActions {
  play: (item: PlayerItem) => void;
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
};

function clampVolume(volume: number): number {
  return Math.min(100, Math.max(0, Math.round(volume)));
}

// 스토어는 "어떻게 재생되어야 하는지"만 갖고 있다. 실제 YouTube 플레이어는 widgets/player-bar가 이 값에 맞춘다
export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      ...initialPlayerState,
      play: (item) => set({ current: item, isPlaying: true }),
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
