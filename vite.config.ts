import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      '__APP_VERSION__': JSON.stringify(pkg.version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    test: {
      // Vitest - tests unitarios de calculos regulatorios (Res. Exenta N 1511/2021)
      environment: 'node',
      include: ['src/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        include: ['src/domain/**'],
        reporter: ['text', 'lcov'],
      },
    },
  };
});
