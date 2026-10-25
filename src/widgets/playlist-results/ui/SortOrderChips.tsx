import type { SearchOrder } from '@/entities/playlist';
import { Chip } from '@/shared/ui';

interface SortOrderChipsProps {
  selected: SearchOrder;
  onSelect: (order: SearchOrder) => void;
}

const SORT_OPTIONS: readonly { order: SearchOrder; label: string }[] = [
  { order: 'relevance', label: '추천순' },
  { order: 'viewCount', label: '조회순' },
];

// 결과 정렬을 고르는 칩. 상태는 갖지 않고, 사용하는 쪽(홈: 스토어, 검색: URL)이 정렬 값을 관리한다
export function SortOrderChips({ selected, onSelect }: SortOrderChipsProps) {
  return (
    <div role="group" aria-label="정렬" className="flex gap-2">
      {SORT_OPTIONS.map(({ order, label }) => (
        <Chip
          key={order}
          variant="glass"
          selected={order === selected}
          onClick={() => onSelect(order)}
        >
          {label}
        </Chip>
      ))}
    </div>
  );
}
