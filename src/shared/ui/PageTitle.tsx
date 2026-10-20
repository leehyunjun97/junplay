export const APP_NAME = 'JUNPLAYLIST';
// 홈 화면 제목에 붙는 서비스 소개
export const APP_TAGLINE = '분위기 따라 듣는 플레이리스트';

interface PageTitleProps {
  // 페이지 이름. 없으면 홈 화면 제목("JUNPLAYLIST | 소개")이 된다
  page?: string;
}

// 브라우저 탭 제목. React 19는 컴포넌트 안의 <title>을 <head>로 옮겨 주고,
// 페이지가 바뀌어 이 컴포넌트가 사라지면 제목도 함께 바뀐다
export function PageTitle({ page }: PageTitleProps) {
  return <title>{page ? `${page} | ${APP_NAME}` : `${APP_NAME} | ${APP_TAGLINE}`}</title>;
}
