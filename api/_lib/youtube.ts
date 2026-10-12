// YouTube Data API 응답을 앱에서 쓰는 Playlist 형태로 바꾸는 함수 모음.
// `_`로 시작하는 폴더는 Vercel이 서버리스 함수로 배포하지 않는다.

// 타입만 가져오므로 빌드 시 지워져, 서버 코드에 프론트엔드 코드가 섞이지 않는다.
// entities/playlist의 index.ts는 React 컴포넌트까지 내보내서 서버 tsconfig로 검사할 수 없으므로
// 순수 타입 파일을 직접 가리킨다.
import type { Playlist } from '../../src/entities/playlist/model/types.js';

const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

// SPEC: search.list maxResults=12
export const MAX_RESULTS = 12;

export function buildSearchUrl(query: string, apiKey: string): string {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    // 20분 이상인 영상만 (음악 모음 영상)
    videoDuration: 'long',
    // 퍼가기가 허용된 영상만 (재생 에러 예방)
    videoEmbeddable: 'true',
    maxResults: String(MAX_RESULTS),
    q: query,
    key: apiKey,
  });
  return `${YOUTUBE_SEARCH_URL}?${params.toString()}`;
}

// YouTube는 제목의 특수문자를 HTML 엔티티로 보낸다 (예: `Rock &amp; Roll`).
// 자주 쓰이는 엔티티만 원래 문자로 바꾼다. 한 번에 치환하므로 `&amp;lt;`는 `&lt;`가 된다.
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => HTML_ENTITIES[entity] ?? entity);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

// 큰 썸네일부터 차례로 찾는다
function pickThumbnailUrl(thumbnails: unknown): string | undefined {
  if (!isRecord(thumbnails)) return undefined;
  for (const size of ['high', 'medium', 'default']) {
    const thumbnail = thumbnails[size];
    const url = isRecord(thumbnail) ? getString(thumbnail, 'url') : undefined;
    if (url) return url;
  }
  return undefined;
}

// 필요한 값이 하나라도 없으면 화면에 보여 줄 수 없으므로 null을 반환해 걸러낸다
function toPlaylist(item: unknown): Playlist | null {
  if (!isRecord(item) || !isRecord(item.id) || !isRecord(item.snippet)) return null;

  const id = getString(item.id, 'videoId');
  const title = getString(item.snippet, 'title');
  const channelTitle = getString(item.snippet, 'channelTitle');
  const thumbnailUrl = pickThumbnailUrl(item.snippet.thumbnails);
  if (!id || !title || channelTitle === undefined || !thumbnailUrl) return null;

  return {
    id,
    title: decodeHtmlEntities(title),
    channelTitle: decodeHtmlEntities(channelTitle),
    thumbnailUrl,
  };
}

// search.list 응답 전체를 Playlist 배열로 바꾼다. 응답 형태 자체가 다르면 null을 반환한다
export function toPlaylists(data: unknown): Playlist[] | null {
  if (!isRecord(data) || !Array.isArray(data.items)) return null;
  return data.items
    .map(toPlaylist)
    .filter((playlist): playlist is Playlist => playlist !== null)
    .slice(0, MAX_RESULTS);
}
