# fojs

fojs 是一个前端 DSL 框架：React 的外壳，Vue 的灵魂。

- 使用 `.fo` 文件编写组件
- 使用 TSX/JSX 写结构与 UI
- 使用 Vue 3 Composition API 写逻辑与响应式

## 快速开始

在你的 Vite 项目里安装并启用插件：

```bash
npm i fojs
```

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fojs from 'fojs'

export default defineConfig({
  plugins: [vue(), fojs()],
})
```

然后在 `src/` 中创建 `.fo` 组件并使用。

