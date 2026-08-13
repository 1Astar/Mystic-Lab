import { describe, expect, it } from 'vitest';
import { SHENSHA_ATLAS } from './codex-atlas-catalog.ts';
import { buildCodexDossier, listHandwrittenShenshaRichIds } from './codex-dossier.ts';
import {
  buildAtlasShenshaFullText,
  isShenshaFullTextReady,
  materializeShenshaFullText,
} from './codex-shensha-schema.ts';
import { shenshaCardId } from './codex-tags.ts';

describe('shensha full-text schema', () => {
  it('天乙贵人满足查法表/落柱/使用边界', () => {
    const d = buildCodexDossier('ss:天乙贵人')!;
    expect(isShenshaFullTextReady(d)).toBe(true);
    expect(d.season).toMatch(/查法/);
    expect(d.combos.length).toBeGreaterThanOrEqual(3);
    expect(d.chartRole).toMatch(/辅助|不能脱离/);
  });

  it('atlas schema 推广函数仍可物化全文（不依赖未手写名）', () => {
    const patch = materializeShenshaFullText(
      buildAtlasShenshaFullText({
        name: '__测试推广__',
        category: '灾厄风险类',
        gloss: '测试 gloss',
        tone: '中性',
      }),
    );
    expect(patch.season).toMatch(/查法/);
    expect(patch.pillarMeaning?.day).toMatch(/日柱/);
  });

  it('SHENSHA_ATLAS 全部已手写且全文ready', () => {
    const handwritten = listHandwrittenShenshaRichIds();
    const missing: string[] = [];
    const notReady: string[] = [];
    for (const s of SHENSHA_ATLAS) {
      const id = shenshaCardId(s.name);
      if (!handwritten.includes(id)) missing.push(s.name);
      const d = buildCodexDossier(id);
      if (!d || !isShenshaFullTextReady(d)) notReady.push(s.name);
      else if (/图鉴定义如下|精查法以排盘/.test(d.whatIs || '')) notReady.push(`${s.name}:skeleton`);
    }
    expect(missing, missing.join(',')).toEqual([]);
    expect(notReady, notReady.join(',')).toEqual([]);
  });

  it('加厚批：学堂等8条已手写且全文ready', () => {
    const batch = [
      '学堂',
      '词馆',
      '文曲',
      '天医',
      '解神',
      '魁罡',
      '国印',
      '空亡',
    ];
    const handwritten = listHandwrittenShenshaRichIds();
    for (const name of batch) {
      const id = shenshaCardId(name);
      expect(handwritten, name).toContain(id);
      const d = buildCodexDossier(id)!;
      expect(isShenshaFullTextReady(d), name).toBe(true);
      expect(d.whatIs, name).not.toMatch(/图鉴骨架|分类象义待/);
      expect(d.season, name).toMatch(/查法/);
    }
  });

  it('加厚第二批：天赦等8条已手写且全文ready', () => {
    const batch = [
      '天赦',
      '三奇贵人',
      '血刃',
      '流霞',
      '风流',
      '沐浴',
      '天马',
      '截路空亡',
    ];
    const handwritten = listHandwrittenShenshaRichIds();
    for (const name of batch) {
      const id = shenshaCardId(name);
      expect(handwritten, name).toContain(id);
      const d = buildCodexDossier(id)!;
      expect(isShenshaFullTextReady(d), name).toBe(true);
      expect(d.whatIs, name).not.toMatch(/图鉴骨架/);
    }
  });

  it('加厚第三批：天德合等8条已手写且全文ready', () => {
    const batch = [
      '天德合',
      '月德合',
      '台阁',
      '权星',
      '天官',
      '仓廪',
      '飞财',
      '阴差阳错',
    ];
    const handwritten = listHandwrittenShenshaRichIds();
    for (const name of batch) {
      const id = shenshaCardId(name);
      expect(handwritten, name).toContain(id);
      const d = buildCodexDossier(id)!;
      expect(isShenshaFullTextReady(d), name).toBe(true);
      expect(d.whatIs, name).not.toMatch(/图鉴骨架/);
    }
  });

  it('加厚第四批：病符等8条已手写且全文ready', () => {
    const batch = [
      '病符',
      '死符',
      '丧门',
      '绞煞',
      '天罗',
      '地网',
      '五鬼',
      '大耗',
    ];
    const handwritten = listHandwrittenShenshaRichIds();
    for (const name of batch) {
      const id = shenshaCardId(name);
      expect(handwritten, name).toContain(id);
      const d = buildCodexDossier(id)!;
      expect(isShenshaFullTextReady(d), name).toBe(true);
      expect(d.whatIs, name).not.toMatch(/图鉴骨架/);
      expect(d.whatIs, name).toMatch(/提醒|非|勿|忌恐吓|慎断/);
    }
  });

  it('SHENSHA_ATLAS 全部 dossier 达天乙级全文 schema', () => {
    const failed: string[] = [];
    for (const s of SHENSHA_ATLAS) {
      const d = buildCodexDossier(shenshaCardId(s.name));
      if (!d || !isShenshaFullTextReady(d)) failed.push(s.name);
    }
    expect(failed, failed.join(',')).toEqual([]);
  });

  it('全量神煞含他派差异（本产品查法+他派条目）', () => {
    for (const s of SHENSHA_ATLAS) {
      const d = buildCodexDossier(shenshaCardId(s.name))!;
      expect(d.schoolDiff?.productMethod, s.name).toMatch(/本产品/);
      expect(d.schoolDiff?.otherSchools.length, s.name).toBeGreaterThanOrEqual(2);
      expect(d.schoolDiff?.note, s.name).toMatch(/学习对照|不断语/);
    }
    const tianYi = buildCodexDossier('ss:天乙贵人')!;
    expect(tianYi.schoolDiff?.productMethod).toMatch(/日干/);
    expect(tianYi.schoolDiff?.otherSchools.some((x) => /年干/.test(x))).toBe(true);
  });

  it('atlas 推广输入含定义/查法/落柱/边界四件套', () => {
    const input = buildAtlasShenshaFullText({
      name: '天赦',
      category: '贵人类',
      gloss: '天赦日贵人 · 宽恕与解厄象。',
      tone: '吉',
    });
    expect(input.whatIs).toMatch(/天赦/);
    expect(input.lookup.lines.length).toBeGreaterThanOrEqual(3);
    expect(input.pillarMeaning.year).toMatch(/年柱/);
    const patch = materializeShenshaFullText(input);
    expect(patch.chartRole).toMatch(/辅助|不能脱离/);
    expect(patch.season).toMatch(/查法/);
  });
});
