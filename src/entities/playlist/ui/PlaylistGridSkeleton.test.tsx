import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MAX_PLAYLIST_RESULTS } from '../api/searchPlaylists';
import { PlaylistGridSkeleton } from './PlaylistGridSkeleton';

describe('PlaylistGridSkeleton', () => {
  it('기본으로 검색 결과 최대 개수만큼 카드 자리를 그린다', () => {
    render(<PlaylistGridSkeleton />);

    expect(screen.getByTestId('playlist-grid-skeleton').children).toHaveLength(
      MAX_PLAYLIST_RESULTS,
    );
  });

  it('스크린 리더에서는 숨긴다', () => {
    render(<PlaylistGridSkeleton count={2} />);

    const skeleton = screen.getByTestId('playlist-grid-skeleton');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton.children).toHaveLength(2);
  });
});
