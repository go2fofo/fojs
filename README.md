# fojs

一个前端 DSL 框架：React 的外壳，Vue 的灵魂。

- 通过自定义 `.fo` 文件使用 TSX/JSX 构建 UI
- 逻辑层直接复用 Vue 3 Composition API 响应式系统
- 通过 Vite 插件在编译阶段把 `.fo` 转换为标准的 Vue 组件

## 主要特性

- Scoped CSS：在 `.fo` 中声明 `export const css = \`...\`\`，自动注入且隔离作用域
- 属性透传：`class/style/id` 等 attrs 合并到根节点
- 响应式解构：`const { x } = props` 自动转换为“可写 ref”（支持跨组件双向绑定）
- 指令语法糖：支持 `<input $value={state.xxx} />`
- 内置全局状态：`useFoStore(key, init)`（跨组件共享）

## 使用方式（在 Vite 项目中）

### 运行环境

- Node.js >= 18（建议使用 Node 20.19+）

### 安装

#### 从 JSR 安装

```bash
# npm
npx jsr add @fo4/fojs

# pnpm
pnpm i jsr:@fo4/fojs

# yarn
yarn add jsr:@fo4/fojs
```

> 说明：JSR 会提供 npm 兼容层，因此在 npm/pnpm/yarn 项目里也能以依赖的方式使用。

### 配置 Vite

在 `vite.config.ts` 中启用 Vue 插件与 fojs 插件：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fojs from 'fojs'

export default defineConfig({
  plugins: [vue(), fojs()],
})
```

### 类型引用

在你的项目里添加类型引用（任选其一）：

- 方式 A：在 `src/shims-fo.d.ts` 中添加：

```ts
/// <reference types="fojs/shims-fo" />
```

- 方式 B：把 `fojs/shims-fo.d.ts` 的内容复制到你的项目里（不推荐，升级不方便）。

## create-fojs（创建项目）

`create-fojs` 是 fojs 的项目脚手架，用来一键创建可运行的 Vite + Vue + fojs 工程。

### 用法

```bash
npx jsr run @fo4/fojs/create-app my-app
```

可选项：

```bash
# 集成 Tailwind CSS
npx jsr run @fo4/fojs/create-app my-app --tailwind

# 集成 Vue Router
npx jsr run @fo4/fojs/create-app my-app --router

# 同时集成
npx jsr run @fo4/fojs/create-app --tailwind --router
```

创建完成后：

```bash
cd my-app
fnm use
npm i
npm run dev
```

#
