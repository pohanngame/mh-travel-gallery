import './Footer.css'
import Reveal from '../Reveal'
import { studio } from '../../data/studio'

/* 版权年份在模块加载时取一次：放在渲染里会在每次重渲染时读一次系统时钟，
   既是 oxlint 的 purity 警告，也让"同一份 DOM 两次渲染结果不同"。 */
const YEAR = new Date().getFullYear()

/* 页脚的邮箱是**纯文字，不是链接**。
   全站只有一个复制入口（加入我们那枚按钮）；在这里再挂一个 mailto，
   等于在页面最底部留第二条"点了弹个空白窗口"的路——没配邮件程序的电脑上
   mailto 就是这个表现。地址照样可选中，要复制去上面那枚按钮。 */
function Footer() {
  return (
    <Reveal as="footer" className="footer">
      <ul className="footer__contact">
        <li>
          <a href={studio.github} target="_blank" rel="noreferrer noopener">
            GitHub · {studio.githubLabel}
          </a>
        </li>
        <li>
          <span className="footer__mail">{studio.email}</span>
        </li>
        <li>{studio.college}</li>
        <li>
          <a className="footer__top" href="#top">
            回到顶部 ↑
          </a>
        </li>
      </ul>
      <p className="footer__copy">
        © {YEAR} {studio.name} Blockchain Workshop · 把链上技术做成能跑起来的东西
      </p>
    </Reveal>
  )
}

export default Footer
