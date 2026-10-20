import { beforeEach, describe, expect, it } from 'vitest';
import {
  initialRecentKeywordsState,
  MAX_RECENT_KEYWORDS,
  RECENT_KEYWORDS_STORAGE_KEY,
  useRecentKeywordsStore,
} from './recentKeywordsStore';

function keywords() {
  return useRecentKeywordsStore.getState().keywords;
}

describe('useRecentKeywordsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useRecentKeywordsStore.setState(initialRecentKeywordsState);
  });

  it('검색어를 최근 순으로 쌓는다', () => {
    useRecentKeywordsStore.getState().add('아이유');
    useRecentKeywordsStore.getState().add('재즈');

    expect(keywords()).toEqual(['재즈', '아이유']);
  });

  it('같은 검색어를 다시 검색하면 중복 없이 맨 앞으로 올린다', () => {
    useRecentKeywordsStore.getState().add('아이유');
    useRecentKeywordsStore.getState().add('재즈');
    useRecentKeywordsStore.getState().add(' 아이유 ');

    expect(keywords()).toEqual(['아이유', '재즈']);
  });

  it('빈 검색어는 저장하지 않는다', () => {
    useRecentKeywordsStore.getState().add('   ');
    expect(keywords()).toEqual([]);
  });

  it(`최대 ${MAX_RECENT_KEYWORDS}개까지 저장하고, 넘으면 오래된 것부터 지운다`, () => {
    for (let index = 0; index <= MAX_RECENT_KEYWORDS; index += 1) {
      useRecentKeywordsStore.getState().add(`검색어 ${index}`);
    }

    expect(keywords()).toHaveLength(MAX_RECENT_KEYWORDS);
    expect(keywords()[0]).toBe(`검색어 ${MAX_RECENT_KEYWORDS}`);
    expect(keywords()).not.toContain('검색어 0');
  });

  it('하나씩 지우거나 전체를 지울 수 있다', () => {
    useRecentKeywordsStore.getState().add('아이유');
    useRecentKeywordsStore.getState().add('재즈');

    useRecentKeywordsStore.getState().remove('아이유');
    expect(keywords()).toEqual(['재즈']);

    useRecentKeywordsStore.getState().clear();
    expect(keywords()).toEqual([]);
  });

  it('localStorage에 저장하고 다시 불러온다', async () => {
    useRecentKeywordsStore.getState().add('아이유');
    const stored = localStorage.getItem(RECENT_KEYWORDS_STORAGE_KEY);
    expect(stored).not.toBeNull();

    // 새로고침 후 앱이 시작될 때처럼, 메모리 상태를 비우고 저장소에서 다시 읽는다
    useRecentKeywordsStore.setState(initialRecentKeywordsState);
    localStorage.setItem(RECENT_KEYWORDS_STORAGE_KEY, stored ?? '');
    await useRecentKeywordsStore.persist.rehydrate();

    expect(keywords()).toEqual(['아이유']);
  });
});
