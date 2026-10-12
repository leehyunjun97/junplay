// GET /api/video?id=영상ID
// 영상 설명란을 YouTube에서 가져와 타임라인(TimelineItem[])으로 바꿔 응답한다.
import { parseTimeline } from './_lib/timeline.js';
import { buildVideoUrl, toVideoDescription } from './_lib/youtube.js';

// YouTube 영상 ID 형식 (영문·숫자·`-`·`_` 11자). 형식이 다르면 YouTube를 호출하지 않는다
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

// 설명란은 거의 바뀌지 않으므로 Vercel CDN이 24시간 캐싱하게 한다 (모든 사용자가 캐시를 공유)
const SUCCESS_CACHE_CONTROL = 's-maxage=86400, stale-while-revalidate';

// 에러 응답은 캐싱하지 않는다. 일시적인 실패가 24시간 동안 고정되면 안 되기 때문
function errorResponse(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: Request): Promise<Response> {
  const videoId = new URL(request.url).searchParams.get('id') ?? '';
  if (!VIDEO_ID_PATTERN.test(videoId)) {
    return errorResponse(400, '올바른 영상 ID(id)가 필요합니다.');
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다.');
    return errorResponse(500, '서버 설정 오류입니다.');
  }

  try {
    // 요청 URL에 API 키가 들어 있으므로 URL은 로그에 남기지 않는다
    const youtubeResponse = await fetch(buildVideoUrl(videoId, apiKey));
    if (!youtubeResponse.ok) {
      console.error(`YouTube API 오류: ${youtubeResponse.status}`);
      return errorResponse(502, 'YouTube에서 영상 정보를 가져오지 못했습니다.');
    }

    const video = toVideoDescription(await youtubeResponse.json());
    if (video === null) {
      console.error('YouTube API 응답 형식이 예상과 다릅니다.');
      return errorResponse(502, 'YouTube에서 영상 정보를 가져오지 못했습니다.');
    }
    if (video === 'not-found') {
      return errorResponse(404, '영상을 찾을 수 없습니다.');
    }

    return Response.json(parseTimeline(video.description), {
      headers: { 'Cache-Control': SUCCESS_CACHE_CONTROL },
    });
  } catch (error) {
    console.error('YouTube API 호출 실패', error);
    return errorResponse(502, 'YouTube에서 영상 정보를 가져오지 못했습니다.');
  }
}
