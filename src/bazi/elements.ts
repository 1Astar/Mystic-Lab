export type WuXing = '木' | '火' | '土' | '金' | '水';

export const STEM_WUXING: Record<string, WuXing> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

export const BRANCH_WUXING: Record<string, WuXing> = {
  寅: '木',
  卯: '木',
  巳: '火',
  午: '火',
  辰: '土',
  戌: '土',
  丑: '土',
  未: '土',
  申: '金',
  酉: '金',
  亥: '水',
  子: '水',
};

export type SeasonLabel = '旺' | '相' | '休' | '囚' | '死';

/** 月令 → 五行旺相休囚死 */
export function seasonStrength(monthBranch: string): Record<WuXing, SeasonLabel> {
  const b = monthBranch;
  if (b === '寅' || b === '卯') {
    return { 木: '旺', 火: '相', 水: '休', 金: '囚', 土: '死' };
  }
  if (b === '巳' || b === '午') {
    return { 火: '旺', 土: '相', 木: '休', 水: '囚', 金: '死' };
  }
  if (b === '申' || b === '酉') {
    return { 金: '旺', 水: '相', 土: '休', 火: '囚', 木: '死' };
  }
  if (b === '亥' || b === '子') {
    return { 水: '旺', 木: '相', 金: '休', 土: '囚', 火: '死' };
  }
  // 辰戌丑未
  return { 土: '旺', 金: '相', 火: '休', 木: '囚', 水: '死' };
}

export function wuxingClass(el: WuXing | string | undefined): string {
  switch (el) {
    case '木':
      return 'wx-mu';
    case '火':
      return 'wx-huo';
    case '土':
      return 'wx-tu';
    case '金':
      return 'wx-jin';
    case '水':
      return 'wx-shui';
    default:
      return '';
  }
}

/** 纳音末字五行，如「大溪水」→ 水 */
export function nayinWuxing(nayin: string): WuXing | '' {
  const last = nayin.trim().slice(-1);
  if (last === '木' || last === '火' || last === '土' || last === '金' || last === '水') {
    return last;
  }
  return '';
}

export function nayinWxClass(nayin: string): string {
  return wuxingClass(nayinWuxing(nayin));
}

/** 八字页氛围 data-bazi-wx 键：mu|huo|tu|jin|shui */
export function baziWxAuraKey(wx: WuXing | string | undefined): string {
  switch (wx) {
    case '木':
      return 'mu';
    case '火':
      return 'huo';
    case '土':
      return 'tu';
    case '金':
      return 'jin';
    case '水':
      return 'shui';
    default:
      return '';
  }
}

/** 只染当前八字页根节点，不改全局 theme */
export function applyBaziPageAura(
  el: HTMLElement,
  wx: WuXing | string | undefined,
): void {
  const key = baziWxAuraKey(wx);
  if (key) el.dataset.baziWx = key;
  else delete el.dataset.baziWx;
}
