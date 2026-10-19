import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolveSiteUrl, siteMeta } from './tools/site-meta.ts';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefijo vacío: lee también SITE_URL y las variables del sistema de Vercel (no solo las VITE_*).
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), siteMeta(resolveSiteUrl(env))],
    build: {
      target: 'es2022',
      sourcemap: false,
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts', 'tools/**/*.test.ts'],
    },
  };
});
