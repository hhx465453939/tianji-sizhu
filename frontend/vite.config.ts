import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'mystilight-8char': path.resolve(__dirname, 'node_modules/mystilight-8char/index.js'),
    },
  },
})
