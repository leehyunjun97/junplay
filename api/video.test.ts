// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './video.js';

// 실제 YouTube는 호출하지 않는다. fetch를 가짜로 바꾸고, API 키도 가짜 값을 쓴다
const fetchMock = vi.fn<typeof fetch>();

const VIDEO_ID = 'AcbC3bhPgzY';

function request(id?: string) {
  const url = new URL('http://localhost/api/video');
  if (id !== undefined) url.searchParams.set('id', id);
  return new Request(url);
}

function youtubeResponse(description: string) {
  return { items: [{ snippet: { description } }] };
}

describe('GET /api/video', () => {
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

  it('설명란을 타임라인으로 바꿔 응답하고 CDN 캐시 헤더를 붙인다', async () => {
    fetchMock.mockResolvedValue(Response.json(youtubeResponse('00:00 곡1\n03:25 곡2')));

    const response = await GET(request(VIDEO_ID));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('s-maxage=86400, stale-while-revalidate');
    expect(await response.json()).toEqual([
      { seconds: 0, label: '곡1' },
      { seconds: 205, label: '곡2' },
    ]);
    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(calledUrl.searchParams.get('id')).toBe(VIDEO_ID);
  });

  it('설명란에 타임스탬프가 없으면 빈 배열로 응답한다', async () => {
    fetchMock.mockResolvedValue(Response.json(youtubeResponse('시간 정보 없음')));

    const response = await GET(request(VIDEO_ID));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it.each([
    ['id가 없으면', undefined],
    ['id가 11자가 아니면', 'short'],
    ['id에 허용되지 않는 문자가 있으면', 'AcbC3bhPgz!'],
  ])('%s 400으로 응답하고 YouTube를 호출하지 않는다', async (_, id) => {
    const response = await GET(request(id));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('API 키가 없으면 500으로 응답하고 응답에 키 이름을 노출하지 않는다', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', '');

    const response = await GET(request(VIDEO_ID));

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('YOUTUBE_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('영상이 없으면 404로 응답한다', async () => {
    fetchMock.mockResolvedValue(Response.json({ items: [] }));

    const response = await GET(request(VIDEO_ID));

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('YouTube가 에러로 응답하면 502로 응답하고 캐싱하지 않는다', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: { code: 403 } }, { status: 403 }));

    const response = await GET(request(VIDEO_ID));

    expect(response.status).toBe(502);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('YouTube 응답 형태가 다르면 502로 응답한다', async () => {
    fetchMock.mockResolvedValue(Response.json({ unexpected: true }));

    const response = await GET(request(VIDEO_ID));

    expect(response.status).toBe(502);
  });

  it('네트워크 오류가 나면 502로 응답한다', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const response = await GET(request(VIDEO_ID));

    expect(response.status).toBe(502);
  });
});
