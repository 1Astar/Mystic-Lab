import type { HuangliBrief } from './huangli.ts';
import type { SixGod, SixGodId } from './six-gods.ts';

/**
 * 六神 × 黄历宜忌：用今日宜/忌给落课一句「生活实感」绑定。
 * 不做绝对预测，只做对照提示。
 */
const BRIDGE_PREF: Record<
  SixGodId,
  { prefer: 'ji' | 'yi'; fallback: string }
> = {
  'da-an': {
    prefer: 'yi',
    fallback: '今天落「大安」——局面偏稳，适合守成与把该确认的确认清楚。',
  },
  'liu-lian': {
    prefer: 'ji',
    fallback: '今天落「留连」——推进易慢，先理清卡点再动。',
  },
  'su-xi': {
    prefer: 'yi',
    fallback: '今天落「速喜」——消息与窗口可能来得快，抓住后仍要核对。',
  },
  'chi-kou': {
    prefer: 'ji',
    fallback: '今天落「赤口」——表达与关系易起摩擦，先管住口再推进。',
  },
  'xiao-ji': {
    prefer: 'yi',
    fallback: '今天落「小吉」——有小幅助力，适合轻推、小步验证。',
  },
  'kong-wang': {
    prefer: 'ji',
    fallback: '今天落「空亡」——结果可能与预期错位，适合静观其变。',
  },
};

function firstActivity(items: string[]): string | null {
  const hit = items.find((x) => x && x !== '—');
  return hit ?? null;
}

export function buildGodHuangliBridge(god: SixGod, brief: HuangliBrief): string {
  const pref = BRIDGE_PREF[god.id];
  const yi = firstActivity(brief.yi);
  const ji = firstActivity(brief.ji);

  if (pref.prefer === 'ji' && ji) {
    if (god.id === 'kong-wang') {
      return `今天落「${god.name}」，对应黄历今日「忌${ji}」——都在提示：不宜大动干戈，适合静观其变。`;
    }
    if (god.id === 'chi-kou') {
      return `今天落「${god.name}」，对照黄历今日「忌${ji}」——表达与行动都宜留余地，少硬碰。`;
    }
    return `今天落「${god.name}」，对照黄历今日「忌${ji}」——节奏偏慢或需慎动，先把阻塞看清。`;
  }

  if (pref.prefer === 'yi' && yi) {
    if (god.id === 'da-an') {
      return `今天落「${god.name}」，对照黄历今日「宜${yi}」——稳处可做扎实的事，不必强求突变。`;
    }
    if (god.id === 'su-xi') {
      return `今天落「${god.name}」，对照黄历今日「宜${yi}」——窗口在时适合主动一步，仍要留下确认。`;
    }
    return `今天落「${god.name}」，对照黄历今日「宜${yi}」——有小幅顺势空间，轻推即可。`;
  }

  // 偏好侧为空时，换另一侧仍给一句对照
  if (ji) {
    return `今天落「${god.name}」，对照黄历今日「忌${ji}」——六神与黄历都在提醒你留意分寸。`;
  }
  if (yi) {
    return `今天落「${god.name}」，对照黄历今日「宜${yi}」——可把落课与今日宜事一起看。`;
  }
  return pref.fallback;
}
