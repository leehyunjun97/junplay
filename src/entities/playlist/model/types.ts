export interface Playlist {
  id: string; // YouTube videoId (플레이리스트 = 음악 모음 영상 한 개)
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt?: string; // 업로드 날짜 (ISO 형식). 예전에 저장된 좋아요·히스토리에는 없을 수 있다
  viewCount?: number; // 조회수. 예전에 저장된 데이터에 없거나, 조회수를 숨긴 영상이면 없다
}
