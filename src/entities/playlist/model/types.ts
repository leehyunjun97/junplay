export interface Playlist {
  id: string; // YouTube videoId (플레이리스트 = 음악 모음 영상 한 개)
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt?: string; // 업로드 날짜 (ISO 형식). 예전에 저장된 좋아요·히스토리에는 없을 수 있다
  viewCount?: number; // 조회수. 예전에 저장된 데이터에 없거나, 조회수를 숨긴 영상이면 없다
  isAiSuspected?: boolean; // AI 의심 여부 (서버에서 판별). 예전에 저장된 데이터에는 없다
}

// /api/search 응답. 다음 결과가 있으면 nextPageToken으로 이어서 받을 수 있다 (더 보기)
export interface PlaylistPage {
  playlists: Playlist[];
  nextPageToken?: string;
}

// 검색 결과 정렬. YouTube search.list의 order 값을 그대로 쓴다 (추천순, 조회순)
export type SearchOrder = 'relevance' | 'viewCount';

export const DEFAULT_SEARCH_ORDER: SearchOrder = 'relevance';
