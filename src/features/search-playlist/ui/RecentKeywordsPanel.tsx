import { Button, CloseIcon, IconButton, ListItemButton } from '@/shared/ui';
import { useRecentKeywordsStore } from '../model/recentKeywordsStore';

interface RecentKeywordsPanelProps {
  onSelect: (keyword: string) => void;
}

// 검색창 아래에 펼쳐지는 최근 검색어 목록. 검색어마다 삭제 버튼이 있고, 전체 삭제도 할 수 있다
export function RecentKeywordsPanel({ onSelect }: RecentKeywordsPanelProps) {
  const keywords = useRecentKeywordsStore((store) => store.keywords);
  const remove = useRecentKeywordsStore((store) => store.remove);
  const clear = useRecentKeywordsStore((store) => store.clear);

  return (
    // onMouseDown preventDefault: 패널을 눌러도 입력창의 포커스가 빠지지 않게 한다.
    // 포커스가 빠지면 패널이 먼저 닫혀서 클릭이 처리되지 않을 수 있다 (Safari는 버튼을 눌러도 버튼으로 포커스를 옮기지 않는다)
    <section
      aria-label="최근 검색어"
      onMouseDown={(event) => event.preventDefault()}
      className="bg-surface absolute inset-x-0 top-full z-10 mt-2 rounded-xl p-2 shadow-lg"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-1">
        <h2 className="text-on-dark/70 text-sm font-bold">최근 검색어</h2>
        <Button onClick={clear}>전체 삭제</Button>
      </div>
      <ul className="mt-1">
        {keywords.map((keyword) => (
          <li key={keyword} className="flex items-center gap-1">
            <ListItemButton onClick={() => onSelect(keyword)}>{keyword}</ListItemButton>
            <IconButton label={`${keyword} 삭제`} onClick={() => remove(keyword)}>
              <CloseIcon className="size-4" />
            </IconButton>
          </li>
        ))}
      </ul>
    </section>
  );
}
