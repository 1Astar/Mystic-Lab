/**
 * 解读段「为什么这么解」理由层：规则模板，可收集为知识点。
 */
import type { BaziChart } from './cast.ts';
import { buildBaziFacts } from './bazi-facts.ts';
import type { SeasonLabel, WuXing } from './elements.ts';
import type { PortraitDomainId } from './portrait-types.ts';
import type { TenGodCategory } from './ten-gods.ts';
import { buildEnergyBalance } from './sense-energy.ts';
import { buildYearForecast } from './sense-forecast.ts';
import type { LifeProfileInput } from '../life/types.ts';

export type LearnWhyItem = {
  id: string;
  /** 段落短名，如「核心定调」 */
  section: string;
  /** 按钮旁/展开标题 */
  title: string;
  /** 大白话理由 */
  body: string;
};

const CAT_PLAIN: Record<TenGodCategory, string> = {
  shi_shang: '食伤（表达/创造力）',
  cai: '财星（资源与结果）',
  guan_sha: '官杀（责任与评价）',
  yin: '印星（学习与托住）',
  bi_jie: '比劫（同侪与并肩）',
};

const STRENGTH_PLAIN: Record<SeasonLabel, string> = {
  旺: '偏旺——油门容易踩满',
  相: '得助力——适合借势',
  休: '在蓄力——宜慢热',
  囚: '受压——先找出口',
  死: '偏弱——先补给再表现',
};

const WX_ROOT: Record<WuXing, string> = {
  木: '生长与方向感',
  火: '表达与可见度',
  土: '根基与落地',
  金: '边界与收口',
  水: '流动与冷静',
};

function topCatLine(facts: ReturnType<typeof buildBaziFacts>): string {
  const top = facts.dominantCategories[0];
  if (!top) return '盘上十神分布相对分散，结论更看整体节奏，而不是单点标签。';
  return `盘上「${CAT_PLAIN[top]}」更显眼，解读才会往这条生活线上靠。`;
}

function rootLine(facts: ReturnType<typeof buildBaziFacts>): string {
  const wx = facts.dayMasterWx;
  if (!wx) return '你的根基需要对照四柱再核。';
  const str = STRENGTH_PLAIN[facts.dayStrength];
  return `你的「根」（坐下气势里的「${wx}」）眼下是：${str}。`;
}

export function buildInsightWhy(chart: BaziChart): LearnWhyItem {
  const facts = buildBaziFacts(chart);
  return {
    id: 'why:insight',
    section: '现实感悟',
    title: '为什么会写成这种「现实感」？',
    body: `${rootLine(facts)}${topCatLine(facts)}所以开场先对上你最近的体感，而不是先甩术语——先活在场景里，再回盘核对。`,
  };
}

export function buildSeasonWhy(chart: BaziChart): LearnWhyItem {
  const facts = buildBaziFacts(chart);
  const wx = facts.dayMasterWx || '木';
  return {
    id: 'why:season',
    section: '核心定调',
    title: '为什么用「季节」来定调？',
    body: `八字里你像一棵「${wx}」：出生月令决定它当下是春是秋。你盘上这季对这股气是「${facts.dayStrength}」，所以气质会被说成某种季节感——这是「得令与否」的底层逻辑，不是随便比喻。`,
  };
}

export function buildEnergyWhy(chart: BaziChart): LearnWhyItem {
  const energy = buildEnergyBalance(chart);
  const facts = buildBaziFacts(chart);
  const hot = energy.excess
    ? `「${energy.excess}」偏满（${WX_ROOT[energy.excess]}易过热）`
    : '五行相对匀';
  const cold = energy.shortage
    ? `「${energy.shortage}」偏缺（${WX_ROOT[energy.shortage]}需要补给）`
    : '没有明显短板';
  return {
    id: 'why:energy',
    section: '能量状态',
    title: '为什么说要先补缺口/给过热降温？',
    body: `球的大小看天性构成，颜色看月令旺衰。眼下${hot}；${cold}。${rootLine(facts)}调频建议跟着「抑强扶弱」走——不是改命，是先把杠杆找对。`,
  };
}

export function buildDomainWhy(
  chart: BaziChart,
  domain: PortraitDomainId,
  domainTitle: string,
): LearnWhyItem {
  const facts = buildBaziFacts(chart);
  const byDomain: Record<PortraitDomainId, string> = {
    personality: `性格底色先看自身五行与月令强弱：${rootLine(facts)}${topCatLine(facts)}`,
    career: `事业倾向常看月令十神窗口与「${CAT_PLAIN.guan_sha}/${CAT_PLAIN.shi_shang}」谁更亮——${topCatLine(facts)}`,
    relationship: `关系模式看比劫、官杀、印星谁多：${topCatLine(facts)}靠近方式才会写成这样。`,
    wealth: `财富方式看财星与食伤：${
      facts.categoryCounts.cai >= 1
        ? `盘上财星有信号，强调结果与止损。`
        : facts.categoryCounts.shi_shang >= 2
          ? `食伤偏旺时，钱往往从「本事变现」来，而不是空手抓机会。`
          : `财星不显眼时，更宜先把交付做稳，再谈扩张。`
    }这就是「我克者为财」在生活里的用法：先有可交付的创造，财富才接得住。`,
    inner: `内在课题跟着自身强弱走：${rootLine(facts)}弱则先补给，旺则先找出口——所以「小心」写的是防过热或防空转。`,
  };
  return {
    id: `why:domain:${domain}`,
    section: domainTitle,
    title: `为什么「${domainTitle}」这样写？`,
    body: byDomain[domain],
  };
}

export function buildForecastWhy(
  chart: BaziChart,
  profile: LifeProfileInput,
  opts: { gender?: '' | 'female' | 'male'; year?: number },
): LearnWhyItem {
  const forecast = buildYearForecast(chart, profile, opts);
  const facts = buildBaziFacts(chart);
  return {
    id: 'why:forecast',
    section: '大运流年',
    title: '为什么今年是这种「天气」？',
    body: `流年像风向，叠在你原有的根上。${topCatLine(facts)}所以今年被说成「${forecast.weather}」——宜忌不是鸡汤，是顺着这股十神气候给的行动边界。`,
  };
}

export function buildYijiWhy(chart: BaziChart): LearnWhyItem {
  const facts = buildBaziFacts(chart);
  const tip =
    facts.categoryCounts.shi_shang >= 2 &&
    (facts.dayStrength === '休' || facts.dayStrength === '囚' || facts.dayStrength === '死')
      ? `你盘上「${CAT_PLAIN.shi_shang}」偏旺，但「根」不稳时，最忌全网开播式扩张——创造力会空转。所以宜「先选一个出口专心交付」，这就是「食伤泄秀也要有根」：地基没打好，大楼盖越高越容易塌。`
      : `宜忌跟着流年十神气候与自身强弱写：${rootLine(facts)}${topCatLine(facts)}宜=顺着窗口做可核对的小步；忌=同一气候下的反面玩法。`;
  return {
    id: 'why:yiji',
    section: '宜忌',
    title: '为什么宜忌写成这样？',
    body: tip,
  };
}
