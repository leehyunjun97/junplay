import { useRef, useState } from 'react';
import { searchPlaylists, type Playlist } from '@/entities/playlist';

// status 값에 따라 들어 있는 데이터가 달라지는 판별 유니언.
// status가 'success'일 때만 playlists에 접근할 수 있어 잘못된 상태 조합을 막는다.
export type PlaylistSearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; playlists: Playlist[] }
  | { status: 'error' };

export function usePlaylistSearch() {
  const [state, setState] = useState<PlaylistSearchState>({ status: 'idle' });
  // 가장 최근 요청의 번호. 늦게 도착한 이전 요청의 응답이 최신 결과를 덮어쓰지 않게 한다
  const latestRequestId = useRef(0);

  const search = async (query: string) => {
    latestRequestId.current += 1;
    const requestId = latestRequestId.current;
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
  };

  // 진행 중인 요청이 있으면 그 결과도 무시하도록 요청 번호를 올린다
  const reset = () => {
    latestRequestId.current += 1;
    setState({ status: 'idle' });
  };

  return { state, search, reset };
}
