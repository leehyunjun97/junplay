import { DEFAULT_SEARCH_ORDER, type SearchOrder } from './types';

// URL 등 바깥에서 온 값을 정렬로 바꾼다. 모르는 값이거나 없으면 기본값(추천순)으로 본다
export function toSearchOrder(value: string | null | undefined): SearchOrder {
  return value === 'viewCount' ? 'viewCount' : DEFAULT_SEARCH_ORDER;
}
