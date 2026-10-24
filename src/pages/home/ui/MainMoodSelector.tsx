import { MAIN_MOODS, type MainMood } from '@/entities/mood';
import { Chip } from '@/shared/ui';

interface MainMoodSelectorProps {
  selected: MainMood | null;
  onSelect: (mainMood: MainMood) => void;
}

export function MainMoodSelector({ selected, onSelect }: MainMoodSelectorProps) {
  return (
    <div role="group" aria-label="메인 분위기" className="flex flex-wrap justify-center gap-3">
      {MAIN_MOODS.map((mainMood) => (
        <Chip
          key={mainMood.id}
          variant="solid"
          selected={mainMood.id === selected}
          onClick={() => onSelect(mainMood.id)}
        >
          {/* 이모지는 꾸밈이므로 스크린 리더가 읽지 않게 한다 */}
          <span aria-hidden="true">{mainMood.emoji}</span> {mainMood.label}
        </Chip>
      ))}
    </div>
  );
}
