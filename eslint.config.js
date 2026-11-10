import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // В проекте запрещён any (см. CLAUDE.md)
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  // Отключает правила ESLint, которые спорят с Prettier о форматировании
  prettier,
);
