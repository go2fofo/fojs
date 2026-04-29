/*
 * @Author: fofo
 * @Date: 2026-04-29 11:33:44
 * @LastEditTime: 2026-04-29 11:33:45
 * @LastEditors: fofo
 * @Description: 
 * @FilePath: /fojs/bench/size.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * 读取目录下的 js/css 产物大小（字节）
 */
async function listAssetsSize(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    if (!e.isFile()) continue
    if (!e.name.endsWith('.js') && !e.name.endsWith('.css')) continue
    const p = path.join(dir, e.name)
    const stat = await fs.stat(p)
    out.push({ file: e.name, bytes: stat.size })
  }
  out.sort((a, b) => b.bytes - a.bytes)
  return out
}

/**
 * 打印简易表格
 */
function printTable(title, rows) {
  console.log(`\n${title}`)
  for (const r of rows) {
    const kb = (r.bytes / 1024).toFixed(2)
    console.log(`- ${r.file}：${kb} KB`)
  }
}

async function main() {
  const exampleAssets = path.resolve(process.cwd(), 'example/dist/assets')
  const fojsRows = await listAssetsSize(exampleAssets)
  printTable('fojs 示例项目（example）产物体积', fojsRows)

  console.log('\n说明：')
  console.log('- 该脚本只统计构建产物文件大小（未计算 gzip）。')
  console.log('- 如需对比 Vue SFC，请额外准备一个 Vue SFC 示例项目，并把其 dist/assets 路径也纳入统计。')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

