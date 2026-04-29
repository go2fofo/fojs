/*
 * @Author: whq
 * @Date: 2026-04-29 11:14:52
 * @LastEditTime: 2026-04-29 11:14:53
 * @LastEditors: whq
 * @Description: 
 * @FilePath: /fojs/packages/create-fojs/templates/base/vite.config.ts
 */
// @ts-nocheck
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fojs from 'fojs'

export default defineConfig({
  plugins: [vue(), fojs()],
})
