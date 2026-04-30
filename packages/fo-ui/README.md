# fo-ui

基于 vfojs 的 UI 组件库。

## 安装

```bash
npm i fo-ui
```

## 前置条件

你的项目需要启用 vfojs 的 Vite 插件，才能识别并编译 `.vfo` 组件。

同时建议把 `fo-ui` 从 Vite 的依赖预构建里排除（否则开发模式下可能会被 esbuild 预构建，导致 `.vfo` 依赖无法被正确处理）。

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vfojs from '@fo4/vfojs'

export default defineConfig({
  plugins: [vue(), vfojs()],
  optimizeDeps: {
    exclude: ['fo-ui'],
  },
})
```

并在项目中引用类型：

```ts
/// <reference types="@fo4/vfojs/shims-vfo" />
```

## 使用示例

```tsx
import { FoButton, FoCard, FoInput, FoModal, FoSwitch, FoToastHost, useToast } from 'fo-ui'

export default () => {
  const toast = useToast()
  const name = ref('vfojs')
  const open = ref(false)
  const on = ref(true)

  return (
    <div>
      <FoToastHost />

      <FoCard title="按钮">
        <FoButton label="主按钮" variant="primary" onClick={() => toast.success('点击了主按钮')} />
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

## 组件列表

- FoButton：按钮（variant：primary/secondary/danger）
- FoInput：输入框（支持 modelValue / onUpdate:modelValue）
- FoCard：卡片（title + default slot）
- FoModal：弹窗（open / onUpdate:open）
- FoSwitch：开关（modelValue / onUpdate:modelValue）
- FoToastHost：消息容器
- useToast：推送消息（info/success/warning/danger）
