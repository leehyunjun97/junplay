import { useEffect } from 'react';
import { useHistoryStore } from '@/entities/history';
import { SUB_MOODS } from '@/entities/mood';
import { usePlaylistSearch } from '@/entities/playlist';
import { usePlayPlaylist } from '@/features/play-playlist';
import { PageTitle } from '@/shared/ui';
import { PlaylistResults } from '@/widgets/playlist-results';
import { useMoodSelectionStore } from '../model/moodSelectionStore';
import { MainMoodSelector } from './MainMoodSelector';
import { RecentPlaylists } from './RecentPlaylists';
import { SubMoodSelector } from './SubMoodSelector';

export function HomePage() {
  const mainMood = useMoodSelectionStore((store) => store.mainMood);
  const subMoodId = useMoodSelectionStore((store) => store.subMoodId);
  const selectMainMood = useMoodSelectionStore((store) => store.selectMainMood);
  const selectSubMood = useMoodSelectionStore((store) => store.selectSubMood);
  const order = useMoodSelectionStore((store) => store.order);
  const selectOrder = useMoodSelectionStore((store) => store.selectOrder);
  const hasHistory = useHistoryStore((store) => store.entries.length > 0);
  // 분위기를 고르기 전이고 최근 기록도 없으면, 선택 영역을 세로 가운데에 두고 안내 문구를 보여 준다
  const isEmptyState = mainMood === null && !hasHistory;

  const subMoods = SUB_MOODS.filter((subMood) => subMood.mainMood === mainMood);
  const searchQuery = SUB_MOODS.find((subMood) => subMood.id === subMoodId)?.searchQuery;

  const { state, search, reset } = usePlaylistSearch(searchQuery, order);
  // 카드를 누르면 하단 플레이어 바에서 재생하고 히스토리에 기록한다
  const playPlaylist = usePlayPlaylist();

  // 고른 서브 분위기나 정렬이 바뀌면 검색하고, 선택이 비면(메인 분위기 변경) 결과를 비운다.
  // 다른 페이지에 갔다 돌아왔을 때도 이 effect가 결과를 다시 불러온다 (캐시에 있으면 API 호출 없이 바로)
  useEffect(() => {
    if (searchQuery) void search(searchQuery, order);
    else reset();
  }, [searchQuery, order, search, reset]);

  return (
    // flex-1: main의 남은 세로 공간을 채워야 justify-center로 세로 가운데에 놓을 수 있다
    <div className={`flex flex-1 flex-col gap-8 ${isEmptyState ? 'justify-center' : ''}`}>
      {/* 분위기 선택 영역만 가운데 정렬한다. 결과 그리드는 화면 너비를 모두 쓴다 */}
      <div className="flex flex-col items-center gap-6 text-center">
        <PageTitle />
        <h1 className="text-primary text-2xl font-extrabold">오늘은 어떤 분위기인가요?</h1>
        <MainMoodSelector selected={mainMood} onSelect={selectMainMood} />
        {mainMood && (
          <SubMoodSelector
            subMoods={subMoods}
            selectedId={subMoodId}
            onSelect={(subMood) => selectSubMood(subMood.id)}
          />
        )}
        {isEmptyState && (
          <p className="text-on-dark/70">분위기를 고르면 어울리는 플레이리스트를 추천해 드려요.</p>
        )}
      </div>
      <PlaylistResults
        state={state}
        onSelectPlaylist={playPlaylist}
        emptyMessage="이 분위기에 맞는 플레이리스트가 없어요."
        order={order}
        onChangeOrder={selectOrder}
      />
      {/* 분위기를 고르기 전에만 보여 준다. 고른 뒤에는 추천 결과가 그 자리를 차지한다 */}
      {mainMood === null && <RecentPlaylists onSelectPlaylist={playPlaylist} />}
    </div>
  );
}
