import { useCallback, useRef, useState } from 'react';
import { getCachedPlaylists, searchPlaylists } from '../api/searchPlaylists';
import type { Playlist } from './types';

// status 값에 따라 들어 있는 데이터가 달라지는 판별 유니언.
// status가 'success'일 때만 playlists에 접근할 수 있어 잘못된 상태 조합을 막는다.
export type PlaylistSearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; playlists: Playlist[] }
  | { status: 'error' };

// 이미 받아 둔 결과가 있으면 성공 상태로, 없으면 대기 상태로 시작한다
function getInitialState(initialQuery: string | undefined): PlaylistSearchState {
  const cached = initialQuery ? getCachedPlaylists(initialQuery) : undefined;
  return cached ? { status: 'success', playlists: cached } : { status: 'idle' };
}

// 플레이리스트 검색의 로딩/성공/실패 상태. 홈(분위기 추천)과 검색 페이지가 함께 쓴다.
// initialQuery: 다른 페이지에 갔다 돌아왔을 때 복원할 검색어. 결과가 캐시에 있으면 첫 화면부터 보여 준다
export function usePlaylistSearch(initialQuery?: string) {
  const [state, setState] = useState<PlaylistSearchState>(() => getInitialState(initialQuery));
  // 가장 최근 요청의 번호. 늦게 도착한 이전 요청의 응답이 최신 결과를 덮어쓰지 않게 한다
  const latestRequestId = useRef(0);

  // useCallback: 함수가 렌더마다 새로 만들어지지 않게 해서, 검색 페이지의 effect 의존성에 넣어도 반복 실행되지 않게 한다
  const search = useCallback(async (query: string) => {
    latestRequestId.current += 1;
    const requestId = latestRequestId.current;

    // 받아 둔 결과가 있으면 "불러오는 중"을 거치지 않고 바로 보여 준다.
    // 이미 같은 결과를 보여 주는 중이면 상태를 그대로 둬서 다시 렌더링하지 않는다
    const cached = getCachedPlaylists(query);
    if (cached) {
      setState((previous) =>
        previous.status === 'success' && previous.playlists === cached
          ? previous
          : { status: 'success', playlists: cached },
      );
      return;
    }

    setState({ status: 'loading' });

    try {
      const playlists = await searchPlaylists(query);
      if (requestId === latestRequestId.current) {
        setState({ status: 'success', playlists });
      }
    } catch {
      if (requestId === latestRequestId.current) {
        setState({ status: 'error' });
      }
    }
  }, []);

  // 진행 중인 요청이 있으면 그 결과도 무시하도록 요청 번호를 올린다
  const reset = useCallback(() => {
    latestRequestId.current += 1;
    setState({ status: 'idle' });
  }, []);

  return { state, search, reset };
}
