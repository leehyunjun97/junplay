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

  it('검색 결과를 { playlists } 형태로 응답하고 CDN 캐시 헤더를 붙인다', async () => {
    // 두 번째 호출은 조회수 요청이다. 이 테스트에서는 조회수가 없는 응답을 준다
    fetchMock
      .mockResolvedValueOnce(Response.json(youtubeResponse))
      .mockResolvedValueOnce(Response.json({ items: [] }));

    const response = await GET(request('드라이브'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('s-maxage=86400, stale-while-revalidate');
    expect(await response.json()).toEqual({
      playlists: [
        {
          id: 'VID1',
          title: '드라이브 플레이리스트',
          channelTitle: '채널',
          thumbnailUrl: 'https://i.ytimg.com/high.jpg',
        },
      ],
    });
    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(calledUrl.searchParams.get('q')).toBe('드라이브');
  });

  describe('더 보기', () => {
    function requestWithPageToken(pageToken: string) {
      const url = new URL('http://localhost/api/search');
      url.searchParams.set('q', '드라이브');
      url.searchParams.set('pageToken', pageToken);
      return new Request(url);
    }

    it('다음 결과가 있으면 nextPageToken을 함께 응답한다', async () => {
      fetchMock
        .mockResolvedValueOnce(Response.json({ ...youtubeResponse, nextPageToken: 'CAwQAA' }))
        .mockResolvedValueOnce(Response.json({ items: [] }));

      const response = await GET(request('드라이브'));

      const page = (await response.json()) as { nextPageToken?: string };
      expect(page.nextPageToken).toBe('CAwQAA');
      // 첫 요청에는 pageToken을 보내지 않는다
      const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
      expect(calledUrl.searchParams.has('pageToken')).toBe(false);
    });

    it('pageToken을 받으면 YouTube에 그대로 넘겨 다음 결과를 받는다', async () => {
      fetchMock
        .mockResolvedValueOnce(Response.json(youtubeResponse))
        .mockResolvedValueOnce(Response.json({ items: [] }));

      const response = await GET(requestWithPageToken('CAwQAA'));

      expect(response.status).toBe(200);
      const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
      expect(calledUrl.searchParams.get('pageToken')).toBe('CAwQAA');
    });

    it.each([
      ['비어 있으면', ''],
      ['한글이 섞이면', '토큰'],
      ['공백이 있으면', 'a b'],
      ['100자를 넘으면', 'a'.repeat(101)],
    ])('pageToken이 %s 400으로 응답하고 YouTube를 호출하지 않는다', async (_, pageToken) => {
      const response = await GET(requestWithPageToken(pageToken));

      expect(response.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('조회수', () => {
    const statsResponse = { items: [{ id: 'VID1', statistics: { viewCount: '12345' } }] };

    it('검색 결과 영상들의 조회수를 한 번 더 받아 합쳐서 응답한다', async () => {
      fetchMock
        .mockResolvedValueOnce(Response.json(youtubeResponse))
        .mockResolvedValueOnce(Response.json(statsResponse));

      const response = await GET(request('드라이브'));

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('s-maxage=86400, stale-while-revalidate');
      const { playlists } = (await response.json()) as { playlists: { viewCount?: number }[] };
      expect(playlists[0]?.viewCount).toBe(12345);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const statsUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
      expect(statsUrl.searchParams.get('part')).toBe('statistics');
      expect(statsUrl.searchParams.get('id')).toBe('VID1');
    });

    it('조회수 요청이 실패하면 조회수 없이 결과를 응답하고 캐싱하지 않는다', async () => {
      fetchMock
        .mockResolvedValueOnce(Response.json(youtubeResponse))
        .mockResolvedValueOnce(Response.json({ error: { code: 403 } }, { status: 403 }));

      const response = await GET(request('드라이브'));

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      const { playlists } = (await response.json()) as {
        playlists: { id: string; viewCount?: number }[];
      };
      expect(playlists[0]?.id).toBe('VID1');
      expect(playlists[0]?.viewCount).toBeUndefined();
    });

    it('조회수 요청에서 네트워크 오류가 나도 결과는 응답한다', async () => {
      fetchMock
        .mockResolvedValueOnce(Response.json(youtubeResponse))
        .mockRejectedValueOnce(new TypeError('fetch failed'));

      const response = await GET(request('드라이브'));

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('검색 결과가 없으면 조회수를 요청하지 않는다', async () => {
      fetchMock.mockResolvedValueOnce(Response.json({ items: [] }));

      const response = await GET(request('드라이브'));

      expect(await response.json()).toEqual({ playlists: [] });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('정렬', () => {
    function requestWithOrder(order: string) {
      const url = new URL('http://localhost/api/search');
      url.searchParams.set('q', '드라이브');
      url.searchParams.set('order', order);
      return new Request(url);
    }

    it('order가 없으면 추천순으로 검색한다', async () => {
      fetchMock
        .mockResolvedValueOnce(Response.json(youtubeResponse))
        .mockResolvedValueOnce(Response.json({ items: [] }));

      await GET(request('드라이브'));

      const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
      expect(calledUrl.searchParams.get('order')).toBe('relevance');
    });

    it('조회순을 요청하면 YouTube에도 조회순으로 요청한다', async () => {
      fetchMock
        .mockResolvedValueOnce(Response.json(youtubeResponse))
        .mockResolvedValueOnce(Response.json({ items: [] }));

      const response = await GET(requestWithOrder('viewCount'));

      expect(response.status).toBe(200);
      const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
      expect(calledUrl.searchParams.get('order')).toBe('viewCount');
    });

    it.each([['date'], ['rating'], ['']])(
      'order가 "%s"처럼 정해진 값이 아니면 400으로 응답하고 YouTube를 호출하지 않는다',
      async (order) => {
        const response = await GET(requestWithOrder(order));

        expect(response.status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );
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
