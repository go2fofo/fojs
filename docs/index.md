# vfojs

vfojs 是一个前端 DSL 框架：React 的外壳，Vue 的灵魂。

- 使用 `.vfo` 文件编写组件
- 使用 TSX/JSX 写结构与 UI
- 使用 Vue 3 Composition API 写逻辑与响应式

## 快速开始

在你的 Vite 项目里安装并启用插件：

```bash
npm i @fo4/vfojs
```

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vfojs from '@fo4/vfojs'

export default defineConfig({
  plugins: [vue(), vfojs()],
})
```

然后在 `src/` 中创建 `.vfo` 组件并使用。
