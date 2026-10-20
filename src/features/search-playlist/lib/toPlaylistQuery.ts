// 이미 플레이리스트를 찾는 검색어로 보는 단어. 띄어쓰기는 무시하고 비교한다 (예: "노래 모음")
const PLAYLIST_WORDS = ['플레이리스트', '노래모음'];

// 사용자가 입력한 키워드를 YouTube 검색어로 바꾼다.
// 키워드만으로 찾으면 20분 이상의 인터뷰·라이브 방송이 섞일 수 있어서,
// 플레이리스트를 뜻하는 단어가 없으면 " 플레이리스트"를 붙인다 (분위기 검색어와 같은 방식)
export function toPlaylistQuery(keyword: string): string {
  const trimmed = keyword.trim();
  const compact = trimmed.replace(/\s/g, '');
  if (PLAYLIST_WORDS.some((word) => compact.includes(word))) return trimmed;
  return `${trimmed} 플레이리스트`;
}
