/* 复制到剪贴板，只有一处实现。
   先走 Clipboard API；被浏览器拦下（非安全上下文、权限策略、微信内置浏览器）
   再退回 textarea + execCommand。返回真实结果——调用方不该在失败时也说"已复制"。 */
export async function writeClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 落到下面的兜底 */
  }

  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}
