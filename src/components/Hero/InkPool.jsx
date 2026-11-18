import { INTERACT } from '../../data/interactConfig'
import './InkPool.css'

/* 左区「纸背透墨」
   ---------------------------------------------------------------
   宣纸下压着一层校名墙的淡墨影：静止时只有 15% 的水印隐隐透出，
   指针进入左区后，一盏柔光浮现，照到哪浓到哪。

   性能关键：光斑不是每帧重算 mask/gradient（那会让整层持续重绘），
   而是一个固定 520px 的圆形窗口移动（transform），窗口内那张"整幅"
   墨图做等量反向位移 → 视觉上窗口不动、纸下画面在动，且两张图
   原点严格重合（tile 位移 = -(光斑左上角)），零像素错位。
   全程只有 2 个 transform，走 GPU 合成，不触发任何重绘。
   --------------------------------------------------------------- */
function InkPool() {
  const bg = {
    backgroundImage: `url(${INTERACT.ink.src})`,
    backgroundPosition: INTERACT.ink.pos,
  }

  return (
    <div
      className="inkpool"
      aria-hidden="true"
      style={{
        '--ink-spot': `${INTERACT.ink.spot}px`,
        '--ink-half': `${INTERACT.ink.spot / 2}px`,
        '--ink-ghost': INTERACT.ink.ghost,
        '--ink-boost': INTERACT.ink.boost,
      }}
    >
      {/* ② 水印：常驻，只让白纸"透"出一点淡彩 */}
      <div className="inkpool__ghost" style={bg} />
      {/* ③ 聚光：跟随指针的柔和窗口 */}
      <div className="inkpool__spot">
        <div className="inkpool__tile" style={bg} />
        <div className="inkpool__grain" />
      </div>
    </div>
  )
}

export default InkPool
