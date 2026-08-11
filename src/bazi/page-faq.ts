/** 八字边看边问：按当前命盘/解读页生成常问（对齐六爻 buildLearnFaq） */
import type { BaziChart } from './cast.ts';
import { answerBaziConcept } from './concept-ask.ts';
import { buildEnergyBalance } from './sense-energy.ts';
import { buildSeasonTone } from './sense-season.ts';
import { buildShenShaMarks } from './sense-shensha.ts';

export type BaziFaqItem = { q: string; a: string[] };

export function buildBaziPageFaq(
  chart: BaziChart,
  opts?: { question?: string },
): BaziFaqItem[] {
  const dm = chart.dayMaster;
  const dmWx = chart.dayMasterWx || '';
  const dayPillar = chart.pillars.find((p) => p.title.includes('日'));
  const dayGz = dayPillar && !dayPillar.empty ? `${dayPillar.stem}${dayPillar.branch}` : `${dm}`;
  const energy = buildEnergyBalance(chart);
  const season = buildSeasonTone(chart);
  const marks = buildShenShaMarks(chart, 4);
  const q = opts?.question?.trim() ?? '';

  const items: BaziFaqItem[] = [
    {
      q: `日主「${dm}」是什么意思？`,
      a: (() => {
        const hit = answerBaziConcept(dm);
        return hit.hit
          ? hit.answer.split('\n').filter(Boolean)
          : [`日主是出生日的天干「${dm}」${dmWx ? `（属${dmWx}）` : ''}，代表「我」这一面的气质底色。`];
      })(),
    },
    {
      q: `为什么说我是「${season.title}」？`,
      a: [season.tagline, season.body],
    },
    {
      q: `能量状态「${energy.headline}」怎么理解？`,
      a: [
        energy.body,
        energy.remedy,
        energy.shortage
          ? `相对偏缺：${energy.shortage}——可优先补这一路的节奏与环境。`
          : energy.excess
            ? `相对偏旺：${energy.excess}——宜疏不宜硬顶。`
            : '五行相对均衡，重点在用神与流年窗口。',
      ],
    },
  ];

  if (marks[0]) {
    const m = marks[0];
    const concept = answerBaziConcept(m.label);
    items.push({
      q: `命盘印记「${m.label}」是什么？`,
      a: concept.hit
        ? concept.answer.split('\n').filter(Boolean)
        : [m.comfort || `${m.label}是本命盘上较显眼的神煞印记，点开图鉴可看释义。`],
    });
  }

  if (marks[1]) {
    const m = marks[1];
    items.push({
      q: `「${m.label}」对我有什么提醒？`,
      a: [m.comfort || `留意「${m.label}」相关的人际与时机，不必过度解读。`],
    });
  }

  items.push({
    q: q
      ? `就「${q}」而言，我该先看盘面哪一块？`
      : '我该先看盘面哪一块？',
    a: [
      `先锁定日柱「${dayGz}」——这是「我」的坐标。`,
      `再看季节定调「${season.title}」与能量「${energy.headline}」，最后才落到大运流年。`,
      '想看十神/神煞细节，可打开探索图鉴对照收集。',
    ],
  });

  return items;
}
