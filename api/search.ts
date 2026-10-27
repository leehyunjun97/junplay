// GET /api/search?q=키워드&order=viewCount&pageToken=토큰 (order는 생략하면 추천순, pageToken은 더 보기에서만)
// 프론트엔드 대신 YouTube API를 호출해 API 키를 숨기고, 결과를 { playlists, nextPageToken }으로 바꿔 응답한다.
// 검색 응답에는 조회수가 없어서, 결과 영상들의 조회수를 한 번 더 받아 합친다.
// 이때 설명란·태그도 함께 받아 AI 의심 여부를 판별한다 (설명란·태그는 응답에 넣지 않는다).
import type { PlaylistPage } from '../src/entities/playlist/model/types.js';
import { isAiSuspected } from './_lib/aiSuspicion.js';
import {
  buildSearchUrl,
  buildVideoDetailsUrl,
  isPageToken,
  isSearchOrder,
  toNextPageToken,
  toPlaylists,
  toVideoDetails,
  type VideoDetails,
} from './_lib/youtube.js';

const MAX_QUERY_LENGTH = 100;

// Vercel CDN이 같은 검색어 결과를 24시간 캐싱하게 한다 (모든 사용자가 캐시를 공유)
const SUCCESS_CACHE_CONTROL = 's-maxage=86400, stale-while-revalidate';

// 에러 응답은 캐싱하지 않는다. 일시적인 실패가 24시간 동안 고정되면 안 되기 때문
function errorResponse(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

// 영상 ID별 조회수·설명란·태그를 받는다.
// 실패하면 null (검색 결과는 조회수 없이도 보여 줄 수 있어서 에러로 보지 않는다)
async function fetchVideoDetails(
  videoIds: string[],
  apiKey: string,
): Promise<Map<string, VideoDetails> | null> {
  if (videoIds.length === 0) return new Map();

  try {
    const response = await fetch(buildVideoDetailsUrl(videoIds, apiKey));
    if (!response.ok) {
      console.error(`YouTube 조회수 API 오류: ${response.status}`);
      return null;
    }
    const details = toVideoDetails(await response.json());
    if (!details) {
      console.error('YouTube 조회수 응답 형식이 예상과 다릅니다.');
    }
    return details;
  } catch (error) {
    console.error('YouTube 조회수 API 호출 실패', error);
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  if (!query) {
    return errorResponse(400, '검색어(q)가 필요합니다.');
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return errorResponse(400, `검색어는 ${MAX_QUERY_LENGTH}자 이하로 입력해 주세요.`);
  }
  // 정해진 값만 받는다. 아무 값이나 받으면 값마다 CDN 캐시가 따로 쌓이고 할당량도 쓰게 된다
  const order = searchParams.get('order') ?? 'relevance';
  if (!isSearchOrder(order)) {
    return errorResponse(400, '정렬(order)은 relevance 또는 viewCount만 쓸 수 있습니다.');
  }
  // 더 보기에서 다음 결과를 받을 때만 온다. 정렬과 같은 이유로 형식이 맞는 값만 받는다
  const pageToken = searchParams.get('pageToken') ?? undefined;
  if (pageToken !== undefined && !isPageToken(pageToken)) {
    return errorResponse(400, '페이지 토큰(pageToken) 형식이 올바르지 않습니다.');
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다.');
    return errorResponse(500, '서버 설정 오류입니다.');
  }

  try {
    // 요청 URL에 API 키가 들어 있으므로 URL은 로그에 남기지 않는다
    const youtubeResponse = await fetch(buildSearchUrl(query, apiKey, order, pageToken));
    if (!youtubeResponse.ok) {
      console.error(`YouTube API 오류: ${youtubeResponse.status}`);
      return errorResponse(502, 'YouTube에서 결과를 가져오지 못했습니다.');
    }

    const data: unknown = await youtubeResponse.json();
    const playlists = toPlaylists(data);
    // 다음 결과가 없으면 YouTube가 토큰을 보내지 않는다 (undefined는 JSON 응답에서 빠진다)
    const nextPageToken = toNextPageToken(data);
    if (!playlists) {
      console.error('YouTube API 응답 형식이 예상과 다릅니다.');
      return errorResponse(502, 'YouTube에서 결과를 가져오지 못했습니다.');
    }

    const details = await fetchVideoDetails(
      playlists.map((playlist) => playlist.id),
      apiKey,
    );
    if (!details) {
      // 조회수가 빠진 결과가 24시간 동안 고정되지 않게 캐싱하지 않고, 다음 요청에서 다시 시도한다.
      // AI 의심은 제목·채널명만으로라도 판별한다
      const page: PlaylistPage = {
        playlists: playlists.map((playlist) => ({
          ...playlist,
          isAiSuspected: isAiSuspected(playlist),
        })),
        nextPageToken,
      };
      return Response.json(page, { headers: { 'Cache-Control': 'no-store' } });
    }

    const page: PlaylistPage = {
      playlists: playlists.map((playlist) => {
        const detail = details.get(playlist.id);
        return {
          ...playlist,
          viewCount: detail?.viewCount,
          isAiSuspected: isAiSuspected({
            title: playlist.title,
            channelTitle: playlist.channelTitle,
            description: detail?.description,
            tags: detail?.tags,
          }),
        };
      }),
      nextPageToken,
    };
    return Response.json(page, { headers: { 'Cache-Control': SUCCESS_CACHE_CONTROL } });
  } catch (error) {
    console.error('YouTube API 호출 실패', error);
    return errorResponse(502, 'YouTube에서 결과를 가져오지 못했습니다.');
  }
}
