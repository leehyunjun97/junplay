// 검색어 최대 길이. 서버(api/search.ts)의 MAX_QUERY_LENGTH(100자)를 넘지 않도록,
// toPlaylistQuery가 붙이는 " 플레이리스트"(7자)를 고려해 여유 있게 잡는다
export const MAX_KEYWORD_LENGTH = 90;
