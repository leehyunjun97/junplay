import type { Playlist } from '../model/types';
import { createMockPlaylists } from './mockPlaylists';

// SPEC: search.list maxResults=12
export const MAX_PLAYLIST_RESULTS = 12;

// 로딩 상태를 화면에서 확인할 수 있도록 응답을 일부러 늦춘다
const MOCK_DELAY_MS = 500;

// 검색어로 플레이리스트를 찾는다.
// 지금은 목 데이터를 반환하고, 4단계에서 `/api/search` 호출로 내부만 바꾼다.
export async function searchPlaylists(query: string): Promise<Playlist[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return createMockPlaylists(query, MAX_PLAYLIST_RESULTS);
}
