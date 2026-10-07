import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchPlaylists, type Playlist } from '@/entities/playlist';
import { HomePage } from './HomePage';

// 실제 searchPlaylists(0.5초 지연 + 목 데이터) 대신 테스트에서 결과를 직접 정한다.
// PlaylistCard 등 나머지는 실제 구현을 그대로 쓴다.
vi.mock('@/entities/playlist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/playlist')>();
  return { ...actual, searchPlaylists: vi.fn() };
});
const mockedSearchPlaylists = vi.mocked(searchPlaylists);

function createPlaylists(prefix: string, count: number): Playlist[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    title: `${prefix} 플레이리스트 ${index}`,
    channelTitle: '채널',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
  }));
}

// 원하는 시점에 직접 resolve할 수 있는 Promise (응답 순서를 조작할 때 쓴다)
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('HomePage', () => {
  beforeEach(() => {
    mockedSearchPlaylists.mockReset();
  });

  it('처음에는 서브 분위기 목록이 보이지 않는다', () => {
    render(<HomePage />);
    expect(screen.queryByRole('group', { name: '서브 분위기' })).not.toBeInTheDocument();
  });

  it('메인 분위기를 선택하면 해당 서브 분위기 목록이 나타난다', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '신나는' }));

    const subMoodGroup = screen.getByRole('group', { name: '서브 분위기' });
    const labels = within(subMoodGroup)
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(labels).toEqual(['드라이브', '아이돌', '노동요', '기분전환', '내적댄스']);
    expect(screen.getByRole('button', { name: '신나는' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('서브 분위기를 선택하면 로딩 후 플레이리스트를 최대 12개 보여 준다', async () => {
    const user = userEvent.setup();
    mockedSearchPlaylists.mockResolvedValue(createPlaylists('드라이브', 12));
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '신나는' }));
    await user.click(screen.getByRole('button', { name: '드라이브' }));

    expect(mockedSearchPlaylists).toHaveBeenCalledWith('드라이브 노래 플레이리스트');
    expect(await screen.findAllByRole('article')).toHaveLength(12);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('불러오는 중에는 로딩 상태를 보여 준다', async () => {
    const user = userEvent.setup();
    // resolve하지 않은 Promise라서 계속 로딩 상태에 머문다
    mockedSearchPlaylists.mockReturnValue(createDeferred<Playlist[]>().promise);
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '조용한' }));
    await user.click(screen.getByRole('button', { name: '집중' }));

    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중');
  });

  it('불러오기에 실패하면 에러 메시지를 보여 준다', async () => {
    const user = userEvent.setup();
    mockedSearchPlaylists.mockRejectedValue(new Error('network error'));
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '날씨' }));
    await user.click(screen.getByRole('button', { name: '비 오는 날' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했어요');
  });

  it('이전 요청의 응답이 늦게 와도 마지막으로 선택한 분위기의 결과를 보여 준다', async () => {
    const user = userEvent.setup();
    const driveRequest = createDeferred<Playlist[]>();
    const idolRequest = createDeferred<Playlist[]>();
    mockedSearchPlaylists
      .mockReturnValueOnce(driveRequest.promise)
      .mockReturnValueOnce(idolRequest.promise);
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '신나는' }));
    await user.click(screen.getByRole('button', { name: '드라이브' }));
    await user.click(screen.getByRole('button', { name: '아이돌' }));

    // 아이돌 응답이 먼저, 드라이브 응답이 나중에 도착한다
    await act(async () => idolRequest.resolve(createPlaylists('아이돌', 1)));
    await act(async () => driveRequest.resolve(createPlaylists('드라이브', 1)));

    expect(screen.getByText('아이돌 플레이리스트 0')).toBeInTheDocument();
    expect(screen.queryByText('드라이브 플레이리스트 0')).not.toBeInTheDocument();
  });

  it('메인 분위기를 바꾸면 이전 결과가 사라진다', async () => {
    const user = userEvent.setup();
    mockedSearchPlaylists.mockResolvedValue(createPlaylists('드라이브', 3));
    render(<HomePage />);

    await user.click(screen.getByRole('button', { name: '신나는' }));
    await user.click(screen.getByRole('button', { name: '드라이브' }));
    expect(await screen.findAllByRole('article')).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: '조용한' }));

    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByRole('button', { name: '혼자' })).toBeInTheDocument();
  });
});
