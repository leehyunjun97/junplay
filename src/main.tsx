import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app';
// Pretendard 가변 폰트 dynamic subset: 파일 하나에 모든 굵기가 들어 있고, 화면에 쓰인 글자가 포함된 조각만 내려받는다
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import '@/app/styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root 요소를 찾을 수 없습니다.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
