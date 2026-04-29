declare module "*.fo" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// 在 .fo 文件中自动注入的 Vue API（无需手动 import）
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

// fojs 运行时注入的辅助函数（编译后的 .fo 模块内可直接使用）
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
