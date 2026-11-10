import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Относительные пути к файлам сборки: игра будет открываться
  // по адресу вида https://<user>.github.io/Gravity/
  base: './',
  test: {
    // Тесты физики и логики идут в Node, без браузера и DOM
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
