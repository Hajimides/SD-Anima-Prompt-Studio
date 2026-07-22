import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@data': resolve(__dirname, 'src/data'),
      '@i18n': resolve(__dirname, 'src/i18n'),
      '@components': resolve(__dirname, 'src/components'),
      '@core': resolve(__dirname, 'src/core'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@webgl': resolve(__dirname, 'src/webgl'),
      '@app-types': resolve(__dirname, 'src/app-types'),
      '@styles': resolve(__dirname, 'src/styles'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
