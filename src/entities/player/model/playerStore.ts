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

// 재생 위치 (초)
export interface PlaybackProgress {
  currentTime: number;
  duration: number;
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
  // 이어 듣기용으로 저장해 둔 current의 재생 위치. 다른 항목으로 바뀌면 비운다
  savedProgress: PlaybackProgress | null;
  // "이 위치부터 재생해 달라"는 요청 (담은 곡). 요청할 때마다 새 객체라서,
  // 같은 영상의 같은 곡을 다시 눌러도 플레이어가 바뀐 것으로 알아차린다. 새로고침하면 사라진다
  startRequest: { seconds: number } | null;
}

interface PlayerActions {
  // 새 항목을 재생한다. 지금 항목은 이전 기록에 쌓고, 다음 기록은 비운다.
  // startSeconds를 넘기면 그 위치부터 재생한다. 지금 항목과 같은 영상이어도 그 위치로 다시 불러온다
  play: (item: PlayerItem, startSeconds?: number) => void;
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
  saveProgress: (progress: PlaybackProgress) => void;
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
  savedProgress: null,
  startRequest: null,
};

function clampVolume(volume: number): number {
  return Math.min(100, Math.max(0, Math.round(volume)));
}

// 스토어는 "어떻게 재생되어야 하는지"만 갖고 있다. 실제 YouTube 플레이어는 widgets/player-bar가 이 값에 맞춘다
export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...initialPlayerState,
      play: (item, startSeconds) =>
        set((state) => {
          const startRequest = startSeconds === undefined ? null : { seconds: startSeconds };
          // 지금 항목을 다시 고르면(연속 재생) 기록과 저장 위치를 건드리지 않는다.
          // 이어 듣기로 준비된 항목을 다시 골랐을 때도 저장된 위치부터 재생된다.
          // 시작 위치 없이 다시 고르면 이전 요청을 그대로 둬서, 듣던 곳에서 끊기지 않게 한다
          if (state.current?.id === item.id) {
            return startRequest
              ? { current: item, isPlaying: true, startRequest }
              : { current: item, isPlaying: true };
          }
          return {
            current: item,
            isPlaying: true,
            backStack: state.current ? [...state.backStack, state.current] : state.backStack,
            forwardStack: [],
            savedProgress: null,
            startRequest,
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
          savedProgress: null,
          // 기록 이동은 항상 처음부터 재생한다
          startRequest: null,
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
          savedProgress: null,
          startRequest: null,
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
      saveProgress: (progress) => set({ savedProgress: progress }),
    }),
    {
      name: PLAYER_STORAGE_KEY,
      // 새로고침 후에도 유지할 값만 localStorage에 저장한다.
      // SPEC: 볼륨과 음소거 상태, 이어 듣기(마지막 항목과 재생 위치).
      // 재생 여부는 저장하지 않아서 다시 접속하면 멈춘 상태로 준비된다 (자동 재생 안 함).
      // 반복, 크게 보기, 이전/다음 기록도 저장하지 않는다
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        current: state.current,
        savedProgress: state.savedProgress,
      }),
    },
  ),
);
