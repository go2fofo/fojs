/*
 * @Author: fofo
 * @Date: 2026-04-29 10:17:58
 * @LastEditTime: 2026-04-30 13:41:28
 * @LastEditors: fofo
 * @Description: 
 * @FilePath: /fojs/shims-vfo.d.ts
 */
declare module "*.vfo" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// 在 .vfo 文件中自动注入的 Vue API（无需手动 import）
declare const ref: typeof import('vue')['ref'];
declare const reactive: typeof import('vue')['reactive'];
declare const computed: typeof import('vue')['computed'];
declare const watch: typeof import('vue')['watch'];
declare const watchEffect: typeof import('vue')['watchEffect'];
declare const onMounted: typeof import('vue')['onMounted'];
declare const onUnmounted: typeof import('vue')['onUnmounted'];
declare const onUpdated: typeof import('vue')['onUpdated'];
declare const defineComponent: typeof import('vue')['defineComponent'];
declare const h: typeof import('vue')['h'];
declare const Fragment: typeof import('vue')['Fragment'];
declare const Transition: typeof import('vue')['Transition'];
declare const useAttrs: typeof import('vue')['useAttrs'];
declare const useSlots: typeof import('vue')['useSlots'];
declare const toRef: typeof import('vue')['toRef'];

// 编译期宏（用于“去 .value”）：仅在 .vfo 中使用，运行时会被编译器抹掉
declare function $ref<T>(value: T): import('vue').UnwrapRef<T>;
declare function $computed<T>(getter: () => T): T;
declare function $$<T = any>(value: T): T;

// vfojs 运行时注入的辅助函数（编译后的 .vfo 模块内可直接使用）
declare function useFoStore<T extends Record<string, any>>(
  key?: string,
  init?: T | (() => T),
): T;
declare function useFoEffect(
  effect: () => void | (() => void),
  deps?: readonly unknown[],
): void;
declare function useVModel<T = any>(props: any, key: string): import('vue').ComputedRef<T>;

// JSX 语法提示
declare namespace JSX {
  interface IntrinsicElements {
    [elem: string]: any;
  }
}
