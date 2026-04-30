# vfojs

一个前端 DSL 框架：React 的外壳，Vue 的灵魂。

- 通过自定义 `.vfo` 文件使用 TSX/JSX 构建 UI
- 逻辑层直接复用 Vue 3 Composition API 响应式系统
- 通过 Vite 插件在编译阶段把 `.vfo` 转换为标准的 Vue 组件

## 主要特性

- Scoped CSS：在 `.vfo` 中声明 `export const css = \`...\`\`，自动注入且隔离作用域
- 属性透传：`class/style/id` 等 attrs 合并到根节点
- 响应式解构：`const { x } = props` 自动转换为“可写 ref”（支持跨组件双向绑定）
- 指令语法糖：支持 `<input $value={state.xxx} />`
- 内置全局状态：`useFoStore(key, init)`（跨组件共享）

## 使用方式（在 Vite 项目中）

## 项目目录结构

下面是仓库主要目录的用途说明（只列核心部分）：

```text
fojs/
  src/                      vfojs 核心：Vite 插件 + 编译器 + Babel 插件
    index.ts                Vite 插件入口（拦截 .vfo 并调用 compileFo）
    compiler.ts             compileFo：注入运行时辅助、Babel 转换、HMR 拼接
    babel-plugin-fojs.ts    Babel 插件：Scoped CSS / attrs / 响应式解构 / $value 等

  shims-vfo.d.ts            .vfo 文件的 TS 类型声明（项目使用时需要引用）
  jsr.json                  JSR 发布配置（exports / version / name）

  example/                  示例项目（Vite + Vue + vfojs + fo-ui）
    src/demos/              所有能力演示页（中文案例）

  packages/
    fo-ui/                  基于 vfojs 的 UI 组件库（源码为 .vfo）
    create-vfojs/           脚手架：创建新项目（可选 tailwind/router）

  docs/                     VitePress 文档
  playground/               浏览器 Playground（在线编译预览 .vfo）
  bench/                    Benchmark / 体积统计脚本
```

## 运行环境

- Node.js >= 18（示例项目建议使用 Node 20.19+）
- 必须使用 fnm 管理 Node 版本（仓库提供 `.node-version`）

1. 安装依赖

```bash
npm i @fo4/vfojs
```

1. 配置 `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vfojs from '@fo4/vfojs'

export default defineConfig({
  plugins: [vue(), vfojs()],
})
```

1. 在项目里添加类型引用（任选其一）

- 方式 A：在 `src/shims-vfo.d.ts` 中添加：

```ts
/// <reference types="@fo4/vfojs/shims-vfo" />
```

- 方式 B：把 `@fo4/vfojs/shims-vfo.d.ts` 的内容复制到你的项目里（不推荐，后续升级不方便）。

## 文档

- 功能说明与变更记录：见 [feature.md](file:///Users/fofo/Desktop/project/qita/fojs/docs/feature.md)
- VitePress 文档：`npm run docs:dev`（目录：`/docs`）

## Playground

仓库提供最小 Playground（目录：`/playground`），可在浏览器中实时编译预览 `.vfo`。

## 基准测试

体积统计脚本：`node bench/size.mjs`

## CLI（create-vfojs）

脚手架源码位于 `packages/create-vfojs`，支持：

- `--tailwind`：集成 Tailwind CSS
- `--router`：集成 Vue Router

## 发布到 npm

vfojs 根包（`name: @fo4/vfojs`）可以直接发布到 npm。建议按下面的顺序操作：

1. 确认登录与权限

```bash
npm whoami
npm login
```

1. 更新版本号（建议使用 npm 内置版本管理）

```bash
npm version patch
```

1. 构建（根包发布前需要构建 dist 与类型）

```bash
npm run build
npm publish --access public
```

## 发布 fo-ui 到 npm（可选）

`packages/fo-ui` 当前是“源码发布”（`.vfo` 组件源码直接发布），使用方需要启用 vfojs 插件才能编译它。

```bash
cd packages/fo-ui
npm version patch
npm publish --access public
```

## 发布到 JSR（jsr.io）

本仓库已提供 [jsr.json](file:///Users/fofo/Desktop/project/qita/fojs/jsr.json)，用于以 TypeScript 源码 + ESM 的形式发布到 JSR。

JSR 发布前的关键点：

1. 修改 `jsr.json` 的包名与版本

- `name` 必须是你的 scope，例如：`@你的账号/vfojs`
- `version` 建议与 `package.json` 同步（便于维护）
- `exports` 指向源码入口（本仓库默认是 `./src/index.ts`）

1. 发布命令（npm 环境推荐使用 npx）

```bash
npx jsr publish
```

首次发布会要求你在浏览器中授权，成功后会自动上传并生成文档页面。

1. 验证与使用

- 打开 `https://jsr.io/@你的账号/vfojs` 检查版本、文档与导出是否正确
- npm/Node 项目中也可以通过 JSR 安装（JSR 会提供 npm 兼容入口），例如：
  - `npx jsr add @你的账号/vfojs`

### 常见问题（JSR）

- 仅支持 ESM：确保导出是 `export` / `import` 风格（本仓库已满足）
- 导出路径要稳定：`exports` 中的文件必须存在且可被解析
- 发布失败时建议先在本地跑一遍构建/类型检查，确保仓库状态干净再发布

> JSR 会为 TypeScript 包生成文档与类型定义，并以 ESM 形式分发，同时可在 Node/Deno/Bun 等环境使用。
