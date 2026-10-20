import { describe, expect, it } from 'vitest';
import { toPlaylistQuery } from './toPlaylistQuery';

describe('toPlaylistQuery', () => {
  it.each([
    ['아이유', '아이유 플레이리스트'],
    ['  재즈 카페  ', '재즈 카페 플레이리스트'],
    ['아이유 플레이리스트', '아이유 플레이리스트'],
    ['공부 노래모음', '공부 노래모음'],
    ['공부 노래 모음', '공부 노래 모음'],
    ['시티팝플레이리스트', '시티팝플레이리스트'],
  ])('"%s" → "%s"', (keyword, expected) => {
    expect(toPlaylistQuery(keyword)).toBe(expected);
  });
});
