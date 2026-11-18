import { useState } from 'react'
import './About.css'
import Reveal from '../Reveal'
import { studio } from '../../data/studio'

/* 工坊档案卡 = 照片位 + 事实清单。
   照片为空或加载失败时显示「待补」占位，不会出现破图。
   换照片：把 3:2 横向图放到 public/photos/workshop.jpg，
   或在 studio.js 改 photo / photoCaption。 */
function AboutPhoto() {
  const [broken, setBroken] = useState(false)
  const hasPhoto = Boolean(studio.photo) && !broken

  return (
    <figure className="about__photo">
      <div className="about__mount">
        {hasPhoto ? (
          <img
            className="about__mount-img"
            src={studio.photo}
            alt={studio.photoAlt}
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="about__mount-empty">
            <span className="about__mount-rule" aria-hidden="true" />
            <span className="about__mount-label">工坊合影</span>
          </div>
        )}
        {/* 四个金色相角：把照片"卡"在纸上的那种装裱方式 */}
        <span className="about__corners" aria-hidden="true" />
      </div>
      {hasPhoto ? (
        <>
          <figcaption className="about__photo-cap">{studio.photoCaption}</figcaption>
          <span className="about__seal" aria-hidden="true">
            工坊
          </span>
        </>
      ) : null}
    </figure>
  )
}

function About() {
  return (
    <section className="about" id="about">
      <Reveal className="about__head">
        <p className="about__label"><span className="section-no">01</span> — ABOUT</p>
        <h2 className="about__title">关于工坊</h2>
      </Reveal>
      <div className="about__body">
        {/* 左栏：正文 + 三条主线。主线抽出成三栏，补上正文下方原本空着的一段高度 */}
        <div className="about__col">
          <Reveal className="about__text">
            {studio.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 12)}>{paragraph}</p>
            ))}
          </Reveal>
          <ul className="about__tracks">
            {studio.tracks.map((track, index) => (
              <Reveal as="li" key={track.no} className="about__track" delay={index * 80}>
                <div className="about__track-head">
                  <span className="about__track-no" aria-hidden="true">
                    {track.no}
                  </span>
                  <h3 className="about__track-name">{track.name}</h3>
                </div>
                <p className="about__track-desc">{track.desc}</p>
              </Reveal>
            ))}
          </ul>
        </div>
        <Reveal className="about__dossier">
          <AboutPhoto />
          {/* 档案条目：交错淡入，delay 80ms 递增 */}
          <ul className="about__facts">
            {studio.facts.map((fact, index) => (
              <Reveal as="li" key={fact.k} delay={index * 80}>
                <span className="about__facts-k">{fact.k}</span>
                <span className="about__facts-v">{fact.v}</span>
              </Reveal>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

export default About
