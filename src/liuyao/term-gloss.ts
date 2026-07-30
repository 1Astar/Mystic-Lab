/** 读卦名词短释义：出现处可点开，避免跳走查词典 */

export interface TermGloss {
  id: string;
  title: string;
  /** 一句话，挂在名词旁 */
  tip: string;
  /** 可选：核心概念页锚点 */
  conceptId?: string;
}

export const TERM_GLOSS: Record<string, TermGloss> = {
  'ben-gua': {
    id: 'ben-gua',
    title: '本卦',
    tip: '当下摇出的卦——当前格局与主调。',
  },
  'bian-gua': {
    id: 'bian-gua',
    title: '变卦',
    tip: '动爻翻转后形成的新卦，看可能走向，不是死判决。',
    conceptId: 'bian-gua',
  },
  'hu-gua': {
    id: 'hu-gua',
    title: '互卦',
    tip: '取二三四爻为下卦、三四五爻为上卦另成一卦，看中间过程／内层态势。',
    conceptId: 'hu-gua',
  },
  'cuo-gua': {
    id: 'cuo-gua',
    title: '错卦',
    tip: '六爻阴阳全部对调（阳↔阴），看对立面／对照面。',
    conceptId: 'cuo-zong',
  },
  'zong-gua': {
    id: 'zong-gua',
    title: '综卦',
    tip: '整卦上下颠倒（初变上、上变初），看翻转视角／对方立场。',
    conceptId: 'cuo-zong',
  },
  'shi-yao': {
    id: 'shi-yao',
    title: '世爻',
    tip: '代表「我」：你的立场、状态、能动的部分。金色标记的那一爻。',
    conceptId: 'shi-ying',
  },
  'ying-yao': {
    id: 'ying-yao',
    title: '应爻',
    tip: '代表「外界」：对方、岗位、环境，或你要回应的那一头。红色标记的那一爻。',
    conceptId: 'shi-ying',
  },
  'dong-yao': {
    id: 'dong-yao',
    title: '动爻',
    tip: '会翻转的爻（老阳/老阴）。标出哪里正在变；有动爻才有变卦。',
    conceptId: 'dong-yao',
  },
  'yong-shen': {
    id: 'yong-shen',
    title: '用神',
    tip: '针对你的问题，盘上代表「这件事关键点」的那一层六亲——先定用神，再论旺衰与动变。',
  },
  'wang-shuai': {
    id: 'wang-shuai',
    title: '旺衰',
    tip: '用神相对「月令」力气够不够：旺相偏有气，休囚死偏弱，宜补条件少硬冲。',
  },
  'yuan-shen': {
    id: 'yuan-shen',
    title: '原神',
    tip: '生扶用神的那一层——可借的资源、信息或助力。',
  },
  'ji-shen': {
    id: 'ji-shen',
    title: '忌神',
    tip: '克损用神的那一层——干扰、急躁或拖累；宜先减干扰再推进。',
  },
  'yue-jian': {
    id: 'yue-jian',
    title: '月建',
    tip: '起卦那个月的地支。用来当「这个月的气场标尺」，量爻旺不旺。',
  },
  'wu-xing': {
    id: 'wu-xing',
    title: '五行',
    tip: '金、木、水、火、土。地支各带固定五行。',
  },
  'xiang-ke': {
    id: 'xiang-ke',
    title: '相克',
    tip: '五行相克：土克水、水克火、火克金、金克木、木克土。',
  },
  'an-dong': {
    id: 'an-dong',
    title: '暗动',
    tip: '爻本身没标「动」，但被「日支」冲到——表上安静，暗处仍可能起作用。',
  },
  'yue-po': {
    id: 'yue-po',
    title: '月破',
    tip: '爻的地支被「月支」冲到——力气容易被这个月的气场冲散、难兑现。',
  },
  'kong-wang': {
    id: 'kong-wang',
    title: '空亡',
    tip: '这一天「落空」的两支。落在空亡上的爻，力量容易虚、兑现偏慢。',
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 可点开的名词标签（旁挂短释义；askMark 时在旁加小问号） */
export function renderTermLabelHtml(
  termId: string,
  label?: string,
  opts?: { askMark?: boolean },
): string {
  const t = TERM_GLOSS[termId];
  if (!t) return escapeHtml(label ?? termId);
  const text = label ?? t.title;
  const more = t.conceptId
    ? `<a class="ly-term-more" href="/liuyao/concepts#${escapeHtml(
        t.conceptId,
      )}" data-path="/liuyao/concepts#${escapeHtml(t.conceptId)}">详解 →</a>`
    : '';
  const ask = opts?.askMark
    ? `<span class="ly-term-ask" aria-hidden="true">?</span>`
    : '';
  return `
    <span class="ly-term" data-term="${escapeHtml(t.id)}">
      <button type="button" class="ly-term-btn" aria-expanded="false" title="${escapeHtml(t.tip)}">${escapeHtml(
        text,
      )}${ask}</button>
      <span class="ly-term-tip" hidden>
        <span class="ly-term-tip-body">${escapeHtml(t.tip)}</span>
        ${more}
      </span>
    </span>
  `;
}

export function bindTermGloss(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-term]').forEach((host) => {
    if (host.dataset.glossBound === '1') return;
    host.dataset.glossBound = '1';
    const btn = host.querySelector<HTMLButtonElement>('.ly-term-btn');
    const tip = host.querySelector<HTMLElement>('.ly-term-tip');
    if (!btn || !tip) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = tip.hasAttribute('hidden');
      // 同根下只开一个
      root.querySelectorAll<HTMLElement>('.ly-term-tip').forEach((el) => {
        el.setAttribute('hidden', '');
      });
      root.querySelectorAll<HTMLButtonElement>('.ly-term-btn').forEach((b) => {
        b.setAttribute('aria-expanded', 'false');
      });
      if (open) {
        tip.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}
