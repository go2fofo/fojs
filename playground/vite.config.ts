/*
 * @Author: fofo
 * @Date: 2026-04-29 11:19:54
 * @LastEditTime: 2026-04-29 11:19:55
 * @LastEditors: fofo
 * @Description: 
 * @FilePath: /fojs/playground/vite.config.ts
 */
// @ts-nocheck
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fojs, { compileFo } from 'fojs'

function fojsPlaygroundServer() {
  return {
    name: 'fojs-playground-server',
    configureServer(server) {
      server.middlewares.use('/__fojs_compile', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8')
            const body = JSON.parse(raw)
            const code = String(body?.code || '')
            const out = compileFo(code, { 文件路径: 'Play.fo', 根目录: server.config.root, 是否启用HMR: false })
            res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
            res.end(out.code)
          } catch (e) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ message: String(e?.message || e) }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), fojs(), fojsPlaygroundServer()],
})

