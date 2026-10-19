import { defineConfig } from 'vite';

/**
 * Empaqueta el convertidor para Node (`vite build --ssr`): así puede importar el motor de la app tal
 * cual, sin copiarlo. Lo deja en `node_modules/.cache`, fuera del repositorio.
 */
export default defineConfig({
  logLevel: 'warn',
  build: {
    ssr: 'tools/training/run.ts',
    outDir: 'node_modules/.cache/training-convert',
    emptyOutDir: true,
    target: 'node22',
    minify: false,
    copyPublicDir: false,
  },
});
