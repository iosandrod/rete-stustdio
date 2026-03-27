import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  define: {
    'process.env.JS_EXAMPLES': JSON.stringify('[]'),
    'process.version': '""'
  },
  plugins: [
    vue(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    })
  ],
  resolve: {
    alias: [
      {
        find: 'rete-vue-plugin',
        replacement: resolve(__dirname, '../rete-vue-plugin/index.ts'),
      }
    ],
  },
  build: {
    rollupOptions: {
      external: ['rete', 'rete-area-plugin', 'rete-connection-plugin', 'rete-context-menu-plugin', 'rete-history-plugin', 'rete-render-utils', 'rete-scopes-plugin', 'rete-structures', 'rete-auto-arrange-plugin', 'vue']
    }
  }
})
