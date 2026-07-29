/**
 * 分类标签前强制换行：前期/中期/后期、①②③、第一步…
 * LLM 常挤成一段，渲染前补齐。
 */
export function breakCategorizedProse(text: string): string {
  if (!text?.trim()) return text;
  let out = text.replace(/\r\n/g, '\n');
  out = out.replace(/([^\n])(前期|中期|后期|前段|中段|中后段)([：:])/g, '$1\n$2$3');
  out = out.replace(/([^\n])(第一步|第二步|第三步)([·・.：:])/g, '$1\n$2$3');
  out = out.replace(/([^\n])([①②③④⑤])/g, '$1\n$2');
  out = out.replace(/([^\n])(情况[：:]|阻碍[：:]|建议[：:])/g, '$1\n$2');
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

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
  // 保留换行：只压缩同行内多余空格
  out = out
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[，,。\s]+/, '');
  return breakCategorizedProse(out.trim());
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
