// 헤더 메뉴 (검색 제외). 데스크톱 헤더와 모바일 드로어가 같은 목록을 쓴다
export const NAV_ITEMS = [
  { to: '/history', label: 'HISTORY' },
  { to: '/my', label: 'MYPLAYLIST' },
  // 내 곡: 담아 둔 순간들이라는 뜻으로 MEMORY라고 부른다
  { to: '/songs', label: 'MEMORY' },
] as const;
