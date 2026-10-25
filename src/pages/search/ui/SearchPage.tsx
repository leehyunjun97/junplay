import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import {
  DEFAULT_SEARCH_ORDER,
  toSearchOrder,
  usePlaylistSearch,
  type SearchOrder,
} from '@/entities/playlist';
import { usePlayPlaylist } from '@/features/play-playlist';
import { SearchForm, toPlaylistQuery } from '@/features/search-playlist';
import { PageTitle } from '@/shared/ui';
import { PlaylistResults } from '@/widgets/playlist-results';
import { useLastKeywordStore } from '../model/lastKeywordStore';

// 검색 페이지 주소의 쿼리. 추천순은 기본값이라 주소에 남기지 않는다
function toSearchParams(keyword: string, order: SearchOrder): URLSearchParams {
  const params = new URLSearchParams({ q: keyword });
  if (order !== DEFAULT_SEARCH_ORDER) params.set('order', order);
  return params;
}

// /search?q=키워드&order=viewCount. 검색어와 정렬은 URL에 두어서 새로고침·뒤로 가기·링크 공유에도 같은 결과가 나오게 한다
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('q')?.trim() ?? '';
  const order = toSearchOrder(searchParams.get('order'));
  const lastKeyword = useLastKeywordStore((store) => store.lastKeyword);
  const lastOrder = useLastKeywordStore((store) => store.lastOrder);
  const setLastKeyword = useLastKeywordStore((store) => store.setLastKeyword);
  const searchQuery = keyword ? toPlaylistQuery(keyword) : undefined;
  const { state, search, reset } = usePlaylistSearch(searchQuery, order);
  const playPlaylist = usePlayPlaylist();

  // URL의 검색어나 정렬이 바뀔 때마다 검색하고, 마지막 검색으로 기억한다. 검색어가 비어 있으면 API를 호출하지 않는다
  useEffect(() => {
    if (searchQuery) {
      setLastKeyword(keyword, order);
      void search(searchQuery, order);
    } else {
      reset();
    }
  }, [keyword, order, searchQuery, search, reset, setLastKeyword]);

  // 헤더의 검색 아이콘 등으로 검색어 없이 들어왔으면 마지막 검색 결과로 보낸다.
  // replace: 검색어 없는 주소를 방문 기록에 남기지 않아서, 뒤로 가기가 이 페이지에 갇히지 않게 한다
  if (!keyword && lastKeyword) {
    return (
      <Navigate to={{ search: `?${toSearchParams(lastKeyword, lastOrder).toString()}` }} replace />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle page="검색" />
      <h1 className="text-primary text-2xl font-extrabold">검색 결과</h1>
      {/* key: 뒤로 가기 등으로 URL 검색어가 바뀌면 입력창도 새로 만들어 그 값으로 맞춘다.
          새로 검색하면 q만 담아서, 정렬은 추천순으로 돌아간다 (SPEC F7) */}
      <SearchForm
        key={keyword}
        initialKeyword={keyword}
        onSearch={(nextKeyword) => setSearchParams({ q: nextKeyword })}
      />
      {keyword ? (
        <PlaylistResults
          state={state}
          onSelectPlaylist={playPlaylist}
          emptyMessage="검색 결과가 없어요."
          order={order}
          onChangeOrder={(nextOrder) => setSearchParams(toSearchParams(keyword, nextOrder))}
        />
      ) : (
        <p className="text-on-dark/70 text-center">검색어를 입력해 주세요.</p>
      )}
    </div>
  );
}
