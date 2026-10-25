import type { Playlist, SearchOrder } from '../model/types';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// 지금으로부터 ms만큼 전의 날짜 (ISO 형식)
function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

// 목 모드에서도 실제 재생을 확인할 수 있도록 앞의 두 카드는 실제 YouTube 영상을 쓴다.
// 두 개인 이유: 재생 중에 다른 영상으로 바꾸는 동작(이전/다음, 카드 교체)도 확인할 수 있어야 해서.
// 영상 재생(IFrame API)은 API 키와 할당량이 필요 없다.
// 조회수와 업로드 날짜는 화면 확인용 임의 값이다
function createPlayableSamples(): Playlist[] {
  return [
    {
      id: 'AcbC3bhPgzY',
      title: 'Playlist 공부하며 듣는 따뜻한 플레이리스트',
      channelTitle: '히히덕',
      thumbnailUrl: 'https://i.ytimg.com/vi/AcbC3bhPgzY/hqdefault.jpg',
      publishedAt: ago(3 * DAY_MS),
      viewCount: 1_234_567,
    },
    {
      id: '_G5NFSiaZQk',
      title: 'PLAYLIST 잠깐 왔다가 사라지는 계절처럼, 머물렀다 가는 사람들처럼',
      channelTitle: '인디인디 In The Indie',
      thumbnailUrl: 'https://i.ytimg.com/vi/_G5NFSiaZQk/hqdefault.jpg',
      publishedAt: ago(400 * DAY_MS),
      viewCount: 98_765,
    },
  ];
}

// 카드 표시를 확인할 수 있도록 가짜 카드마다 조회수·업로드 날짜를 돌아가며 다르게 준다.
// 마지막 경우는 값이 없는 예전 데이터(좋아요·히스토리)를 흉내 낸다
function createMockMeta(number: number): Pick<Playlist, 'publishedAt' | 'viewCount'> {
  switch (number % 4) {
    case 0:
      return { publishedAt: ago(5 * HOUR_MS), viewCount: 832 };
    case 1:
      return { publishedAt: ago(6 * DAY_MS), viewCount: 45_300 };
    case 2:
      return { publishedAt: ago(90 * DAY_MS), viewCount: 230_000_000 };
    default:
      return {};
  }
}

// 개발용 목 데이터. 검색어마다 다른 썸네일이 나오도록 검색어를 picsum의 seed로 쓴다.
// 실제 영상 뒤의 나머지는 가짜 ID라서 재생하면 에러가 난다 (에러 화면 확인용).
// 조회순이면 조회수가 많은 순으로 다시 늘어놔서, 정렬을 바꾸면 화면에서 차이가 보이게 한다
export function createMockPlaylists(
  query: string,
  count: number,
  order: SearchOrder = 'relevance',
): Playlist[] {
  const playableSamples = createPlayableSamples();
  const fakeCount = Math.max(0, count - playableSamples.length);
  const fakePlaylists = Array.from({ length: fakeCount }, (_, index) => {
    const number = index + playableSamples.length + 1;
    const id = `mock-${query}-${number}`;
    return {
      id,
      title: `${query} #${number}`,
      channelTitle: `목 채널 ${number}`,
      thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(id)}/480/270`,
      ...createMockMeta(number),
    };
  });
  const playlists = [...playableSamples, ...fakePlaylists].slice(0, count);
  if (order === 'viewCount') {
    // 조회수가 없는 항목은 맨 뒤로 보낸다
    return playlists.toSorted((a, b) => (b.viewCount ?? -1) - (a.viewCount ?? -1));
  }
  return playlists;
}
