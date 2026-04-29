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

// JSX 语法提示
declare namespace JSX {
  interface IntrinsicElements {
    [elem: string]: any;
  }
}
