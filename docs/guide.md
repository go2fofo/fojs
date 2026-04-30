# 指南

## `.vfo` 文件写法

`.vfo` 的默认导出是一个函数，它会被自动包装为 Vue 组件的 `setup`。

```tsx
export default () => {
  const count = ref(0)
  const inc = () => count.value++

  return (
    <div>
      <p>计数：{count.value}</p>
      <button onClick={inc}>加 1</button>
    </div>
  )
}
```

## Scoped CSS

在 `.vfo` 文件中声明 `export const css = \`...\``，框架会：

- 自动把 CSS 注入到页面
- 自动给根节点附加一个作用域类名，避免样式污染

```tsx
export const css = `
.box {
  padding: 16px;
}
`
```

完整示例（来自 example 项目）：

```tsx
export const css = `
.box {
  padding: 16px;
  border: 1px dashed #94a3b8;
  border-radius: 12px;
}

.tip {
  color: #64748b;
}
`

export default () => {
  return (
    <div class="box">
      <h2>Scoped CSS</h2>
      <p class="tip">此样式只作用于当前组件的根节点作用域内。</p>
    </div>
  )
}
```

## 属性透传（class/style/id）

vfojs 会将传入组件的 attrs 合并到根节点，确保 `class/style/id` 等像 Vue 一样可用。

完整示例：

```tsx
const 子组件 = () => {
  return (
    <div class="child">
      <h3>子组件根节点</h3>
      <p>外部传入的 class/style/id 会自动合并到这个根节点上。</p>
    </div>
  )
}

export default () => {
  return (
    <div class="wrap">
      <h2>属性透传（Attribute Fallthrough）</h2>
      <子组件 class="外部class" id="attrs-demo" style="background: #f8fafc;" />
    </div>
  )
}
```

## 响应式解构

你可以在 `.vfo` 里写：

```ts
export default (props) => {
  const { count } = props
  return <div>{count.value}</div>
}
```

编译后会自动转换为 `toRef(props, 'count')`，保持响应式。

完整示例（父组件改变 count，子组件依然能更新）：

```tsx
const 子组件 = (props) => {
  const { count } = props
  return (
    <div>
      <h3>子组件</h3>
      <p>count：{count.value}</p>
    </div>
  )
}

export default () => {
  const state = reactive({ count: 1 })
  const inc = () => state.count++

  return (
    <div class="wrap">
      <h2>响应式解构</h2>
      <p>父组件 count：{state.count}</p>
      <button onClick={inc}>父组件加 1</button>
      <div style="margin-top: 12px;">
        <子组件 count={state.count} />
      </div>
    </div>
  )
}
```

## 指令语法糖：`$value`

写法：

```tsx
<input $value={name} />
```

会自动转换为 `modelValue` + `onUpdate:modelValue` 的等价写法。

完整示例：

```tsx
export default () => {
  const state = useFoStore('model-demo', () => ({ name: 'vfojs' }))

  return (
    <div class="wrap">
      <h2>指令语法糖（$value）</h2>
      <p>当前值：{state.name}</p>
      <input $value={state.name} placeholder="请输入名称" />
    </div>
  )
}
```

## 内置全局状态：`useFoStore`

写法：

```ts
const store = useFoStore('demo', () => ({ name: 'vfojs' }))
```

同一个 key 在多个组件中拿到的是同一份 `reactive` 状态。

完整示例（两个组件共享同一个 count）：

```tsx
const 组件A = () => {
  const store = useFoStore('global-demo', () => ({ count: 0 }))
  const inc = () => store.count++
  return (
    <div>
      <h3>组件 A</h3>
      <button onClick={inc}>A 加 1（count：{store.count}）</button>
    </div>
  )
}

const 组件B = () => {
  const store = useFoStore('global-demo', () => ({ count: 0 }))
  const dec = () => store.count--
  return (
    <div>
      <h3>组件 B</h3>
      <button onClick={dec}>B 减 1（count：{store.count}）</button>
    </div>
  )
}

export default () => {
  return (
    <div class="wrap">
      <h2>内置全局状态（useFoStore）</h2>
      <组件A />
      <组件B />
    </div>
  )
}
```

## CLI（create-vfojs）

脚手架支持可选集成 Tailwind CSS / Vue Router：

```bash
npx create-vfojs@latest my-app --tailwind --router
```

创建完成后：

```bash
cd my-app
fnm use
npm i
npm run dev
```
