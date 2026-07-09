import type { CardDefinition } from '../tarot/deck.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';

export type CodexPreviewInfo = {
  nameCn: string;
  nameEn: string;
  suitLabel: string;
  theme: string;
  mysteryHint: string;
};

const SUIT_LABEL: Record<string, string> = {
  wands: '权杖',
  cups: '圣杯',
  swords: '宝剑',
  pentacles: '星币',
};

const MYSTERY_HINTS: Record<string, string[]> = {
  major: [
    '有些答案不在牌面，而在你敢于承认的那一步里。',
    '大阿尔克那常指向人生课题——等你亲手翻开那一天。',
    '它尚未开口，但已在你的问题里埋下伏笔。',
    '命运不会提前剧透，只会留下隐约的轮廓。',
  ],
  wands: [
    '火种常在犹豫之前就已点燃，只等你承认那股冲动。',
    '行动之前，先问：这股热情究竟要带你去哪里？',
    '有些推进不是为了快，而是为了不再原地打转。',
    '热情是礼物，也可能是未加审视的燃烧。',
  ],
  cups: [
    '感受从不撒谎，只是未必用你期待的方式说话。',
    '心的事，往往在水面之下先流动。',
    '有些联结需要被感受，而不是被分析。',
    '柔软不是软弱，是另一种诚实。',
  ],
  swords: [
    '有些痛苦不是为了惩罚你，而是为了让真相浮出水面。',
    '思绪像剑，能切开迷雾，也可能划伤自己。',
    '清晰有时来得突然，你需要准备好承接它。',
    '未说出口的话，往往比已说的更重。',
  ],
  pentacles: [
    '安稳与流动之间，总有一道你需要亲自衡量的边界。',
    '资源从不只是数字，也是你对安全感的定义。',
    '脚下的路比远方的梦更诚实，先看清此刻拥有什么。',
    '积累是慢功夫，急躁会让种子烂在土里。',
  ],
};

const CARD_THEME: Record<string, string> = {
  'swords-three': '心痛、真相、切开幻象',
  'swords-ten': '触底、终结、旧模式落幕',
  'swords-ace': '清晰、决断、新念头',
  'pentacles-four': '守成、安全感、紧握与松动',
  'wands-eight': '加速、消息、事态推进',
  'major-0': '出发、信任、未知旅程',
  'major-2': '直觉、静默、未言真相',
  'major-6': '选择、价值、联结',
  'major-16': '突变、崩塌、觉醒',
  'major-17': '希望、疗愈、重新相信',
  'major-18': '迷雾、潜意识、不确定',
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 9973;
  return h;
}

function pickHint(card: CardDefinition): string {
  const pool =
    card.arcana === 'major'
      ? MYSTERY_HINTS.major
      : MYSTERY_HINTS[card.suit ?? 'wands'] ?? MYSTERY_HINTS.major;
  return pool[hashId(card.id) % pool.length]!;
}

function defaultTheme(card: CardDefinition): string {
  if (CARD_THEME[card.id]) return CARD_THEME[card.id]!;
  if (card.arcana === 'major') {
    return card.keywords.slice(0, 3).join('、') || '人生课题、转折、内在召唤';
  }
  const suitZh = SUIT_LABEL[card.suit ?? 'wands'] ?? '';
  const rankTheme = card.keywords[1] ?? card.keywords[0] ?? '主题';
  return `${suitZh}之${rankTheme}`;
}

export function getCodexPreviewInfo(card: CardDefinition): CodexPreviewInfo {
  const nameCn = formatCardNameZh(card);
  const suitLabel =
    card.arcana === 'major' ? '大阿尔克那' : (SUIT_LABEL[card.suit ?? ''] ?? '小阿尔克那');

  return {
    nameCn,
    nameEn: card.nameEn,
    suitLabel,
    theme: defaultTheme(card),
    mysteryHint: pickHint(card),
  };
}
