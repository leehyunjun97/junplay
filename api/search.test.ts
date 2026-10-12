// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './search.js';

// 실제 YouTube는 호출하지 않는다. fetch를 가짜로 바꾸고, API 키도 가짜 값을 쓴다
const fetchMock = vi.fn<typeof fetch>();

function request(query?: string) {
  const url = new URL('http://localhost/api/search');
  if (query !== undefined) url.searchParams.set('q', query);
  return new Request(url);
}

const youtubeResponse = {
  items: [
    {
      id: { kind: 'youtube#video', videoId: 'VID1' },
      snippet: {
        title: '드라이브 플레이리스트',
        channelTitle: '채널',
        thumbnails: { high: { url: 'https://i.ytimg.com/high.jpg' } },
      },
    },
  ],
};

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('YOUTUBE_API_KEY', 'test-key');
    // 에러 로그가 테스트 출력에 섞이지 않게 한다
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('검색 결과를 Playlist 배열로 응답하고 CDN 캐시 헤더를 붙인다', async () => {
    fetchMock.mockResolvedValue(Response.json(youtubeResponse));

    const response = await GET(request('드라이브'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('s-maxage=86400, stale-while-revalidate');
    expect(await response.json()).toEqual([
      {
        id: 'VID1',
        title: '드라이브 플레이리스트',
        channelTitle: '채널',
        thumbnailUrl: 'https://i.ytimg.com/high.jpg',
      },
    ]);
    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(calledUrl.searchParams.get('q')).toBe('드라이브');
  });

  it.each([
    ['q가 없으면', undefined],
    ['q가 공백뿐이면', '   '],
    ['q가 100자를 넘으면', 'a'.repeat(101)],
  ])('%s 400으로 응답하고 YouTube를 호출하지 않는다', async (_, query) => {
    const response = await GET(request(query));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('API 키가 없으면 500으로 응답하고 응답에 키 이름을 노출하지 않는다', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', '');

    const response = await GET(request('드라이브'));

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('YOUTUBE_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('YouTube가 에러로 응답하면 502로 응답하고 캐싱하지 않는다', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: { code: 403 } }, { status: 403 }));

    const response = await GET(request('드라이브'));

    expect(response.status).toBe(502);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('YouTube 응답 형태가 다르면 502로 응답한다', async () => {
    fetchMock.mockResolvedValue(Response.json({ unexpected: true }));

    const response = await GET(request('드라이브'));

    expect(response.status).toBe(502);
  });

  it('네트워크 오류가 나면 502로 응답한다', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const response = await GET(request('드라이브'));

    expect(response.status).toBe(502);
  });
});
