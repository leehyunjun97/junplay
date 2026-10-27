import type { ReactNode } from 'react';

interface PageHeadingProps {
  children: ReactNode;
}

// 페이지 제목(h1). 모든 페이지가 같은 크기를 쓰도록 한곳에서 정한다.
// 모바일·태블릿(~1023px)에서는 작게, 데스크톱(lg 이상)에서는 원래 크기로 보여 준다.
// 브라우저 탭 제목은 PageTitle이 따로 정한다
export function PageHeading({ children }: PageHeadingProps) {
  return <h1 className="text-primary text-xl font-extrabold lg:text-2xl">{children}</h1>;
}
