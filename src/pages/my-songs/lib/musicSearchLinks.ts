// 음악 서비스에서 곡명을 검색하는 주소. API를 부르지 않고 검색 결과 페이지로 보내기만 한다
export interface MusicSearchLink {
  service: string;
  url: string;
}

// 곡명에 &, #, 공백 등이 있어도 주소가 깨지지 않게 인코딩한다
export function createMusicSearchLinks(title: string): MusicSearchLink[] {
  const query = encodeURIComponent(title);
  return [
    { service: 'YouTube Music', url: `https://music.youtube.com/search?q=${query}` },
    { service: 'Spotify', url: `https://open.spotify.com/search/${query}` },
  ];
}
