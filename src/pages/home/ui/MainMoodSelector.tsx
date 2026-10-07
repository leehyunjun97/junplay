import { MAIN_MOODS, type MainMood } from '@/entities/mood';

interface MainMoodSelectorProps {
  selected: MainMood | null;
  onSelect: (mainMood: MainMood) => void;
}

export function MainMoodSelector({ selected, onSelect }: MainMoodSelectorProps) {
  return (
    <div role="group" aria-label="메인 분위기" className="flex flex-wrap justify-center gap-3">
      {MAIN_MOODS.map((mainMood) => {
        const isSelected = mainMood.id === selected;
        return (
          <button
            key={mainMood.id}
            type="button"
            // 스크린 리더에 "선택됨" 상태를 알린다
            aria-pressed={isSelected}
            onClick={() => onSelect(mainMood.id)}
            className={`rounded-full px-5 py-2 font-bold transition-colors ${
              isSelected ? 'bg-selected text-on-dark' : 'bg-primary text-bg hover:bg-primary-light'
            }`}
          >
            {/* 이모지는 꾸밈이므로 스크린 리더가 읽지 않게 한다 */}
            <span aria-hidden="true">{mainMood.emoji}</span> {mainMood.label}
          </button>
        );
      })}
    </div>
  );
}
