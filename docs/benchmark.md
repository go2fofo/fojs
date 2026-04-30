# 基准测试（Benchmark）

本仓库提供一个轻量的基准测试思路，用于对比：

- 原生 Vue 项目 vs vfojs 项目：产物体积
- 简单交互场景：渲染/更新的直观感受

## 建议对比方法（体积）

1. 构建 Vue SFC 示例项目（你可以用 Vite 官方模板）
2. 构建 vfojs 示例项目（仓库自带 `example/`）
3. 对比 `dist/assets/*.js` 的 gzip 后大小

## 关于 Static Hoisting

vfojs 的 JSX 编译依赖 `@vue/babel-plugin-jsx`，开启 `optimize` 后会生成 PatchFlags 并尽可能提升静态节点，减少 diff 成本。
