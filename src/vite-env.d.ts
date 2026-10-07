// Vite 환경변수(import.meta.env)의 타입. 여기 선언하지 않은 변수는 타입 검사를 받지 못한다
interface ImportMetaEnv {
  readonly VITE_USE_MOCK_API?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
