import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { initialPlayerState, usePlayerStore, type PlayerItem } from '@/entities/player';
import { AmbientBackground } from './AmbientBackground';

function createItem(id: string): PlayerItem {
  return {
    id,
    title: `${id} 플레이리스트`,
    channelTitle: `${id} 채널`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

// 화면에 깔린 썸네일 배경들의 주소 (마지막이 맨 위)
function thumbnailUrls() {
  return screen.queryAllByTestId('ambient-thumbnail').map((image) => image.getAttribute('src'));
}

// 애니메이션이 끝났다고 알린다.
// jsdom에는 AnimationEvent가 없어서 React가 표준 이름(animationend) 대신 접두사 이름(webkitAnimationEnd)으로
// 듣는다. 실제 브라우저에서는 animationend로 동작한다
function endAnimation(element: Element) {
  act(() => {
    element.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }));
  });
}

describe('AmbientBackground', () => {
  beforeEach(() => {
    localStorage.clear();
    usePlayerStore.setState(initialPlayerState);
  });

  it('재생 전에는 썸네일 없이 기본 배경만 보여 준다', () => {
    render(<AmbientBackground />);

    expect(thumbnailUrls()).toEqual([]);
  });

  it('재생하면 그 플레이리스트의 썸네일을 배경으로 깐다', () => {
    render(<AmbientBackground />);

    act(() => usePlayerStore.getState().play(createItem('VID1')));

    expect(thumbnailUrls()).toEqual(['https://i.ytimg.com/vi/VID1/hqdefault.jpg']);
  });

  it('이어 듣기로 복원된 항목이 있으면 처음부터 그 썸네일을 깐다', () => {
    usePlayerStore.setState({ current: createItem('VID1') });

    render(<AmbientBackground />);

    expect(thumbnailUrls()).toEqual(['https://i.ytimg.com/vi/VID1/hqdefault.jpg']);
  });

  it('다른 플레이리스트로 바뀌면 새 썸네일을 위에 겹치고, 다 나타나면 이전 것을 지운다', () => {
    usePlayerStore.setState({ current: createItem('VID1') });
    render(<AmbientBackground />);

    act(() => usePlayerStore.getState().play(createItem('VID2')));

    // 서서히 나타나는 동안에는 이전 배경이 아래에 남아 있다
    expect(thumbnailUrls()).toEqual([
      'https://i.ytimg.com/vi/VID1/hqdefault.jpg',
      'https://i.ytimg.com/vi/VID2/hqdefault.jpg',
    ]);

    const [, newImage] = screen.getAllByTestId('ambient-thumbnail');
    if (newImage) endAnimation(newImage);

    expect(thumbnailUrls()).toEqual(['https://i.ytimg.com/vi/VID2/hqdefault.jpg']);
  });

  it('배경은 스크린 리더에서 숨긴다', () => {
    usePlayerStore.setState({ current: createItem('VID1') });
    const { container } = render(<AmbientBackground />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
