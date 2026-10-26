import { useCallback, useEffect, useState } from 'react';

// 토스트가 화면에 머무는 시간
export const TOAST_DURATION_MS = 2500;

// 잠깐 보였다가 사라지는 안내 문구 상태.
// 문구를 객체로 감싸서, 같은 문구를 연달아 보여 줘도 새 객체라 타이머가 처음부터 다시 시작된다
export function useToast() {
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const show = useCallback((message: string) => setToast({ message }), []);

  return { message: toast?.message ?? null, show };
}
