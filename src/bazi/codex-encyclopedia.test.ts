import { describe, expect, it } from 'vitest';
import {
  BAZI_ENCYCLOPEDIA,
  BAZI_ENCYCLOPEDIA_IDS,
  getBaziEncyclopedia,
  isAtlasLibraryKind,
} from './codex-encyclopedia.ts';
import {
  LUCK_ATLAS,
  NAYIN_ATLAS,
  RELATION_ATLAS,
  SHENSHA_ATLAS,
  SHENSHA_CATEGORIES,
  assertNayinCoverage,
  listSixtyJiazi,
  nayinId,
  jiaziId,
} from './codex-atlas-catalog.ts';
import { CODEX_DETAIL_PANES } from './codex-encyclopedia-types.ts';
import { buildCodexDossier } from './codex-dossier.ts';
import { buildChartLinkReport } from './codex-chart-link.ts';
import { renderWuxingShengKeMapHtml } from './codex-wuxing-map.ts';
import { renderBaziCodexDetailHtml } from '../ui/bazi-codex-detail.ts';
import {
  getJiaziDayunLore,
  jiaziDayunRichCoverage,
  listRichJiaziDayunIds,
} from './codex-jiazi-dayun-lore.ts';
import { getNayinLore } from './codex-nayin-lore.ts';

describe('bazi encyclopedia', () => {
  it('core kinds still present', () => {
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'wuxing')).toHaveLength(5);
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'stem')).toHaveLength(10);
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'branch')).toHaveLength(12);
    expect(Object.values(BAZI_ENCYCLOPEDIA).filter((e) => e.kind === 'tengod')).toHaveLength(10);
  });

  it('atlas shells: nayin30 jiazi60 shensha80+ relation luck', () => {
    expect(NAYIN_ATLAS).toHaveLength(30);
    expect(listSixtyJiazi()).toHaveLength(60);
    expect(SHENSHA_ATLAS.length).toBeGreaterThanOrEqual(80);
    expect(SHENSHA_CATEGORIES).toHaveLength(10);
    expect(RELATION_ATLAS.length).toBeGreaterThanOrEqual(10);
    expect(LUCK_ATLAS.length).toBeGreaterThanOrEqual(6);
    expect(BAZI_ENCYCLOPEDIA_IDS.length).toBeGreaterThan(49 + 30 + 60);
    expect(getBaziEncyclopedia(nayinId('海中金'))?.kind).toBe('nayin');
    expect(getBaziEncyclopedia(jiaziId('甲子'))?.kind).toBe('jiazi');
    expect(assertNayinCoverage().ok).toBe(true);
  });

  it('library kinds are browsable without unlock', () => {
    expect(isAtlasLibraryKind('nayin')).toBe(true);
    expect(isAtlasLibraryKind('stem')).toBe(false);
  });

  it('甲木 has memory tags and four panes of content', () => {
    const e = getBaziEncyclopedia('甲')!;
    expect(e.title).toBe('甲木');
    expect(e.tags).toMatchObject({ wuxing: '木', yinyang: '阳', category: '天干' });
    expect(e.oneLiner).toMatch(/大树/);
    expect(e.structure.keywords.length).toBeGreaterThanOrEqual(3);
    expect(e.dimensions.personality).toBeTruthy();
    expect(e.relations.generates.length).toBeGreaterThan(0);
  });

  it('甲木 dossier matches 详解模板', () => {
    const d = buildCodexDossier('甲')!;
    expect(d.whatIs).toMatch(/参天大树|栋梁/);
    expect(d.likes).toEqual(expect.arrayContaining(['水滋养', '火温暖', '金修剪']));
    expect(d.dislikes.some((x) => x.includes('土'))).toBe(true);
    expect(d.pillarMeaning.year).toMatch(/年柱/);
    expect(d.combos.some((c) => c.peer.includes('庚'))).toBe(true);
    expect(d.combos.some((c) => c.peer.includes('壬'))).toBe(true);
    expect(d.memory).toMatch(/甲木/);
  });

  it('detail html includes 基础/表现/生克/命盘 tabs', () => {
    const html = renderBaziCodexDetailHtml('甲', {
      artHtml: '<svg></svg>',
      lit: true,
      chartLink: buildChartLinkReport('甲', null),
    });
    for (const pane of CODEX_DETAIL_PANES) {
      expect(html).toContain(`data-enc-tab="${pane}"`);
      expect(html).toContain(`data-enc-pane="${pane}"`);
    }
    expect(html).not.toContain('data-enc-tab="schools"');
    expect(html).toContain('甲木');
    expect(html).toContain('生克');
    expect(html).toContain('命盘');
    expect(html).toContain('水滋养');
    expect(html).toContain('data-shengke-map');
    expect(html).toMatch(/data-enc-pane="express"[^>]*hidden/);
  });

  it('神煞详情含「他派差异」Tab', () => {
    const html = renderBaziCodexDetailHtml('ss:天乙贵人', {
      artHtml: '<span></span>',
      lit: true,
      chartLink: buildChartLinkReport('ss:天乙贵人', null),
    });
    expect(html).toContain('data-enc-tab="schools"');
    expect(html).toContain('他派差异');
    expect(html).toContain('本产品查法');
    expect(html).toMatch(/日干|年干/);
  });

  it('shengke map renders five nodes and edges', () => {
    const html = renderWuxingShengKeMapHtml();
    expect(html).toContain('data-shengke-map');
    for (const wx of ['木', '火', '土', '金', '水']) {
      expect(html).toContain(`data-codex-id="${wx}"`);
    }
  });

  it('天乙贵人 dossier 接近甲木级：查法表 + 使用边界 + 四柱', () => {
    const d = buildCodexDossier('ss:天乙贵人')!;
    expect(d.chartRole).toMatch(/辅助|不能脱离/);
    expect(d.season).toMatch(/丑|未/);
    expect(d.combos.some((c) => c.note.includes('甲') && c.note.includes('丑'))).toBe(true);
    expect(d.imbalance).toMatch(/单独|懈怠|误读/);
    expect(d.pillarMeaning.day).toMatch(/日柱/);
    expect(d.memory).toMatch(/天乙/);
  });

  it('精品神煞 dossier 均有查法表与使用边界', () => {
    const samples = [
      { id: 'ss:文昌', season: /巳|午/, memory: /文昌/ },
      { id: 'ss:羊刃', season: /卯|寅/, memory: /羊刃/ },
      { id: 'ss:华盖', season: /辰|戌|丑|未/, memory: /华盖/ },
      { id: 'ss:驿马', season: /寅|申|巳|亥/, memory: /驿马/ },
      { id: 'ss:桃花', season: /酉|卯|午|子/, memory: /桃花/ },
      { id: 'ss:将星', season: /子|午|酉|卯/, memory: /将星/ },
      { id: 'ss:红鸾', season: /年支/, memory: /红鸾/ },
      { id: 'ss:天喜', season: /年支/, memory: /天喜/ },
      { id: 'ss:禄神', season: /寅|卯/, memory: /禄/ },
      { id: 'ss:孤辰寡宿', season: /孤辰|寡宿/, memory: /孤辰/ },
      { id: 'ss:劫煞', season: /巳|亥|寅|申/, memory: /劫煞/ },
    ] as const;
    for (const s of samples) {
      const d = buildCodexDossier(s.id)!;
      expect(d.chartRole, s.id).toMatch(/辅助|不能脱离/);
      expect(d.season, s.id).toMatch(s.season);
      expect(d.combos.length, s.id).toBeGreaterThanOrEqual(3);
      expect(d.pillarMeaning.day, s.id).toMatch(/日柱/);
      expect(d.memory, s.id).toMatch(s.memory);
    }
  });

  it('MORE 名录神煞 dossier 达天乙模板（查法+边界+四柱）', () => {
    const samples = [
      { id: 'ss:天德', season: /寅月|丁/, memory: /天德/ },
      { id: 'ss:月德', season: /天干丙|寅午戌/, memory: /月德/ },
      { id: 'ss:福星', season: /寅|子/, memory: /福星/ },
      { id: 'ss:咸池', season: /酉|卯|午|子/, memory: /咸池/ },
      { id: 'ss:金舆', season: /辰/, memory: /金舆/ },
      { id: 'ss:天厨', season: /巳/, memory: /天厨/ },
      { id: 'ss:灾煞', season: /午|子|卯|酉/, memory: /灾煞/ },
      { id: 'ss:亡神', season: /亥|巳|申|寅/, memory: /亡神/ },
      { id: 'ss:白虎', season: /年支/, memory: /白虎/ },
      { id: 'ss:吊客', season: /年支/, memory: /吊客/ },
      { id: 'ss:天哭', season: /年支/, memory: /天哭/ },
      { id: 'ss:天虚', season: /年支/, memory: /天虚/ },
      { id: 'ss:破碎', season: /酉|巳|丑/, memory: /破碎/ },
    ] as const;
    for (const s of samples) {
      const d = buildCodexDossier(s.id)!;
      expect(d, s.id).toBeTruthy();
      expect(d.chartRole, s.id).toMatch(/辅助|不能脱离/);
      expect(d.season, s.id).toMatch(s.season);
      expect(d.combos.length, s.id).toBeGreaterThanOrEqual(3);
      expect(d.pillarMeaning.day, s.id).toMatch(/日柱/);
      expect(d.memory, s.id).toMatch(s.memory);
      expect(d.imbalance, s.id).toMatch(/单独|恐吓|误读|懈怠|躺平|沉溺|硬/);
    }
  });

  it('乙木 dossier 加深到接近甲木级字段', () => {
    const d = buildCodexDossier('乙')!;
    expect(d.whatIs).toMatch(/藤萝|柔韧/);
    expect(d.likes.length).toBeGreaterThanOrEqual(2);
    expect(d.dislikes.length).toBeGreaterThanOrEqual(2);
    expect(d.pillarMeaning.year).toMatch(/年柱/);
    expect(d.combos.some((c) => c.peer.includes('庚'))).toBe(true);
    expect(d.memory).toMatch(/乙木/);
  });

  it('纳音 dossier 达可用百科：画面+甲子对+边界', () => {
    const d = buildCodexDossier(nayinId('海中金'))!;
    expect(d.whatIs).toMatch(/海中金|深海/);
    expect(d.season).toMatch(/甲子|乙丑/);
    expect(d.chartRole).toMatch(/辅助|不能脱离|纳音/);
    expect(d.combos.some((c) => c.peer === '甲子')).toBe(true);
    expect(d.memory).toMatch(/海中金/);
    expect(d.pillarMeaning.day).toMatch(/日柱/);
  });

  it('甲子 dossier 拆干支纳音三层', () => {
    const d = buildCodexDossier(jiaziId('甲子'))!;
    expect(d.whatIs).toMatch(/甲子|海中金/);
    expect(d.combos.some((c) => c.peer === '甲')).toBe(true);
    expect(d.combos.some((c) => c.peer === '子')).toBe(true);
    expect(d.combos.some((c) => c.peer.includes('海中金') || c.note.includes('海中金'))).toBe(true);
    expect(d.chartRole).toMatch(/干支|纳音|不能脱离|作大运/);
    expect(d.memory).toMatch(/甲子/);
    expect(d.dayunAs?.rich).toBe(true);
    expect(d.dayunAs?.theme).toMatch(/蓄势|立骨/);
    expect(d.coreKeyword).toMatch(/甲子/);
  });

  it('三十纳音均有 lore 且 dossier 非骨架占位', () => {
    for (const n of NAYIN_ATLAS) {
      const d = buildCodexDossier(nayinId(n.name))!;
      expect(d.season, n.name).not.toMatch(/骨架条目/);
      expect(d.likes.length, n.name).toBeGreaterThanOrEqual(2);
      expect(d.memory, n.name).toMatch(/纳音|勿单断|画面/);
    }
  });

  it('六十甲子作大运时专区均为手写精品', () => {
    const { rich, total } = jiaziDayunRichCoverage();
    expect(total).toBe(60);
    expect(rich).toBe(60);
    expect(listRichJiaziDayunIds()).toEqual(listSixtyJiazi());
    for (const gz of listSixtyJiazi()) {
      const lore = getJiaziDayunLore(gz);
      expect(lore.rich, gz).toBe(true);
      expect(lore.theme, gz).not.toMatch(/待补/);
      expect(lore.weather.length, gz).toBeGreaterThanOrEqual(40);
      expect(lore.playbook.length, gz).toBeGreaterThanOrEqual(35);
      expect(lore.leanIn.length, gz).toBeGreaterThanOrEqual(10);
      expect(lore.watch.length, gz).toBeGreaterThanOrEqual(10);
      const d = buildCodexDossier(jiaziId(gz))!;
      expect(d.dayunAs?.rich, gz).toBe(true);
      expect(d.dayunAs!.theme.length, gz).toBeGreaterThan(4);
      expect(d.dayunAs!.playbook.length, gz).toBeGreaterThan(8);
      expect(d.dayunAs!.watch, gz).not.toMatch(/倒霉|必凶|必灾/);
    }
  });

  it('三十纳音 lore 字段齐全且非恐吓式单断', () => {
    for (const n of NAYIN_ATLAS) {
      const lore = getNayinLore(n.name)!;
      expect(lore, n.name).toBeTruthy();
      expect(lore.scene.length, n.name).toBeGreaterThanOrEqual(12);
      expect(lore.memory, n.name).toMatch(/纳音|勿单断|画面/);
      expect(lore.avoid.some((a) => /^(必凶|必灾|必贵)/.test(a)), n.name).toBe(false);
      const d = buildCodexDossier(nayinId(n.name))!;
      expect(d.whatIs, n.name).toMatch(n.name);
      expect(d.whatIs, n.name).not.toMatch(/骨架条目|图鉴定义如下/);
    }
  });
});
