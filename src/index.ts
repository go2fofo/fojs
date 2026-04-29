import type { Plugin } from 'vite';
import { compileFo } from './compiler';
export { useFoEffect, useVModel } from './runtime'

export { compileFo };

/**
 * fojs 的核心 Vite 插件：
 * - 拦截 `.fo` 文件
 * - 通过 Babel 将 TSX/JSX 转换为 Vue 可执行的组件模块
 * - 自动注入常用 Vue Composition API（在 `.fo` 内无需手动 import）
 */
export default function vitePluginFojs(): Plugin {
  let root = process.cwd();
  let isServe = false;

  return {
    name: 'vite-plugin-fojs',
    enforce: 'pre',
    configResolved(config) {
      root = config.root || root;
      isServe = config.command === 'serve';
    },
    transform(code: string, id: string) {
      const cleanId = id.split('?')[0];
      if (cleanId.endsWith('.fo')) {
        const out = compileFo(code, {
          文件路径: cleanId,
          根目录: root,
          是否启用HMR: isServe,
        });
        return { code: out.code, map: out.map as any };
      }
    }
  };
}
