import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOAST_DURATION_MS, useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('처음에는 문구가 없다', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.message).toBeNull();
  });

  it('show로 문구를 보여 주고, 정해진 시간이 지나면 사라진다', () => {
    const { result } = renderHook(() => useToast());

    act(() => result.current.show('담았어요'));
    expect(result.current.message).toBe('담았어요');

    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 1));
    expect(result.current.message).toBe('담았어요');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.message).toBeNull();
  });

  it('보이는 중에 다시 show하면 그때부터 시간을 다시 잰다', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.show('담았어요'));
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 500));

    act(() => result.current.show('담았어요'));
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 500));

    expect(result.current.message).toBe('담았어요');
  });
});
