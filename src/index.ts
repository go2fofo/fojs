import type { Plugin } from 'vite';
import { compileVfo } from './compiler';
export { useFoEffect, useVModel } from './runtime'

export { compileVfo };

/**
 * vfojs 的核心 Vite 插件：
 * - 拦截 `.vfo` 文件
 * - 通过 Babel 将 TSX/JSX 转换为 Vue 可执行的组件模块
 * - 自动注入常用 Vue Composition API（在 `.vfo` 内无需手动 import）
 */
export default function vitePluginVfojs(): Plugin {
  let root = process.cwd();
  let isServe = false;

  return {
    name: 'vite-plugin-vfojs',
    enforce: 'pre',
    configResolved(config) {
      root = config.root || root;
      isServe = config.command === 'serve';
    },
    transform(code: string, id: string) {
      const cleanId = id.split('?')[0];
      if (cleanId.endsWith('.vfo') || cleanId.endsWith('.fo')) {
        const out = compileVfo(code, {
          filename: cleanId,
          cwd: root,
          hmr: isServe,
          isDev: isServe,
        });
        return { code: out.code, map: out.map as any };
      }
    }
  };
}
