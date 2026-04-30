// @ts-ignore
import { transformSync } from '@babel/core';
// @ts-ignore
import vueJsx from '@vue/babel-plugin-jsx';
// @ts-ignore
import tsPlugin from '@babel/plugin-transform-typescript';
import type { TransformOptions } from '@babel/core';
import { createRequire } from 'node:module';
import path from 'node:path';
import babelPluginVfojs from './babel-plugin-vfojs';
export type CompileVfoOptions = {
  /** 当前正在处理的文件绝对路径 */
  filename?: string;
  /** 项目根目录，主要用于计算 HMR 的相对路径 ID */
  cwd?: string;
  /** 是否开启 Vite 热更新注入 */
  hmr?: boolean;
  /** 是否为开发模式（影响样式注入逻辑） */
  isDev?: boolean;
};
// --- 内部工具函数 ---
const __vfojs_evalRequire: any = (() => {
  try { return (0, eval)('require'); } catch { return null; }
})();
const require = __vfojs_evalRequire || createRequire(path.join(process.cwd(), 'package.json'));

const __vfojs_wait = <T>(p: Promise<T>): T => { 
  const sab = new SharedArrayBuffer(4);
  const ia = new Int32Array(sab);
  let done = false, value: T | undefined, error: any;
  p.then((v) => { value = v; done = true; Atomics.store(ia, 0, 1); Atomics.notify(ia, 0); })
   .catch((e) => { error = e; done = true; Atomics.store(ia, 0, 1); Atomics.notify(ia, 0); });
  while (!done) Atomics.wait(ia, 0, 0);
  if (error) throw error;
  return value as T;
};

// --- 样式预处理器逻辑 ---
const __vfojs_preprocessStyle = (source: string, filename: string) => {
  const blocks = __vfojs_findStyleBlocks(source);
  if (blocks.length === 0) return source;
  let out = source;
  for (let idx = blocks.length - 1; idx >= 0; idx--) {
    const b = blocks[idx];
    if (b.raw.includes('${')) continue; // 暂不支持动态模板字符串
    if (b.name !== 'scss' && b.name !== 'less') continue;
    
    const text = __vfojs_unescapeTemplate(b.raw);
    let css = '';
    if (b.name === 'scss') {
      try {
        const sass = require('sass');
        css = sass.compileString(text, { loadPaths: [path.dirname(filename)] }).css;
      } catch { throw new Error('请安装 sass: npm i -D sass'); }
    } else {
      try {
        const less = require('less');
        const r: any = __vfojs_wait(less.render(text, { filename, paths: [path.dirname(filename)] }));
        css = r.css;
      } catch { throw new Error('请安装 less: npm i -D less'); }
    }
    const replacement = `export const css = \`${__vfojs_escapeTemplate(css)}\``;
    out = out.slice(0, b.start) + replacement + out.slice(b.end);
  }
  return out;
};

// --- 核心编译函数 ---
export function compileVfo(source: string, options: CompileVfoOptions = {}) {
  const filename = options.filename || 'virtual.vfojs';
  const cwd = options.cwd || process.cwd();
  
  // 1. 样式预处理
  const preprocessed = __vfojs_preprocessStyle(source, filename);

  // 2. 注入运行时辅助函数 (Runtime Library)
  // 这是 vfojs 能够作为 Vue 超集运行的关键
const header = `import { 
  ref, reactive, computed, watch, watchEffect, 
  onMounted, onUnmounted, onUpdated, defineComponent, 
  h, Fragment, Transition, useAttrs, useSlots, toRef,
  getCurrentInstance
} from 'vue';

/** vfojs：核心内部工具 - 获取当前组件的原始 Props */
function __vfojs__getRawProps() {
  const instance = getCurrentInstance();
  if (!instance) return {};
  // 在 Vue 3 中，instance.props 是已经处理好的响应式对象
  return instance.props;
}

/** vfojs：增强型 defineProps (运行时安全版) */
function defineProps(defaults) {
  const rawProps = __vfojs__getRawProps();
  const attrs = useAttrs();
  
  return new Proxy(rawProps, {
    get(target, key) {
      if (key === '__isProxy') return true;
      if (key === '__raw') return target;
      
      // 优先级：1. 显式传入的 props -> 2. 透传的 attrs -> 3. 默认值
      const val = target[key];
      if (val !== undefined) return val;
      
      const attrVal = attrs[key];
      if (attrVal !== undefined) return attrVal;
      
      return defaults ? defaults[key] : undefined;
    },
    has(target, key) {
      return (key in target) || (key in attrs) || (defaults && key in defaults);
    },
    ownKeys(target) {
      const keys = new Set(Reflect.ownKeys(target));
      Object.keys(attrs).forEach(k => keys.add(k));
      if (defaults) Object.keys(defaults).forEach(k => keys.add(k));
      return Array.from(keys);
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true };
    }
  });
}

/** vfojs：增强型 defineEmits */
function defineEmits() {
  const instance = getCurrentInstance();
  return (event, ...args) => {
    if (instance) instance.emit(event, ...args);
  };
}

/** vfojs：Effect 增强（自动清理） */
function useFoEffect(effect, deps) {
  let cleanup;
  const run = () => {
    if (typeof cleanup === 'function') cleanup();
    const next = effect();
    cleanup = typeof next === 'function' ? next : undefined;
  };
  const stop = (Array.isArray(deps) && deps.length > 0) 
    ? watch(deps, run, { immediate: true }) 
    : watchEffect(run);
  onUnmounted(() => { stop(); if (cleanup) cleanup(); });
}

/** vfojs：跨组件双向绑定（可写 ref） */
function __vfojs__toModelRef(props, key) {
  try {
    const raw = props ? props[key] : undefined;
    if (raw && typeof raw === 'object' && 'value' in raw) return raw;
  } catch (_) {}
  
  return computed({
    get() {
      return props ? props[key] : undefined;
    },
    set(v) {
      const fn = props ? (props['onUpdate:' + key]) : undefined;
      if (typeof fn === 'function') fn(v);
    },
  });
}

/** vfojs：复杂组件里快速创建 v-model ref */
function useVModel(props, key) {
  return __vfojs__toModelRef(props, key);
}

/** vfojs：属性透传合并 */
function __vfojs__applyAttrs(vnode, attrs) {
  if (!attrs || !vnode || typeof vnode !== 'object') return vnode;
  const props = vnode.props || (vnode.props = {});
  for (const k in attrs) {
    if (k === 'class') props.class = props.class ? [props.class, attrs.class] : attrs.class;
    else if (k === 'style') props.style = props.style ? [props.style, attrs.style] : attrs.style;
    else if (props[k] == null) props[k] = attrs[k];
  }
  return vnode;
}

/** vfojs：给根节点挂载作用域类名（Scoped CSS） */
function __vfojs__attachScope(vnode, scopeClass) {
  if (!scopeClass) return vnode;
  if (!vnode) return vnode;
  if (Array.isArray(vnode)) return vnode;
  if (typeof vnode !== 'object') return vnode;
  
  // Fragment：尽量把 scope 挂在唯一根节点上，否则包一层 div
  if (vnode.type === Fragment) {
    const ch = vnode.children;
    if (Array.isArray(ch) && ch.length === 1 && ch[0] && typeof ch[0] === 'object') {
      ch[0] = __vfojs__attachScope(ch[0], scopeClass);
      return vnode;
    }
    return h('div', { class: scopeClass }, ch);
  }
  
  const props = vnode.props || (vnode.props = {});
  props.class = props.class ? [props.class, scopeClass] : scopeClass;
  return vnode;
}

/** vfojs：Scoped CSS 注入（按 scopeClass 去重） */
function __vfojs__injectStyle(scopeClass, cssText) {
  if (typeof document === 'undefined') return;
  if (!cssText) return;
  
  const id = 'vfojs-style-' + String(scopeClass || 'default');
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  
  const scoped = __vfojs__scopeCss(String(scopeClass || ''), String(cssText));
  if (el.textContent !== scoped) el.textContent = scoped;
}

/** vfojs：把 CSS 作用域化到 .scopeClass 下（轻量实现） */
function __vfojs__scopeCss(scopeClass, cssText) {
  const scope = String(scopeClass || '').trim();
  if (!scope) return cssText;
  const prefix = '.' + scope;
  
  // 极简作用域化：给普通选择器前缀；跳过 @keyframes / @font-face 等
  const re = /(^|})\s*([^@}{][^{]*)\{/g;
  return String(cssText).replace(re, (m, brace, selector) => {
    const s = String(selector || '').trim();
    if (!s) return m;
    const parts = s.split(',').map(x => x.trim()).filter(Boolean);
    const next = parts.map(p => {
      if (p.startsWith(prefix)) return p;
      if (p.startsWith(':root')) return prefix;
      if (p.startsWith('html') || p.startsWith('body')) return prefix + ' ' + p;
      return prefix + ' ' + p;
    }).join(', ');
    return String(brace || '') + ' ' + next + '{';
  });
}

/** vfojs：状态共享 */
function useFoStore(key = 'default', init) {
  const map = globalThis.__VFOJS_STORE__ || (globalThis.__VFOJS_STORE__ = new Map());
  if (map.has(key)) return map.get(key);
  const state = reactive(typeof init === 'function' ? init() : (init || {}));
  map.set(key, state);
  return state;
}
`;

  // 3. Babel 转换 (TSX -> Vue defineComponent)
  const babelOptions: TransformOptions = {
    filename,
    plugins: [
      babelPluginVfojs, // 关键：负责重写 export default 为 defineComponent 结构
      [tsPlugin, { isTSX: true, allExtensions: true }],
      [vueJsx, { optimize: true }],
    ],
  };

  const result = transformSync(preprocessed, babelOptions);
  const compiled = header + (result?.code || '');

  // 4. HMR 热更新注入
  let hmrCode = '';
  if (options.hmr) {
    const normRoot = cwd.replace(/\\/g, '/');
    const normFile = filename.replace(/\\/g, '/');
    const rel = path.posix.relative(normRoot, normFile);
    const hmrId = `vfojs:${rel}`;

    hmrCode = `\nif (import.meta.hot) {
  const __id = ${JSON.stringify(hmrId)};
  try {
    __VUE_HMR_RUNTIME__.createRecord(__id, __vfojs_main);
    import.meta.hot.accept(m => __VUE_HMR_RUNTIME__.reload(__id, m.default));
  } catch (e) { console.error('[vfojs] HMR failed:', e); }
}\n`;
  }

  return {
    code: compiled + hmrCode,
    map: result?.map,
  };
}

type __VfojsStyleBlock = {  
  name: string;
  start: number;
  end: number;
  raw: string;
};

const __vfojs_findStyleBlocks = (code: string): __VfojsStyleBlock[] => {
  const blocks: __VfojsStyleBlock[] = [];
  const re = /export\s+const\s+(css|style|scss|less)\s*=\s*`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const name = m[1];
    let i = re.lastIndex;
    let raw = '';
    while (i < code.length) {
      const ch = code[i];
      if (ch === '`') break;
      if (ch === '\\' && i + 1 < code.length) {
        raw += ch + code[i + 1];
        i += 2;
        continue;
      }
      raw += ch;
      i++;
    }
    if (i >= code.length) break;
    const endBacktick = i;
    const start = m.index;
    const end = endBacktick + 1;
    blocks.push({ name, start, end, raw });
    re.lastIndex = end;
  }
  return blocks;
  // 反斜杠转义处理
};

const __vfojs_unescapeTemplate = (raw: string) => {
  let s = raw;
  s = s.replace(/\\`/g, '`');
  s = s.replace(/\\\\/g, '\\');
  s = s.replace(/\\n/g, '\n');
  s = s.replace(/\\r/g, '\r');
  s = s.replace(/\\t/g, '\t');
  return s;
};

const __vfojs_escapeTemplate = (text: string) => {
  return String(text).replace(/\\/g, '\\\\').replace(/`/g, '\\`');
};
