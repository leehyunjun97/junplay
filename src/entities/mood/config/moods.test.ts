import { describe, expect, it } from 'vitest';
import { MAIN_MOODS, SUB_MOODS } from './moods';

describe('moods', () => {
  it('메인 분위기마다 서브 분위기가 5개씩 있다', () => {
    for (const mainMood of MAIN_MOODS) {
      const subMoods = SUB_MOODS.filter((subMood) => subMood.mainMood === mainMood.id);
      expect(subMoods).toHaveLength(5);
    }
  });

  it('서브 분위기 id는 중복되지 않는다', () => {
    const ids = SUB_MOODS.map((subMood) => subMood.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
