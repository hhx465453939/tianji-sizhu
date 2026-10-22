import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')) as { version: string }

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'mystilight-8char': path.resolve(__dirname, 'node_modules/mystilight-8char/index.js'),
    },
  },
  define: {
    // Single source of truth for the displayed version (Settings page + APK).
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    // ECharts dominates the bundle; keep the warning threshold realistic.
    chunkSizeWarningLimit: 2500,
  },
})
