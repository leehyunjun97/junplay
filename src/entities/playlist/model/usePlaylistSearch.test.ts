import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCachedSearchResult,
  loadMorePlaylists,
  searchPlaylists,
  type PlaylistSearchResult,
} from '../api/searchPlaylists';
import type { Playlist } from './types';
import { usePlaylistSearch } from './usePlaylistSearch';

// 실제 /api/search 대신 캐시 여부와 응답을 테스트에서 정한다
vi.mock('../api/searchPlaylists', () => ({
  searchPlaylists: vi.fn(),
  loadMorePlaylists: vi.fn(),
  getCachedSearchResult: vi.fn(),
}));
const mockedSearchPlaylists = vi.mocked(searchPlaylists);
const mockedLoadMorePlaylists = vi.mocked(loadMorePlaylists);
const mockedGetCachedSearchResult = vi.mocked(getCachedSearchResult);

const playlists: Playlist[] = [
  {
    id: 'VID1',
    title: '드라이브 플레이리스트',
    channelTitle: '채널',
    thumbnailUrl: 'https://i.ytimg.com/vi/VID1/hqdefault.jpg',
  },
];
const result: PlaylistSearchResult = { playlists, canLoadMore: false };
const successState = { status: 'success', playlists, canLoadMore: false, loadMoreStatus: 'idle' };

describe('usePlaylistSearch', () => {
  beforeEach(() => {
    mockedSearchPlaylists.mockReset();
    mockedLoadMorePlaylists.mockReset();
    mockedGetCachedSearchResult.mockReset();
  });

  it('검색어 없이 시작하면 대기 상태다', () => {
    const { result: hook } = renderHook(() => usePlaylistSearch());
    expect(hook.current.state).toEqual({ status: 'idle' });
  });

  it('처음 검색어의 결과가 캐시에 있으면 첫 화면부터 성공 상태다', () => {
    mockedGetCachedSearchResult.mockReturnValue(result);

    const { result: hook } = renderHook(() => usePlaylistSearch('드라이브'));

    expect(hook.current.state).toEqual(successState);
  });

  it('처음 검색어의 결과가 캐시에 없으면 대기 상태로 시작한다', () => {
    mockedGetCachedSearchResult.mockReturnValue(undefined);

    const { result: hook } = renderHook(() => usePlaylistSearch('드라이브'));

    expect(hook.current.state).toEqual({ status: 'idle' });
  });

  it('캐시에 있는 검색어는 로딩 없이 바로 결과를 보여 주고 API를 호출하지 않는다', async () => {
    mockedGetCachedSearchResult.mockReturnValue(result);
    const { result: hook } = renderHook(() => usePlaylistSearch());

    await act(() => hook.current.search('드라이브'));

    expect(hook.current.state).toEqual(successState);
    expect(mockedSearchPlaylists).not.toHaveBeenCalled();
  });

  it('캐시에 없는 검색어는 로딩을 거쳐 결과를 보여 준다', async () => {
    mockedGetCachedSearchResult.mockReturnValue(undefined);
    let resolve!: (value: PlaylistSearchResult) => void;
    mockedSearchPlaylists.mockReturnValue(new Promise((res) => (resolve = res)));
    const { result: hook } = renderHook(() => usePlaylistSearch());

    let request!: Promise<void>;
    act(() => {
      request = hook.current.search('드라이브');
    });
    expect(hook.current.state).toEqual({ status: 'loading' });

    await act(async () => {
      resolve(result);
      await request;
    });
    expect(hook.current.state).toEqual(successState);
  });

  describe('더 보기', () => {
    const morePlaylists: Playlist[] = [
      ...playlists,
      { ...playlists[0]!, id: 'VID2', title: '두 번째 플레이리스트' },
    ];

    it('지금 검색어와 정렬로 다음 결과를 받아, 불러오는 중을 거쳐 결과를 바꾼다', async () => {
      mockedGetCachedSearchResult.mockReturnValue({ playlists, canLoadMore: true });
      let resolve!: (value: PlaylistSearchResult) => void;
      mockedLoadMorePlaylists.mockReturnValue(new Promise((res) => (resolve = res)));
      const { result: hook } = renderHook(() => usePlaylistSearch());
      await act(() => hook.current.search('드라이브', 'viewCount'));

      let request!: Promise<void>;
      act(() => {
        request = hook.current.loadMore();
      });
      expect(hook.current.state).toMatchObject({ playlists, loadMoreStatus: 'loading' });

      await act(async () => {
        resolve({ playlists: morePlaylists, canLoadMore: false });
        await request;
      });
      expect(mockedLoadMorePlaylists).toHaveBeenCalledWith('드라이브', 'viewCount');
      expect(hook.current.state).toEqual({
        status: 'success',
        playlists: morePlaylists,
        canLoadMore: false,
        loadMoreStatus: 'idle',
      });
    });

    it('실패하면 기존 결과는 그대로 두고 더 보기만 실패 상태가 된다', async () => {
      mockedGetCachedSearchResult.mockReturnValue({ playlists, canLoadMore: true });
      mockedLoadMorePlaylists.mockRejectedValue(new Error('실패'));
      const { result: hook } = renderHook(() => usePlaylistSearch());
      await act(() => hook.current.search('드라이브'));

      await act(() => hook.current.loadMore());

      expect(hook.current.state).toEqual({
        status: 'success',
        playlists,
        canLoadMore: true,
        loadMoreStatus: 'error',
      });
    });

    it('기다리는 중에 다른 검색으로 바뀌면 늦게 온 결과를 버린다', async () => {
      mockedGetCachedSearchResult.mockImplementation((query) =>
        query === '드라이브' ? { playlists, canLoadMore: true } : undefined,
      );
      let resolve!: (value: PlaylistSearchResult) => void;
      mockedLoadMorePlaylists.mockReturnValue(new Promise((res) => (resolve = res)));
      mockedSearchPlaylists.mockReturnValue(new Promise(() => {}));
      const { result: hook } = renderHook(() => usePlaylistSearch());
      await act(() => hook.current.search('드라이브'));

      let request!: Promise<void>;
      act(() => {
        request = hook.current.loadMore();
      });
      act(() => {
        void hook.current.search('아이돌');
      });
      await act(async () => {
        resolve({ playlists: morePlaylists, canLoadMore: false });
        await request;
      });

      expect(hook.current.state).toEqual({ status: 'loading' });
    });
  });
});
