# fo-ui

fo-ui 是基于 fojs 的 UI 组件库。

## 安装与启用

1. 安装：

```bash
npm i fo-ui
```

2. 启用 fojs 插件（`.fo` 编译需要它）：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fojs from 'fojs'

export default defineConfig({
  plugins: [vue(), fojs()],
  optimizeDeps: {
    exclude: ['fo-ui'],
  },
})
```

3. 引用类型：

```ts
/// <reference types="fojs/shims-fo" />
```

## 完整示例

```tsx
import { FoButton, FoCard, FoInput, FoModal, FoSwitch, FoToastHost, useToast } from 'fo-ui'

export default () => {
  const toast = useToast()
  const name = ref('fojs')
  const open = ref(false)
  const on = ref(true)

  return (
    <div>
      <FoToastHost />

      <FoCard title="按钮">
        <FoButton label="主按钮" variant="primary" onClick={() => toast.success('点击了主按钮')} />
        <FoButton label="次按钮" variant="secondary" onClick={() => toast.info('点击了次按钮')} />
        <FoButton label="危险按钮" variant="danger" onClick={() => toast.danger('点击了危险按钮')} />
        <FoButton variant="secondary" onClick={() => toast.info('这是 slot 渲染')}>这是 slot</FoButton>
      </FoCard>

      <FoCard title="输入框">
        <FoInput $value={name.value} placeholder="请输入名称" />
        <div>当前值：{name.value}</div>
      </FoCard>

      <FoCard title="开关 + 弹窗">
        <FoSwitch $value={on.value} label={on.value ? '开' : '关'} />
        <FoButton label="打开弹窗" variant="secondary" onClick={() => (open.value = true)} />
      </FoCard>

      <FoModal open={open.value} onUpdate:open={(v) => (open.value = v)} title="提示" maskClosable>
        <div>
          <p>你好，fo-ui！</p>
          <FoButton label="关闭" variant="secondary" onClick={() => (open.value = false)} />
        </div>
      </FoModal>
    </div>
  )
}
```

## 组件与 API

- FoButton
  - 用法：`<FoButton label="文本" />` 或 `<FoButton>slot</FoButton>`
  - 常用属性：`variant: 'primary' | 'secondary' | 'danger'`，`size: 'md' | 'sm'`，`disabled`
- FoInput
  - 双向：`modelValue` + `onUpdate:modelValue`
  - 在 fojs 中推荐：`<FoInput $value={state.xxx} />`
- FoSwitch
  - 双向：`modelValue` + `onUpdate:modelValue`
  - 在 fojs 中推荐：`<FoSwitch $value={state.xxx} />`
- FoModal
  - 控制：`open` + `onUpdate:open`
  - 常用属性：`title`，`maskClosable`
- FoCard
  - 常用属性：`title`
  - 内容：default slot
- FoToastHost / useToast
  - 页面上需要放一个 `<FoToastHost />` 作为容器
  - `useToast()`：`info/success/warning/danger(message, { title?, duration? })`
