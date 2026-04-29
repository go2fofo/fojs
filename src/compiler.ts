// @ts-ignore
import { transformSync } from '@babel/core';
// @ts-ignore
import vueJsx from '@vue/babel-plugin-jsx';
// @ts-ignore
import tsPlugin from '@babel/plugin-transform-typescript';
import type { TransformOptions } from '@babel/core';
import path from 'node:path';
import babelPluginFojs from './babel-plugin-fojs';

export type CompileFoOptions = {
  文件路径?: string;
  根目录?: string;
  是否启用HMR?: boolean;
};

/**
 * 编译 `.fo` 源码为标准 ESM 模块代码
 */
export function compileFo(source: string, options: CompileFoOptions = {}) {
  const filePath = options.文件路径 || 'virtual.fo';

  const header = `import { ref, reactive, computed, watch, watchEffect, onMounted, onUnmounted, onUpdated, defineComponent, h, Fragment, Transition, useAttrs, useSlots, toRef } from 'vue';\n` +
    `/** 将样式注入到页面（仅浏览器环境生效） */\n` +
    `function __fojs__injectStyle(scopeClass, cssText) {\n` +
    `  try {\n` +
    `    if (typeof document === 'undefined') return;\n` +
    `    const cache = globalThis.__FOJS_STYLE_CACHE__ || (globalThis.__FOJS_STYLE_CACHE__ = new Set());\n` +
    `    const key = String(scopeClass || '') + '::' + String(cssText || '');\n` +
    `    if (cache.has(key)) return;\n` +
    `    const el = document.createElement('style');\n` +
    `    el.setAttribute('data-fojs-style', String(scopeClass || ''));\n` +
    `    el.textContent = __fojs__scopeCss(String(scopeClass || ''), String(cssText || ''));\n` +
    `    document.head.appendChild(el);\n` +
    `    cache.add(key);\n` +
    `  } catch (_) {}\n` +
    `}\n` +
    `/** 将 CSS 选择器限定在作用域类名下（简单实现，覆盖大多数常见写法） */\n` +
    `function __fojs__scopeCss(scopeClass, cssText) {\n` +
    `  if (!scopeClass) return cssText;\n` +
    `  const prefix = '.' + scopeClass;\n` +
    `  return String(cssText).replace(/(^|\\}|\\n)\\s*([^@\\n\\{\\}][^\\{\\}]*?)\\s*\\{/g, (m, g1, sel) => {\n` +
    `    const s = String(sel).trim();\n` +
    `    if (!s) return m;\n` +
    `    const next = s.split(',').map(x => prefix + ' ' + x.trim()).join(', ');\n` +
    `    return g1 + ' ' + next + ' {';\n` +
    `  });\n` +
    `}\n` +
    `/** 将 attrs 合并到根节点，确保 class/style/id 等透传行为稳定 */\n` +
    `function __fojs__applyAttrs(vnode, attrs) {\n` +
    `  if (!attrs || !vnode || typeof vnode !== 'object') return vnode;\n` +
    `  const props = vnode.props || (vnode.props = {});\n` +
    `  for (const k in attrs) {\n` +
    `    const v = attrs[k];\n` +
    `    if (k === 'class') {\n` +
    `      props.class = props.class ? [props.class, v] : v;\n` +
    `      continue;\n` +
    `    }\n` +
    `    if (k === 'style') {\n` +
    `      props.style = props.style ? [props.style, v] : v;\n` +
    `      continue;\n` +
    `    }\n` +
    `    if (props[k] == null) props[k] = v;\n` +
    `  }\n` +
    `  return vnode;\n` +
    `}\n` +
    `function __fojs__cloneShallow(v) {\n` +
    `  if (Array.isArray(v)) return v.slice();\n` +
    `  if (v && typeof v === 'object') return Object.assign({}, v);\n` +
    `  return v;\n` +
    `}\n` +
    `/**\n` +
    ` * 将 props 上的字段包装为“可写 ref”。\n` +
    ` * - 如果 props[key] 本身就是 ref，则直接返回它（支持直接传 ref 做双向绑定）。\n` +
    ` * - 否则返回 computed({ get, set })，set 会触发 props['onUpdate:' + key]\n` +
    ` */\n` +
    `function __fojs__toModelRef(props, key) {\n` +
    `  try {\n` +
    `    const raw = props ? props[key] : undefined;\n` +
    `    if (raw && typeof raw === 'object' && 'value' in raw) return raw;\n` +
    `  } catch (_) {}\n` +
    `  const proxyCache = new WeakMap();\n` +
    `  let scheduled = false;\n` +
    `  const emit = () => {\n` +
    `    if (scheduled) return;\n` +
    `    scheduled = true;\n` +
    `    Promise.resolve().then(() => {\n` +
    `      scheduled = false;\n` +
    `      const fn = props ? props['onUpdate:' + key] : undefined;\n` +
    `      if (typeof fn === 'function') fn(__fojs__cloneShallow(props ? props[key] : undefined));\n` +
    `    });\n` +
    `  };\n` +
    `  const wrap = (obj) => {\n` +
    `    if (!obj || typeof obj !== 'object') return obj;\n` +
    `    const tag = Object.prototype.toString.call(obj);\n` +
    `    if (tag !== '[object Object]' && tag !== '[object Array]') return obj;\n` +
    `    if (proxyCache.has(obj)) return proxyCache.get(obj);\n` +
    `    const p = new Proxy(obj, {\n` +
    `      get(target, prop, receiver) {\n` +
    `        const v = Reflect.get(target, prop, receiver);\n` +
    `        return (v && typeof v === 'object') ? wrap(v) : v;\n` +
    `      },\n` +
    `      set(target, prop, value, receiver) {\n` +
    `        const ok = Reflect.set(target, prop, value, receiver);\n` +
    `        emit();\n` +
    `        return ok;\n` +
    `      },\n` +
    `      deleteProperty(target, prop) {\n` +
    `        const ok = Reflect.deleteProperty(target, prop);\n` +
    `        emit();\n` +
    `        return ok;\n` +
    `      },\n` +
    `    });\n` +
    `    proxyCache.set(obj, p);\n` +
    `    return p;\n` +
    `  };\n` +
    `  return computed({\n` +
    `    get() {\n` +
    `      const v = props ? props[key] : undefined;\n` +
    `      return (v && typeof v === 'object') ? wrap(v) : v;\n` +
    `    },\n` +
    `    set(v) {\n` +
    `      const fn = props ? props['onUpdate:' + key] : undefined;\n` +
    `      if (typeof fn === 'function') fn(v);\n` +
    `    },\n` +
    `  })\n` +
    `}\n` +
    `/** 给根节点附加作用域类名（用于 Scoped CSS） */\n` +
    `function __fojs__attachScope(vnode, scopeClass) {\n` +
    `  if (!scopeClass || !vnode || typeof vnode !== 'object') return vnode;\n` +
    `  const props = vnode.props || (vnode.props = {});\n` +
    `  props.class = props.class ? [props.class, scopeClass] : scopeClass;\n` +
    `  return vnode;\n` +
    `}\n` +
    `/** 极简全局状态：跨组件共享，基于 reactive */\n` +
    `function useFoStore(key = 'default', init) {\n` +
    `  const map = globalThis.__FOJS_STORE__ || (globalThis.__FOJS_STORE__ = new Map());\n` +
    `  if (map.has(key)) return map.get(key);\n` +
    `  const base = typeof init === 'function' ? init() : (init || {});\n` +
    `  const state = reactive(base);\n` +
    `  map.set(key, state);\n` +
    `  return state;\n` +
    `}\n`;

  const babelOptions: TransformOptions = {
    filename: filePath,
    plugins: [
      babelPluginFojs,
      [tsPlugin, { isTSX: true, allExtensions: true }],
      [vueJsx, { optimize: true }],
    ],
  };

  const result = transformSync(source, babelOptions);
  const compiled = header + (result?.code || '');

  let hmrCode = '';
  if (options.是否启用HMR) {
    const root = options.根目录 || process.cwd();
    const rel = path.posix.relative(root.replace(/\\/g, '/'), filePath.replace(/\\/g, '/'));
    const hmrId = `fojs:${rel}`;

    hmrCode = `\n` +
      `if (import.meta.hot) {\n` +
      `  const __fojs_hmr_id = ${JSON.stringify(hmrId)};\n` +
      `  try {\n` +
      `    // @ts-ignore\n` +
      `    __VUE_HMR_RUNTIME__.createRecord(__fojs_hmr_id, __fojs_main);\n` +
      `    import.meta.hot.accept((m) => {\n` +
      `      // @ts-ignore\n` +
      `      __VUE_HMR_RUNTIME__.reload(__fojs_hmr_id, m.default);\n` +
      `    });\n` +
      `  } catch (_) {}\n` +
      `}\n`;
  }

  return {
    code: compiled + hmrCode,
    map: result?.map,
  };
}
