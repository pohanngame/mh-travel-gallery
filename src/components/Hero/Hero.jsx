import { useEffect, useRef } from 'react'
import './Hero.css'
import { BOOT } from '../../data/bootConfig'
import { studio } from '../../data/studio'
import { INTERACT } from '../../data/interactConfig'
import { useBootReady } from '../../hooks/useBootReady'
import { usePointerFrame } from '../../hooks/usePointerFrame'
import { clamp, damp } from '../../lib/motion'
import InkPool from './InkPool'

function Hero() {
  // 认识我们 → 平滑滚动到下一章节（主力成员）
  const scrollToNext = () => {
    const target = document.getElementById('members')
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const heroRef = useRef(null)
  const mainRef = useRef(null)
  const btnRef = useRef(null)
  const ready = useBootReady()

  /* 动效状态全部放在 ref 里逐帧阻尼推进，绝不进 React 状态（否则每帧重渲染）。
     初值 0：进场动画期间 CSS 变量保持 0，遮罩与 Hero 逐像素一致 → 溶解零跳变。 */
  const st = useRef({
    x: 0, y: 0, nx: 0, ny: 0, art: 0, ink: 0, bx: 0, by: 0, rect: null, rectAt: 0,
    crx: 0, cry: 0, ctx: 0, cty: 0, sheen: 0, still: true, mrect: null, mrectAt: 0,
  })
  const pinned = useRef(false)

  /* 回调每帧都会换成最新闭包（usePointerFrame 内部每次渲染更新 ref），
     所以这里直接读 ready 即可，不需要额外的 ref 镜像。 */
  usePointerFrame((s, dt) => {
    const el = heroRef.current
    if (!el) return
    if (pinned.current) return
    const p = st.current
    const live = ready

    /* 页面坐标下的光斑位置（Hero 从页面左上角起铺满，故页面坐标即本区坐标） */
    p.x = damp(p.x, s.px, dt, INTERACT.ink.tau)
    p.y = damp(p.y, s.py, dt, INTERACT.ink.tau)

    /* 归一化 -1~1，驱动画卷视差 */
    p.nx = damp(p.nx, (s.cx / s.vw - 0.5) * 2, dt, INTERACT.art.tau)
    p.ny = damp(p.ny, (s.cy / s.vh - 0.5) * 2, dt, INTERACT.art.tau)

    /* 分区存在感：只有指针真的在左区 / 右区时才点亮，离开即熄灭 */
    const wide = s.vw >= 1024
    p.art = damp(p.art, wide && s.cx > s.vw * 0.3 ? 1 : 0, dt, 220)
    p.ink = damp(p.ink, wide && s.cx < s.vw * INTERACT.ink.zoneX ? 1 : 0, dt, 150)

    /* ── 「牌」：倾斜 + 跟手位移 + 受光 ──
       进场期间满幅（墨玉牌立在暗场里，跟着手轻微转动）；
       进场结束后幅度收到 calm 倍（纸面上只剩"纸被轻轻压了一下"）。
       幅度改变时阻尼会自己滑过去，所以 ready 切换那一刻不会有跳变。 */
    const mainEl = mainRef.current
    if (mainEl) {
      const now = performance.now()
      if (!p.mrect || now - p.mrectAt > 400) {
        p.mrectAt = now
        p.mrect = mainEl.getBoundingClientRect()
      }
      const mr = p.mrect
      if (mr && mr.width > 0) {
        const near = s.cx < s.vw * INTERACT.card.reach ? 1 : 0
        const amp = near * (live ? INTERACT.card.calm : 1)
        const mx = clamp((s.cx - (mr.left + mr.width / 2)) / (mr.width * 0.8), -1, 1) * amp
        const my = clamp((s.cy - (mr.top + mr.height / 2)) / (mr.height * 0.8), -1, 1) * amp
        p.cry = damp(p.cry, mx * INTERACT.card.tiltY, dt, INTERACT.card.tau)
        p.crx = damp(p.crx, -my * INTERACT.card.tiltX, dt, INTERACT.card.tau)
        p.ctx = damp(p.ctx, mx * INTERACT.card.shift, dt, INTERACT.card.tau)
        p.cty = damp(p.cty, my * INTERACT.card.shift, dt, INTERACT.card.tau)
        mainEl.style.setProperty('--card-ry', `${p.cry.toFixed(2)}deg`)
        mainEl.style.setProperty('--card-rx', `${p.crx.toFixed(2)}deg`)
        mainEl.style.setProperty('--card-tx', `${p.ctx.toFixed(2)}px`)
        mainEl.style.setProperty('--card-ty', `${p.cty.toFixed(2)}px`)

        /* 受光：光源落在指针处，离开左区整体收回 */
        if (near) {
          const gx = clamp((s.cx - mr.left) / mr.width, -0.15, 1.15) * 100
          const gy = clamp((s.cy - mr.top) / mr.height, -0.15, 1.15) * 100
          mainEl.style.setProperty('--sheen-x', `${gx.toFixed(1)}%`)
          mainEl.style.setProperty('--sheen-y', `${gy.toFixed(1)}%`)
        }
        p.sheen = damp(p.sheen, near, dt, 320)
        mainEl.style.setProperty('--sheen', p.sheen.toFixed(3))

        /* 指针基本静止时摘掉 3D 矩阵（见 Hero.css 的 .is-still 说明）。
           只在状态翻转时操作一次，不做每帧 classList 写入。 */
        const still =
          Math.abs(p.cry) + Math.abs(p.crx) < 0.03 &&
          Math.abs(p.ctx) + Math.abs(p.cty) < 0.2
        if (still !== p.still) {
          p.still = still
          mainEl.classList.toggle('is-still', still)
        }
      }
    }

    /* 进场未结束：牌可以动，但纸下显影 / 画卷视差 / 磁吸一律保持 0，
       保证与遮罩交叉溶解的那一刻逐像素一致。 */
    if (!live) return

    /* 按钮磁吸：矩形按 400ms 节流缓存，避免每帧 getBoundingClientRect 触发强制重排 */
    if (btnRef.current) {
      const now = performance.now()
      if (!p.rect || now - p.rectAt > 400) {
        p.rectAt = now
        p.rect = btnRef.current.getBoundingClientRect()
      }
      const r = p.rect
      if (r) {
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const dx = s.cx - cx
        const dy = s.cy - cy
        const d = Math.hypot(dx, dy)
        const k = d < INTERACT.magnet.reach ? (1 - d / INTERACT.magnet.reach) * INTERACT.magnet.pull : 0
        const m = INTERACT.magnet.max
        p.bx = damp(p.bx, clamp(dx * k, -m, m), dt, 130)
        p.by = damp(p.by, clamp(dy * k, -m, m), dt, 130)
        btnRef.current.style.setProperty('--btn-x', `${p.bx.toFixed(2)}px`)
        btnRef.current.style.setProperty('--btn-y', `${p.by.toFixed(2)}px`)
      }
    }

    el.style.setProperty('--ptr-x', `${p.x.toFixed(1)}px`)
    el.style.setProperty('--ptr-y', `${p.y.toFixed(1)}px`)
    el.style.setProperty('--ptr-nx', p.nx.toFixed(3))
    el.style.setProperty('--ptr-ny', p.ny.toFixed(3))
    el.style.setProperty('--ptr-art', p.art.toFixed(3))
    el.style.setProperty('--ptr-ink', p.ink.toFixed(3))
  }, true)

  /* 调试：?ink=0.22,0.5 把聚光钉在指定归一化位置（截图 / 排查用），
     与 ?boott、?bootdebug 同风格；正常访问不带此参数则完全不生效。 */
  useEffect(() => {
    if (!ready) return
    const raw = new URLSearchParams(window.location.search).get('ink')
    const el = heroRef.current
    if (!raw || !el) return
    const [nx = 0.2, ny = 0.5] = raw.split(',').map(Number)
    pinned.current = true
    el.style.setProperty('--ptr-x', `${(Number.isFinite(nx) ? nx : 0.2) * window.innerWidth}px`)
    el.style.setProperty('--ptr-y', `${(Number.isFinite(ny) ? ny : 0.5) * window.innerHeight}px`)
    el.style.setProperty('--ptr-ink', '1')
  }, [ready])

  /* 滚动视差：文案上浮、画卷下沉 → 两层分离的深度感。
     仅在进场结束后启用，值用 CSS 变量传给样式层。 */
  useEffect(() => {
    if (!ready) return undefined
    const el = heroRef.current
    if (!el) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const h = window.innerHeight
        const p = clamp(window.scrollY / h, 0, 1)
        el.style.setProperty('--hero-scroll', p.toFixed(3))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ready])

  return (
    <header
      className="hero"
      id="top"
      ref={heroRef}
      style={{
        '--art-shift-x': `${INTERACT.art.shiftX}px`,
        '--art-shift-y': `${INTERACT.art.shiftY}px`,
        '--art-scale': INTERACT.art.scale,
        '--scroll-text': `${-INTERACT.scroll.textShift}px`,
        '--scroll-art': `${INTERACT.scroll.artShift}px`,
      }}
    >
      {/* 右侧画卷：左缘经「宽羽化 + 纸雾」融进宣纸（规则见 styles/art-seam.css，
          与开机遮罩共用同一份，改一处两边同步） */}
      <div className="hero__art art-seam">
        {/* 视差包装层：只承载位移，图片 scale 留在 img 上，两者互不干扰 */}
        <div className="hero__art-parallax">
          <img
            src={BOOT.imageSrc}
            alt="东莞职业技术学院校名墙"
            draggable="false"
            style={{ objectPosition: `${BOOT.imageAlign.x * 100}% ${BOOT.imageAlign.y * 100}%` }}
          />
        </div>
      </div>

      {/* 左区纸下的鎏金拓片：常驻墨影 + 跟随指针的聚光显影 */}
      <InkPool />

      {/* 暖光：跟随指针掠过画面，模拟日光扫过校名墙 */}
      <div className="hero__glow" aria-hidden="true" />

      <div className="hero__main is-still" ref={mainRef}>
        {/* 受光层：跟着指针在牌面/纸面上走，z-index 在牌之上、文字之下 */}
        <span className="hero__sheen" aria-hidden="true" />
        {/* 眉标只说英文：原来写作「BLOCKCHAIN WORKSHOP · 区块链工坊」，
            与下面 84px 的中文大标题重复了一遍，等于把同一句话说两次。 */}
        <p className="hero__label">{studio.nameEn}</p>
        <h1 className="hero__title">{studio.name}</h1>
        <p className="hero__subtitle">{studio.slogan}</p>
        <div className="hero__actions">
          <button type="button" className="hero__btn" ref={btnRef} onClick={scrollToNext}>
            认识我们 →
          </button>
          <span className="hero__note">{studio.college}</span>
        </div>
      </div>
    </header>
  )
}

export default Hero
