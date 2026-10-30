import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

// jsdom은 CSS(md:hidden 등)를 적용하지 않으므로, 화면 크기와 상관없이 드로어 동작만 확인한다
function renderHeader() {
  const router = createMemoryRouter([{ path: '*', element: <Header /> }], {
    initialEntries: ['/'],
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('Header 툴팁', () => {
  it('아이콘만 있는 검색 링크는 포커스하면 툴팁이 뜨고, 글자 메뉴 링크는 뜨지 않는다', async () => {
    const user = userEvent.setup();
    renderHeader();

    // 로고 다음이 검색 링크
    await user.tab();
    await user.tab();
    expect(screen.getByRole('link', { name: '검색' })).toHaveFocus();
    // 툴팁은 aria-hidden이라 글자로 찾는다. 링크 이름은 aria-label이라 글자로는 잡히지 않는다
    expect(screen.getByText('검색')).toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole('link', { name: 'HISTORY' })).toHaveFocus();
    expect(screen.queryByText('검색')).not.toBeInTheDocument();
    // 글자 메뉴는 화면의 글자 하나뿐, 툴팁으로 한 번 더 생기지 않는다
    expect(screen.getAllByText('HISTORY')).toHaveLength(1);
  });
});

function menuButton() {
  return screen.getByRole('button', { name: '메뉴 열기' });
}

async function openDrawer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(menuButton());
  return screen.getByRole('dialog', { name: '메뉴' });
}

describe('Header 모바일 드로어', () => {
  it('메뉴 버튼을 누르면 드로어가 열리고 닫기 버튼에 포커스가 가며, 메뉴 3개가 있다', async () => {
    const user = userEvent.setup();
    renderHeader();

    const drawer = await openDrawer(user);

    expect(within(drawer).getByRole('button', { name: '메뉴 닫기' })).toHaveFocus();
    const links = within(drawer).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['HISTORY', 'MYPLAYLIST', 'MEMORY']);
  });

  it('열려 있는 동안 뒤 페이지가 스크롤되지 않고, 닫으면 다시 스크롤된다', async () => {
    const user = userEvent.setup();
    renderHeader();

    await openDrawer(user);
    expect(document.documentElement).toHaveClass('overflow-hidden');

    await user.click(screen.getByRole('button', { name: '메뉴 닫기' }));
    expect(document.documentElement).not.toHaveClass('overflow-hidden');
  });

  it('닫기 버튼을 누르면 닫히고 메뉴 버튼으로 포커스가 돌아간다', async () => {
    const user = userEvent.setup();
    renderHeader();

    await openDrawer(user);
    await user.click(screen.getByRole('button', { name: '메뉴 닫기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(menuButton()).toHaveFocus();
  });

  it('Esc를 누르면 닫히고, 바깥으로 Esc가 전달되지 않는다', async () => {
    const user = userEvent.setup();
    const onWindowKeyDown = vi.fn();
    window.addEventListener('keydown', onWindowKeyDown);
    renderHeader();

    await openDrawer(user);
    onWindowKeyDown.mockClear();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(menuButton()).toHaveFocus();
    expect(onWindowKeyDown).not.toHaveBeenCalled();
    window.removeEventListener('keydown', onWindowKeyDown);
  });

  it('바깥(어두운 배경)을 누르면 닫힌다', async () => {
    const user = userEvent.setup();
    renderHeader();

    const drawer = await openDrawer(user);
    // 배경은 스크린 리더에서 숨겨 두어서 역할로 찾을 수 없으므로, 드로어 바로 앞 요소를 누른다
    const backdrop = drawer.previousElementSibling;
    if (!backdrop) throw new Error('배경을 찾지 못했습니다');
    await user.click(backdrop);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('메뉴를 누르면 그 페이지로 이동하고 드로어가 닫힌다', async () => {
    const user = userEvent.setup();
    const router = renderHeader();

    const drawer = await openDrawer(user);
    await user.click(within(drawer).getByRole('link', { name: 'MEMORY' }));

    expect(router.state.location.pathname).toBe('/songs');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Tab은 드로어 안에서만 돈다 (마지막에서 처음으로, 처음에서 Shift+Tab이면 마지막으로)', async () => {
    const user = userEvent.setup();
    renderHeader();

    const drawer = await openDrawer(user);
    const closeButton = within(drawer).getByRole('button', { name: '메뉴 닫기' });
    const lastLink = within(drawer).getByRole('link', { name: 'MEMORY' });

    await user.tab({ shift: true });
    expect(lastLink).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();
  });
});
