import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Playlist } from '../model/types';
import { PlaylistCard } from './PlaylistCard';

const playlist: Playlist = {
  id: 'VID1',
  title: '공부할 때 듣는 플레이리스트',
  channelTitle: '채널',
  thumbnailUrl: 'https://i.ytimg.com/vi/VID1/hqdefault.jpg',
};

describe('PlaylistCard', () => {
  beforeEach(() => {
    // "3일 전" 같은 상대 날짜가 늘 같게 나오도록 현재 시각을 고정한다
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2025-10-20T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('제목과 채널명을 보여 주고, 누르면 onSelect를 호출한다', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PlaylistCard playlist={playlist} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /공부할 때 듣는 플레이리스트/ }));

    expect(screen.getByText('채널')).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith(playlist);
  });

  it('AI 의심 영상이면 AI 의심 배지를 보여 주고, 카드 버튼 이름에 함께 들어간다', () => {
    render(<PlaylistCard playlist={{ ...playlist, isAiSuspected: true }} onSelect={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /AI 의심.*공부할 때 듣는 플레이리스트/ }),
    ).toBeInTheDocument();
  });

  it('AI 의심이 아니거나 값이 없으면(예전에 저장한 데이터) 배지를 보여 주지 않는다', () => {
    const { rerender } = render(
      <PlaylistCard playlist={{ ...playlist, isAiSuspected: false }} onSelect={vi.fn()} />,
    );
    expect(screen.queryByText('AI 의심')).not.toBeInTheDocument();

    rerender(<PlaylistCard playlist={playlist} onSelect={vi.fn()} />);
    expect(screen.queryByText('AI 의심')).not.toBeInTheDocument();
  });

  it('조회수와 업로드 날짜를 함께 보여 준다', () => {
    render(
      <PlaylistCard
        playlist={{ ...playlist, viewCount: 12_345, publishedAt: '2025-10-17T12:00:00Z' }}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText('조회수 1.2만회 · 3일 전')).toBeInTheDocument();
  });

  it('둘 중 하나만 있으면 있는 것만 보여 준다', () => {
    const { rerender } = render(
      <PlaylistCard playlist={{ ...playlist, viewCount: 832 }} onSelect={() => {}} />,
    );
    expect(screen.getByText('조회수 832회')).toBeInTheDocument();

    rerender(
      <PlaylistCard
        playlist={{ ...playlist, publishedAt: '2023-01-05T12:00:00Z' }}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText('2023. 1. 5.')).toBeInTheDocument();
  });

  it('둘 다 없으면(예전에 저장한 데이터) 조회수·날짜를 보여 주지 않는다', () => {
    render(<PlaylistCard playlist={playlist} onSelect={() => {}} />);

    expect(screen.queryByText(/조회수/)).not.toBeInTheDocument();
    expect(screen.queryByText(/전$/)).not.toBeInTheDocument();
  });
});
