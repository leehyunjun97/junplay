import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 좋아요한 플레이리스트. 같은 레이어(entities)의 playlist 슬라이스를 import하지 않으려고 필요한 모양을 따로 적는다.
// TypeScript는 모양이 같으면 같은 타입으로 보므로 Playlist를 그대로 넘길 수 있다.
export interface LikedItem {
  id: string; // YouTube videoId
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}

interface LikeState {
  // 최근에 좋아요한 것이 앞에 온다
  items: LikedItem[];
}

interface LikeActions {
  // 좋아요하지 않은 항목이면 추가하고, 이미 좋아요한 항목이면 해제한다
  toggle: (item: LikedItem) => void;
}

export type LikeStore = LikeState & LikeActions;

export const LIKE_STORAGE_KEY = 'junplaylist-likes';

export const initialLikeState: LikeState = {
  items: [],
};

// 특정 플레이리스트를 좋아요했는지 고르는 셀렉터. 사용: useLikeStore(selectIsLiked(id))
export function selectIsLiked(id: string) {
  return (state: LikeState) => state.items.some((item) => item.id === id);
}

export const useLikeStore = create<LikeStore>()(
  persist(
    (set) => ({
      ...initialLikeState,
      toggle: (item) =>
        set((state) =>
          state.items.some((liked) => liked.id === item.id)
            ? { items: state.items.filter((liked) => liked.id !== item.id) }
            : { items: [item, ...state.items] },
        ),
    }),
    // 새로고침해도 좋아요 목록이 유지되도록 localStorage에 저장한다
    { name: LIKE_STORAGE_KEY },
  ),
);
