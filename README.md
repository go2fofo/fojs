# vfojs

**一个前端 DSL 框架：React 的外壳，Vue 的灵魂。**

vfojs 是 **Vue 3 的超集**。它以非侵入式的方式深度集成于 Vue 生态，允许你在同一个项目中混合使用 `.vue` 标准组件与 `.vfo` 魔法组件。

- **React 体验**：使用 TSX/JSX 构建 UI，支持同文件多组件组合。
- **Vue 性能**：逻辑层直接复用 Vue 3 Composition API 响应式系统。
- **非侵入式**：通过 Vite 插件精准拦截 `.vfo` 文件，不干扰现有 Vue 代码，完美兼容所有 Vue 插件与 UI 库。

## 主要特性

- **Vue 超集架构**：完全支持 Vue 生态（Router, Pinia, Element Plus），`.vfo` 组件可直接在 `.vue` 中引用，反之亦然。
- **Scoped CSS/SCSS/Less**：支持在 `.vfo` 中直接声明样式变量，编译期自动实现作用域隔离。
- **智能属性透传**：`class/style/id` 等 attrs 自动合并至根节点，保持与 Vue 一致的行为。
- **响应式解构 (Writeable Ref)**：`const { count } = props` 自动转换为 `toRef`，支持跨组件双向绑定。
- **指令语法糖**：`<input $value={state.name} />` 自动展开为高性能的双向绑定逻辑。
- **内置轻量状态管理**：`useFoStore(key, init)` 实现跨组件、跨文件的状态共享。

***

## 在 Vue 项目中使用

vfojs 的设计初衷是**非侵入式**。你可以在现有的 Vue 项目中开启“魔法模式”。

<br />

## 安装 vfojs

```bash
npm install @fo4/vfojs
```

### 1）`.vfo` 组件的基本写法

`.vfo` 的默认导出是一个函数。你可以把它理解成 Vue 组件的 `setup()`：写逻辑、返回 JSX 作为渲染内容。

```tsx
export default () => {
  const count = ref(0)
  const inc = () => count.value++

  return (
    <div>
      <h2>计数</h2>
      <p>count：{count.value}</p>
      <button onClick={inc}>加 1</button>
    </div>
  )
}
```

### 2）自动注入的 API（无需 import）

在 `.vfo` 里可以直接使用（编译时自动注入）：

- Vue：`ref/reactive/computed/watch/watchEffect/onMounted/onUnmounted/onUpdated/defineComponent/h/Fragment/Transition/useAttrs/useSlots/toRef`
- vfojs：`useFoStore/useFoEffect/useVModel`

### 3）子组件写法（同文件组件 / 组合组件）

你可以在同一个 `.vfo` 文件里用函数声明子组件，然后像 React 一样在 JSX 里使用：

```tsx
const myComponent = (props) => {
  return <div>你好，{props.name}</div>
}

export default () => {
  return (
    <div>
      <myComponent name="vfojs" />
    </div>
  )
}
```

说明：

- 只要某个函数变量被当成 `<myComponent name="vfojs" />` 使用，vfojs 会把它自动包装成真正的 Vue 组件实例（支持生命周期）
- `props` 里能直接拿到传入的属性（包含常规 props 和 attrs）
- 也支持第二个参数 `ctx`，用于 `ctx.slots`（slot）等能力

### 4）插槽（slots）

```tsx
const myCard = (props, ctx) => {
  const body = ctx?.slots?.default ? ctx.slots.default() : null
  return (
    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px;">
      <h3>{props.title}</h3>
      <div>{body}</div>
    </div>
  )
}

export default () => {
  return (
    <myCard title="标题">
      <div>这里是 slot 内容</div>
    </myCard>
  )
}
```

### 5）Scoped CSS / SCSS / Less

三种写法都支持：

- CSS：`export const css = \`...\`\`
- SCSS：`export const scss = \`...\`\`
- Less：`export const less = \`...\`\`

也支持在 `.vfo` 中直接引入样式文件：

```ts
import './app.scss'
import './app.less'
```

### 6）属性透传（Attribute Fallthrough）

像 Vue 一样，传给组件的 `class/style/id` 等 attrs 会自动合并到根节点：

```tsx
const myComponent = () => <div class="box">子组件</div>

export default () => {
  return <myComponent class="外部class" style="background: #f8fafc;" />
}
```

### 7）响应式解构（可写 ref）与跨组件双向绑定

子组件：

```tsx
const myComponent = (props) => {
  const { count } = props
  return <button onClick={() => (count.value = count.value + 1)}>count：{count.value}</button>
}
```

父组件用 `onUpdate:count` 接收回写：

```tsx
export default () => {
  const state = reactive({ count: 1 })
  return (
    <div>
      <p>父：{state.count}</p>
      <myComponent count={state.count} onUpdate:count={(v) => (state.count = v)} />
    </div>
  )
}
```

### 8）指令语法糖：`$value`

你可以写：

```tsx
<input $value={state.name} />
```

vfojs 会自动把它展开为双向绑定：

- 原生表单元素（input/textarea/select）：`value/checked` + `onInput/onChange`
- 自定义组件：`modelValue` + `onUpdate:modelValue`

### 9）内置全局状态：`useFoStore`

同一个 key 在多个组件里拿到的是同一份状态（基于 `reactive`）：

```tsx
const A = () => {
  const store = useFoStore('demo', () => ({ count: 0 }))
  return <button onClick={() => store.count++}>A：{store.count}</button>
}

const B = () => {
  const store = useFoStore('demo', () => ({ count: 0 }))
  return <button onClick={() => store.count--}>B：{store.count}</button>
}
```

### 10）便捷 Hook：`useFoEffect` / `useVModel`

`useFoEffect`：更接近 React effect 的心智，组件卸载时自动停止监听并清理副作用：

```ts
useFoEffect(() => {
  console.log(count.value)
  return () => console.log('cleanup')
}, [count])
```

`useVModel`：复杂组件里快速创建一个双向绑定 ref（修改会触发 `onUpdate:name`）：

```ts
const name = useVModel(props, 'name')
name.value = 'next'
```

### 11）显式 Props/Emits：`defineProps` / `defineEmits`

`defineProps` 和 `defineEmits` 由编译器自动注入（无需手动 import），用于在 `.vfo` 中显式声明组件的 props 与事件。

```tsx
// defineProps 和 defineEmits 将由编译器自动注入，无需手动 import
export default (context) => {
  // 1. 定义 Props（带类型和默认值）
  const props = defineProps<{
    title: string;
    count?: number;
  }>({
    count: 0, // 默认值
  });

  // 2. 定义 Emits
  const emit = defineEmits<{
    (e: 'change', value: number): void;
    (e: 'update:count', value: number): void;
  }>();

  return (
    <div onClick={() => emit('change', props.count)}>
      {props.title}: {props.count}
    </div>
  );
}
```

事件映射规则：

- `emit('change', x)` 会尝试调用 `props.onChange(x)`
- `emit('update:count', x)` 会尝试调用 `props['onUpdate:count'](x)`

## 安装 vfojs

```bash
npm install @fo4/vfojs
```

### 1. 配置 Vite

在 `vite.config.ts` 中，将 `vfojs` 插件置于 `vue` 插件之前：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vfojs from '@fo4/vfojs'

export default defineConfig({
  plugins: [
    vfojs(), // 拦截并处理 .vfo 文件
    vue(),  // 处理标准 .vue 文件
  ],
})
```

### 2. 混合开发模式

**在** **`App.vue`** **中调用** **`.vfo`** **组件：**

```vue
<script setup>
import MyFoCard from './components/Card.vfo'
</script>
<template>
  <MyFoCard title="来自 vfojs 的组件" class="custom-style" />
</template>
```

***

***

## 快速上手 (CLI)

```bash
npx create-vfojs@latest my-app
```

创建完成后，你可以立即体验。

```bash
cd my-app
npm i
npm run dev
```
