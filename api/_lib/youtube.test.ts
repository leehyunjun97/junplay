// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildSearchUrl, decodeHtmlEntities, MAX_RESULTS, toPlaylists } from './youtube.js';

function createItem(index: number) {
  return {
    id: { kind: 'youtube#playlist', playlistId: `PL${index}` },
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
  it('플레이리스트 타입으로 최대 12개를 요청하는 URL을 만든다', () => {
    const url = new URL(buildSearchUrl('비 오는 날', 'test-key'));

    expect(url.origin + url.pathname).toBe('https://www.googleapis.com/youtube/v3/search');
    expect(url.searchParams.get('part')).toBe('snippet');
    expect(url.searchParams.get('type')).toBe('playlist');
    expect(url.searchParams.get('maxResults')).toBe('12');
    expect(url.searchParams.get('q')).toBe('비 오는 날');
    expect(url.searchParams.get('key')).toBe('test-key');
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
        id: 'PL1',
        title: '플레이리스트 1',
        channelTitle: '채널 1',
        thumbnailUrl: 'https://i.ytimg.com/1/high.jpg',
      },
    ]);
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
    const noPlaylistId = { ...createItem(2), id: { kind: 'youtube#playlist' } };
    const noThumbnail = { ...createItem(3), snippet: { title: '제목', channelTitle: '채널' } };

    const playlists = toPlaylists({ items: [createItem(1), noPlaylistId, noThumbnail, null] });

    expect(playlists?.map((playlist) => playlist.id)).toEqual(['PL1']);
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
