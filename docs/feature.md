# 功能说明与变更记录

本文件用于记录 vfojs 的核心功能点与变更内容。

## 核心功能

### 1. `.vfo` 文件编译

- 通过 Vite 插件拦截 `.vfo` 后缀文件
- 使用 Babel 将 TSX/JSX 转换为 Vue 渲染函数
- 默认导出函数会自动包装为 `defineComponent({ setup })`

### 2. 自动注入 Composition API

在 `.vfo` 文件中默认可直接使用以下 API（无需手动 import）：

- 响应式：`ref`、`reactive`、`computed`、`watch`、`watchEffect`
- 生命周期：`onMounted`、`onUnmounted`、`onUpdated`
- 渲染：`h`、`Fragment`、`Transition`

### 3. 类型支持

- 提供 `shims-vfo.d.ts`，让 TypeScript/VSCode 识别 `.vfo` 模块
- 提供 JSX IntrinsicElements 的兜底类型，减少编辑器报错

### 4. 发布支持

- npm：构建产物位于 `dist/`，可直接发布到 npm
- JSR：提供 `jsr.json`，可将 TypeScript 源码以 ESM 形式发布到 JSR

### 5. Scoped CSS

- 在 `.vfo` 中声明 `export const css = \`...\``（或 `export const style = \`...\``）
- 构建时自动注入样式到页面
- 通过作用域类名实现隔离，减少样式污染

### 6. 细化 HMR（热更新）

- 在开发模式下为 `.vfo` 组件注入 Vue HMR 逻辑
- 优先尝试组件级替换，减少整页刷新概率

### 7. 属性透传（Attribute Fallthrough）

- 通过 `useAttrs()` 获取 attrs 并合并到根节点
- 对 `class/style` 做合并策略，避免覆盖用户传入样式

### 8. 响应式解构（Reactive Destructuring）

- 将 `const { x } = props` 自动转换为 `const x = toRef(props, 'x')`
- 解决解构后丢失响应式的问题

### 9. 内置全局状态（useFoStore）

- 提供 `useFoStore(key, init)`：同一个 key 跨组件共享同一份 `reactive` 状态
- 适用于小型/中型项目的轻量状态共享

### 10. 指令语法糖（$value）

- 支持 `<input $value={state.xxx} />`
- 编译为 `modelValue` + `onUpdate:modelValue` 的等价写法

### 11. CLI（create-vfojs）

- 提供 `create-vfojs` 脚手架（目录：`/packages/create-vfojs`）
- 支持可选集成：
  - Tailwind CSS（`--tailwind`）
  - Vue Router（`--router`）

### 12. 官方文档与 Playground

- 文档基于 VitePress（目录：`/docs`）
- 提供最小 Playground（目录：`/playground`），支持浏览器中实时编译预览 `.vfo`

### 13. 基准测试（Benchmark）

- 提供 `bench/size.mjs` 用于统计构建产物体积（便于与 Vue SFC 项目对比）

### 14. UI 组件库（fo-ui）

- 提供 `fo-ui`（目录：`/packages/fo-ui`）
- 组件示例：Button/Input/Card/Modal/Switch/Toast

## 变更记录（手动维护）

- 2026-04-29：完成 `.vfo` 编译链路、自动注入 API、示例项目、npm/JSR 发布配置
- 2026-04-29：新增 Scoped CSS、细化 HMR、属性透传、响应式解构、useFoStore、$value 语法糖、create-vfojs、VitePress 文档、Playground、基准测试脚本
