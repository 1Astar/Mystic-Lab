/** 短句阅读：带「，」的宜忌/并列句拆成两行；换行后不再带 ， 和 。 */

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 去掉首尾顿号、逗号、句号等，换行后更干净 */
function stripEdgePunct(s: string): string {
  return s.replace(/^[，。；：、\s]+|[，。；：、\s]+$/g, '').trim();
}

function twoLines(a: string, b: string): string {
  return `${esc(stripEdgePunct(a))}<br>${esc(stripEdgePunct(b))}`;
}

/**
 * 返回可插入 HTML 的文案（含 `<br>`）。
 * 优先在「忌」前断行；否则在逗号中段断成两行。
 */
export function formatClauseHtml(text: string): string {
  const t = text.trim();
  if (!t) return '';

  /** 宜…，忌… / 宜…。忌… */
  const beforeJi = t.match(/^(.*?)[，。]\s*(忌[:：]?.+)$/);
  if (beforeJi && /宜/.test(beforeJi[1]!)) {
    return twoLines(beforeJi[1]!, beforeJi[2]!);
  }

  /** 宜：…。忌：… */
  const yiJiColon = t.match(/^(宜[:：].*?[。；])\s*(忌[:：].+)$/);
  if (yiJiColon) {
    return twoLines(yiJiColon[1]!, yiJiColon[2]!);
  }

  if (!t.includes('，')) return esc(stripEdgePunct(t));

  const parts = t.split('，').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 2) {
    return twoLines(parts[0]!, parts[1]!);
  }

  const mid = Math.ceil(parts.length / 2);
  return twoLines(parts.slice(0, mid).join('，'), parts.slice(mid).join('，'));
}
