import {
  DEFAULT_SEARCH_ORDER,
  type Playlist,
  type PlaylistPage,
  type SearchOrder,
} from '../model/types';
import { createMockPage } from './mockPlaylists';

// SPEC: search.list maxResults=12
export const MAX_PLAYLIST_RESULTS = 12;

// SPEC F8: 첫 결과 이후 더 보기는 최대 3번 (API 할당량 보호)
export const MAX_EXTRA_PAGES = 3;

// 로딩 상태를 화면에서 확인할 수 있도록 목 응답을 일부러 늦춘다
const MOCK_DELAY_MS = 500;

// `npm run dev:mock`으로 실행하면 true가 된다 (.env.mock). API 할당량을 아끼며 화면 작업을 할 때 쓴다
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// 화면에 보여 줄 검색 결과. 더 보기로 받은 결과까지 이어 붙인 상태다
export interface PlaylistSearchResult {
  playlists: Playlist[];
  // 다음 결과가 있고, 더 보기 횟수가 남아 있으면 true
  canLoadMore: boolean;
}

// 검색어 + 정렬마다 지금까지 받은 결과. 새로고침 전까지 메모리에만 유지된다.
// 다른 페이지에 갔다 돌아왔을 때 "불러오는 중"을 거치지 않고, 더 불러온 결과까지 첫 화면부터 보여 주려고 둔다
interface StoredResult {
  result: PlaylistSearchResult;
  nextPageToken?: string;
  extraPageCount: number;
}
const storedResults = new Map<string, StoredResult>();

// 진행 중인 요청. 응답을 기다리는 중에 같은 요청이 또 와도 호출은 한 번만 나가게 한다
const firstPageRequests = new Map<string, Promise<PlaylistSearchResult>>();
const loadMoreRequests = new Map<string, Promise<PlaylistSearchResult>>();

function isPlaylist(value: unknown): value is Playlist {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'channelTitle' in value &&
    typeof value.channelTitle === 'string' &&
    'thumbnailUrl' in value &&
    typeof value.thumbnailUrl === 'string' &&
    // 업로드 날짜와 조회수는 없을 수 있다. 있으면 타입이 맞는지만 확인한다
    (!('publishedAt' in value) || typeof value.publishedAt === 'string') &&
    (!('viewCount' in value) || typeof value.viewCount === 'number')
  );
}

function isPlaylistPage(value: unknown): value is PlaylistPage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'playlists' in value &&
    Array.isArray(value.playlists) &&
    value.playlists.every(isPlaylist) &&
    (!('nextPageToken' in value) || typeof value.nextPageToken === 'string')
  );
}

async function fetchPage(
  query: string,
  order: SearchOrder,
  pageToken: string | undefined,
): Promise<PlaylistPage> {
  const params = new URLSearchParams({ q: query });
  // 추천순은 서버 기본값이라 붙이지 않는다. 주소가 그대로여서 이미 쌓인 CDN 캐시를 계속 쓸 수 있다
  if (order !== DEFAULT_SEARCH_ORDER) params.set('order', order);
  if (pageToken) params.set('pageToken', pageToken);
  const response = await fetch(`/api/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`플레이리스트 검색 실패: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!isPlaylistPage(data)) {
    throw new Error('플레이리스트 응답 형식이 올바르지 않습니다.');
  }
  return data;
}

async function fetchMockPage(
  query: string,
  order: SearchOrder,
  pageToken: string | undefined,
): Promise<PlaylistPage> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return createMockPage(query, MAX_PLAYLIST_RESULTS, order, pageToken);
}

function requestPage(query: string, order: SearchOrder, pageToken?: string): Promise<PlaylistPage> {
  return USE_MOCK_API ? fetchMockPage(query, order, pageToken) : fetchPage(query, order, pageToken);
}

// 같은 검색어라도 정렬이 다르면 결과가 다르므로 따로 둔다
function toCacheKey(query: string, order: SearchOrder): string {
  return `${order}:${query.trim()}`;
}

function storeResult(
  key: string,
  playlists: Playlist[],
  nextPageToken: string | undefined,
  extraPageCount: number,
): PlaylistSearchResult {
  const result = {
    playlists,
    canLoadMore: nextPageToken !== undefined && extraPageCount < MAX_EXTRA_PAGES,
  };
  storedResults.set(key, { result, nextPageToken, extraPageCount });
  return result;
}

// 검색어로 플레이리스트를 찾는다 (첫 12개). 같은 "검색어 + 정렬"은 다시 요청하지 않고,
// 더 불러온 결과가 있으면 그것까지 돌려준다
export function searchPlaylists(
  query: string,
  order: SearchOrder = DEFAULT_SEARCH_ORDER,
): Promise<PlaylistSearchResult> {
  const key = toCacheKey(query, order);
  const stored = storedResults.get(key);
  if (stored) return Promise.resolve(stored.result);
  const pending = firstPageRequests.get(key);
  if (pending) return pending;

  const request = requestPage(query.trim(), order).then((page) =>
    storeResult(key, page.playlists, page.nextPageToken, 0),
  );
  firstPageRequests.set(key, request);
  // 끝나면(성공이든 실패든) 진행 중 목록에서 지운다. 실패했으면 다음 요청에서 다시 시도할 수 있다
  void request.then(
    () => firstPageRequests.delete(key),
    () => firstPageRequests.delete(key),
  );
  return request;
}

// 다음 12개를 받아 지금까지 받은 결과 뒤에 이어 붙인다. 이미 받은 영상은 빼고 붙인다
// (YouTube 검색은 페이지끼리 같은 영상이 겹칠 수 있다). 실패하면 기존 결과는 그대로 남는다
export function loadMorePlaylists(
  query: string,
  order: SearchOrder = DEFAULT_SEARCH_ORDER,
): Promise<PlaylistSearchResult> {
  const key = toCacheKey(query, order);
  const stored = storedResults.get(key);
  if (!stored) return Promise.reject(new Error('먼저 검색해야 더 불러올 수 있습니다.'));
  if (!stored.result.canLoadMore) return Promise.resolve(stored.result);
  const pending = loadMoreRequests.get(key);
  if (pending) return pending;

  const request = requestPage(query.trim(), order, stored.nextPageToken).then((page) => {
    const knownIds = new Set(stored.result.playlists.map((playlist) => playlist.id));
    const newPlaylists = page.playlists.filter((playlist) => {
      if (knownIds.has(playlist.id)) return false;
      knownIds.add(playlist.id);
      return true;
    });
    return storeResult(
      key,
      [...stored.result.playlists, ...newPlaylists],
      page.nextPageToken,
      stored.extraPageCount + 1,
    );
  });
  loadMoreRequests.set(key, request);
  void request.then(
    () => loadMoreRequests.delete(key),
    () => loadMoreRequests.delete(key),
  );
  return request;
}

// 이미 받아 둔 검색 결과를 바로 꺼낸다. 아직 없거나 요청 중이면 undefined
export function getCachedSearchResult(
  query: string,
  order: SearchOrder = DEFAULT_SEARCH_ORDER,
): PlaylistSearchResult | undefined {
  return storedResults.get(toCacheKey(query, order))?.result;
}
