import { useState, type FocusEvent, type FormEvent, type KeyboardEvent } from 'react';
import { IconButton, SearchIcon } from '@/shared/ui';
import { MAX_KEYWORD_LENGTH } from '../config/limits';
import { useRecentKeywordsStore } from '../model/recentKeywordsStore';
import { RecentKeywordsPanel } from './RecentKeywordsPanel';

interface SearchFormProps {
  // 처음 입력창에 채워 둘 검색어 (URL의 검색어)
  initialKeyword: string;
  // 앞뒤 공백을 지운, 비어 있지 않은 검색어로만 호출된다
  onSearch: (keyword: string) => void;
}

// 검색창. Enter나 검색 버튼으로 제출한다. 빈 문자열(공백만 있는 경우 포함)로는 검색되지 않는다.
// 입력창에 포커스하면 최근 검색어 목록이 열리고, Esc를 누르거나 포커스가 검색 영역 밖으로 나가면 닫힌다
export function SearchForm({ initialKeyword, onSearch }: SearchFormProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const recentKeywords = useRecentKeywordsStore((store) => store.keywords);
  const addRecentKeyword = useRecentKeywordsStore((store) => store.add);
  const trimmedKeyword = keyword.trim();
  const showPanel = isPanelOpen && recentKeywords.length > 0;

  // 검색어를 최근 검색어에 기록하고 검색한다
  const runSearch = (nextKeyword: string) => {
    addRecentKeyword(nextKeyword);
    setIsPanelOpen(false);
    onSearch(nextKeyword);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // 폼 제출로 페이지가 새로고침되지 않게 한다
    event.preventDefault();
    if (!trimmedKeyword) return;
    runSearch(trimmedKeyword);
  };

  const handleSelectRecentKeyword = (recentKeyword: string) => {
    setKeyword(recentKeyword);
    runSearch(recentKeyword);
  };

  // 포커스가 검색 영역(입력창, 패널) 밖으로 나가면 닫는다. 바깥을 클릭해도 입력창의 포커스가 빠지므로 닫힌다
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsPanelOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || !isPanelOpen) return;
    // type="search" 입력창은 Esc를 누르면 입력값을 지운다. 패널만 닫히도록 기본 동작을 막는다
    event.preventDefault();
    setIsPanelOpen(false);
  };

  return (
    // relative: 최근 검색어 패널을 검색창 바로 아래에 띄우는 기준
    <div className="relative" onBlur={handleBlur} onKeyDown={handleKeyDown}>
      {/* role="search": 스크린 리더가 검색 영역으로 알려 준다 */}
      <form role="search" onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="search"
          aria-label="검색어"
          placeholder="가수, 장르, 분위기로 검색해 보세요"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          // 포커스할 때 열고, Esc로 닫은 뒤 다시 눌렀을 때도 연다
          onFocus={() => setIsPanelOpen(true)}
          onClick={() => setIsPanelOpen(true)}
          maxLength={MAX_KEYWORD_LENGTH}
          // 헤더의 검색 아이콘으로 막 들어왔을 때(검색어 없음) 바로 입력할 수 있게 한다
          autoFocus={initialKeyword === ''}
          className="bg-input border-input-border text-bg placeholder:text-bg/60 hover:border-primary-light focus-visible:outline-primary h-11 min-w-0 flex-1 rounded-full border px-5 focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <IconButton type="submit" label="검색" disabled={!trimmedKeyword}>
          <SearchIcon />
        </IconButton>
      </form>
      {showPanel && <RecentKeywordsPanel onSelect={handleSelectRecentKeyword} />}
    </div>
  );
}
