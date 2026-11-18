import { useEffect, useState } from 'react'

/**
 * 进场动画结束信号。
 * 优先级：?noboot / prefers-reduced-motion → 立即就绪；
 *        否则监听 BootAnimationOverlay 派发的 boot:done；
 *        再兜底 6.5s（遮罩最迟 6s 卸载）+ 挂载时补查一次 dataset。
 * 就绪后向 <html> 写 data-booted="1"，全站动效的总开关由它门控。
 */
export function useBootReady() {
  const [ready, setReady] = useState(() => {
    if (typeof window === 'undefined') return false
    if (new URLSearchParams(window.location.search).has('noboot')) return true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
    return false
  })

  useEffect(() => {
    if (ready) {
      document.documentElement.dataset.booted = '1'
      return undefined
    }
    let done = false
    const on = () => {
      if (done) return
      done = true
      setReady(true)
    }
    if (document.documentElement.dataset.booted === '1') {
      on()
      return undefined
    }
    window.addEventListener('boot:done', on)
    const t = window.setTimeout(on, 6500)
    return () => {
      window.removeEventListener('boot:done', on)
      window.clearTimeout(t)
    }
  }, [ready])

  return ready
}
