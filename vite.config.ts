import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import { buildSync } from 'esbuild';

function preloadPlugin(): Plugin {
  return {
    name: 'preload-esbuild',
    buildStart() {
      buildSync({
        entryPoints: ['src/preload/index.ts'],
        outfile: 'dist-electron/preload/index.cjs',
        bundle: true,
        platform: 'node',
        format: 'cjs',
        external: ['electron']
      });
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('src/preload')) {
        buildSync({
          entryPoints: ['src/preload/index.ts'],
          outfile: 'dist-electron/preload/index.cjs',
          bundle: true,
          platform: 'node',
          format: 'cjs',
          external: ['electron']
        });
        server.ws.send({ type: 'full-reload' });
      }
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    preloadPlugin(),
    electron([
      {
        entry: 'src/main/index.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron', 'adm-zip']
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer')
    }
  },
  server: {
    port: 5173
  }
});
