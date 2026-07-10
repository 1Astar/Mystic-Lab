export type SixGodId = 'da-an' | 'liu-lian' | 'su-xi' | 'chi-kou' | 'xiao-ji' | 'kong-wang';

export type SixGod = {
  id: SixGodId;
  name: string;
  symbol: string;
  summary: string;
  meaning: string;
  advice: string;
  tone: 'steady' | 'slow' | 'joy' | 'sharp' | 'small-luck' | 'empty';
};

export const SIX_GODS: SixGod[] = [
  {
    id: 'da-an',
    name: '大安',
    symbol: '☁',
    summary: '整体偏稳，可以守，不宜躁进。',
    meaning: '稳定、平安、可守、慢稳推进。事情有底，适合按节奏来。',
    advice: '先稳住基本盘，把该确认的确认清楚，再慢慢推进。',
    tone: 'steady',
  },
  {
    id: 'liu-lian',
    name: '留连',
    symbol: '⛓',
    summary: '事情会拖，别急，先看清卡点。',
    meaning: '拖延、反复、牵扯、暂时难快。不是没结果，而是需要耐心。',
    advice: '别硬推，先处理阻塞项；等一等、理一理，往往比猛冲更有效。',
    tone: 'slow',
  },
  {
    id: 'su-xi',
    name: '速喜',
    symbol: '⚡',
    summary: '有喜讯、有转机，可以积极一点。',
    meaning: '快速、喜讯、短期可见反馈。适合主动沟通、尽快行动。',
    advice: '抓住窗口期，把关键一步先迈出去；好消息往往来自你主动的那一下。',
    tone: 'joy',
  },
  {
    id: 'chi-kou',
    name: '赤口',
    symbol: '⚔',
    summary: '注意口舌是非，说话做事都要留余地。',
    meaning: '争执、误会、言语摩擦、情绪起伏。事能成，但过程易有冲突。',
    advice: '少说断言、多留余地；重要沟通书面确认，别在气头上做决定。',
    tone: 'sharp',
  },
  {
    id: 'xiao-ji',
    name: '小吉',
    symbol: '🍶',
    summary: '有小顺利，适合试探性推进。',
    meaning: '小吉、小成、渐进式好转。不是大爆发，但有可行路径。',
    advice: '先小步试水，看到反馈后再加码；小吉喜「轻、快、试」。',
    tone: 'small-luck',
  },
  {
    id: 'kong-wang',
    name: '空亡',
    symbol: '○',
    summary: '暂时落空，别急着定论，先观望。',
    meaning: '落空、延迟、信息不全、结果未明。不是凶，而是「还没到」。',
    advice: '暂缓重大决定，补齐信息；把精力放在准备和观察上。',
    tone: 'empty',
  },
];

export function getSixGodIconUrl(id: SixGodId): string {
  return `/xiaoliuren/gods/god-${id}.png`;
}

/** 六神合图原稿（2×3），切图脚本见 scripts/slice-six-gods.mjs */
export const SIX_GODS_GRID_URL = '/xiaoliuren/gods/six-gods-grid.png';

export function renderSixGodIcon(god: SixGod, className = 'xlr-god-icon'): string {
  return `<img class="${className}" src="${getSixGodIconUrl(god.id)}" alt="${god.name}" width="72" height="72" loading="lazy" />`;
}

export function getSixGodByIndex(index: number): SixGod {
  const normalized = ((index % 6) + 6) % 6;
  return SIX_GODS[normalized];
}

export function getSixGodByName(name: string): SixGod | undefined {
  return SIX_GODS.find((g) => g.name === name);
}
