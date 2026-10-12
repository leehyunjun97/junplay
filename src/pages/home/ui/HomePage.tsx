import { useState } from 'react';
import { SUB_MOODS, type MainMood, type SubMood } from '@/entities/mood';
import { usePlayerStore } from '@/entities/player';
import { usePlaylistSearch } from '../model/usePlaylistSearch';
import { MainMoodSelector } from './MainMoodSelector';
import { PlaylistSection } from './PlaylistSection';
import { SubMoodSelector } from './SubMoodSelector';

export function HomePage() {
  const [mainMood, setMainMood] = useState<MainMood | null>(null);
  const [subMoodId, setSubMoodId] = useState<string | null>(null);
  const { state, search, reset } = usePlaylistSearch();
  // 카드를 누르면 하단 플레이어 바에서 재생한다
  const play = usePlayerStore((store) => store.play);

  const subMoods = SUB_MOODS.filter((subMood) => subMood.mainMood === mainMood);

  const handleSelectMainMood = (nextMainMood: MainMood) => {
    if (nextMainMood === mainMood) return;
    // 메인 분위기가 바뀌면 이전 서브 분위기 선택과 결과를 비운다
    setMainMood(nextMainMood);
    setSubMoodId(null);
    reset();
  };

  const handleSelectSubMood = (subMood: SubMood) => {
    setSubMoodId(subMood.id);
    void search(subMood.searchQuery);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 분위기 선택 영역만 가운데 정렬한다. 결과 그리드는 화면 너비를 모두 쓴다 */}
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-primary text-2xl font-extrabold">오늘은 어떤 분위기인가요?</h1>
        <MainMoodSelector selected={mainMood} onSelect={handleSelectMainMood} />
        {mainMood && (
          <SubMoodSelector
            subMoods={subMoods}
            selectedId={subMoodId}
            onSelect={handleSelectSubMood}
          />
        )}
      </div>
      <PlaylistSection state={state} onSelectPlaylist={play} />
    </div>
  );
}
