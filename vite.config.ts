import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import path from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // CRITICAL: Manual copy of preload - NOT bundled by Vite
    // This prevents "module not found: fs" errors in renderer context
    {
      name: 'copy-preload',
      closeBundle() {
        if (!existsSync('dist-electron')) {
          mkdirSync('dist-electron', { recursive: true })
        }
        copyFileSync('electron/preload.js', 'dist-electron/preload.cjs')
        console.log('✅ Copied preload.js → dist-electron/preload.cjs (raw, unbundled)')
      },
    },
    // IMPORTANT: Only main.ts in electron() plugin - NO preload entry
    electron([
      {
        // Main process only - preload is copied manually above
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'es',
                entryFileNames: 'main.js',
              },
            },
          },
        },
      },
    ]),
  ],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
