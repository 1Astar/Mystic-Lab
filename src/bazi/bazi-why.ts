import type { WhyItem } from '../mystic-engine/types.ts';
import type { BaziFacts } from './bazi-facts.ts';
import { STRENGTH_MOD } from './portrait-copy.ts';
import type { TenGodCategory } from './ten-gods.ts';

const CAT_PLAIN: Record<TenGodCategory, string> = {
  guan_sha: '责任与评价结构',
  cai: '资源与结果',
  shi_shang: '表达与输出',
  yin: '学习与支持',
  bi_jie: '同侪与协作',
};

const CAT_GLOSS: Record<TenGodCategory, { term: string; gloss: string }> = {
  guan_sha: { term: '官杀', gloss: '盘里代表责任、规则与外界评价的那一类结构。' },
  cai: { term: '财星', gloss: '盘里代表资源、报酬与可变现结果的那一类。' },
  shi_shang: { term: '食伤', gloss: '盘里代表表达、创意与对外输出的那一类。' },
  yin: { term: '印星', gloss: '盘里代表学习、庇护与信息支持的那一类。' },
  bi_jie: { term: '比劫', gloss: '盘里代表同辈、搭档与竞争协作的那一类。' },
};

function whyItem(partial: Omit<WhyItem, 'body'>): WhyItem {
  const lines = [partial.hook, ...(partial.points ?? [])];
  if (partial.tip) lines.push(partial.tip);
  return { ...partial, body: lines.filter(Boolean).join('\n') };
}

/** 八字 why 卡：眼下 / 结构 / 拉扯 */
export function buildBaziWhyItems(facts: BaziFacts, question = ''): WhyItem[] {
  const wx = facts.dayMasterWx || '未知';
  const mod = STRENGTH_MOD[facts.dayStrength];
  const items: WhyItem[] = [
    whyItem({
      title: '眼下气质',
      badgeTerm: {
        term: '日主',
        gloss: `四柱里代表「你自己」的那一干。月令强度学习名：${facts.dayStrength}。`,
      },
      hook: `核心气质偏「${wx}」：${mod}`,
      tip: question.trim()
        ? '先把问题收成一件可核对的事，再对照结构看倾向。'
        : '先认清自己的用力方式，再谈环境与选择。',
    }),
  ];

  const cat = facts.monthCategory ?? facts.dominantCategories[0];
  if (cat) {
    items.push(
      whyItem({
        title: '结构偏向',
        badgeTerm: CAT_GLOSS[cat],
        hook: `月令/盘面更靠近「${CAT_PLAIN[cat]}」`,
        points: [
          facts.monthCategory
            ? '月令这一层常映射对外角色与事业长法。'
            : `「${CAT_PLAIN[cat]}」在盘里出现较多，做事时更容易被这一层牵动。`,
        ],
        tip: '不是判决，是提醒你往哪对齐更容易顺。',
      }),
    );
  }

  if (facts.relationCount > 0) {
    items.push(
      whyItem({
        title: '人际拉扯',
        badgeTerm: {
          term: '地支关系',
          gloss: '四柱地支之间的合、冲、刑、害等互动——常映射人际与事件上的牵引。',
        },
        hook: `地支关系里有 ${facts.relationCount} 处合冲刑害一类拉扯`,
        tip: '人际与节奏上宜主动对齐，少硬扛。',
      }),
    );
  }

  if (!facts.hasHour) {
    items.push(
      whyItem({
        title: '信息缺口',
        hook: '时辰未填，时柱细节暂缺',
        tip: '结论先看年月日本层；补时辰后可更细。',
      }),
    );
  }

  return items.slice(0, 4);
}
