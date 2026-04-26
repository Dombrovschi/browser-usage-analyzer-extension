import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '',
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.js'),
        content: resolve(__dirname, 'src/content.js'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        dashboard: resolve(__dirname, 'src/dashboard/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
    outDir: 'dist',
  },
})
