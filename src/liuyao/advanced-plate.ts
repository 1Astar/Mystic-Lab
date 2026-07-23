import type { CastResult } from './engine.ts';
import { LINE_LABELS, palaceOfHexagram } from './hexagrams.ts';
import type { TrigramId } from './trigrams.ts';
import {
  branchWuXing,
  dressHexagram,
  liuqinOf,
  type DressedHexagram,
  type LiuQin,
  type YaoDress,
} from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import type { WuXing } from './wuxing.ts';
import { teachFold } from './flip-teach.ts';

const ALL_QIN: LiuQin[] = ['父母', '兄弟', '子孙', '妻财', '官鬼'];

/**
 * 八纯卦纳支（初→上）。
 * 内外卦同宫时上卦另起一旬，不能简单把三爻翻倍。
 */
export const PURE_HEX_BRANCHES: Record<
  TrigramId,
  [string, string, string, string, string, string]
> = {
  乾: ['子', '寅', '辰', '午', '申', '戌'],
  坤: ['未', '巳', '卯', '丑', '亥', '酉'],
  震: ['子', '寅', '辰', '午', '申', '戌'],
  巽: ['丑', '亥', '酉', '未', '巳', '卯'],
  坎: ['寅', '辰', '午', '申', '戌', '子'],
  离: ['卯', '丑', '亥', '未', '巳', '酉'],
  艮: ['辰', '午', '申', '戌', '子', '寅'],
  兑: ['巳', '卯', '丑', '亥', '酉', '未'],
};

export type FuShenItem = {
  qin: LiuQin;
  /** 伏在第几爻（0–5） */
  index: number;
  label: string;
  branch: string;
  wuxing: WuXing;
  /** 飞神：本卦同爻 */
  feiQin: LiuQin;
  feiBranch: string;
};

export type XunKongInfo = {
  /** 日旬空，如「戌亥」 */
  text: string;
  /** 落空的本卦爻 */
  rows: YaoDress[];
};

export type ShenShaHit = {
  name: string;
  tip: string;
  branch: string;
  /** 落在本卦哪些爻 */
  rows: YaoDress[];
};

export type AdvancedPlate = {
  palaceName: string;
  pureName: string;
  fushen: FuShenItem[];
  xunkong: XunKongInfo;
  shensha: ShenShaHit[];
};

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 三合局取支 */
function sanheMate(
  dayBranch: string,
  map: Record<'寅午戌' | '申子辰' | '巳酉丑' | '亥卯未', string>,
): string | undefined {
  if ('寅午戌'.includes(dayBranch)) return map['寅午戌'];
  if ('申子辰'.includes(dayBranch)) return map['申子辰'];
  if ('巳酉丑'.includes(dayBranch)) return map['巳酉丑'];
  if ('亥卯未'.includes(dayBranch)) return map['亥卯未'];
  return undefined;
}

const YIMA: Record<'寅午戌' | '申子辰' | '巳酉丑' | '亥卯未', string> = {
  寅午戌: '申',
  申子辰: '寅',
  巳酉丑: '亥',
  亥卯未: '巳',
};

const TAOHUA: Record<'寅午戌' | '申子辰' | '巳酉丑' | '亥卯未', string> = {
  寅午戌: '卯',
  申子辰: '酉',
  巳酉丑: '午',
  亥卯未: '子',
};

const HUAGAI: Record<'寅午戌' | '申子辰' | '巳酉丑' | '亥卯未', string> = {
  寅午戌: '戌',
  申子辰: '辰',
  巳酉丑: '丑',
  亥卯未: '未',
};

/** 日干 → 天乙贵人地支（常用甲戊庚牛羊法） */
const GUIREN: Record<string, [string, string]> = {
  甲: ['丑', '未'],
  戊: ['丑', '未'],
  庚: ['丑', '未'],
  乙: ['子', '申'],
  己: ['子', '申'],
  丙: ['亥', '酉'],
  丁: ['亥', '酉'],
  壬: ['巳', '卯'],
  癸: ['巳', '卯'],
  辛: ['午', '寅'],
};

const WENCHANG: Record<string, string> = {
  甲: '巳',
  乙: '午',
  丙: '申',
  丁: '酉',
  戊: '申',
  己: '酉',
  庚: '亥',
  辛: '子',
  壬: '寅',
  癸: '卯',
};

const LU: Record<string, string> = {
  甲: '寅',
  乙: '卯',
  丙: '巳',
  丁: '午',
  戊: '巳',
  己: '午',
  庚: '申',
  辛: '酉',
  壬: '亥',
  癸: '子',
};

const YANGREN: Record<string, string> = {
  甲: '卯',
  乙: '寅',
  丙: '午',
  丁: '巳',
  戊: '午',
  己: '巳',
  庚: '酉',
  辛: '申',
  壬: '子',
  癸: '亥',
};

function parseKongBranches(xunKong: string): string[] {
  return BRANCHES.filter((b) => xunKong.includes(b));
}

function rowsWithBranch(rows: YaoDress[], branch: string): YaoDress[] {
  return rows.filter((r) => r.branch === branch);
}

/** 本宫八纯卦名（宫名＝首卦名） */
export function pureHexagramOfPalace(palace: TrigramId): string {
  return palace;
}

/** 伏神：本卦缺的六亲，按本宫首卦同位补入 */
export function buildFuShen(dressed: DressedHexagram): FuShenItem[] {
  const present = new Set(dressed.rows.map((r) => r.liuqin));
  const missing = ALL_QIN.filter((q) => !present.has(q));
  if (!missing.length) return [];

  const pureBranches = PURE_HEX_BRANCHES[dressed.palace];
  if (!pureBranches) return [];

  const items: FuShenItem[] = [];

  for (const qin of missing) {
    const index = pureBranches.findIndex(
      (br) => liuqinOf(dressed.palaceWx, branchWuXing(br)) === qin,
    );
    if (index < 0) continue;
    const branch = pureBranches[index]!;
    const fei = dressed.rows[index]!;
    items.push({
      qin,
      index,
      label: LINE_LABELS[index]!,
      branch,
      wuxing: branchWuXing(branch),
      feiQin: fei.liuqin,
      feiBranch: fei.branch,
    });
  }
  return items;
}

export function buildXunKong(rows: YaoDress[], dayXunKong: string): XunKongInfo {
  const text = dayXunKong || '—';
  const kongSet = new Set(parseKongBranches(dayXunKong));
  return {
    text,
    rows: rows.filter((r) => kongSet.has(r.branch)),
  };
}

/** 常用神煞（日干支起）：驿马 / 桃花 / 华盖 / 贵人 / 文昌 / 禄 / 羊刃 */
export function buildShenSha(
  rows: YaoDress[],
  dayStem: string,
  dayBranch: string,
): ShenShaHit[] {
  const hits: ShenShaHit[] = [];

  const push = (name: string, tip: string, branch: string | undefined) => {
    if (!branch) return;
    const hitRows = rowsWithBranch(rows, branch);
    if (!hitRows.length) return;
    hits.push({ name, tip, branch, rows: hitRows });
  };

  push('驿马', '走动、出行、调动、事情推进的脚力。', sanheMate(dayBranch, YIMA));
  push('桃花', '人缘、吸引力、交际场；感情题尤醒目。', sanheMate(dayBranch, TAOHUA));
  push('华盖', '孤高、艺术、宗教、想得开也想得远。', sanheMate(dayBranch, HUAGAI));

  const gr = GUIREN[dayStem];
  if (gr) {
    for (const b of gr) {
      push('天乙贵人', '得贵人提携、手续旁有人相助的象。', b);
    }
  }
  push('文昌', '文书、考试、表达与条理。', WENCHANG[dayStem]);
  push('日禄', '日干之禄：得力、有根、偏有气势。', LU[dayStem]);
  push('羊刃', '刚猛、冲撞、手术血光等刚象（象义，非定论）。', YANGREN[dayStem]);

  return hits;
}

export function buildAdvancedPlate(cast: CastResult, castAt = new Date()): AdvancedPlate {
  const sz = siZhuFromDate(castAt);
  const dressed = dressHexagram(cast, sz.dayStem);
  const palace = palaceOfHexagram(cast.primary.name) ?? dressed.palace;
  const dayBranch = sz.day.length >= 2 ? sz.day.charAt(1) : '';

  return {
    palaceName: `${palace}宫`,
    pureName: palace,
    fushen: buildFuShen(dressed),
    xunkong: buildXunKong(dressed.rows, sz.dayXunKong),
    shensha: buildShenSha(dressed.rows, sz.dayStem, dayBranch),
  };
}

function formatRowList(rows: YaoDress[]): string {
  if (!rows.length) return '本卦未落';
  return rows.map((r) => `${r.label}${r.liuqin}${r.branch}${r.wuxing}`).join('、');
}

export function renderAdvancedPlateBodyHtml(plate: AdvancedPlate): string {
  const fu =
    plate.fushen.length === 0
      ? `<p class="ly-guide-tip">本卦六亲俱全（或无可补），无需伏神。</p>`
      : `<ul class="ly-adv-list">${plate.fushen
          .map(
            (f) => `
        <li>
          <strong>伏神${escapeHtml(f.qin)}</strong>
          ${escapeHtml(f.branch)}${escapeHtml(f.wuxing)}
          伏于${escapeHtml(f.label)}
          （飞神${escapeHtml(f.feiQin)}${escapeHtml(f.feiBranch)}）
          <span class="ly-adv-note">取自${escapeHtml(plate.palaceName)}首卦「${escapeHtml(
            plate.pureName,
          )}」同位</span>
        </li>`,
          )
          .join('')}</ul>`;

  const kongRows = formatRowList(plate.xunkong.rows);
  const kong = `
    <p><strong>日旬空</strong> ${escapeHtml(plate.xunkong.text)}</p>
    <p class="ly-adv-note">落空爻：${escapeHtml(kongRows)}。空则力虚，动空／冲空另论。</p>
  `;

  const sha =
    plate.shensha.length === 0
      ? `<p class="ly-guide-tip">常用神煞未直接落到本卦地支。</p>`
      : `<ul class="ly-adv-list">${plate.shensha
          .map(
            (s) => `
        <li>
          <strong>${escapeHtml(s.name)}</strong>
          （${escapeHtml(s.branch)}）
          → ${escapeHtml(formatRowList(s.rows))}
          <span class="ly-adv-note">${escapeHtml(s.tip)}</span>
        </li>`,
          )
          .join('')}</ul>`;

  return `
    <p class="ly-guide-tip">专业向参考：默认收起，不影响新手主路径。象义提示，不作定论。</p>
    <div class="ly-adv-block">
      <p class="ly-layer-guide">伏神</p>
      ${fu}
    </div>
    <div class="ly-adv-block">
      <p class="ly-layer-guide">旬空</p>
      ${kong}
    </div>
    <div class="ly-adv-block">
      <p class="ly-layer-guide">神煞</p>
      ${sha}
    </div>
  `;
}

/** 进阶折叠：伏神 / 旬空 / 神煞 */
export function renderAdvancedPlateFoldHtml(cast: CastResult, castAt = new Date()): string {
  const plate = buildAdvancedPlate(cast, castAt);
  const fuN = plate.fushen.length;
  const kongN = plate.xunkong.rows.length;
  const shaN = plate.shensha.length;
  const hint = [
    fuN ? `伏神${fuN}` : '',
    kongN ? `空${kongN}爻` : '无落空',
    shaN ? `神煞${shaN}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return teachFold(
    `进阶 · 伏神 / 旬空 / 神煞${hint ? `（${hint}）` : ''}`,
    renderAdvancedPlateBodyHtml(plate),
  );
}
