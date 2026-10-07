// toBeInTheDocument() 같은 DOM 전용 matcher를 expect에 추가한다
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest globals를 쓰지 않으므로 Testing Library의 자동 정리가 등록되지 않는다.
// 테스트마다 렌더링한 DOM을 직접 정리해 다음 테스트에 영향을 주지 않게 한다.
afterEach(() => {
  cleanup();
});
