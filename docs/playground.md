# Playground

本仓库提供了一个最小可用的 Playground，用于在浏览器中直接编写 `.fo` 代码并实时预览。

目录：`/playground`

## 启动

```bash
cd playground
fnm use
npm i
npm run dev
```

## 原理

- 浏览器侧：textarea 输入代码，发送到服务端编译接口
- 服务端：调用 `compileFo` 编译 `.fo` 源码，返回 ESM 代码字符串
- 浏览器侧：将返回的代码写入 Blob，并动态 `import()` 得到组件进行渲染

