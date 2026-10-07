export type MainMood = 'exciting' | 'calm' | 'weather';

// 화면에 보여 줄 메인 분위기 정보
export interface MainMoodOption {
  id: MainMood;
  label: string;
  emoji: string;
}

export interface SubMood {
  id: string; // 예: 'drive'
  label: string; // 예: '드라이브'
  mainMood: MainMood;
  searchQuery: string; // YouTube 검색에 사용할 키워드
}
