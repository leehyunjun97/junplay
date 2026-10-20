// GET /api/video?id=영상ID
// 영상의 타임라인(TimelineItem[])을 응답한다.
// 설명란에서 먼저 찾고, 없으면 업로더가 직접 쓴 댓글에서 찾는다.
import { findUploaderTimeline, parseTimeline } from './_lib/timeline.js';
import {
  buildCommentThreadsUrl,
  buildVideoUrl,
  toVideoComments,
  toVideoDescription,
} from './_lib/youtube.js';

// YouTube 영상 ID 형식 (영문·숫자·`-`·`_` 11자). 형식이 다르면 YouTube를 호출하지 않는다
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

// 설명란과 업로더 댓글은 거의 바뀌지 않으므로 Vercel CDN이 24시간 캐싱하게 한다 (모든 사용자가 캐시를 공유)
const SUCCESS_CACHE_CONTROL = 's-maxage=86400, stale-while-revalidate';

// 캐싱하지 않는 응답. 일시적인 실패가 24시간 동안 고정되면 안 되기 때문
const NO_STORE = 'no-store';

function errorResponse(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': NO_STORE } });
}

// 업로더 댓글에서 타임라인을 찾는다. 댓글 요청이 실패하면(댓글 꺼짐, 할당량 초과, 네트워크 등) null.
// 설명란은 이미 받아 왔으므로, 댓글 실패는 에러가 아니라 "타임라인 없음"으로 처리한다
async function fetchUploaderTimeline(videoId: string, uploaderChannelId: string, apiKey: string) {
  try {
    // 요청 URL에 API 키가 들어 있으므로 URL은 로그에 남기지 않는다
    const response = await fetch(buildCommentThreadsUrl(videoId, apiKey));
    if (!response.ok) {
      console.error(`YouTube 댓글 API 오류: ${response.status}`);
      return null;
    }
    const comments = toVideoComments(await response.json());
    if (comments === null) {
      console.error('YouTube 댓글 API 응답 형식이 예상과 다릅니다.');
      return null;
    }
    return findUploaderTimeline(comments, uploaderChannelId);
  } catch (error) {
    console.error('YouTube 댓글 API 호출 실패', error);
    return null;
  }
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

    // 1) 설명란에 타임라인이 있으면 댓글은 요청하지 않는다 (할당량 절약)
    const descriptionTimeline = parseTimeline(video.description);
    if (descriptionTimeline.length > 0 || video.channelId === undefined) {
      return Response.json(descriptionTimeline, {
        headers: { 'Cache-Control': SUCCESS_CACHE_CONTROL },
      });
    }

    // 2) 없으면 업로더가 쓴 댓글에서 찾는다.
    //    댓글 요청이 실패했으면 빈 타임라인으로 응답하되, 다음에 다시 시도할 수 있게 캐싱하지 않는다
    const commentTimeline = await fetchUploaderTimeline(videoId, video.channelId, apiKey);
    return Response.json(commentTimeline ?? [], {
      headers: { 'Cache-Control': commentTimeline === null ? NO_STORE : SUCCESS_CACHE_CONTROL },
    });
  } catch (error) {
    console.error('YouTube API 호출 실패', error);
    return errorResponse(502, 'YouTube에서 영상 정보를 가져오지 못했습니다.');
  }
}
