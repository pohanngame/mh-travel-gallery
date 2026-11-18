import { useState } from 'react'
import './Join.css'
import Reveal from '../Reveal'
import { studio } from '../../data/studio'
import { writeClipboard } from '../../lib/clipboard'

/* 转化入口。
   原来这里有两个 mailto（主按钮 + 正文里的邮箱）和一个复制按钮：
   三个控件读起来都在说同一件事，而且在没配邮件程序的电脑上（机房、
   或者任何一台只装了 Chrome 的 Windows），mailto 会弹一个空白窗口再
   自己关掉——"点了新开个浏览器，里面什么都没有"就是这个。

   现在只留一条主路：复制。复制的是一段带收件人、主题和正文骨架的纯文本，
   不依赖系统邮件程序，任何设备、任何浏览器都能走通。
   mailto 降级成一行可选的小字，只在手机上（装了邮件 App）真的有用。 */

const MAILTO_JOIN = `mailto:${studio.email}?subject=${encodeURIComponent(
  studio.signupSubject
)}&body=${encodeURIComponent(studio.signupBody)}`

/* 复制的内容 = 收件人 + 主题 + 正文。少写一项，学生就得回页面再找一次。 */
const SIGNUP_PAYLOAD = `收件人：${studio.email}
主题：${studio.signupSubject}

${studio.signupBody}`

function Join() {
  const [status, setStatus] = useState('idle') // idle | copied | manual

  const copySignup = async () => {
    const ok = await writeClipboard(SIGNUP_PAYLOAD)
    setStatus(ok ? 'copied' : 'manual')
    if (ok) window.setTimeout(() => setStatus('idle'), 6000)
  }

  const btnLabel =
    status === 'copied' ? '已复制 ✓' : status === 'manual' ? '复制被拦下' : '复制报名信息'

  return (
    <section className="join" id="join">
      <Reveal className="join__inner">
        <p className="join__label"><span className="section-no">05</span> — JOIN US</p>
        <h2 className="join__title">加入我们</h2>
        <p className="join__desc">
          工坊面向人工智能学院在校生，<strong>不看作品、不限年级</strong>。
          对链上技术、Agent 开发或软硬件结合有兴趣，先来工作室坐一次，聊聊你想做什么。
        </p>

        <div className="join__side">
          <div className="join__cta">
            <button
              type="button"
              className="join__btn"
              onClick={copySignup}
              data-state={status}
            >
              {btnLabel}
              {status === 'idle' && (
                <span className="join__btn-arrow" aria-hidden="true">→</span>
              )}
            </button>
          </div>

          {/* 状态说明就是反馈：复制成功换文案，失败给可一键全选的手动路径 */}
          {status === 'copied' ? (
            <p className="join__hint join__hint--ok">
              已复制。打开邮箱粘贴，发给
              <strong> {studio.email}</strong> 就行。
            </p>
          ) : status === 'manual' ? (
            <p className="join__hint join__hint--warn">
              浏览器拦下了剪贴板。点一下下面的地址全选，复制后发过去：
              <span className="join__addr">{studio.email}</span>
            </p>
          ) : (
            <p className="join__hint">
              收件人、主题、正文一起复制，粘进任何邮箱就能发。
            </p>
          )}

          <span className="sr-only" role="status">
            {status === 'copied'
              ? `报名信息已复制，收件人是 ${studio.email}`
              : status === 'manual'
                ? '复制失败，请手动选择页面上的邮箱地址'
                : ''}
          </span>

          <p className="join__alt">
            已经有作品？发到 <span className="join__addr">{studio.email}</span>，
            标题注明「投稿 + 作品名」，我们先看东西再聊。微信不便公开留，先发邮件，我们回信里再换。
          </p>

          <div className="join__meta">
            <a className="join__mailto" href={MAILTO_JOIN}>
              手机上有邮件 App？直接写 ↗
            </a>
            <a
              className="join__gh"
              href={studio.github}
              target="_blank"
              rel="noreferrer noopener"
            >
              GitHub · {studio.githubLabel}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export default Join
