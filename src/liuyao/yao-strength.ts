import type { CastResult } from './engine.ts';
import { dressHexagram, branchWuXing, type LiuQin, type YaoDress } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { WX_KE, WX_SHENG, type WuXing } from './wuxing.ts';
import { buildShengKeMap } from './shengke-map.ts';
import { resolveYongShen, yongLiuQinList } from './yong-shen.ts';
import { formatLiuqinShort, LIUQIN_ENERGY } from './energy-lens.ts';
import { renderTermLabelHtml } from './term-gloss.ts';
import { LIU_CHONG } from './yao-special.ts';

/** 相对月令：旺相休囚死（教学用，月建五行论） */
export type WangXiang = '旺' | '相' | '休' | '囚' | '死';

export function wangXiangOf(yaoWx: WuXing, monthWx: WuXing): WangXiang {
  if (yaoWx === monthWx) return '旺';
  if (WX_SHENG[monthWx] === yaoWx) return '相'; // 令生者相
  if (WX_SHENG[yaoWx] === monthWx) return '休'; // 生令者休
  if (WX_KE[yaoWx] === monthWx) return '囚'; // 克令者囚
  if (WX_KE[monthWx] === yaoWx) return '死'; // 令克者死
  return '休';
}

/** 白话推一步：同属 / 谁生谁 / 谁克谁 → 旺相休囚死 */
export function wangXiangReason(yaoWx: WuXing, monthWx: WuXing): string {
  const grade = wangXiangOf(yaoWx, monthWx);
  if (yaoWx === monthWx) return `同属${yaoWx} → ${grade}`;
  if (WX_SHENG[monthWx] === yaoWx) return `${monthWx}生${yaoWx} → ${grade}`;
  if (WX_SHENG[yaoWx] === monthWx) return `${yaoWx}生${monthWx} → ${grade}`;
  if (WX_KE[yaoWx] === monthWx) return `${yaoWx}克${monthWx} → ${grade}`;
  if (WX_KE[monthWx] === yaoWx) return `${monthWx}克${yaoWx} → ${grade}`;
  return grade;
}

export type KeyYaoStrength = {
  index: number;
  roles: string[];
  wangXiang: WangXiang;
  kong: boolean;
  linRi: boolean;
};

export type YongStatusPack = {
  monthBranch: string;
  monthWx: WuXing;
  dayBranch: string;
  dayXunKong: string;
  yongQin: LiuQin | null;
  yongLabel: string;
  row: YaoDress | null;
  wangXiang: WangXiang | null;
  moving: boolean;
  kong: boolean;
  linRi: boolean;
  /** 关键爻：用神 / 世 / 应 / 动 */
  keyLines: KeyYaoStrength[];
  summary: string;
};

function branchOfGanzhi(gz: string): string {
  return gz.slice(1) || '';
}

function isKong(branch: string, xunKong: string): boolean {
  return Boolean(branch) && xunKong.includes(branch);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildYongStatusPack(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): YongStatusPack {
  const sz = siZhuFromDate(castAt);
  const monthBranch = branchOfGanzhi(sz.month);
  const dayBranch = branchOfGanzhi(sz.day);
  const monthWx = branchWuXing(monthBranch);
  const dressed = dressHexagram(cast, sz.dayStem);
  const map = buildShengKeMap(cast, dressed, question);
  const yongDef = resolveYongShen(question);

  const yongRow = map.nodes.find((n) => n.role === '用神')?.row ?? null;
  const yongQin = map.yongQin;
  const yongLabel = yongQin
    ? formatLiuqinShort(yongQin)
    : yongDef.name || formatLiuqinShort(yongLiuQinList(question)[0] ?? '父母');

  const wangXiang = yongRow ? wangXiangOf(yongRow.wuxing, monthWx) : null;
  const moving = Boolean(yongRow?.changing);
  const kong = yongRow ? isKong(yongRow.branch, sz.dayXunKong) : false;
  const linRi = Boolean(yongRow && yongRow.branch === dayBranch);

  const keyMap = new Map<number, KeyYaoStrength>();
  const bump = (row: YaoDress | undefined, role: string) => {
    if (!row) return;
    const cur = keyMap.get(row.index);
    const wx = wangXiangOf(row.wuxing, monthWx);
    if (cur) {
      if (!cur.roles.includes(role)) cur.roles.push(role);
      return;
    }
    keyMap.set(row.index, {
      index: row.index,
      roles: [role],
      wangXiang: wx,
      kong: isKong(row.branch, sz.dayXunKong),
      linRi: row.branch === dayBranch,
    });
  };

  bump(yongRow ?? undefined, '用神');
  bump(dressed.rows.find((r) => r.isShi), '世');
  bump(dressed.rows.find((r) => r.isYing), '应');
  for (const i of cast.changingIndexes) {
    bump(dressed.rows.find((r) => r.index === i), '动');
  }

  const keyLines = [...keyMap.values()].sort((a, b) => b.index - a.index);

  const wangPlain: Record<WangXiang, string> = {
    旺: '这个月很得力',
    相: '这个月还算有力',
    休: '这个月力气一般',
    囚: '这个月偏受压',
    死: '这个月偏弱、不得令',
  };

  let summary: string;
  if (!yongRow || !wangXiang || !yongQin) {
    summary =
      '还没在表里找到本题该盯的那一层。先看装卦表里有没有对应六亲，或把问题写得更具体。';
  } else {
    const what = LIUQIN_ENERGY[yongQin]?.modern ?? yongQin;
    const moveBit = moving
      ? '而且这一爻在动——事情正在起变化'
      : '另外：这一爻没动（和旺衰不是一回事）——局面相对静，别指望它自己突然发力';
    const kongBit = kong
      ? '又逢空亡，力量容易落空、兑现偏慢'
      : '不在空亡里，至少不是「虚着」';
    const linBit = linRi ? '又临今日地支，当天气场会更显眼。' : '';
    summary = `本题该盯的是「${what}」（${yongQin}），落在${yongRow.label}${yongRow.branch}${yongRow.wuxing}。${wangPlain[wangXiang]}（相对月建，不是因为动或没动）；${moveBit}；${kongBit}。${linBit}`.trim();
  }

  return {
    monthBranch,
    monthWx,
    dayBranch,
    dayXunKong: sz.dayXunKong,
    yongQin,
    yongLabel,
    row: yongRow,
    wangXiang,
    moving,
    kong,
    linRi,
    keyLines,
    summary,
  };
}

/** 用神状态条（事实芯片 + 白话一句 + 旺衰怎么算） */
export function renderYongStatusHtml(pack: YongStatusPack): string {
  const chips: string[] = [];
  if (pack.row && pack.yongQin) {
    chips.push(`${pack.row.label}·${pack.yongQin}${pack.row.branch}${pack.row.wuxing}`);
  } else {
    chips.push(`该盯：${pack.yongLabel} · 表里未落`);
  }
  if (pack.wangXiang) {
    const plain =
      pack.wangXiang === '旺' || pack.wangXiang === '相'
        ? `偏强（${pack.wangXiang}）`
        : pack.wangXiang === '休'
          ? `一般（${pack.wangXiang}）`
          : `偏弱（${pack.wangXiang}）`;
    chips.push(plain);
  }
  chips.push(pack.moving ? '在动' : '没动');
  if (pack.kong) chips.push('逢空');
  if (pack.linRi) chips.push('临今日');

  const chipHtml = chips
    .map((c) => `<span class="ly-yong-status-chip">${escapeHtml(c)}</span>`)
    .join('');

  const yueJian = renderTermLabelHtml('yue-jian', '月建', { askMark: true });
  const wuXing = renderTermLabelHtml('wu-xing', '五行', { askMark: true });
  const xiangKe = renderTermLabelHtml('xiang-ke', '相克', { askMark: true });

  const monthLabel = `${pack.monthBranch}${pack.monthWx}`;
  let whyHtml = '';
  if (pack.row && pack.wangXiang) {
    const yaoLabel = `${pack.row.branch}${pack.row.wuxing}`;
    const reason = wangXiangReason(pack.row.wuxing, pack.monthWx);
    const wangCell =
      pack.wangXiang === '旺' || pack.wangXiang === '相'
        ? `偏强 / ${pack.wangXiang}`
        : pack.wangXiang === '休'
          ? `一般 / ${pack.wangXiang}`
          : `偏弱 / 不得令`;
    const moveCell = pack.moving
      ? `${pack.row.label}标了「动」→ 动`
      : `${pack.row.label}没标「动」→ 静`;
    whyHtml = `
      <div class="ly-yong-why" data-yong-why>
        <p class="ly-yong-why-lead">怎么算的（和动不动是两件事）</p>
        <table class="ly-yong-why-table">
          <thead>
            <tr><th></th><th>看什么</th><th>你这例</th></tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">${escapeHtml(wangCell)}</th>
              <td>爻的${wuXing} vs ${yueJian}</td>
              <td>${escapeHtml(yaoLabel)} vs ${escapeHtml(monthLabel)} → ${xiangKe}推：${escapeHtml(reason)}</td>
            </tr>
            <tr>
              <th scope="row">${pack.moving ? '在动' : '没动'}</th>
              <td>这一爻摇的时候变不变</td>
              <td>${escapeHtml(moveCell)}</td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  return `
    <section class="ly-yong-status" data-yong-status>
      <p class="ly-layer-guide">用神状态 · 本题该盯哪一层</p>
      <p class="ly-guide-tip">用神＝按你的问题要看的那一层；旺衰看它相对${yueJian}力气够不够。</p>
      <div class="ly-yong-status-chips">${chipHtml}</div>
      <p class="ly-yong-status-meta">${yueJian}：${escapeHtml(monthLabel)}（冲${escapeHtml(
        LIU_CHONG[pack.monthBranch] ?? '—',
      )}→月破） · 日建：${escapeHtml(pack.dayBranch)}（冲${escapeHtml(
        LIU_CHONG[pack.dayBranch] ?? '—',
      )}→暗动） · 空亡：${escapeHtml(pack.dayXunKong || '—')}</p>
      <p class="ly-yong-status-summary">${escapeHtml(pack.summary)}</p>
      ${whyHtml}
    </section>
  `;
}

/** 关键爻旺衰：用神 / 世 / 应 / 动 */
export function renderKeyWangXiangHtml(pack: YongStatusPack): string {
  if (!pack.keyLines.length) {
    return `
      <section class="ly-key-wangxiang" data-key-wangxiang>
        <p class="ly-layer-guide">关键爻旺衰</p>
        <p class="ly-guide-tip">本卦暂无关键爻可标（用神未落 / 无世应动）。</p>
      </section>`;
  }

  const rows = pack.keyLines
    .map((k) => {
      const flags = [k.kong ? '空' : '', k.linRi ? '临日' : ''].filter(Boolean).join(' · ');
      return `
      <tr>
        <td>${escapeHtml(k.roles.join('·'))}</td>
        <td>${k.index + 1}爻</td>
        <td><span class="ly-wangxiang is-${escapeHtml(k.wangXiang)}">${escapeHtml(k.wangXiang)}</span></td>
        <td>${flags ? escapeHtml(flags) : '—'}</td>
      </tr>`;
    })
    .join('');

  return `
    <section class="ly-key-wangxiang" data-key-wangxiang>
      <p class="ly-layer-guide">关键爻旺衰</p>
      <p class="ly-guide-tip">只标用神 / 世 / 应 / 动；相对月建论旺相休囚死（教学近似）。</p>
      <div class="ly-dress-wrap">
        <table class="ly-dress-table ly-dress-table-compact ly-key-wangxiang-table">
          <thead>
            <tr><th>角色</th><th>爻</th><th>旺衰</th><th>备注</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderYongStatusForCast(
  cast: CastResult,
  question: string,
  castAt = new Date(),
): string {
  return renderYongStatusHtml(buildYongStatusPack(cast, question, castAt));
}

/** index → 旺衰标注（仅关键爻） */
export function keyStrengthByIndex(pack: YongStatusPack): Map<number, KeyYaoStrength> {
  return new Map(pack.keyLines.map((k) => [k.index, k]));
}
