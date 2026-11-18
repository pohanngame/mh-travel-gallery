/* 阻尼工具：与帧率无关的指数平滑。
   dt 为毫秒，tau 为"时间常数"（越小越跟手，越大越"重"）。
   逐帧推进到目标值，绝不用 CSS transition 叠加（会变成二次缓动、发飘）。 */

export const damp = (cur, target, dt, tau) => cur + (target - cur) * (1 - Math.exp(-dt / tau))

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
