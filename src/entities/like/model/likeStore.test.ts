import { beforeEach, describe, expect, it } from 'vitest';
import {
  initialLikeState,
  LIKE_STORAGE_KEY,
  selectIsLiked,
  useLikeStore,
  type LikedItem,
} from './likeStore';

function createItem(id: string): LikedItem {
  return {
    id,
    title: `${id} 플레이리스트`,
    channelTitle: `${id} 채널`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

// 좋아요 목록의 ID들 (최근 것이 앞)
function likedIds() {
  return useLikeStore.getState().items.map((item) => item.id);
}

describe('useLikeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useLikeStore.setState(initialLikeState);
  });

  it('처음에는 좋아요한 항목이 없다', () => {
    expect(useLikeStore.getState().items).toEqual([]);
  });

  it('toggle로 좋아요를 추가하고, 최근에 누른 것이 앞에 온다', () => {
    useLikeStore.getState().toggle(createItem('A'));
    useLikeStore.getState().toggle(createItem('B'));

    expect(likedIds()).toEqual(['B', 'A']);
  });

  it('이미 좋아요한 항목을 toggle하면 해제된다', () => {
    useLikeStore.getState().toggle(createItem('A'));
    useLikeStore.getState().toggle(createItem('B'));

    useLikeStore.getState().toggle(createItem('A'));

    expect(likedIds()).toEqual(['B']);
  });

  it('selectIsLiked로 좋아요 여부를 확인한다', () => {
    useLikeStore.getState().toggle(createItem('A'));

    expect(selectIsLiked('A')(useLikeStore.getState())).toBe(true);
    expect(selectIsLiked('B')(useLikeStore.getState())).toBe(false);
  });

  it('좋아요 목록을 localStorage에 저장하고 다시 불러온다', async () => {
    useLikeStore.getState().toggle(createItem('A'));
    const stored = localStorage.getItem(LIKE_STORAGE_KEY);
    expect(stored).not.toBeNull();

    // 새로고침 후 앱이 시작될 때처럼, 메모리 상태를 비우고 저장소에서 다시 읽는다
    useLikeStore.setState(initialLikeState);
    localStorage.setItem(LIKE_STORAGE_KEY, stored ?? '');
    await useLikeStore.persist.rehydrate();

    expect(likedIds()).toEqual(['A']);
  });
});
