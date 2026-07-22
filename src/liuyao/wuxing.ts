/** 八卦五行（教学用，装卦前近似） */
export type WuXing = '金' | '木' | '水' | '火' | '土';

const TRIGRAM_WX: Record<string, WuXing> = {
  乾: '金',
  兑: '金',
  离: '火',
  震: '木',
  巽: '木',
  坎: '水',
  艮: '土',
  坤: '土',
};

/** 我生对方 */
export const WX_SHENG: Record<WuXing, WuXing> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

/** 我克对方 */
export const WX_KE: Record<WuXing, WuXing> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木',
};

/** 谁生我（原神五行） */
export function whatGenerates(wx: WuXing): WuXing {
  const entry = Object.entries(WX_SHENG).find(([, v]) => v === wx);
  return (entry?.[0] as WuXing) ?? wx;
}

/** 谁克我（忌神五行） */
export function whatOvercomes(wx: WuXing): WuXing {
  const entry = Object.entries(WX_KE).find(([, v]) => v === wx);
  return (entry?.[0] as WuXing) ?? wx;
}

export function trigramWuXing(id: string): WuXing {
  return TRIGRAM_WX[id] ?? '土';
}

/** 爻所在半卦的五行：初二三→下卦，四五上→上卦（教学近似） */
export function lineApproxWuXing(
  line1to6: number,
  upperId: string,
  lowerId: string,
): WuXing {
  return line1to6 <= 3 ? trigramWuXing(lowerId) : trigramWuXing(upperId);
}

export type ShiYingRel = '相生' | '相克' | '比和';

export function shiYingRelation(shiWx: WuXing, yingWx: WuXing): {
  rel: ShiYingRel;
  verdict: string;
  tip: string;
} {
  if (shiWx === yingWx) {
    return {
      rel: '比和',
      verdict: '内外同频',
      tip: '你和外界节奏接近，适合协同，也防一起原地打转。',
    };
  }
  if (WX_SHENG[shiWx] === yingWx) {
    return {
      rel: '相生',
      verdict: '内外较有默契',
      tip: '世爻（你）和应爻（外部）相生：你现在和周围环境较有默契，顺水推舟即可；也留意别把力气全交给外界。',
    };
  }
  if (WX_SHENG[yingWx] === shiWx) {
    return {
      rel: '相生',
      verdict: '外界在滋养你',
      tip: '应生世：外部世界在滋养你的内部能量，宜承接机会，也别被动等靠。',
    };
  }
  if (WX_KE[shiWx] === yingWx || WX_KE[yingWx] === shiWx) {
    return {
      rel: '相克',
      verdict: '需求与现实有冲突',
      tip: '世爻（你）和应爻（外部）相克：内心需求与外部现实有冲突。冲突不是你的错，而是价值观与环境暂不匹配——这不是要你去妥协的信号，而是停下来审视真实需求的信号。不要为了顺应外部环境而内耗自己。',
    };
  }
  return {
    rel: '比和',
    verdict: '关系平淡',
    tip: '生克不明显，先把事实对齐，再谈策略。',
  };
}
