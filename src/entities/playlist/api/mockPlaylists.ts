import type { Playlist } from '../model/types';

// 개발용 목 데이터. 검색어마다 다른 썸네일이 나오도록 검색어를 picsum의 seed로 쓴다
export function createMockPlaylists(query: string, count: number): Playlist[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `mock-${query}-${index + 1}`;
    return {
      id,
      title: `${query} #${index + 1}`,
      channelTitle: `목 채널 ${index + 1}`,
      thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(id)}/480/270`,
    };
  });
}
