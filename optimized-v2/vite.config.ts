import { defineConfig } from 'vite';
import { resolve } from 'path';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  base: './',
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
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'prompt-data': ['./src/data/promptLibrary.json'],
          'i18n-data': ['./src/i18n/zh-CN.json', './src/i18n/zh-TW.json', './src/i18n/en.json'],
        },
      },
    },
  },
  css: {
    devSourcemap: true,
  },
});
