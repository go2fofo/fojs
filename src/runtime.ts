import { computed, onUnmounted, watch, watchEffect } from 'vue'
import type { ComputedRef, WatchStopHandle } from 'vue'

export type FoEffectCleanup = void | (() => void)
export type FoEffect = () => FoEffectCleanup

export function useFoEffect(effect: FoEffect, deps?: readonly unknown[]): void {
  let cleanup: FoEffectCleanup

  const run = () => {
    if (typeof cleanup === 'function') cleanup()
    const next = effect()
    cleanup = typeof next === 'function' ? next : undefined
  }

  let stop: WatchStopHandle
  if (Array.isArray(deps) && deps.length > 0) {
    stop = watch(deps as any, run, { immediate: true })
  } else {
    stop = watchEffect(run)
  }

  onUnmounted(() => {
    stop?.()
    if (typeof cleanup === 'function') cleanup()
  })
}

export function useVModel<T = any>(props: any, key: string): ComputedRef<T> {
  return computed<T>({
    get() {
      return props ? (props[key] as T) : (undefined as any)
    },
    set(v) {
      const fn = props ? props['onUpdate:' + key] : undefined
      if (typeof fn === 'function') fn(v)
    },
  })
}

