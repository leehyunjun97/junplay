import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { initialHistoryState, useHistoryStore, type HistoryItem } from '@/entities/history';
import { initialPlayerState, usePlayerStore } from '@/entities/player';
import { HistoryPage } from './HistoryPage';

function createItem(id: string): HistoryItem {
  return {
    id,
    title: `${id} 플레이리스트`,
    channelTitle: '채널',
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

// 화면에 보이는 카드 제목을 위에서부터 순서대로 꺼낸다
function cardTitles(): string[] {
  return screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent ?? '');
}

describe('HistoryPage', () => {
  beforeEach(() => {
    localStorage.clear();
    usePlayerStore.setState(initialPlayerState);
    useHistoryStore.setState(initialHistoryState);
  });

  it('기록이 없으면 안내 문구를 보여 주고 전체 삭제 버튼을 비활성화한다', () => {
    render(<HistoryPage />);

    expect(screen.getByText('아직 들은 플레이리스트가 없어요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체 삭제' })).toBeDisabled();
  });

  it('최근 들은 순서대로 목록을 보여 준다', () => {
    useHistoryStore.getState().add(createItem('A'));
    useHistoryStore.getState().add(createItem('B'));
    useHistoryStore.getState().add(createItem('A'));

    render(<HistoryPage />);

    expect(cardTitles()).toEqual(['A 플레이리스트', 'B 플레이리스트', 'A 플레이리스트']);
  });

  it('카드를 누르면 다시 재생하고 히스토리 맨 앞에 기록한다', async () => {
    const user = userEvent.setup();
    useHistoryStore.getState().add(createItem('A'));
    useHistoryStore.getState().add(createItem('B'));
    render(<HistoryPage />);

    await user.click(screen.getByRole('button', { name: /A 플레이리스트/ }));

    expect(usePlayerStore.getState().current?.id).toBe('A');
    expect(cardTitles()).toEqual(['A 플레이리스트', 'B 플레이리스트', 'A 플레이리스트']);
  });

  it('전체 삭제를 누르면 기록이 모두 지워진다', async () => {
    const user = userEvent.setup();
    useHistoryStore.getState().add(createItem('A'));
    render(<HistoryPage />);

    await user.click(screen.getByRole('button', { name: '전체 삭제' }));

    expect(useHistoryStore.getState().entries).toEqual([]);
    expect(screen.getByText('아직 들은 플레이리스트가 없어요.')).toBeInTheDocument();
  });
});
