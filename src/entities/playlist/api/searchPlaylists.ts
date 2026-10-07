import type { Playlist } from '../model/types';
import { createMockPlaylists } from './mockPlaylists';

// SPEC: search.list maxResults=12
export const MAX_PLAYLIST_RESULTS = 12;

// 로딩 상태를 화면에서 확인할 수 있도록 목 응답을 일부러 늦춘다
const MOCK_DELAY_MS = 500;

// `npm run dev:mock`으로 실행하면 true가 된다 (.env.mock). API 할당량을 아끼며 화면 작업을 할 때 쓴다
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// 검색어별 결과 캐시. 새로고침 전까지 메모리에만 유지된다.
// 결과가 아닌 Promise를 저장해서, 응답을 기다리는 중에 같은 검색어가 또 요청돼도 호출은 한 번만 나간다.
const cache = new Map<string, Promise<Playlist[]>>();

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
    typeof value.thumbnailUrl === 'string'
  );
}

async function fetchPlaylists(query: string): Promise<Playlist[]> {
  const response = await fetch(`/api/search?${new URLSearchParams({ q: query }).toString()}`);
  if (!response.ok) {
    throw new Error(`플레이리스트 검색 실패: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isPlaylist)) {
    throw new Error('플레이리스트 응답 형식이 올바르지 않습니다.');
  }
  return data;
}

async function fetchMockPlaylists(query: string): Promise<Playlist[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return createMockPlaylists(query, MAX_PLAYLIST_RESULTS);
}

// 검색어로 플레이리스트를 찾는다. 같은 검색어는 다시 요청하지 않고 캐시를 쓴다
export function searchPlaylists(query: string): Promise<Playlist[]> {
  const key = query.trim();
  const cached = cache.get(key);
  if (cached) return cached;

  const request = USE_MOCK_API ? fetchMockPlaylists(key) : fetchPlaylists(key);
  cache.set(key, request);
  // 실패한 요청은 캐시에서 지워서 다시 시도할 수 있게 한다
  request.catch(() => cache.delete(key));
  return request;
}
