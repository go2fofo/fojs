import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fojs from 'fojs'

// Vite 配置：启用 Vue 插件 + fojs 插件
export default defineConfig({
  plugins: [vue(), fojs()],
  optimizeDeps: {
    exclude: ['fo-ui'],
  },
})
