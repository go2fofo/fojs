import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vfojs from '@fo4/vfojs'

// Vite 配置：启用 Vue 插件 + fojs 插件
export default defineConfig({
  plugins: [vue(), vfojs()],
  optimizeDeps: {
    exclude: ['fo-ui'],
  },
})
