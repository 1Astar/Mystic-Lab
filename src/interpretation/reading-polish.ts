/**
 * LLM / mock 文案轻量清洗：错字、漏字常见模式、多余空白。
 * 不做语义改写，只修明显笔误。
 */

const FIXES: Array<[RegExp, string]> = [
  [/如果没有岗位[，,]\s*注意选择/g, '如果没有岗位，注意转化'],
  [/没有岗位[，,]\s*注意选择/g, '没有岗位，注意转化'],
  [/画大饼饼/g, '画大饼'],
  [/温水煮青蛙青蛙/g, '温水煮青蛙'],
  [/聊得来来/g, '聊得来'],
  [/务必务必/g, '务必'],
  [/不要不要/g, '不要'],
  [/([。！？])\1+/g, '$1'],
  [/[ \t]{2,}/g, ' '],
  [/\n{3,}/g, '\n\n'],
];

export function polishReadingCopy(text: string): string {
  if (!text?.trim()) return text;
  let out = text.trim();
  for (const [re, to] of FIXES) {
    out = out.replace(re, to);
  }
  // 去掉「关于【提问1】…【提问N】」整段复述
  out = out.replace(
    /关于(?:【提问\s*\d+】[^【]{0,80}){2,}[？?]?\s*[，,]?/g,
    '',
  );
  out = out.replace(/直接说：\s*关于[^。]{0,400}[，,]/g, '直接说：');
  out = out.replace(/就你问的(?:这些事|事)而言[，,]?\s*关于[^。]{0,400}[，,]/g, '');
  out = out.replace(/\s{2,}/g, ' ').replace(/^[，,。\s]+/, '');
  return out.trim();
}

/** 递归清洗 thread / QA 字段 */
export function polishInsightFields<T extends { insight?: string; action?: string; meaningMap?: string }>(
  row: T,
): T {
  return {
    ...row,
    insight: row.insight ? polishReadingCopy(row.insight) : row.insight,
    action: row.action ? polishReadingCopy(row.action) : row.action,
    meaningMap: row.meaningMap ? polishReadingCopy(row.meaningMap) : row.meaningMap,
  };
}
