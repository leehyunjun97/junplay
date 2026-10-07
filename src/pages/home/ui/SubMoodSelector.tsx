import type { SubMood } from '@/entities/mood';

interface SubMoodSelectorProps {
  subMoods: readonly SubMood[];
  selectedId: string | null;
  onSelect: (subMood: SubMood) => void;
}

export function SubMoodSelector({ subMoods, selectedId, onSelect }: SubMoodSelectorProps) {
  return (
    <div role="group" aria-label="서브 분위기" className="flex flex-wrap justify-center gap-2">
      {subMoods.map((subMood) => {
        const isSelected = subMood.id === selectedId;
        return (
          <button
            key={subMood.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(subMood)}
            // SPEC: 선택되지 않은 서브 분위기 칩은 유리 효과, 선택된 칩은 selected 색
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              isSelected
                ? 'bg-selected border-selected text-on-dark'
                : 'glass text-primary-light hover:text-primary'
            }`}
          >
            {subMood.label}
          </button>
        );
      })}
    </div>
  );
}
