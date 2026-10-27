import { describe, expect, it } from 'vitest';
import { createMusicSearchLinks } from './musicSearchLinks';

describe('createMusicSearchLinks', () => {
  it('YouTube Music과 Spotify 검색 주소를 순서대로 만든다', () => {
    expect(createMusicSearchLinks('Hype Boy')).toEqual([
      { service: 'YouTube Music', url: 'https://music.youtube.com/search?q=Hype%20Boy' },
      { service: 'Spotify', url: 'https://open.spotify.com/search/Hype%20Boy' },
    ]);
  });

  it('한글과 특수문자(&, #, /, ?)를 인코딩해서 주소가 깨지지 않게 한다', () => {
    const [youtubeMusic, spotify] = createMusicSearchLinks('밤편지 & Love #1 / ?');
    const encoded = '%EB%B0%A4%ED%8E%B8%EC%A7%80%20%26%20Love%20%231%20%2F%20%3F';

    expect(youtubeMusic.url).toBe(`https://music.youtube.com/search?q=${encoded}`);
    expect(spotify.url).toBe(`https://open.spotify.com/search/${encoded}`);
  });
});
