// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildCommentThreadsUrl,
  buildSearchUrl,
  buildVideoStatsUrl,
  buildVideoUrl,
  decodeHtmlEntities,
  isSearchOrder,
  MAX_COMMENT_RESULTS,
  MAX_RESULTS,
  toPlaylists,
  toVideoComments,
  toVideoDescription,
  toViewCounts,
} from './youtube.js';

function createItem(index: number) {
  return {
    id: { kind: 'youtube#video', videoId: `VID${index}` },
    snippet: {
      title: `플레이리스트 ${index}`,
      channelTitle: `채널 ${index}`,
      thumbnails: {
        default: { url: `https://i.ytimg.com/${index}/default.jpg` },
        high: { url: `https://i.ytimg.com/${index}/high.jpg` },
      },
    },
  };
}

describe('buildSearchUrl', () => {
  it('퍼가기가 허용된 20분 이상 영상을 최대 12개 요청하는 URL을 만든다', () => {
    const url = new URL(buildSearchUrl('비 오는 날', 'test-key', 'relevance'));

    expect(url.origin + url.pathname).toBe('https://www.googleapis.com/youtube/v3/search');
    expect(url.searchParams.get('part')).toBe('snippet');
    expect(url.searchParams.get('type')).toBe('video');
    expect(url.searchParams.get('videoDuration')).toBe('long');
    expect(url.searchParams.get('videoEmbeddable')).toBe('true');
    expect(url.searchParams.get('maxResults')).toBe('12');
    expect(url.searchParams.get('q')).toBe('비 오는 날');
    expect(url.searchParams.get('key')).toBe('test-key');
  });

  it('정렬을 order로 담는다', () => {
    const relevance = new URL(buildSearchUrl('재즈', 'test-key', 'relevance'));
    const viewCount = new URL(buildSearchUrl('재즈', 'test-key', 'viewCount'));

    expect(relevance.searchParams.get('order')).toBe('relevance');
    expect(viewCount.searchParams.get('order')).toBe('viewCount');
  });
});

describe('isSearchOrder', () => {
  it('추천순과 조회순만 허용한다', () => {
    expect(isSearchOrder('relevance')).toBe(true);
    expect(isSearchOrder('viewCount')).toBe(true);
    expect(isSearchOrder('date')).toBe(false);
    expect(isSearchOrder('')).toBe(false);
  });
});

describe('decodeHtmlEntities', () => {
  it('자주 쓰이는 HTML 엔티티를 원래 문자로 바꾼다', () => {
    expect(decodeHtmlEntities('Rock &amp; Roll &#39;90s &quot;best&quot; &lt;3 &gt;')).toBe(
      'Rock & Roll \'90s "best" <3 >',
    );
  });

  it('한 번만 치환한다', () => {
    expect(decodeHtmlEntities('&amp;lt;')).toBe('&lt;');
  });
});

describe('toPlaylists', () => {
  it('YouTube 응답을 Playlist 배열로 바꾸고 가장 큰 썸네일을 고른다', () => {
    expect(toPlaylists({ items: [createItem(1)] })).toEqual([
      {
        id: 'VID1',
        title: '플레이리스트 1',
        channelTitle: '채널 1',
        thumbnailUrl: 'https://i.ytimg.com/1/high.jpg',
      },
    ]);
  });

  it('업로드 날짜가 있으면 함께 꺼낸다', () => {
    const item = createItem(1);
    const withDate = { ...item, snippet: { ...item.snippet, publishedAt: '2025-10-01T12:00:00Z' } };

    const [playlist] = toPlaylists({ items: [withDate] }) ?? [];

    expect(playlist?.publishedAt).toBe('2025-10-01T12:00:00Z');
  });

  it('제목과 채널명의 HTML 엔티티를 변환한다', () => {
    const item = createItem(1);
    item.snippet.title = 'Lo-fi &amp; Chill';
    item.snippet.channelTitle = 'Tom&#39;s';

    const [playlist] = toPlaylists({ items: [item] }) ?? [];

    expect(playlist?.title).toBe('Lo-fi & Chill');
    expect(playlist?.channelTitle).toBe("Tom's");
  });

  it('필요한 값이 빠진 항목은 걸러낸다', () => {
    const noVideoId = { ...createItem(2), id: { kind: 'youtube#video' } };
    const noThumbnail = { ...createItem(3), snippet: { title: '제목', channelTitle: '채널' } };

    const playlists = toPlaylists({ items: [createItem(1), noVideoId, noThumbnail, null] });

    expect(playlists?.map((playlist) => playlist.id)).toEqual(['VID1']);
  });

  it(`최대 ${MAX_RESULTS}개까지만 반환한다`, () => {
    const items = Array.from({ length: 20 }, (_, index) => createItem(index));
    expect(toPlaylists({ items })).toHaveLength(MAX_RESULTS);
  });

  it('응답 형태가 다르면 null을 반환한다', () => {
    expect(toPlaylists(null)).toBeNull();
    expect(toPlaylists({ error: { code: 403 } })).toBeNull();
  });
});

describe('buildVideoUrl', () => {
  it('영상 하나의 설명란과 채널 ID만 요청하는 URL을 만든다', () => {
    const url = new URL(buildVideoUrl('AcbC3bhPgzY', 'test-key'));

    expect(url.origin + url.pathname).toBe('https://www.googleapis.com/youtube/v3/videos');
    expect(url.searchParams.get('part')).toBe('snippet');
    expect(url.searchParams.get('id')).toBe('AcbC3bhPgzY');
    expect(url.searchParams.get('fields')).toBe('items(snippet(description,channelId))');
    expect(url.searchParams.get('key')).toBe('test-key');
  });
});

describe('buildVideoStatsUrl', () => {
  it('여러 영상의 조회수만 한 번에 요청하는 URL을 만든다', () => {
    const url = new URL(buildVideoStatsUrl(['VID1', 'VID2'], 'test-key'));

    expect(url.origin + url.pathname).toBe('https://www.googleapis.com/youtube/v3/videos');
    expect(url.searchParams.get('part')).toBe('statistics');
    expect(url.searchParams.get('id')).toBe('VID1,VID2');
    expect(url.searchParams.get('fields')).toBe('items(id,statistics(viewCount))');
    expect(url.searchParams.get('key')).toBe('test-key');
  });
});

describe('toViewCounts', () => {
  it('문자열로 온 조회수를 숫자로 바꿔 영상 ID별로 꺼낸다', () => {
    const data = {
      items: [
        { id: 'VID1', statistics: { viewCount: '12345' } },
        { id: 'VID2', statistics: { viewCount: '0' } },
      ],
    };

    expect(toViewCounts(data)).toEqual(
      new Map([
        ['VID1', 12345],
        ['VID2', 0],
      ]),
    );
  });

  it('조회수를 숨겼거나 값이 이상한 영상은 뺀다', () => {
    const data = {
      items: [
        { id: 'VID1', statistics: {} },
        { id: 'VID2', statistics: { viewCount: 'abc' } },
        { statistics: { viewCount: '10' } },
        null,
        { id: 'VID3', statistics: { viewCount: '7' } },
      ],
    };

    expect(toViewCounts(data)).toEqual(new Map([['VID3', 7]]));
  });

  it('응답 형태가 다르면 null을 반환한다', () => {
    expect(toViewCounts(null)).toBeNull();
    expect(toViewCounts({ error: { code: 403 } })).toBeNull();
  });
});

describe('toVideoDescription', () => {
  it('응답에서 설명란을 꺼낸다', () => {
    const data = { items: [{ snippet: { description: '00:00 곡1' } }] };
    expect(toVideoDescription(data)).toEqual({ description: '00:00 곡1' });
  });

  it('채널 ID도 함께 꺼낸다', () => {
    const data = { items: [{ snippet: { description: '설명', channelId: 'UC_UPLOADER' } }] };
    expect(toVideoDescription(data)).toEqual({ description: '설명', channelId: 'UC_UPLOADER' });
  });

  it('설명란 필드가 없으면 빈 문자열로 본다', () => {
    expect(toVideoDescription({ items: [{ snippet: {} }] })).toEqual({ description: '' });
  });

  it('설명란이 "not-found"라는 글자여도 영상이 없는 경우와 구분한다', () => {
    const data = { items: [{ snippet: { description: 'not-found' } }] };
    expect(toVideoDescription(data)).toEqual({ description: 'not-found' });
  });

  it("영상이 없으면 'not-found'를 반환한다", () => {
    expect(toVideoDescription({ items: [] })).toBe('not-found');
  });

  it('응답 형태가 다르면 null을 반환한다', () => {
    expect(toVideoDescription(null)).toBeNull();
    expect(toVideoDescription({ error: { code: 403 } })).toBeNull();
    expect(toVideoDescription({ items: [{ id: 'x' }] })).toBeNull();
  });
});

describe('buildCommentThreadsUrl', () => {
  it('최상위 댓글을 관련도순으로 최대 100개, 작성자와 글만 요청하는 URL을 만든다', () => {
    const url = new URL(buildCommentThreadsUrl('AcbC3bhPgzY', 'test-key'));

    expect(url.origin + url.pathname).toBe('https://www.googleapis.com/youtube/v3/commentThreads');
    expect(url.searchParams.get('part')).toBe('snippet');
    expect(url.searchParams.get('videoId')).toBe('AcbC3bhPgzY');
    expect(url.searchParams.get('order')).toBe('relevance');
    expect(url.searchParams.get('maxResults')).toBe(String(MAX_COMMENT_RESULTS));
    expect(url.searchParams.get('textFormat')).toBe('plainText');
    expect(url.searchParams.get('fields')).toBe(
      'items(snippet(topLevelComment(snippet(authorChannelId,textDisplay))))',
    );
    expect(url.searchParams.get('key')).toBe('test-key');
  });
});

describe('toVideoComments', () => {
  // commentThreads.list 응답의 댓글 하나
  function thread(authorChannelId: unknown, textDisplay: unknown) {
    return { snippet: { topLevelComment: { snippet: { authorChannelId, textDisplay } } } };
  }

  it('댓글마다 작성자 채널 ID와 글을 꺼낸다', () => {
    const data = {
      items: [thread({ value: 'UC_A' }, '00:00 곡1'), thread({ value: 'UC_B' }, '좋아요')],
    };
    expect(toVideoComments(data)).toEqual([
      { authorChannelId: 'UC_A', text: '00:00 곡1' },
      { authorChannelId: 'UC_B', text: '좋아요' },
    ]);
  });

  it('글의 HTML 엔티티를 변환한다', () => {
    const data = { items: [thread({ value: 'UC_A' }, '00:00 Rock &amp; Roll')] };
    expect(toVideoComments(data)?.[0]?.text).toBe('00:00 Rock & Roll');
  });

  it('작성자나 글이 빠진 댓글은 걸러낸다', () => {
    const data = {
      items: [thread(undefined, '글'), thread({ value: 'UC_A' }, undefined), { snippet: {} }, null],
    };
    expect(toVideoComments(data)).toEqual([]);
  });

  it('댓글이 없으면 빈 배열을 반환한다', () => {
    expect(toVideoComments({ items: [] })).toEqual([]);
  });

  it('응답 형태가 다르면 null을 반환한다', () => {
    expect(toVideoComments(null)).toBeNull();
    expect(toVideoComments({ error: { code: 403 } })).toBeNull();
  });
});
