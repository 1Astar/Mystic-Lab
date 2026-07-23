/**
 * 把「误读为…」否定句式，改成新手更友好的正向纠正。
 * 例：误读为「一定有欺骗」——也可能是焦虑 → 【月亮】不代表一定有欺骗——…
 */

export function formatMisreadingFriendly(cardName: string, raw: string): string {
  const text = raw.trim();
  if (!text) return text;

  // 已是正向纠正（「不代表」「不是在说」等）则原样
  if (/不代表|不是在说|更像|更多指向|请别|不要过早/.test(text) && !/^误读为/.test(text)) {
    return text;
  }

  const m = text.match(/^误读为[「『【]([^」』】]+)[」』】]\s*[—–\-－]{1,2}\s*(.+)$/);
  if (m) {
    const myth = m[1]!.trim();
    const correction = m[2]!.trim().replace(/[。！？.!?]+$/, '');
    return `【${cardName}】不代表${myth}——${correction}。不要过早下定论。`;
  }

  const m2 = text.match(/^误读为[「『【]([^」』】]+)[」』】]\s*[：:]\s*(.+)$/);
  if (m2) {
    const myth = m2[1]!.trim();
    const correction = m2[2]!.trim().replace(/[。！？.!?]+$/, '');
    return `【${cardName}】不代表${myth}——${correction}。不要过早下定论。`;
  }

  return text;
}
