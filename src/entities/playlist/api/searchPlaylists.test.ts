import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Playlist } from '../model/types';

const fetchMock = vi.fn<typeof fetch>();

const playlists: Playlist[] = [
  {
    id: 'PL1',
    title: '드라이브 플레이리스트',
    channelTitle: '채널',
    thumbnailUrl: 'https://i.ytimg.com/high.jpg',
  },
];

// 캐시가 모듈 안에 있으므로, 테스트마다 모듈을 새로 불러와 빈 캐시에서 시작한다
async function loadSearchPlaylists() {
  vi.resetModules();
  const module = await import('./searchPlaylists');
  return module.searchPlaylists;
}

describe('searchPlaylists', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('/api/search에 검색어를 담아 요청하고 결과를 반환한다', async () => {
    fetchMock.mockResolvedValue(Response.json(playlists));
    const searchPlaylists = await loadSearchPlaylists();

    await expect(searchPlaylists('비 오는 날')).resolves.toEqual(playlists);
    expect(fetchMock).toHaveBeenCalledWith('/api/search?q=%EB%B9%84+%EC%98%A4%EB%8A%94+%EB%82%A0');
  });

  it('같은 검색어를 다시 요청하면 API를 다시 호출하지 않고 캐시를 쓴다', async () => {
    fetchMock.mockResolvedValue(Response.json(playlists));
    const searchPlaylists = await loadSearchPlaylists();

    await searchPlaylists('드라이브');
    await expect(searchPlaylists('드라이브')).resolves.toEqual(playlists);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('응답을 기다리는 중에 같은 검색어가 또 요청돼도 한 번만 호출한다', async () => {
    fetchMock.mockResolvedValue(Response.json(playlists));
    const searchPlaylists = await loadSearchPlaylists();

    await Promise.all([searchPlaylists('드라이브'), searchPlaylists('드라이브')]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('검색어가 다르면 각각 호출한다', async () => {
    fetchMock.mockImplementation(async () => Response.json(playlists));
    const searchPlaylists = await loadSearchPlaylists();

    await searchPlaylists('드라이브');
    await searchPlaylists('아이돌');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('서버가 에러로 응답하면 에러를 던지고, 다음 요청에서 다시 시도한다', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ error: '실패' }, { status: 502 }))
      .mockResolvedValueOnce(Response.json(playlists));
    const searchPlaylists = await loadSearchPlaylists();

    await expect(searchPlaylists('드라이브')).rejects.toThrow('502');
    await expect(searchPlaylists('드라이브')).resolves.toEqual(playlists);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('응답 형식이 올바르지 않으면 에러를 던진다', async () => {
    fetchMock.mockResolvedValue(Response.json([{ id: 'PL1' }]));
    const searchPlaylists = await loadSearchPlaylists();

    await expect(searchPlaylists('드라이브')).rejects.toThrow('형식');
  });
  describe('getCachedPlaylists', () => {
    it('응답이 도착하기 전에는 undefined, 도착한 뒤에는 결과를 바로 돌려준다', async () => {
      fetchMock.mockResolvedValue(Response.json(playlists));
      vi.resetModules();
      const { searchPlaylists, getCachedPlaylists } = await import('./searchPlaylists');

      const request = searchPlaylists('드라이브');
      expect(getCachedPlaylists('드라이브')).toBeUndefined();

      await request;
      expect(getCachedPlaylists('드라이브')).toEqual(playlists);
      // 앞뒤 공백은 같은 검색어로 본다
      expect(getCachedPlaylists('  드라이브 ')).toEqual(playlists);
    });

    it('실패한 검색어는 결과로 남기지 않는다', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
      vi.resetModules();
      const { searchPlaylists, getCachedPlaylists } = await import('./searchPlaylists');

      await expect(searchPlaylists('드라이브')).rejects.toThrow();
      expect(getCachedPlaylists('드라이브')).toBeUndefined();
    });
  });
});
