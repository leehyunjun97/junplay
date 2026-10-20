import type { Playlist } from '../model/types';

// 목 모드에서도 실제 재생을 확인할 수 있도록 앞의 두 카드는 실제 YouTube 영상을 쓴다.
// 두 개인 이유: 재생 중에 다른 영상으로 바꾸는 동작(이전/다음, 카드 교체)도 확인할 수 있어야 해서.
// 영상 재생(IFrame API)은 API 키와 할당량이 필요 없다.
const PLAYABLE_SAMPLES: Playlist[] = [
  {
    id: 'AcbC3bhPgzY',
    title: 'Playlist 공부하며 듣는 따뜻한 플레이리스트',
    channelTitle: '히히덕',
    thumbnailUrl: 'https://i.ytimg.com/vi/AcbC3bhPgzY/hqdefault.jpg',
  },
  {
    id: '_G5NFSiaZQk',
    title: 'PLAYLIST 잠깐 왔다가 사라지는 계절처럼, 머물렀다 가는 사람들처럼',
    channelTitle: '인디인디 In The Indie',
    thumbnailUrl: 'https://i.ytimg.com/vi/_G5NFSiaZQk/hqdefault.jpg',
  },
];

// 개발용 목 데이터. 검색어마다 다른 썸네일이 나오도록 검색어를 picsum의 seed로 쓴다.
// 실제 영상 뒤의 나머지는 가짜 ID라서 재생하면 에러가 난다 (에러 화면 확인용)
export function createMockPlaylists(query: string, count: number): Playlist[] {
  const fakeCount = Math.max(0, count - PLAYABLE_SAMPLES.length);
  const fakePlaylists = Array.from({ length: fakeCount }, (_, index) => {
    const number = index + PLAYABLE_SAMPLES.length + 1;
    const id = `mock-${query}-${number}`;
    return {
      id,
      title: `${query} #${number}`,
      channelTitle: `목 채널 ${number}`,
      thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(id)}/480/270`,
    };
  });
  return [...PLAYABLE_SAMPLES, ...fakePlaylists].slice(0, count);
}
