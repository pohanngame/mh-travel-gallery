import { useEffect, useRef } from 'react'
import './HaloCursor.css'
import { INTERACT } from '../../data/interactConfig'
import { useBootReady } from '../../hooks/useBootReady'
import { usePointerFrame } from '../../hooks/usePointerFrame'
import { pointerAllowed, markPointerGone } from '../../hooks/pointerField'
import { damp } from '../../lib/motion'

/* 金色光标环：外环带阻尼拖尾，中心点近乎跟手（保证点击精度）。
   只在桌面指针设备 + 进场结束 + 未开启"减少动效"时挂载。

   ── 结构上必须分成"位移层 / 视觉层"两层 ──────────────────────────
   .halo__ring        只吃逐帧写入的 transform，无过渡、无 will-change
     └ .halo__ring-line  只吃 scale / opacity / background 的 CSS 过渡
   合成层里"transform 逐帧更新"和"transform 族属性的 CSS 过渡"会互相抢占：
   2026-11 的现象是环被冻结在旧位置（点还在跟手），因为 scale 的过渡把
   元素的 transform 动画接管了，主线程写的 translate3d 不再落到图层上。
   拆成两层后，位移层没有任何 transform 族过渡，这种抢占在结构上不可能发生。

   ── 状态一律写 dataset，不经过 React state ──────────────────────
   上一版的 bug：hot 用 useState，重渲染时 React 按模板重写 className，
   把 JS 摘掉的 is-off 又写回去，环 opacity 归零 → "只剩一个点"。
   规则：React 只负责挂不挂载，挂载之后所有动态视觉由 dataset 驱动。

   ── 系统光标与环同生共死 ─────────────────────────────────────
   html[data-halo="1"] 在环点亮时写入、隐藏时删除，不可能出现"没有光标"。

   URL 开关：?cursor=0 或 INTERACT.cursor.enabled=false 整块退回系统光标。 */

const HIT = 'a, button, [role="button"], summary, input, textarea, select, label, [data-halo-hot]'

function HaloCursor() {
  const ready = useBootReady()
  const query = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const enabled =
    ready &&
    pointerAllowed() &&
    INTERACT.cursor.enabled !== false &&
    query?.get('cursor') !== '0'

  const rootRef = useRef(null)
  const ringRef = useRef(null)
  const dotRef = useRef(null)
  const st = useRef({ x: 0, y: 0, dx: 0, dy: 0, init: false, on: null })

  usePointerFrame((s, dt) => {
    const p = st.current
    const root = rootRef.current
    const ring = ringRef.current
    const dot = dotRef.current
    if (!root || !ring || !dot) return

    /* 可见性只在翻转时写一次；顺手把系统光标一起开关 */
    if (p.on !== s.has) {
      p.on = s.has
      root.dataset.on = s.has ? '1' : '0'
      if (s.has) document.documentElement.dataset.halo = '1'
      else delete document.documentElement.dataset.halo
    }
    if (!s.has) {
      p.init = false // 下次进入时重新落位，避免从上次离开的点"飞"过来
      return
    }

    if (!p.init) {
      // 首次有指针坐标：直接落位，避免从视口左上角"飞"过来
      p.init = true
      p.x = p.dx = s.cx
      p.y = p.dy = s.cy
    }
    p.x = damp(p.x, s.cx, dt, INTERACT.cursor.tau)
    p.y = damp(p.y, s.cy, dt, INTERACT.cursor.tau)
    p.dx = damp(p.dx, s.cx, dt, INTERACT.cursor.dotTau)
    p.dy = damp(p.dy, s.cy, dt, INTERACT.cursor.dotTau)

    /* 只写平移，居中靠 CSS 负 margin —— transform 里不掺任何会被过渡的属性 */
    ring.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`
    dot.style.transform = `translate3d(${p.dx.toFixed(1)}px, ${p.dy.toFixed(1)}px, 0)`
  }, enabled)

  useEffect(() => {
    if (!enabled) return undefined
    const root = rootRef.current
    if (!root) return undefined

    const onOver = (e) => {
      const t = e.target
      const v = t instanceof Element && t.closest(HIT) ? '1' : '0'
      if (root.dataset.hot !== v) root.dataset.hot = v
    }
    /* 按下只做一次回弹，不当作 hover（原实现把 hot 置真且永不复位） */
    const onDown = () => {
      root.dataset.press = '1'
    }
    const onUp = () => {
      root.dataset.press = '0'
    }
    /* 移出文档 / 失焦 / 切标签页：指针位置已不可信，连系统光标一起交还 */
    const hide = () => {
      root.dataset.hot = '0'
      root.dataset.press = '0'
      root.dataset.on = '0'
      delete document.documentElement.dataset.halo
      st.current.on = false
      st.current.init = false
      markPointerGone() // 让 s.has 归零，避免 rAF 下一帧又把环点亮
    }
    const onVis = () => {
      if (document.hidden) hide()
    }

    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })
    window.addEventListener('blur', hide)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      delete document.documentElement.dataset.halo
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('blur', hide)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div className="halo" ref={rootRef} aria-hidden="true" data-on="0" data-hot="0" data-press="0">
      <div className="halo__ring" ref={ringRef}>
        <i className="halo__ring-line" />
      </div>
      <div className="halo__dot" ref={dotRef}>
        <i className="halo__dot-core" />
      </div>
    </div>
  )
}

export default HaloCursor
