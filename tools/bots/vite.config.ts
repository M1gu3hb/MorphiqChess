import { defineConfig } from 'vite';

/**
 * Empaqueta el probador de rivales para Node (`vite build --ssr`): importa el código de la app tal
 * cual (motor de reglas, rivales, fuerza), sin copiarlo. Sale a `node_modules/.cache`.
 */
export default defineConfig({
  logLevel: 'warn',
  build: {
    ssr: 'tools/bots/duel.ts',
    outDir: 'node_modules/.cache/bots-duel',
    emptyOutDir: true,
    target: 'node22',
    minify: false,
    copyPublicDir: false,
  },
});
