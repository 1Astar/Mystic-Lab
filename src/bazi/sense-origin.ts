import type { BaziChart } from './cast.ts';
import { buildEnergyBalance } from './sense-energy.ts';
import type { ShenShaMark } from './sense-shensha.ts';
import { currentDayunGod } from './sense-forecast.ts';
import type { LifeProfileInput } from '../life/types.ts';

export type TraditionOrigin = {
  title: string;
  /** 折叠内段落（可含术语） */
  paragraphs: string[];
};

/**
 * 第二层：传统命理溯源。折叠展示，允许干支/十神/神煞原名。
 */
export function buildTraditionOrigin(
  chart: BaziChart,
  profile: LifeProfileInput,
  marks: ShenShaMark[],
  opts?: { gender?: '' | 'female' | 'male'; year?: number },
): TraditionOrigin {
  const year = opts?.year ?? chart.liunianYear ?? new Date().getFullYear();
  const gender = opts?.gender ?? '';
  const day = chart.pillars.find((p) => p.key === 'day');
  const month = chart.pillars.find((p) => p.key === 'month');
  const hour = chart.pillars.find((p) => p.key === 'hour');
  const liu = chart.pillars.find((p) => p.key === 'liunian' && !p.empty);
  const energy = buildEnergyBalance(chart);
  const dayun = currentDayunGod(profile, gender, year);

  const paragraphs: string[] = [];

  if (day && !day.empty) {
    const monthNote =
      month && !month.empty
        ? `生于${month.stem}${month.branch}月令一带`
        : '月令信息待补';
    paragraphs.push(
      `以上现象，在传统八字中可回溯到日柱 ${day.stem}${day.branch}（日主 ${chart.dayMaster}${chart.dayMasterWx || ''}）。本命局：${monthNote}；日主旺衰倾向为「${energy.shortage ? '短板偏' + energy.shortage : energy.excess ? '偏旺在' + energy.excess : '相对均衡'}」。`,
    );
  }

  if (dayun || liu) {
    const bits: string[] = [];
    if (dayun?.ganZhi) {
      bits.push(
        `当前大运倾向 ${dayun.ganZhi}${dayun.stemGod ? `（${dayun.stemGod}）` : ''}`,
      );
    }
    if (liu) {
      bits.push(
        `流年 ${year} 为 ${liu.stem}${liu.branch}（${liu.stemGod}）`,
      );
    }
    paragraphs.push(`大运与流年：${bits.join('；')}。`);
  }

  if (hour && !hour.empty && hour.shensha?.length) {
    paragraphs.push(
      `时柱 ${hour.stem}${hour.branch} 可见神煞：${hour.shensha.join('、')}。`,
    );
  }

  if (marks.length) {
    paragraphs.push(
      `本页精选印记对应传统名：${marks.map((m) => `${m.label}←${m.traditional}`).join('；')}。`,
    );
  }

  if (chart.relations.length) {
    paragraphs.push(`地支关系：${chart.relations.join('、')}。`);
  }

  if (!paragraphs.length) {
    paragraphs.push('排盘信息不足，暂无法展开传统溯源。请先补全出生信息。');
  }

  return {
    title: '传统命理溯源',
    paragraphs,
  };
}
