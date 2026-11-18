/* 指针场：全站唯一的 pointermove 监听 + 唯一 rAF 循环，订阅者各自做阻尼
   —— 严禁每个组件自己 addEventListener，否则一秒内会堆出十几个循环。
   触屏设备与 prefers-reduced-motion 下不启动（订阅直接返回空函数）。 */

const subs = new Set()
let raf = 0
let last = 0

/** s.cx/cy：视口坐标；s.px/py：页面坐标；s.vw/vh：视口尺寸；s.has：指针是否在页内 */
const s = { cx: 0, cy: 0, px: 0, py: 0, vw: 0, vh: 0, has: false }

function onMove(e) {
  s.cx = e.clientX
  s.cy = e.clientY
  s.px = e.clientX + window.scrollX
  s.py = e.clientY + window.scrollY
  s.has = true
}

function onLeave() {
  s.has = false
}

function tick(now) {
  const dt = Math.min(64, now - last || 16)
  last = now
  s.vw = window.innerWidth
  s.vh = window.innerHeight
  for (const fn of subs) fn(s, dt)
  raf = requestAnimationFrame(tick)
}

/** 外部判定"指针已不可信"（失焦 / 切标签页）时调用，把 s.has 归零。
    下一次真实 pointermove 会自动翻回 true。 */
export function markPointerGone() {
  s.has = false
}

export function subscribePointer(fn) {
  subs.add(fn)
  if (!raf) {
    window.addEventListener('pointermove', onMove, { passive: true })
    /* pointerleave 不冒泡：绑 document 在部分浏览器收不到，
       必须绑在 <html> 上，s.has 才会在鼠标移出窗口时翻回 false
       （否则光标环会停在页脚变成一枚金色圆盘）。 */
    document.documentElement.addEventListener('pointerleave', onLeave, { passive: true })
    document.addEventListener('pointerleave', onLeave, { passive: true })
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }
  return () => {
    subs.delete(fn)
    if (!subs.size) {
      cancelAnimationFrame(raf)
      raf = 0
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerleave', onLeave)
    }
  }
}

/** 是否允许鼠标动效：桌面指针设备 + 用户未要求减少动效 */
export function pointerAllowed() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}
