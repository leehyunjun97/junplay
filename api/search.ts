// GET /api/search?q=키워드
// 프론트엔드 대신 YouTube API를 호출해 API 키를 숨기고, 결과를 Playlist[]로 바꿔 응답한다.
// 검색 응답에는 조회수가 없어서, 결과 영상들의 조회수를 한 번 더 받아 합친다.
import { buildSearchUrl, buildVideoStatsUrl, toPlaylists, toViewCounts } from './_lib/youtube.js';

const MAX_QUERY_LENGTH = 100;

// Vercel CDN이 같은 검색어 결과를 24시간 캐싱하게 한다 (모든 사용자가 캐시를 공유)
const SUCCESS_CACHE_CONTROL = 's-maxage=86400, stale-while-revalidate';

// 에러 응답은 캐싱하지 않는다. 일시적인 실패가 24시간 동안 고정되면 안 되기 때문
function errorResponse(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

// 영상 ID별 조회수를 받는다. 실패하면 null (검색 결과는 조회수 없이도 보여 줄 수 있어서 에러로 보지 않는다)
async function fetchViewCounts(
  videoIds: string[],
  apiKey: string,
): Promise<Map<string, number> | null> {
  if (videoIds.length === 0) return new Map();

  try {
    const response = await fetch(buildVideoStatsUrl(videoIds, apiKey));
    if (!response.ok) {
      console.error(`YouTube 조회수 API 오류: ${response.status}`);
      return null;
    }
    const viewCounts = toViewCounts(await response.json());
    if (!viewCounts) {
      console.error('YouTube 조회수 응답 형식이 예상과 다릅니다.');
    }
    return viewCounts;
  } catch (error) {
    console.error('YouTube 조회수 API 호출 실패', error);
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (!query) {
    return errorResponse(400, '검색어(q)가 필요합니다.');
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return errorResponse(400, `검색어는 ${MAX_QUERY_LENGTH}자 이하로 입력해 주세요.`);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다.');
    return errorResponse(500, '서버 설정 오류입니다.');
  }

  try {
    // 요청 URL에 API 키가 들어 있으므로 URL은 로그에 남기지 않는다
    const youtubeResponse = await fetch(buildSearchUrl(query, apiKey));
    if (!youtubeResponse.ok) {
      console.error(`YouTube API 오류: ${youtubeResponse.status}`);
      return errorResponse(502, 'YouTube에서 결과를 가져오지 못했습니다.');
    }

    const playlists = toPlaylists(await youtubeResponse.json());
    if (!playlists) {
      console.error('YouTube API 응답 형식이 예상과 다릅니다.');
      return errorResponse(502, 'YouTube에서 결과를 가져오지 못했습니다.');
    }

    const viewCounts = await fetchViewCounts(
      playlists.map((playlist) => playlist.id),
      apiKey,
    );
    if (!viewCounts) {
      // 조회수가 빠진 결과가 24시간 동안 고정되지 않게 캐싱하지 않고, 다음 요청에서 다시 시도한다
      return Response.json(playlists, { headers: { 'Cache-Control': 'no-store' } });
    }

    const playlistsWithViewCount = playlists.map((playlist) => ({
      ...playlist,
      viewCount: viewCounts.get(playlist.id),
    }));
    return Response.json(playlistsWithViewCount, {
      headers: { 'Cache-Control': SUCCESS_CACHE_CONTROL },
    });
  } catch (error) {
    console.error('YouTube API 호출 실패', error);
    return errorResponse(502, 'YouTube에서 결과를 가져오지 못했습니다.');
  }
}
