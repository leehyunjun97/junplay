import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // CLAUDE.md: any 금지
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  // Vercel 서버리스 함수는 브라우저가 아니라 Node.js에서 실행된다
  {
    files: ['api/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Prettier와 겹치는 포맷 규칙을 끈다 (항상 마지막에 둔다)
  eslintConfigPrettier,
]);
