/*
 * @Author: fofo
 * @Date: 2026-04-30 15:37:53
 * @LastEditTime: 2026-04-30 15:37:54
 * @LastEditors: fofo
 * @Description: 
 * @FilePath: /fojs/packages/vscode-vfo/src/server.ts
 */
const patchVueLanguageCore = () => {
  const core = require('@vue/language-core');
  const pluginPkg = require('@fo4/vfojs-language-plugin');
  const vfoPlugin = pluginPkg?.default ?? pluginPkg;

  const resolver = core?.CompilerOptionsResolver;
  if (!resolver?.prototype?.build) return;
  if (resolver.prototype.__vfo_patched__) return;

  const rawBuild = resolver.prototype.build;
  resolver.prototype.build = function (...args: any[]) {
    const built = rawBuild.apply(this, args);
    const plugins = Array.isArray(built?.plugins) ? built.plugins : [];
    const next = typeof vfoPlugin === 'function' ? [...plugins, vfoPlugin] : plugins;
    return { ...built, plugins: next };
  };
  resolver.prototype.__vfo_patched__ = true;
};

patchVueLanguageCore();

require('@vue/language-server');

