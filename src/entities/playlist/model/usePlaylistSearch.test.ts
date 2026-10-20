import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedPlaylists, searchPlaylists } from '../api/searchPlaylists';
import type { Playlist } from './types';
import { usePlaylistSearch } from './usePlaylistSearch';

// 실제 /api/search 대신 캐시 여부와 응답을 테스트에서 정한다
vi.mock('../api/searchPlaylists', () => ({
  searchPlaylists: vi.fn(),
  getCachedPlaylists: vi.fn(),
}));
const mockedSearchPlaylists = vi.mocked(searchPlaylists);
const mockedGetCachedPlaylists = vi.mocked(getCachedPlaylists);

const playlists: Playlist[] = [
  {
    id: 'VID1',
    title: '드라이브 플레이리스트',
    channelTitle: '채널',
    thumbnailUrl: 'https://i.ytimg.com/vi/VID1/hqdefault.jpg',
  },
];

describe('usePlaylistSearch', () => {
  beforeEach(() => {
    mockedSearchPlaylists.mockReset();
    mockedGetCachedPlaylists.mockReset();
  });

  it('검색어 없이 시작하면 대기 상태다', () => {
    const { result } = renderHook(() => usePlaylistSearch());
    expect(result.current.state).toEqual({ status: 'idle' });
  });

  it('처음 검색어의 결과가 캐시에 있으면 첫 화면부터 성공 상태다', () => {
    mockedGetCachedPlaylists.mockReturnValue(playlists);

    const { result } = renderHook(() => usePlaylistSearch('드라이브'));

    expect(result.current.state).toEqual({ status: 'success', playlists });
  });

  it('처음 검색어의 결과가 캐시에 없으면 대기 상태로 시작한다', () => {
    mockedGetCachedPlaylists.mockReturnValue(undefined);

    const { result } = renderHook(() => usePlaylistSearch('드라이브'));

    expect(result.current.state).toEqual({ status: 'idle' });
  });

  it('캐시에 있는 검색어는 로딩 없이 바로 결과를 보여 주고 API를 호출하지 않는다', async () => {
    mockedGetCachedPlaylists.mockReturnValue(playlists);
    const { result } = renderHook(() => usePlaylistSearch());

    await act(() => result.current.search('드라이브'));

    expect(result.current.state).toEqual({ status: 'success', playlists });
    expect(mockedSearchPlaylists).not.toHaveBeenCalled();
  });

  it('캐시에 없는 검색어는 로딩을 거쳐 결과를 보여 준다', async () => {
    mockedGetCachedPlaylists.mockReturnValue(undefined);
    let resolve!: (value: Playlist[]) => void;
    mockedSearchPlaylists.mockReturnValue(new Promise((res) => (resolve = res)));
    const { result } = renderHook(() => usePlaylistSearch());

    let request!: Promise<void>;
    act(() => {
      request = result.current.search('드라이브');
    });
    expect(result.current.state).toEqual({ status: 'loading' });

    await act(async () => {
      resolve(playlists);
      await request;
    });
    expect(result.current.state).toEqual({ status: 'success', playlists });
  });
});
