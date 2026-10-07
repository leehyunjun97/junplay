import type { MainMoodOption, SubMood } from '../model/types';

// SPEC.md F1의 분위기 표를 그대로 옮긴 목록
export const MAIN_MOODS: readonly MainMoodOption[] = [
  { id: 'exciting', label: '신나는', emoji: '😄' },
  { id: 'calm', label: '조용한', emoji: '😐' },
  { id: 'weather', label: '날씨', emoji: '☁️' },
];

export const SUB_MOODS: readonly SubMood[] = [
  // 신나는
  {
    id: 'drive',
    label: '드라이브',
    mainMood: 'exciting',
    searchQuery: '드라이브 노래 플레이리스트',
  },
  {
    id: 'idol',
    label: '아이돌',
    mainMood: 'exciting',
    searchQuery: '아이돌 노래 플레이리스트',
  },
  {
    id: 'work',
    label: '노동요',
    mainMood: 'exciting',
    searchQuery: '노동요 플레이리스트',
  },
  {
    id: 'refresh',
    label: '기분전환',
    mainMood: 'exciting',
    searchQuery: '기분전환 노래 플레이리스트',
  },
  {
    id: 'inner-dance',
    label: '내적댄스',
    mainMood: 'exciting',
    searchQuery: '내적댄스 신나는 노래 플레이리스트',
  },
  // 조용한
  {
    id: 'alone',
    label: '혼자',
    mainMood: 'calm',
    searchQuery: '혼자 듣기 좋은 노래 플레이리스트',
  },
  {
    id: 'emotional',
    label: '감성적',
    mainMood: 'calm',
    searchQuery: '감성 노래 플레이리스트',
  },
  {
    id: 'focus',
    label: '집중',
    mainMood: 'calm',
    searchQuery: '집중할 때 듣는 음악 플레이리스트',
  },
  {
    id: 'indie',
    label: '인디',
    mainMood: 'calm',
    searchQuery: '인디 음악 플레이리스트',
  },
  {
    id: 'sleep',
    label: '잠잘 때',
    mainMood: 'calm',
    searchQuery: '잠잘 때 듣는 음악 플레이리스트',
  },
  // 날씨
  {
    id: 'rainy',
    label: '비 오는 날',
    mainMood: 'weather',
    searchQuery: '비 오는 날 듣기 좋은 노래 플레이리스트',
  },
  {
    id: 'sunny',
    label: '화창한',
    mainMood: 'weather',
    searchQuery: '화창한 날 듣기 좋은 노래 플레이리스트',
  },
  {
    id: 'warm',
    label: '따뜻한',
    mainMood: 'weather',
    searchQuery: '따뜻한 노래 플레이리스트',
  },
  {
    id: 'cloudy',
    label: '흐린',
    mainMood: 'weather',
    searchQuery: '흐린 날 듣기 좋은 노래 플레이리스트',
  },
  {
    id: 'dawn',
    label: '새벽',
    mainMood: 'weather',
    searchQuery: '새벽 감성 노래 플레이리스트',
  },
];
