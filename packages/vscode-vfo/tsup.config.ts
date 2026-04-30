/*
 * @Author: fofo
 * @Date: 2026-04-30 15:39:36
 * @LastEditTime: 2026-04-30 15:39:37
 * @LastEditors: fofo
 * @Description: 
 * @FilePath: /fojs/packages/vscode-vfo/tsup.config.ts
 */
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    extension: 'src/extension.ts',
    server: 'src/server.ts',
  },
  format: ['cjs'],
  platform: 'node',
  target: 'es2020',
  dts: true,
  clean: true,
  external: [
    'vscode',
    'vscode-languageclient/node',
    '@fo4/vfojs-language-plugin',
    '@vue/language-core',
    '@vue/language-server',
  ],
});
