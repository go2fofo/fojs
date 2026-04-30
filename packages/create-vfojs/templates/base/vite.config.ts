/*
 * @Author: whq
 * @Date: 2026-04-29 11:14:52
 * @LastEditTime: 2026-04-29 16:41:11
 * @LastEditors: fofo
 * @Description: 
 * @FilePath: /fojs/packages/create-vfojs/templates/base/vite.config.ts
 */
// @ts-nocheck
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vfojs from '@fo4/vfojs'

export default defineConfig({
  plugins: [vue(), vfojs()],
})
