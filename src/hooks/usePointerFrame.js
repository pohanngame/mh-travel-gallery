import { useEffect, useRef } from 'react'
import { pointerAllowed, subscribePointer } from './pointerField'

/**
 * 订阅全局指针帧。回调每帧触发一次（即使鼠标静止 —— 阻尼需要持续推进到目标值）。
 * active 为 false 或设备不支持时完全不订阅，回调永不执行。
 * 回调内可直接写 DOM 样式，但严禁调用 setState。
 */
export function usePointerFrame(cb, active = true) {
  const ref = useRef(cb)
  useEffect(() => {
    ref.current = cb
  })
  useEffect(() => {
    if (!active || !pointerAllowed()) return undefined
    return subscribePointer((s, dt) => ref.current(s, dt))
  }, [active])
}
