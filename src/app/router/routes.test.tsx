import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from './routes';

// 주어진 경로에서 시작하는 메모리 라우터로 앱을 렌더링한다
function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('routes', () => {
  it.each([
    ['/', '오늘은 어떤 분위기인가요?'],
    ['/search?q=드라이브', '검색 결과'],
    ['/my', '내 플레이리스트'],
  ])('%s 경로에서 "%s" 페이지를 렌더링한다', (path, title) => {
    renderAt(path);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it('모든 페이지에 헤더가 표시된다', () => {
    renderAt('/my');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'JUNPLAYLIST' })).toBeInTheDocument();
  });

  it('헤더의 "내 플레이리스트" 링크를 누르면 /my로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/');

    await user.click(screen.getByRole('link', { name: '내 플레이리스트' }));

    expect(router.state.location.pathname).toBe('/my');
    expect(screen.getByRole('heading', { name: '내 플레이리스트' })).toBeInTheDocument();
  });

  it('로고를 누르면 홈으로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/my');

    await user.click(screen.getByRole('link', { name: 'JUNPLAYLIST' }));

    expect(router.state.location.pathname).toBe('/');
  });
});
