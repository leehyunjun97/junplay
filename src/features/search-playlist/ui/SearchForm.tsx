import { useState, type FormEvent } from 'react';
import { IconButton, SearchIcon } from '@/shared/ui';
import { MAX_KEYWORD_LENGTH } from '../config/limits';

interface SearchFormProps {
  // 처음 입력창에 채워 둘 검색어 (URL의 검색어)
  initialKeyword: string;
  // 앞뒤 공백을 지운, 비어 있지 않은 검색어로만 호출된다
  onSearch: (keyword: string) => void;
}

// 검색창. Enter나 검색 버튼으로 제출한다. 빈 문자열(공백만 있는 경우 포함)로는 검색되지 않는다
export function SearchForm({ initialKeyword, onSearch }: SearchFormProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const trimmedKeyword = keyword.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // 폼 제출로 페이지가 새로고침되지 않게 한다
    event.preventDefault();
    if (!trimmedKeyword) return;
    onSearch(trimmedKeyword);
  };

  return (
    // role="search": 스크린 리더가 검색 영역으로 알려 준다
    <form role="search" onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="search"
        aria-label="검색어"
        placeholder="가수, 장르, 분위기로 검색해 보세요"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        maxLength={MAX_KEYWORD_LENGTH}
        // 헤더의 검색 아이콘으로 막 들어왔을 때(검색어 없음) 바로 입력할 수 있게 한다
        autoFocus={initialKeyword === ''}
        className="bg-input border-input-border text-bg placeholder:text-bg/60 hover:border-primary-light focus-visible:outline-primary h-11 min-w-0 flex-1 rounded-full border px-5 focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <IconButton type="submit" label="검색" disabled={!trimmedKeyword}>
        <SearchIcon />
      </IconButton>
    </form>
  );
}
