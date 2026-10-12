import type { Playlist } from '../model/types';

// 목 모드에서도 실제 재생을 확인할 수 있도록 첫 번째 카드는 실제 YouTube 영상을 쓴다.
// 영상 재생(IFrame API)은 API 키와 할당량이 필요 없다.
const PLAYABLE_SAMPLE: Playlist = {
  id: 'AcbC3bhPgzY',
  title: 'Playlist 공부하며 듣는 따뜻한 플레이리스트',
  channelTitle: '히히덕',
  thumbnailUrl: 'https://i.ytimg.com/vi/AcbC3bhPgzY/hqdefault.jpg',
};

// 개발용 목 데이터. 검색어마다 다른 썸네일이 나오도록 검색어를 picsum의 seed로 쓴다.
// 첫 번째 카드를 뺀 나머지는 가짜 ID라서 재생하면 에러가 난다 (에러 화면 확인용)
export function createMockPlaylists(query: string, count: number): Playlist[] {
  const fakePlaylists = Array.from({ length: count - 1 }, (_, index) => {
    const id = `mock-${query}-${index + 2}`;
    return {
      id,
      title: `${query} #${index + 2}`,
      channelTitle: `목 채널 ${index + 2}`,
      thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(id)}/480/270`,
    };
  });
  return [PLAYABLE_SAMPLE, ...fakePlaylists];
}
