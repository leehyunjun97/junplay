import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Playlist, PlaylistPage } from '../model/types';

const fetchMock = vi.fn<typeof fetch>();

const playlists: Playlist[] = [
  {
    id: 'PL1',
    title: '드라이브 플레이리스트',
    channelTitle: '채널',
    thumbnailUrl: 'https://i.ytimg.com/high.jpg',
  },
];

function createPlaylist(id: string): Playlist {
  return { ...playlists[0]!, id };
}

// 서버(/api/search) 응답. 호출할 때마다 새 Response를 만들어야 본문을 다시 읽을 수 있다
function respondWith(page: PlaylistPage) {
  return async () => Response.json(page);
}

// 캐시가 모듈 안에 있으므로, 테스트마다 모듈을 새로 불러와 빈 캐시에서 시작한다
async function loadModule() {
  vi.resetModules();
  return import('./searchPlaylists');
}

async function loadSearchPlaylists() {
  return (await loadModule()).searchPlaylists;
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
    fetchMock.mockImplementation(respondWith({ playlists }));
    const searchPlaylists = await loadSearchPlaylists();

    await expect(searchPlaylists('비 오는 날')).resolves.toEqual({
      playlists,
      canLoadMore: false,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/search?q=%EB%B9%84+%EC%98%A4%EB%8A%94+%EB%82%A0');
  });

  it('같은 검색어를 다시 요청하면 API를 다시 호출하지 않고 캐시를 쓴다', async () => {
    fetchMock.mockImplementation(respondWith({ playlists }));
    const searchPlaylists = await loadSearchPlaylists();

    await searchPlaylists('드라이브');
    await expect(searchPlaylists('드라이브')).resolves.toEqual({ playlists, canLoadMore: false });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('응답을 기다리는 중에 같은 검색어가 또 요청돼도 한 번만 호출한다', async () => {
    fetchMock.mockImplementation(respondWith({ playlists }));
    const searchPlaylists = await loadSearchPlaylists();

    await Promise.all([searchPlaylists('드라이브'), searchPlaylists('드라이브')]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('검색어가 다르면 각각 호출한다', async () => {
    fetchMock.mockImplementation(respondWith({ playlists }));
    const searchPlaylists = await loadSearchPlaylists();

    await searchPlaylists('드라이브');
    await searchPlaylists('아이돌');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('서버가 에러로 응답하면 에러를 던지고, 다음 요청에서 다시 시도한다', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ error: '실패' }, { status: 502 }))
      .mockResolvedValueOnce(Response.json({ playlists }));
    const searchPlaylists = await loadSearchPlaylists();

    await expect(searchPlaylists('드라이브')).rejects.toThrow('502');
    await expect(searchPlaylists('드라이브')).resolves.toEqual({ playlists, canLoadMore: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['예전 형식(배열)이면', playlists],
    ['플레이리스트에 필요한 값이 빠지면', { playlists: [{ id: 'PL1' }] }],
    ['nextPageToken이 문자열이 아니면', { playlists, nextPageToken: 123 }],
  ])('응답이 %s 형식 에러를 던진다', async (_, body) => {
    fetchMock.mockImplementation(async () => Response.json(body));
    const searchPlaylists = await loadSearchPlaylists();

    await expect(searchPlaylists('드라이브')).rejects.toThrow('형식');
  });

  it('조회순이면 order를 담아 요청하고, 추천순이면 order를 붙이지 않는다', async () => {
    fetchMock.mockImplementation(respondWith({ playlists }));
    const searchPlaylists = await loadSearchPlaylists();

    await searchPlaylists('재즈', 'viewCount');
    await searchPlaylists('재즈', 'relevance');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/search?q=%EC%9E%AC%EC%A6%88&order=viewCount',
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/search?q=%EC%9E%AC%EC%A6%88');
  });

  it('같은 검색어라도 정렬이 다르면 캐시를 따로 쓴다', async () => {
    fetchMock.mockImplementation(respondWith({ playlists }));
    const searchPlaylists = await loadSearchPlaylists();

    await searchPlaylists('재즈', 'relevance');
    await searchPlaylists('재즈', 'viewCount');
    await searchPlaylists('재즈', 'viewCount');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('업로드 날짜와 조회수가 있으면 함께 반환한다', async () => {
    const withMeta = [{ ...playlists[0]!, publishedAt: '2025-10-01T12:00:00Z', viewCount: 12345 }];
    fetchMock.mockImplementation(respondWith({ playlists: withMeta }));
    const searchPlaylists = await loadSearchPlaylists();

    await expect(searchPlaylists('드라이브')).resolves.toEqual({
      playlists: withMeta,
      canLoadMore: false,
    });
  });

  it.each([
    ['업로드 날짜가 문자열이 아니면', { publishedAt: 20251001 }],
    ['조회수가 숫자가 아니면', { viewCount: '12345' }],
  ])('%s 에러를 던진다', async (_, meta) => {
    fetchMock.mockImplementation(async () =>
      Response.json({ playlists: [{ ...playlists[0], ...meta }] }),
    );
    const searchPlaylists = await loadSearchPlaylists();

    await expect(searchPlaylists('드라이브')).rejects.toThrow('형식');
  });

  it('다음 결과 토큰이 있으면 더 불러올 수 있다고 알려 준다', async () => {
    fetchMock.mockImplementation(respondWith({ playlists, nextPageToken: 'PAGE2' }));
    const searchPlaylists = await loadSearchPlaylists();

    await expect(searchPlaylists('드라이브')).resolves.toEqual({ playlists, canLoadMore: true });
  });

  describe('loadMorePlaylists', () => {
    it('다음 결과 토큰으로 요청해 기존 결과 뒤에 이어 붙인다', async () => {
      fetchMock
        .mockImplementationOnce(respondWith({ playlists, nextPageToken: 'PAGE2' }))
        .mockImplementationOnce(
          respondWith({ playlists: [createPlaylist('PL2')], nextPageToken: 'PAGE3' }),
        );
      const { searchPlaylists, loadMorePlaylists } = await loadModule();
      await searchPlaylists('드라이브', 'viewCount');

      const result = await loadMorePlaylists('드라이브', 'viewCount');

      expect(result.playlists.map((playlist) => playlist.id)).toEqual(['PL1', 'PL2']);
      expect(result.canLoadMore).toBe(true);
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/search?q=%EB%93%9C%EB%9D%BC%EC%9D%B4%EB%B8%8C&order=viewCount&pageToken=PAGE2',
      );
    });

    it('이미 받은 영상이 다음 결과에 또 오면 빼고 붙인다', async () => {
      fetchMock
        .mockImplementationOnce(respondWith({ playlists, nextPageToken: 'PAGE2' }))
        .mockImplementationOnce(
          respondWith({ playlists: [createPlaylist('PL1'), createPlaylist('PL2')] }),
        );
      const { searchPlaylists, loadMorePlaylists } = await loadModule();
      await searchPlaylists('드라이브');

      const result = await loadMorePlaylists('드라이브');

      expect(result.playlists.map((playlist) => playlist.id)).toEqual(['PL1', 'PL2']);
    });

    it('다음 결과 토큰이 없으면 더 불러올 수 없다', async () => {
      fetchMock
        .mockImplementationOnce(respondWith({ playlists, nextPageToken: 'PAGE2' }))
        .mockImplementationOnce(respondWith({ playlists: [createPlaylist('PL2')] }));
      const { searchPlaylists, loadMorePlaylists } = await loadModule();
      await searchPlaylists('드라이브');

      await expect(loadMorePlaylists('드라이브')).resolves.toMatchObject({ canLoadMore: false });
    });

    it('첫 결과 이후 3번까지만 더 불러오고, 그 뒤에는 요청하지 않는다', async () => {
      let page = 0;
      fetchMock.mockImplementation(async () => {
        page += 1;
        return Response.json({ playlists: [createPlaylist(`PL${page}`)], nextPageToken: 'NEXT' });
      });
      const { searchPlaylists, loadMorePlaylists, MAX_EXTRA_PAGES } = await loadModule();
      await searchPlaylists('드라이브');

      await loadMorePlaylists('드라이브');
      await loadMorePlaylists('드라이브');
      const third = await loadMorePlaylists('드라이브');
      const fourth = await loadMorePlaylists('드라이브');

      expect(MAX_EXTRA_PAGES).toBe(3);
      expect(third.playlists).toHaveLength(4);
      expect(third.canLoadMore).toBe(false);
      expect(fourth).toBe(third);
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('실패하면 에러를 던지고 기존 결과는 그대로 남아, 다시 시도할 수 있다', async () => {
      fetchMock
        .mockImplementationOnce(respondWith({ playlists, nextPageToken: 'PAGE2' }))
        .mockResolvedValueOnce(new Response(null, { status: 502 }))
        .mockImplementationOnce(respondWith({ playlists: [createPlaylist('PL2')] }));
      const { searchPlaylists, loadMorePlaylists, getCachedSearchResult } = await loadModule();
      await searchPlaylists('드라이브');

      await expect(loadMorePlaylists('드라이브')).rejects.toThrow('502');
      expect(getCachedSearchResult('드라이브')).toEqual({ playlists, canLoadMore: true });

      const retried = await loadMorePlaylists('드라이브');
      expect(retried.playlists.map((playlist) => playlist.id)).toEqual(['PL1', 'PL2']);
    });

    it('검색하기 전에는 더 불러올 수 없다', async () => {
      const { loadMorePlaylists } = await loadModule();

      await expect(loadMorePlaylists('드라이브')).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('getCachedSearchResult', () => {
    it('응답이 도착하기 전에는 undefined, 도착한 뒤에는 결과를 바로 돌려준다', async () => {
      fetchMock.mockImplementation(respondWith({ playlists }));
      const { searchPlaylists, getCachedSearchResult } = await loadModule();

      const request = searchPlaylists('드라이브');
      expect(getCachedSearchResult('드라이브')).toBeUndefined();

      await request;
      expect(getCachedSearchResult('드라이브')).toEqual({ playlists, canLoadMore: false });
      // 앞뒤 공백은 같은 검색어로 본다
      expect(getCachedSearchResult('  드라이브 ')).toEqual({ playlists, canLoadMore: false });
    });

    it('실패한 검색어는 결과로 남기지 않는다', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
      const { searchPlaylists, getCachedSearchResult } = await loadModule();

      await expect(searchPlaylists('드라이브')).rejects.toThrow();
      expect(getCachedSearchResult('드라이브')).toBeUndefined();
    });

    it('더 불러온 결과까지 돌려줘서, 다른 페이지에 다녀와도 이어 붙인 결과가 남는다', async () => {
      fetchMock
        .mockImplementationOnce(respondWith({ playlists, nextPageToken: 'PAGE2' }))
        .mockImplementationOnce(respondWith({ playlists: [createPlaylist('PL2')] }));
      const { searchPlaylists, loadMorePlaylists, getCachedSearchResult } = await loadModule();
      await searchPlaylists('드라이브');
      await loadMorePlaylists('드라이브');

      expect(getCachedSearchResult('드라이브')?.playlists).toHaveLength(2);
      // 다시 검색해도 처음 12개로 돌아가지 않고 이어 붙인 결과를 준다
      await expect(searchPlaylists('드라이브')).resolves.toMatchObject({
        playlists: [{ id: 'PL1' }, { id: 'PL2' }],
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
