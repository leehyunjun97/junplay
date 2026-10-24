import type { SubMood } from '@/entities/mood';
import { Chip } from '@/shared/ui';

interface SubMoodSelectorProps {
  subMoods: readonly SubMood[];
  selectedId: string | null;
  onSelect: (subMood: SubMood) => void;
}

export function SubMoodSelector({ subMoods, selectedId, onSelect }: SubMoodSelectorProps) {
  return (
    <div role="group" aria-label="서브 분위기" className="flex flex-wrap justify-center gap-2">
      {subMoods.map((subMood) => (
        // SPEC: 선택되지 않은 서브 분위기 칩은 유리 효과, 선택된 칩은 selected 색
        <Chip
          key={subMood.id}
          variant="glass"
          selected={subMood.id === selectedId}
          onClick={() => onSelect(subMood)}
        >
          {subMood.label}
        </Chip>
      ))}
    </div>
  );
}
